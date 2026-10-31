import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/platform/personal-state-migration.js", import.meta.url), "utf8");
const legacy = new Map([
  ["ai-library-personal-books", JSON.stringify([{ id: "draft-1", title: "Моя книга", chapters: ["Текст"] }])],
  ["ai-library-favs", JSON.stringify(["book-a", "book-b"])],
  ["ai-library-progress", JSON.stringify({ "book-a": { part: 1, page: 4 } })],
  ["ai-library-reader-settings", JSON.stringify({ fontSize: 19, lineSpacing: "1.8" })]
]);
const localStorage = {
  getItem(key) { return legacy.has(key) ? legacy.get(key) : null; },
  removeItem() { throw new Error("Migration must not remove legacy keys"); },
  setItem() { throw new Error("Migration must not rewrite legacy keys"); },
  clear() { throw new Error("Migration must not clear legacy data"); }
};
let stored = null;
const store = {
  async getPersonalState() { return stored; },
  async setPersonalState(snapshot) { stored = { ...snapshot }; return stored; }
};
const window = { AILibraryStore: store };
vm.runInNewContext(source, { window, localStorage, console, Date, Object, Array, JSON });

const first = await window.AILibraryPersonalStateMigration.migrate();
assert.equal(first.migrated, true);
assert.equal(first.personalBooks, 1);
assert.equal(first.favorites, 2);
assert.equal(stored.migrationVersion, 1);
assert.equal(stored.personalBooks[0].title, "Моя книга");
assert.deepEqual(JSON.parse(JSON.stringify(stored.progress)), { "book-a": { part: 1, page: 4 } });
assert.deepEqual(JSON.parse(JSON.stringify(stored.readerSettings)), { fontSize: 19, lineSpacing: "1.8" });

const second = await window.AILibraryPersonalStateMigration.migrate();
assert.equal(second.migrated, false);
assert.equal(second.alreadyMigrated, true);
assert.equal(stored.personalBooks.length, 1);
assert.equal(legacy.size, 4, "Original localStorage keys must remain untouched");

console.log("Personal-state migration tests passed: copy, idempotence, and legacy-data preservation.");
