/* AI Library — non-destructive, idempotent legacy personal-state migration.
 * Copies the existing localStorage snapshot into IndexedDB; it never deletes or rewrites
 * legacy keys. The UI continues using its synchronous compatibility layer for now.
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

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn('AI Library: legacy personal data could not be parsed:', key, error);
      return fallback;
    }
  }

  async function migrate() {
    const existing = await store.getPersonalState();
    if (existing?.migrationVersion >= 1) {
      return { migrated: false, alreadyMigrated: true };
    }
    const snapshot = {
      migrationVersion: 1,
      source: 'localStorage',
      migratedAt: new Date().toISOString(),
      personalBooks: readJson(KEYS.personalBooks, []),
      favorites: readJson(KEYS.favorites, []),
      progress: readJson(KEYS.progress, {}),
      readerSettings: readJson(KEYS.readerSettings, { fontSize: 17, lineSpacing: '1.7' })
    };
    await store.setPersonalState(snapshot);
    return {
      migrated: true,
      alreadyMigrated: false,
      personalBooks: Array.isArray(snapshot.personalBooks) ? snapshot.personalBooks.length : 0,
      favorites: Array.isArray(snapshot.favorites) ? snapshot.favorites.length : 0
    };
  }

  Object.defineProperty(window, 'AILibraryPersonalStateMigration', {
    value: Object.freeze({ migrate }),
    configurable: false,
    enumerable: false,
    writable: false
  });
})();
