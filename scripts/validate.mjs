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
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v2['"]/, "Offline shell cache version should be bumped for this release");
assert.match(serviceWorker, /request\.mode\s*===\s*['"]navigate['"]/, "Offline navigation fallback is missing");
assert.match(serviceWorker, /url\.origin\s*!==\s*self\.location\.origin/, "Service worker must not intercept external APIs");
assert.match(html, /id="exportLibraryData"/, "Personal data export control is missing");
assert.match(html, /id="importLibraryData"/, "Personal data import control is missing");
assert.match(html, /function exportLibraryBackup\(/, "Backup export logic is missing");
assert.match(html, /async function importLibraryBackup\(/, "Backup import logic is missing");
assert.match(html, /const safeClass\s*=\s*value\s*=>/, "Dynamic cover classes must be sanitized");
assert.match(html, /data-read="\$\{esc\(b\.id\)\}"/, "Book IDs from imported data must be escaped in HTML attributes");
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
