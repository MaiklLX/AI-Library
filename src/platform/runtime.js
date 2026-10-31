/* AI Library — cross-platform runtime and durable storage foundation.
 * This module is intentionally additive: it does not migrate, clear, or rewrite
 * any existing localStorage data. IndexedDB is opened only when explicitly used.
 */
(() => {
  'use strict';

  const DB_NAME = 'ai-library-platform';
  const DB_VERSION = 2;
  const STORES = Object.freeze({
    books: 'books',
    metadata: 'metadata',
    downloads: 'downloads',
    personalState: 'personalState'
  });

  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  let databasePromise = null;

  function openDatabase() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB is not available in this environment.'));
    }
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        Object.values(STORES).forEach(storeName => {
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };
        resolve(database);
      };

      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error('Unable to open AI Library storage.'));
      };

      request.onblocked = () => {
        console.warn('AI Library: storage upgrade is blocked by another open tab.');
      };
    });

    return databasePromise;
  }

  function validateStore(storeName) {
    if (!Object.values(STORES).includes(storeName)) {
      throw new TypeError('Unknown AI Library storage collection.');
    }
    return storeName;
  }

  async function requestStore(storeName, mode, operation) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(validateStore(storeName), mode);
      let result = null;
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      let request;
      try {
        request = operation(transaction.objectStore(storeName));
      } catch (error) {
        fail(error);
        try { transaction.abort(); } catch {}
        return;
      }

      request.onsuccess = () => {
        result = request.result ?? null;
      };
      request.onerror = () => fail(request.error || new Error('AI Library storage request failed.'));
      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      transaction.onerror = () => fail(transaction.error || new Error('AI Library storage transaction failed.'));
      transaction.onabort = () => fail(transaction.error || new Error('AI Library storage transaction was aborted.'));
    });
  }

  const storage = Object.freeze({
    open: openDatabase,
    get: (storeName, id) => requestStore(storeName, 'readonly', store => store.get(id)),
    getAll: storeName => requestStore(storeName, 'readonly', store => store.getAll()),
    put: (storeName, record) => {
      if (!record || typeof record !== 'object' || record.id == null) {
        return Promise.reject(new TypeError('Stored records must contain an id.'));
      }
      return requestStore(storeName, 'readwrite', store => store.put(record));
    },
    remove: (storeName, id) => requestStore(storeName, 'readwrite', store => store.delete(id))
  });

  const runtime = Object.freeze({
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'web',
    isIOS,
    isAndroid,
    isStandalone,
    capabilities: Object.freeze({
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      fileSystemAccess: 'showSaveFilePicker' in window,
      nativeBridge: Boolean(window.Capacitor)
    }),
    storage,
    version: 1
  });

  Object.defineProperty(window, 'AILibraryPlatform', {
    value: runtime,
    configurable: false,
    enumerable: false,
    writable: false
  });

  window.dispatchEvent(new CustomEvent('ai-library:platform-ready', {
    detail: { platform: runtime.platform, standalone: runtime.isStandalone }
  }));
})();
