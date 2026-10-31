/* AI Library — non-destructive legacy migration and write-through bridge.
 * Existing localStorage remains the synchronous compatibility layer for the UI.
 * Every change to its personal-data keys is queued into IndexedDB as a durable snapshot.
 */
(() => {
  'use strict';
  const store = window.AILibraryStore;
  if (!store) throw new Error('AI Library storage is unavailable.');

  const KEYS = Object.freeze({
    personalBooks: 'ai-library-personal-books',
    favorites: 'ai-library-favs',
    progress: 'ai-library-progress',
    readerSettings: 'ai-library-reader-settings'
  });
  const KEY_SET = new Set(Object.values(KEYS));
  let initializationPromise = null;
  let writeQueue = Promise.resolve();
  let lastSyncError = null;
  let bridgeInstalled = false;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn('AI Library: legacy personal data could not be parsed:', key, error);
      return fallback;
    }
  }

  function readSnapshot(existing = null) {
    return {
      migrationVersion: 1,
      source: 'localStorage-write-through',
      migratedAt: existing?.migratedAt || new Date().toISOString(),
      synchronizedAt: new Date().toISOString(),
      personalBooks: readJson(KEYS.personalBooks, []),
      favorites: readJson(KEYS.favorites, []),
      progress: readJson(KEYS.progress, {}),
      readerSettings: readJson(KEYS.readerSettings, { fontSize: 17, lineSpacing: '1.7' })
    };
  }

  async function persistSnapshot() {
    const existing = await store.getPersonalState();
    const snapshot = readSnapshot(existing);
    await store.setPersonalState(snapshot);
    lastSyncError = null;
    return snapshot;
  }

  function scheduleSync() {
    writeQueue = writeQueue
      .then(() => initializationPromise)
      .then(() => persistSnapshot())
      .catch(error => {
        lastSyncError = error;
        console.warn('AI Library: personal data remains safe in the browser; IndexedDB sync will retry after the next change.', error);
      });
    return writeQueue;
  }

  function installWriteThrough() {
    if (bridgeInstalled) return;
    const prototype = Object.getPrototypeOf(localStorage);
    const canPatchPrototype = prototype && prototype !== Object.prototype &&
      typeof prototype.setItem === 'function';

    if (canPatchPrototype) {
      const originalSetItem = prototype.setItem;
      prototype.setItem = function(key, value) {
        const result = originalSetItem.call(this, key, value);
        if (this === localStorage && KEY_SET.has(String(key))) scheduleSync();
        return result;
      };
    } else {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(key, value) {
        const result = originalSetItem(key, value);
        if (KEY_SET.has(String(key))) scheduleSync();
        return result;
      };
    }
    bridgeInstalled = true;
  }

  function migrate() {
    installWriteThrough();
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
      const existing = await store.getPersonalState();
      if (existing?.migrationVersion >= 1) {
        return { migrated: false, alreadyMigrated: true };
      }

      const snapshot = readSnapshot();
      await store.setPersonalState(snapshot);
      return {
        migrated: true,
        alreadyMigrated: false,
        personalBooks: Array.isArray(snapshot.personalBooks) ? snapshot.personalBooks.length : 0,
        favorites: Array.isArray(snapshot.favorites) ? snapshot.favorites.length : 0
      };
    })();
    return initializationPromise;
  }

  async function flush() {
    await migrate();
    await writeQueue;
    return { synced: !lastSyncError, error: lastSyncError };
  }

  Object.defineProperty(window, 'AILibraryPersonalStateMigration', {
    value: Object.freeze({ migrate, flush }),
    configurable: false,
    enumerable: false,
    writable: false
  });
})();
