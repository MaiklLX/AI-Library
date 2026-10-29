import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.webmanifest"), "utf8"));
const serviceWorker = readFileSync(resolve(root, "sw.js"), "utf8");

assert.match(html, /<html[^>]+lang=["']ru["']/i, "Document language should be Russian");
assert.match(html, /<meta[^>]+name=["']description["']/i, "SEO description is missing");
assert.equal(manifest.lang, "ru", "Manifest language should be Russian");
assert.ok(manifest.name && manifest.start_url && manifest.scope, "Manifest metadata is incomplete");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicates)], [], "Duplicate static HTML IDs found");

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length >= 1, "No inline JavaScript found");
scripts.forEach((match, index) => {
  try {
    new Function(match[1]);
  } catch (error) {
    throw new Error(`Inline script #${index + 1} has a syntax error: ${error.message}`);
  }
});

for (const match of html.matchAll(/\b(?:href|src)=["'](\.\/[^"'#?]+)["']/gi)) {
  const asset = resolve(root, match[1]);
  assert.ok(existsSync(asset), `Referenced local asset does not exist: ${match[1]}`);
}

assert.ok(existsSync(resolve(root, "icon.svg")), "App icon is missing");
assert.ok(manifest.icons?.some(icon => icon.src === "./icon.svg"), "Manifest icon is missing");
assert.match(html, /serviceWorker\.register/, "Service worker registration is missing");
assert.match(html, /new AbortController\(\)/, "AI generation cancellation/timeout controller is missing");
assert.match(html, /signal:\s*controller\.signal/, "AI generation request must be abortable");
assert.match(html, /controller\.abort\(\)/, "AI generation timeout must abort the request");
assert.match(html, /form\.setAttribute\(["']aria-busy["']/, "AI generation busy state is missing");
assert.match(html, /body\.classList\.add\(["']ai-generator-open["']/, "Generator modal should lock background scrolling");
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v4['"]/, "Offline shell cache version should be bumped for this release");
assert.match(serviceWorker, /request\.mode\s*===\s*['"]navigate['"]/, "Offline navigation fallback is missing");
assert.match(serviceWorker, /url\.origin\s*!==\s*self\.location\.origin/, "Service worker must not intercept external APIs");
assert.match(html, /id="exportLibraryData"/, "Personal data export control is missing");
assert.match(html, /id="importLibraryData"/, "Personal data import control is missing");
assert.match(html, /function exportLibraryBackup\(/, "Backup export logic is missing");
assert.match(html, /async function importLibraryBackup\(/, "Backup import logic is missing");
assert.match(html, /const safeClass\s*=\s*value\s*=>/, "Dynamic cover classes must be sanitized");
assert.match(html, /data-read="\$\{esc\(b\.id\)\}"/, "Book IDs from imported data must be escaped in HTML attributes");
const publishedCatalogPath = resolve(root, "content/catalog.json");
assert.ok(existsSync(publishedCatalogPath), "Published books catalog is missing");
const publishedCatalog = JSON.parse(readFileSync(publishedCatalogPath, "utf8"));
assert.equal(publishedCatalog.version, 1, "Published books catalog version must be 1");
assert.ok(Array.isArray(publishedCatalog.books), "Published books catalog must contain a books array");
const publishedIds = new Set();
for (const entry of publishedCatalog.books) {
  assert.ok(entry && typeof entry.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(entry.id), "Published book ID must be a slug");
  assert.ok(!publishedIds.has(entry.id), `Duplicate published book ID: ${entry.id}`);
  publishedIds.add(entry.id);
  assert.ok(typeof entry.path === "string" && entry.path === `./content/books/${entry.id}.json`, `Published book path must match its ID: ${entry.id}`);
  const bookPath = resolve(root, entry.path);
  assert.ok(existsSync(bookPath), `Published book file is missing: ${entry.path}`);
  const book = JSON.parse(readFileSync(bookPath, "utf8"));
  assert.equal(book.id, entry.id, `Book ID does not match catalog entry: ${entry.id}`);
  assert.ok(typeof book.title === "string" && book.title.trim(), `Book title is missing: ${entry.id}`);
  if (book.status === "prerelease") {
    assert.ok(!Array.isArray(book.chapters) || book.chapters.length === 0, `Prerelease book must not expose chapters: ${entry.id}`);
  } else {
    assert.ok(Array.isArray(book.chapters) && book.chapters.length > 0, `Book must contain at least one chapter: ${entry.id}`);
    assert.ok(book.chapters.every(chapter => typeof chapter === "string" || (chapter && typeof chapter === "object" && typeof chapter.content === "string")), `Book chapters have an invalid format: ${entry.id}`);
  }
}
assert.match(html, /PUBLISHED_CATALOG_URL\s*=\s*['"]\.\/content\/catalog\.json['"]/, "Published catalog loader is missing");
assert.match(html, /async function loadPublishedBooks\(/, "Published book loader is missing");
assert.match(html, /PUBLISHED_BOOKS_KEY/, "Published book offline cache is missing");

try {
  new Function(serviceWorker);
} catch (error) {
  throw new Error(`Service worker has a syntax error: ${error.message}`);
}

for (const icon of manifest.icons || []) {
  if (icon.src.startsWith("./")) {
    assert.ok(existsSync(resolve(root, icon.src)), `Manifest icon does not exist: ${icon.src}`);
  }
}
console.log(`AI Library release validation passed: ${scripts.length} inline scripts, service worker, ${ids.length} IDs, manifest and local assets checked.`);
