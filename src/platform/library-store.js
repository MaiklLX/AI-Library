/* AI Library — domain storage adapter.
 * This layer is additive and deliberately does not import or migrate legacy localStorage.
 * Books, metadata and download records are stored independently in IndexedDB.
 */
(() => {
  'use strict';

  const platform = window.AILibraryPlatform;
  if (!platform?.storage) {
    throw new Error('AI Library platform storage is unavailable.');
  }

  const storage = platform.storage;

  function requireId(value, label) {
    const id = String(value ?? '').trim();
    if (!id) throw new TypeError(label + ' must have a non-empty id.');
    return id;
  }

  const libraryStore = Object.freeze({
    async getBook(id) {
      const record = await storage.get('books', requireId(id, 'Book'));
      return record?.book ?? null;
    },

    async getBooks() {
      const records = await storage.getAll('books');
      return records.map(record => record.book).filter(Boolean);
    },

    async saveBook(book) {
      if (!book || typeof book !== 'object' || Array.isArray(book)) {
        throw new TypeError('Book must be an object.');
      }
      const id = requireId(book.id, 'Book');
      await storage.put('books', { id, book, updatedAt: Date.now() });
      return book;
    },

    async removeBook(id) {
      return storage.remove('books', requireId(id, 'Book'));
    },

    async getMetadata(key, fallback = null) {
      const record = await storage.get('metadata', requireId(key, 'Metadata key'));
      return record ? record.value : fallback;
    },

    async setMetadata(key, value) {
      const id = requireId(key, 'Metadata key');
      await storage.put('metadata', { id, value, updatedAt: Date.now() });
      return value;
    },

    async getDownloads() {
      return storage.getAll('downloads');
    },

    async getDownload(id) {
      return storage.get('downloads', requireId(id, 'Download'));
    },

    async setDownload(record) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new TypeError('Download record must be an object.');
      }
      const id = requireId(record.id, 'Download');
      const next = { ...record, id, updatedAt: Date.now() };
      await storage.put('downloads', next);
      return next;
    },

    async removeDownload(id) {
      return storage.remove('downloads', requireId(id, 'Download'));
    },

    async getPersonalState() {
      return storage.get('personalState', 'legacy-local-state-v1');
    },

    async setPersonalState(snapshot) {
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        throw new TypeError('Personal state snapshot must be an object.');
      }
      const record = { ...snapshot, id: 'legacy-local-state-v1', updatedAt: Date.now() };
      await storage.put('personalState', record);
      return record;
    }
  });

  Object.defineProperty(window, 'AILibraryStore', {
    value: libraryStore,
    configurable: false,
    enumerable: false,
    writable: false
  });
})();
