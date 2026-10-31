import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../src/platform/personal-state-migration.js", import.meta.url), "utf8");
function createHarness(initialLegacy = {}, initialSnapshot = null) {
  const legacy = new Map(Object.entries(initialLegacy));
  const localStorage = {
    getItem(key) { return legacy.has(key) ? legacy.get(key) : null; },
    setItem(key, value) { legacy.set(String(key), String(value)); },
    removeItem() { throw new Error("Recovery must not remove legacy keys"); },
    clear() { throw new Error("Recovery must not clear legacy data"); }
  };
  let stored = initialSnapshot ? structuredClone(initialSnapshot) : null, writes = 0;
  const store = {
    async getPersonalState() { return stored; },
    async setPersonalState(snapshot) { stored = structuredClone(snapshot); writes += 1; return stored; }
  };
  const window = { AILibraryStore: store };
  vm.runInNewContext(source, { window, localStorage, console, Date, Object, Array, JSON, Promise });
  return { api: window.AILibraryPersonalStateMigration, legacy, get stored() { return stored; }, get writes() { return writes; } };
}
const original = createHarness({
  "ai-library-personal-books": JSON.stringify([{ id: "draft-1", title: "Моя книга", chapters: ["Текст"] }]),
  "ai-library-favs": JSON.stringify(["book-a", "book-b"]),
  "ai-library-progress": JSON.stringify({ "book-a": { part: 1, page: 4 } }),
  "ai-library-reader-settings": JSON.stringify({ fontSize: 19, lineSpacing: "1.8" })
});
const first = await original.api.migrate();
assert.equal(first.migrated, true);
assert.equal(first.personalBooks, 1);
assert.equal(first.favorites, 2);
assert.equal(original.stored.migrationVersion, 1);
assert.equal(original.stored.personalBooks[0].title, "Моя книга");
assert.deepEqual(original.stored.progress, { "book-a": { part: 1, page: 4 } });
assert.deepEqual(original.stored.readerSettings, { fontSize: 19, lineSpacing: "1.8" });
original.legacy.set("ai-library-favs", JSON.stringify(["book-b", "book-c"]));
original.legacy.set("ai-library-progress", JSON.stringify({ "book-b": { part: 2, page: 8 } }));
original.legacy.set("unrelated-key", "leave-me-alone");
await original.api.sync();
assert.equal((await original.api.flush()).synced, true);
assert.deepEqual(original.stored.favorites, ["book-b", "book-c"]);
assert.deepEqual(original.stored.progress, { "book-b": { part: 2, page: 8 } });
assert.equal(original.legacy.get("unrelated-key"), "leave-me-alone");
assert.equal(original.legacy.size, 5);
const second = await original.api.migrate();
assert.equal(second.migrated, false);
assert.equal(second.alreadyMigrated, true);
assert.equal(original.writes, 2);

const restart = createHarness({}, original.stored);
const restored = await restart.api.restore();
assert.deepEqual(Array.from(restored.restored).sort(), ["favorites", "personalBooks", "progress", "readerSettings"]);
assert.deepEqual(JSON.parse(restart.legacy.get("ai-library-personal-books")), [{ id: "draft-1", title: "Моя книга", chapters: ["Текст"] }]);
assert.deepEqual(JSON.parse(restart.legacy.get("ai-library-favs")), ["book-b", "book-c"]);
assert.deepEqual(JSON.parse(restart.legacy.get("ai-library-progress")), { "book-b": { part: 2, page: 8 } });
assert.deepEqual(JSON.parse(restart.legacy.get("ai-library-reader-settings")), { fontSize: 19, lineSpacing: "1.8" });

const newer = createHarness({
  "ai-library-personal-books": JSON.stringify([{ id: "newer", title: "Новая локальная", chapters: ["x"] }]),
  "ai-library-favs": JSON.stringify(["local-favorite"]),
  "ai-library-progress": JSON.stringify({ newer: { part: 0, page: 2 } }),
  "ai-library-reader-settings": JSON.stringify({ fontSize: 22, theme: "dark" })
}, original.stored);
const preserved = await newer.api.restore();
assert.deepEqual(Array.from(preserved.restored), []);
assert.equal(preserved.skipped.length, 4);
assert.deepEqual(JSON.parse(newer.legacy.get("ai-library-favs")), ["local-favorite"]);
assert.equal(JSON.parse(newer.legacy.get("ai-library-personal-books"))[0].id, "newer");

const partial = createHarness({
  "ai-library-personal-books": "{broken-json",
  "ai-library-favs": JSON.stringify(["keep-this"]),
  "ai-library-progress": "[]"
}, original.stored);
const repaired = await partial.api.restore();
assert.deepEqual(Array.from(repaired.restored).sort(), ["personalBooks", "progress", "readerSettings"]);
assert.deepEqual(JSON.parse(partial.legacy.get("ai-library-favs")), ["keep-this"]);
assert.deepEqual(JSON.parse(partial.legacy.get("ai-library-progress")), { "book-b": { part: 2, page: 8 } });

const corrupt = createHarness({}, { migrationVersion: 1, personalBooks: "not-an-array", favorites: null, progress: [], readerSettings: "broken" });
const safe = await corrupt.api.restore();
assert.deepEqual(Array.from(safe.restored), []);
assert.equal(safe.skipped.length, 4);
assert.equal(corrupt.legacy.size, 0);

// First-ever migration must normalize valid JSON with the wrong data shape as well.
const firstBootCorrupt = createHarness({
  "ai-library-personal-books": JSON.stringify({ wrong: "shape" }),
  "ai-library-favs": JSON.stringify("not-an-array"),
  "ai-library-progress": JSON.stringify([]),
  "ai-library-reader-settings": JSON.stringify(null)
});
await firstBootCorrupt.api.migrate();
assert.deepEqual(firstBootCorrupt.stored.personalBooks, []);
assert.deepEqual(firstBootCorrupt.stored.favorites, []);
assert.deepEqual(firstBootCorrupt.stored.progress, {});
assert.deepEqual(firstBootCorrupt.stored.readerSettings, { fontSize: 17, lineSpacing: "1.7", theme: "sepia" });
const firstBootRepair = await firstBootCorrupt.api.restore();
assert.equal(firstBootRepair.restored.length, 4);
console.log("Personal-state tests passed: migration, sync, restart recovery, malformed data, newer local state and corrupted snapshots.");
