/* AI Library — verified offline book downloads.
 * Each ready download is stored as one IndexedDB record, so an older
 * download remains intact until the replacement has been fetched and validated.
 */
(() => {
  'use strict';
  const store = window.AILibraryStore;
  if (!store) throw new Error('AI Library storage is unavailable.');
  const CATALOG_URL = './content/catalog.json';
  const ready = new Map();
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

  async function readJson(response, label) {
    if (!response.ok) throw new Error(label + ': HTTP ' + response.status);
    const text = await response.text();
    if (!text || text.length > 25 * 1024 * 1024) throw new Error(label + ': недопустимый размер файла.');
    try { return { data: JSON.parse(text), text }; }
    catch { throw new Error(label + ': повреждённый JSON.'); }
  }

  function validateBook(book, expectedId) {
    if (!book || typeof book !== 'object' || Array.isArray(book) ||
        book.id !== expectedId || typeof book.title !== 'string' || !book.title.trim() ||
        book.status === 'prerelease' || !Array.isArray(book.chapters) || !book.chapters.length) {
      throw new Error('Книга не прошла проверку структуры и не была сохранена.');
    }
    const validChapters = book.chapters.every(chapter =>
      typeof chapter === 'string' ||
      (chapter && typeof chapter === 'object' && typeof chapter.content === 'string')
    );
    if (!validChapters) throw new Error('В книге обнаружен некорректный формат главы.');
    return book;
  }

  async function digest(text) {
    if (!globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') return null;
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
  }

  async function download(id) {
    const publicId = String(id || '');
    const rawId = publicId.startsWith('published-') ? publicId.slice(10) : publicId;
    if (!slugPattern.test(rawId)) throw new TypeError('Некорректный идентификатор книги.');
    const response = await fetch(CATALOG_URL, { cache: 'no-cache' });
    const { data: catalog } = await readJson(response, 'Каталог');
    if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.books)) {
      throw new Error('Каталог имеет неподдерживаемый формат.');
    }
    const entry = catalog.books.find(item => item && item.id === rawId);
    if (!entry || entry.path !== './content/books/' + rawId + '.json') {
      throw new Error('Книга отсутствует в актуальном каталоге.');
    }
    const bookResponse = await fetch(entry.path, { cache: 'no-cache' });
    const { data: book, text: source } = await readJson(bookResponse, 'Книга');
    validateBook(book, rawId);
    const contentHash = await digest(source);
    const record = {
      id: 'published-' + rawId,
      status: 'ready',
      title: book.title,
      book,
      catalogVersion: catalog.version,
      contentHash,
      contentBytes: new TextEncoder().encode(source).length,
      downloadedAt: Date.now()
    };
    // A single IndexedDB put replaces the prior ready version only after validation.
    await store.setDownload(record);
    ready.set(record.id, record);
    return record;
  }

  async function load() {
    const records = await store.getDownloads();
    ready.clear();
    for (const record of records) {
      if (record?.status === 'ready' && record.book && record.id === 'published-' + record.book.id) {
        try { validateBook(record.book, record.book.id); ready.set(record.id, record); }
        catch (error) { console.warn('AI Library: пропущена повреждённая офлайн-книга.', error); }
      }
    }
    return [...ready.values()];
  }

  async function remove(id) {
    const key = String(id || '');
    await store.removeDownload(key);
    ready.delete(key);
    return true;
  }

  async function getStorageInfo() {
    const storageManager = navigator.storage;
    let estimate = {};
    let persisted = false;
    try {
      if (typeof storageManager?.estimate === 'function') estimate = await storageManager.estimate();
    } catch (error) {
      console.warn('AI Library: не удалось оценить хранилище.', error);
    }
    try {
      if (typeof storageManager?.persisted === 'function') persisted = await storageManager.persisted();
    } catch (error) {
      console.warn('AI Library: не удалось проверить защиту хранилища.', error);
    }
    return {
      usage: Number.isFinite(estimate.usage) ? estimate.usage : null,
      quota: Number.isFinite(estimate.quota) ? estimate.quota : null,
      persisted: persisted === true,
      persistenceSupported: typeof storageManager?.persist === 'function'
    };
  }

  async function requestPersistence() {
    const storageManager = navigator.storage;
    if (typeof storageManager?.persist !== 'function') {
      return { supported: false, persisted: false };
    }
    const persisted = await storageManager.persist();
    return { supported: true, persisted: persisted === true };
  }

  window.AILibraryDownloadManager = Object.freeze({
    download,
    load,
    remove,
    isDownloaded: id => ready.has(String(id)),
    getCachedDownloads: () => [...ready.values()],
    getStorageInfo,
    requestPersistence
  });
})();
