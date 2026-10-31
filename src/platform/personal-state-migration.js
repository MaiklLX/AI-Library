/* AI Library — non-destructive migration, recovery and durable personal-state bridge.
 * localStorage remains the synchronous compatibility layer; IndexedDB is the recovery copy.
 * Recovery only fills absent or malformed legacy keys and never replaces valid local data.
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
  const DEFAULTS = Object.freeze({
    personalBooks: [], favorites: [], progress: {},
    readerSettings: { fontSize: 17, lineSpacing: '1.7', theme: 'sepia' }
  });
  let migrationPromise = null, migrationComplete = false;
  let writeQueue = Promise.resolve(), lastSyncError = null;

  function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }
  function isValidValue(name, value) {
    if (name === 'personalBooks' || name === 'favorites') return Array.isArray(value);
    if (name === 'progress' || name === 'readerSettings') return isRecord(value);
    return false;
  }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn('AI Library: personal data could not be parsed:', key, error);
      return fallback;
    }
  }
  function readSnapshot(existing = null) {
    const readCategory = name => {
      const value = readJson(KEYS[name], DEFAULTS[name]);
      return isValidValue(name, value) ? value : DEFAULTS[name];
    };
    return {
      migrationVersion: 1, source: 'localStorage-compatibility-bridge',
      migratedAt: existing?.migratedAt || new Date().toISOString(),
      synchronizedAt: new Date().toISOString(),
      personalBooks: readCategory('personalBooks'),
      favorites: readCategory('favorites'),
      progress: readCategory('progress'),
      readerSettings: readCategory('readerSettings')
    };
  }
  function migrate() {
    if (migrationComplete) return Promise.resolve({ migrated: false, alreadyMigrated: true });
    if (migrationPromise) return migrationPromise;
    const pending = (async () => {
      const existing = await store.getPersonalState();
      if (existing?.migrationVersion >= 1) return { migrated: false, alreadyMigrated: true };
      const initial = readSnapshot();
      await store.setPersonalState(initial);
      return { migrated: true, alreadyMigrated: false, personalBooks: initial.personalBooks.length, favorites: initial.favorites.length };
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
  async function restore() {
    await migrate();
    const snapshot = await store.getPersonalState();
    if (!snapshot || snapshot.migrationVersion < 1) {
      return { restored: [], skipped: Object.keys(KEYS), sourceAvailable: false };
    }
    const restored = [], skipped = [];
    for (const [name, key] of Object.entries(KEYS)) {
      const fallback = Object.prototype.hasOwnProperty.call(snapshot, name) ? snapshot[name] : undefined;
      let currentValid = false;
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) currentValid = isValidValue(name, JSON.parse(raw));
      } catch (error) {
        console.warn('AI Library: replacing malformed local personal data:', key, error);
      }
      if (currentValid) { skipped.push(name); continue; }
      if (!isValidValue(name, fallback)) { skipped.push(name); continue; }
      try {
        localStorage.setItem(key, JSON.stringify(fallback));
        restored.push(name);
      } catch (error) {
        console.warn('AI Library: could not restore personal data:', key, error);
        skipped.push(name);
      }
    }
    return { restored, skipped, sourceAvailable: true };
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
    value: Object.freeze({ migrate, restore, sync, flush }),
    configurable: false, enumerable: false, writable: false
  });
})();
