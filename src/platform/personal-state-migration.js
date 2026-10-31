/* AI Library — non-destructive migration and durable personal-state bridge.
 * localStorage remains the synchronous compatibility layer; explicit save operations
 * call sync() to mirror a complete snapshot into IndexedDB. Legacy keys are preserved.
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
  let migrationPromise = null;
  let migrationComplete = false;
  let writeQueue = Promise.resolve();
  let lastSyncError = null;

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
      source: 'localStorage-compatibility-bridge',
      migratedAt: existing?.migratedAt || new Date().toISOString(),
      synchronizedAt: new Date().toISOString(),
      personalBooks: readJson(KEYS.personalBooks, []),
      favorites: readJson(KEYS.favorites, []),
      progress: readJson(KEYS.progress, {}),
      readerSettings: readJson(KEYS.readerSettings, { fontSize: 17, lineSpacing: '1.7' })
    };
  }

  function migrate() {
    if (migrationComplete) return Promise.resolve({ migrated: false, alreadyMigrated: true });
    if (migrationPromise) return migrationPromise;
    const pending = (async () => {
      const existing = await store.getPersonalState();
      if (existing?.migrationVersion >= 1) {
        return { migrated: false, alreadyMigrated: true };
      }
      const initial = readSnapshot();
      await store.setPersonalState(initial);
      return {
        migrated: true,
        alreadyMigrated: false,
        personalBooks: Array.isArray(initial.personalBooks) ? initial.personalBooks.length : 0,
        favorites: Array.isArray(initial.favorites) ? initial.favorites.length : 0
      };
    })();
    migrationPromise = pending.then(result => {
      migrationComplete = true;
      return result;
    }, error => {
      migrationPromise = null;
      throw error;
    });
    return migrationPromise;
  }

  function sync() {
    writeQueue = writeQueue.then(async () => {
      await migrate();
      const existing = await store.getPersonalState();
      const next = readSnapshot(existing);
      await store.setPersonalState(next);
      lastSyncError = null;
      return next;
    }).catch(error => {
      lastSyncError = error;
      console.warn('AI Library: IndexedDB sync failed; browser data remains intact.', error);
      return null;
    });
    return writeQueue;
  }

  async function flush() {
    await migrate();
    await writeQueue;
    return { synced: !lastSyncError, error: lastSyncError };
  }

  Object.defineProperty(window, 'AILibraryPersonalStateMigration', {
    value: Object.freeze({ migrate, sync, flush }),
    configurable: false,
    enumerable: false,
    writable: false
  });
})();
