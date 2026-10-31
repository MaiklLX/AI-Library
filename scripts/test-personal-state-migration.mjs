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
  setItem(key, value) { legacy.set(String(key), String(value)); },
  removeItem() { throw new Error("Migration must not remove legacy keys"); },
  clear() { throw new Error("Migration must not clear legacy data"); }
};
let stored = null;
let writes = 0;
const store = {
  async getPersonalState() { return stored; },
  async setPersonalState(snapshot) { stored = { ...snapshot }; writes += 1; return stored; }
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

localStorage.setItem("ai-library-favs", JSON.stringify(["book-b", "book-c"]));
localStorage.setItem("ai-library-progress", JSON.stringify({ "book-b": { part: 2, page: 8 } }));
localStorage.setItem("unrelated-key", "leave-me-alone");
await window.AILibraryPersonalStateMigration.sync();
const flush = await window.AILibraryPersonalStateMigration.flush();
assert.equal(flush.synced, true);
assert.deepEqual(JSON.parse(JSON.stringify(stored.favorites)), ["book-b", "book-c"]);
assert.deepEqual(JSON.parse(JSON.stringify(stored.progress)), { "book-b": { part: 2, page: 8 } });
assert.equal(legacy.get("unrelated-key"), "leave-me-alone");
assert.equal(legacy.size, 5, "Original and unrelated localStorage keys must remain intact");

const second = await window.AILibraryPersonalStateMigration.migrate();
assert.equal(second.migrated, false);
assert.equal(second.alreadyMigrated, true);
assert.equal(writes, 2, "Initial migration and one durable snapshot should be persisted");
console.log("Personal-state tests passed: migration, explicit sync, idempotence and legacy-data preservation.");
