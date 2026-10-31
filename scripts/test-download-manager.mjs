import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/platform/download-manager.js", import.meta.url), "utf8");
const clone = value => value == null ? value : structuredClone(value);

function makeHarness({ downloads = [], routes = {}, storage = {} } = {}) {
  const records = new Map(downloads.map(record => [record.id, clone(record)]));
  const calls = [];
  const store = {
    async getDownloads() { return [...records.values()].map(clone); },
    async getDownload(id) { return clone(records.get(id) || null); },
    async setDownload(record) { records.set(record.id, clone(record)); return clone(record); },
    async removeDownload(id) { records.delete(id); return true; }
  };
  const fetch = async (url, options = {}) => {
    const path = String(url);
    calls.push({ path, options });
    const value = routes[path];
    if (value instanceof Error) throw value;
    if (typeof value === "function") return value(path, options);
    if (value === undefined) throw new Error("Unexpected network request: " + path);
    return {
      ok: value.status !== undefined ? value.status >= 200 && value.status < 300 : true,
      status: value.status || 200,
      async text() { return typeof value.body === "string" ? value.body : JSON.stringify(value.body); }
    };
  };
  const navigator = { storage: {
    async estimate() { return { usage: 120, quota: 1000 }; },
    async persisted() { return storage.persisted === true; },
    async persist() { return storage.persistResult === true; }
  } };
  const window = { AILibraryStore: store };
  vm.runInNewContext(source, { window, fetch, navigator, TextEncoder, console, Date, Map, Set, String, Number, Array, Object, Promise, TypeError, Error });
  return { api: window.AILibraryDownloadManager, records, calls };
}

const validBook = {
  id: "winter-city", title: "Зимний город", revision: "r2",
  chapters: ["Первая глава", { title: "Вторая", content: "Текст второй главы" }]
};
const catalog = { version: 1, books: [{ id: "winter-city", title: "Зимний город", revision: "r2", path: "./content/books/winter-city.json" }] };
const routes = {
  "./content/catalog.json": { body: catalog },
  "./content/books/winter-city.json": { body: validBook }
};
const initial = makeHarness({ routes });
const saved = await initial.api.download("published-winter-city");
assert.equal(saved.status, "ready");
assert.equal(saved.id, "published-winter-city");
assert.equal(saved.book.chapters.length, 2);
assert.equal(initial.records.size, 1);
assert.equal(initial.api.isDownloaded(saved.id), true);
assert.equal(initial.calls.length, 2);

// A malformed replacement must never overwrite the previous verified offline copy.
const oldRecord = clone(saved);
const invalid = makeHarness({
  downloads: [oldRecord],
  routes: {
    "./content/catalog.json": { body: catalog },
    "./content/books/winter-city.json": { body: { ...validBook, chapters: ["ok", 42] } }
  }
});
await assert.rejects(() => invalid.api.download("winter-city"), /некорректный формат главы/);
assert.deepEqual(invalid.records.get(oldRecord.id), oldRecord);

// A catalog/body revision mismatch is also rejected without replacing the previous copy.
const mismatch = makeHarness({
  downloads: [oldRecord],
  routes: {
    "./content/catalog.json": { body: { ...catalog, books: [{ ...catalog.books[0], revision: "r3" }] } },
    "./content/books/winter-city.json": { body: validBook }
  }
});
await assert.rejects(() => mismatch.api.download("winter-city"), /редакция загруженного текста не совпадает/i);
assert.deepEqual(mismatch.records.get(oldRecord.id), oldRecord);

// Update checks inspect catalog metadata only; they must not fetch the full text.
const update = makeHarness({
  downloads: [oldRecord],
  routes: {
    "./content/catalog.json": { body: { ...catalog, books: [{ ...catalog.books[0], revision: "r3" }] } }
  }
});
const updateResult = await update.api.checkForUpdate("published-winter-city");
assert.equal(updateResult.available, true);
assert.equal(updateResult.currentRevision, "r2");
assert.equal(updateResult.latestRevision, "r3");
assert.deepEqual(update.calls.map(call => call.path), ["./content/catalog.json"]);
assert.equal(update.api.hasUpdate("published-winter-city"), true);

// Startup loading remains local and filters malformed records without requiring network access.
const startup = makeHarness({
  downloads: [
    oldRecord,
    { id: "published-broken", status: "ready", book: { id: "broken", title: "Broken", chapters: [] } },
    { id: "pending", status: "pending", book: validBook }
  ]
});
const loaded = await startup.api.load();
assert.deepEqual(loaded.map(record => record.id), ["published-winter-city"]);
assert.equal(startup.calls.length, 0);
assert.equal(startup.api.isDownloaded("published-winter-city"), true);
assert.equal(startup.api.isDownloaded("published-broken"), false);

await startup.api.remove("published-winter-city");
assert.equal(startup.records.has("published-winter-city"), false);
assert.equal(startup.api.isDownloaded("published-winter-city"), false);

const storage = makeHarness({ storage: { persisted: false, persistResult: true } });
assert.deepEqual(await storage.api.getStorageInfo(), {
  usage: 120, quota: 1000, persisted: false, persistenceSupported: true
});
assert.deepEqual(await storage.api.requestPersistence(), { supported: true, persisted: true });

await assert.rejects(() => initial.api.download("../bad-id"), /Некорректный идентификатор/);
console.log("Offline download tests passed: verified save, atomic replacement protection, revision mismatch, metadata-only update checks, local startup, corruption filtering, removal and storage protection.");
