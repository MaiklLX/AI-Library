import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.webmanifest"), "utf8"));
const serviceWorker = readFileSync(resolve(root, "sw.js"), "utf8");
const platformRuntime = readFileSync(resolve(root, "src/platform/runtime.js"), "utf8");
const libraryStore = readFileSync(resolve(root, "src/platform/library-store.js"), "utf8");
const downloadManager = readFileSync(resolve(root, "src/platform/download-manager.js"), "utf8");

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
assert.match(html, /<script src=["']\.\/src\/platform\/runtime\.js["']><\/script>/, "Cross-platform runtime must load before the main application");
assert.match(serviceWorker, /['"]\.\/src\/platform\/runtime\.js['"]/, "Platform runtime must be included in the offline app shell");
assert.match(platformRuntime, /const DB_NAME = ['"]ai-library-platform['"]/, "Platform storage database is missing");
assert.match(platformRuntime, /books: 'books',[\s\S]*metadata: 'metadata',[\s\S]*downloads: 'downloads'/, "Platform storage collections are incomplete");
assert.match(platformRuntime, /transaction\.oncomplete/, "IndexedDB writes must resolve only after transaction completion");
assert.match(html, /<script src=["']\.\/src\/platform\/library-store\.js["']><\/script>/, "Library storage adapter must load after the platform runtime");
assert.match(serviceWorker, /['"]\.\/src\/platform\/library-store\.js['"]/, "Library storage adapter must be cached for offline startup");
assert.match(libraryStore, /async getBook\(/, "Library storage adapter must expose book retrieval");
assert.match(html, /<script src=["\']\.\/src\/platform\/download-manager\.js["\']><\/script>/, "Offline download manager must load after the storage adapter");
assert.match(serviceWorker, /[\']\.\/src\/platform\/download-manager\.js[\']/, "Offline download manager must be cached in the app shell");
assert.match(downloadManager, /async function download\(/, "Offline download manager must expose a download workflow");
assert.match(downloadManager, /async function checkForUpdate\(/, "Offline books must support non-destructive update checks");
assert.match(downloadManager, /updateAvailable\.delete\(record\.id\)/, "Successful replacement must clear the pending update state");
assert.match(html, /data-library-check-update=/, "Downloaded books must expose update checks in the personal library");
assert.match(html, /async function handleOfflineUpdateCheck\(/, "Personal library update action must be wired");

assert.match(downloadManager, /async function getStorageInfo\(/, "Offline storage status must be available to the library UI");
assert.match(downloadManager, /async function requestPersistence\(/, "Persistent storage must be requested only through an explicit user action");
assert.match(html, /id="requestStoragePersistence"/, "Personal library must expose an explicit storage protection action");
assert.match(html, /id="myLibraryStorageStatus"/, "Personal library must show local storage status");
assert.match(downloadManager, /validateBook\(book, rawId\)/, "Offline downloads must validate book structure before saving");
assert.match(downloadManager, /await store\.setDownload\(record\)/, "Offline book content and ready status must be persisted together");
assert.match(libraryStore, /async getDownloads\(/, "Library storage adapter must expose download collection retrieval");
assert.match(html, /data-download-book=/, "Published catalog cards must expose offline download actions");
assert.match(html, /id="myLibraryDownloads"/, "Personal library must show downloaded books");
assert.match(html, /async function loadDownloadedBooks\(/, "Offline books must be restored from durable storage at startup");
assert.match(html, /async function removeOfflineDownload\(/, "Offline downloads must be removable from the personal library");
try { new Function(downloadManager); } catch (error) { throw new Error(`Offline download manager has a syntax error: ${error.message}`); }
assert.match(libraryStore, /async saveBook\(/, "Library storage adapter must expose book persistence");
assert.match(libraryStore, /async getMetadata\(/, "Library storage adapter must expose metadata retrieval");
assert.match(libraryStore, /async setDownload\(/, "Library storage adapter must expose download-state persistence");
assert.match(html, /id="myLibrary"/, "Personal library section is missing");
assert.match(html, /id="myLibraryToggle"/, "Personal library navigation control is missing");
assert.match(html, /function renderMyLibrary\(/, "Personal library renderer is missing");
assert.match(html, /data-library-read=/, "Personal library book actions are missing");
assert.match(html, /renderPrereleaseShowcase\(\);renderMyLibrary\(\)/, "Personal library must refresh with catalog rendering");
assert.doesNotMatch(libraryStore, /localStorage\.clear|localStorage\.removeItem|PERSONAL_BOOKS_KEY/, "Platform storage adapter must not migrate or clear legacy browser data");
try {
  new Function(libraryStore);
} catch (error) {
  throw new Error(`Library storage adapter has a syntax error: ${error.message}`);
}
try {
  new Function(platformRuntime);
} catch (error) {
  throw new Error(`Platform runtime has a syntax error: ${error.message}`);
}
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*[\'"]v\d+[\'"]/, "Offline shell cache version must be refreshed for the current reader release");
assert.match(serviceWorker, /request\.mode\s*===\s*['"]navigate['"]/, "Offline navigation fallback is missing");
assert.match(serviceWorker, /url\.origin\s*!==\s*self\.location\.origin/, "Service worker must not intercept external APIs");
assert.match(html, /id="exportLibraryData"/, "Personal data export control is missing");
assert.match(html, /id="importLibraryData"/, "Personal data import control is missing");
assert.match(html, /getAllBooks\(\)\.filter\(book=>book\.status!==["\']prerelease["\']&&\(Number\(book\.chapterCount\)>0\|\|\(Array\.isArray\(book\.chapters\)&&book\.chapters\.length>0\)\)\)/, "Random discovery must include metadata-only published books and exclude prerelease");
assert.match(html, /desktop-two-page-book-spread-v31/, "Desktop two-page book spread styles are missing");
assert.match(html, /function isDesktopReaderSpread\(\)/, "Desktop spread mode detection is missing");
assert.match(html, /const pageStep=isDesktopReaderSpread\(\)\?2:1/, "Desktop page turns must advance by a two-page spread");
assert.match(html, /book-page-right/, "The right page of the desktop spread is missing");
assert.match(html, /#books \.book-flip-back\{display:none!important\}/, "Desktop card back-flip affordance must be hidden");
assert.match(html, /desktop-reader-spread-layout-fix-v32/, "Desktop spread must override the immersive single-page absolute layout");
assert.match(html, /position:relative!important;inset:auto!important;flex:1 1 50%!important/, "Desktop spread pages must sit side by side rather than overlap");
assert.match(html, /reader-settings\{top:calc\(66px/, "Desktop reading settings must open below the top toolbar");
assert.match(html, /rightReader\.style\.fontSize=settings\.fontSize/, "Reader typography settings must apply to both pages");
assert.match(html, /readerHoverEnabled=window\.matchMedia\('\(hover: hover\) and \(pointer: fine\)'\)\.matches/, "Desktop reader hover controls must be enabled only for mouse-like pointers");
assert.match(html, /const readerHoverEdge=64/, "Desktop reader controls must reveal from the screen edges");
assert.match(html, /readerArea\.addEventListener\('pointerup'/, "Mouse and touch page-edge interaction must use the visible reader viewport");
assert.match(html, /function exportLibraryBackup\(/, "Backup export logic is missing");
assert.match(html, /async function importLibraryBackup\(/, "Backup import logic is missing");
assert.match(html, /const safeClass\s*=\s*value\s*=>/, "Dynamic cover classes must be sanitized");
assert.match(html, /data-book-id="\x27\+esc\(book\.id\)\+\x27"/, "Book card IDs from imported data must be escaped in HTML attributes");
assert.match(html, /data-fav="\x27\+esc\(book\.id\)\+\x27"/, "Favorite button IDs from imported data must be escaped in HTML attributes");
assert.match(html, /data-read="\x27\+esc\(book\.id\)\+\x27"/, "Read button IDs from imported data must be escaped in HTML attributes");
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
  assert.equal(entry.metadataOnly, true, `Catalog must contain metadata only: ${entry.id}`);
  assert.ok(Number.isInteger(entry.chapterCount) && entry.chapterCount >= 0, `Catalog chapter count is missing: ${entry.id}`);
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

assert.match(html, /id="reader-desktop-flow-layout-v33"/, "Desktop reader must use the stable flex-flow layout");
assert.match(html, /\.book-spread\s*\{[^}]*position:relative!important;[^}]*display:flex!important;[^}]*flex:1 1 0!important/s, "Desktop book spread must participate in normal reader layout");
assert.match(html, /\.book-spread>\.book-page\s*\{[^}]*position:relative!important;[^}]*height:auto!important/s, "Desktop pages must not be absolutely stacked");
assert.match(serviceWorker, /const CACHE_NAME\s*=\s*CACHE_PREFIX\s*\+\s*[\'"]v\d+[\'"]/, "Reader page-turn cache must use a versioned cache name");


assert.match(html, /let pageTokenEstimate = 0/, "Pagination should reuse measured page lengths to reduce DOM layout work");
assert.match(html, /reader-interaction-performance-fixes-v34/, "Reader interaction fixes must be present");
assert.match(html, /readerArea\.addEventListener\('pointerup'/, "Page edge handling must be delegated from the reader viewport");
assert.doesNotMatch(html, /if\s*\(e\.pointerType\s*===\s*['"]mouse['"]\)\s*return/, "Mouse clicks must not be excluded from page edge turns");


assert.match(html, /reader-crisp-page-turn-v35/, "Reader must use the crisp non-3D page transition");
assert.match(html, /const pageState=getReaderPageState\(readingPageIndex,localTotalPages,spread\)/, "Reader page index must align with the current chapter page count and canonical spread state");
assert.match(html, /rightPage=spread&&startIndex\+1<total\?startIndex\+2:null/, "Right-page numbering must be conditional on a real page");
assert.match(html, /readerPageStatus/, "Reader spread counter must remain available");
assert.doesNotMatch(html, /function animateBookPageTurn\(direction, afterTurn\)\s*\{[\s\S]{0,1500}rotateY/, "Page-turn logic must not rotate text content in 3D");
assert.match(html, /readerTurnInProgress/, "Reader must guard against overlapping page-turn animations");
assert.match(serviceWorker, /const CACHE_NAME\s*=\s*CACHE_PREFIX\s*\+\s*[\'"]v\d+[\'"]/, "Reader animation cache must use a versioned cache name");


assert.match(html, /function getReaderPageState\(index,totalPages,spread\)/, "Reader page numbering must use one canonical page-state calculation");
assert.match(html, /function formatReaderPageStatus\(state,totalPages\)/, "Reader status must be formatted from the canonical page state");
assert.match(html, /reader-paper-light-turn-v36/, "Crisp paper-light page-turn layer is missing");
assert.match(html, /body\.reader-open #bookPage,[\s\S]{0,900}?transform:none!important/, "The page surface must remain untransformed while the paper-light layer animates");
assert.match(html, /body\.reader-open #bookPage\.reader-turn-out-back::after/, "Single-page backward paper-light animation selector is missing");
const pageStateMatch = html.match(/function getReaderPageState\(index,totalPages,spread\)\{[\s\S]*?\n\}/);
assert.ok(pageStateMatch, "Could not isolate page-state helper for boundary tests");
const getPageState = new Function(`${pageStateMatch[0]}; return getReaderPageState;`)();
assert.deepEqual(getPageState(0, 8, true), { startIndex: 0, leftPage: 1, rightPage: 2 });
assert.deepEqual(getPageState(2, 8, true), { startIndex: 2, leftPage: 3, rightPage: 4 });
assert.deepEqual(getPageState(7, 7, true), { startIndex: 6, leftPage: 7, rightPage: null });
assert.deepEqual(getPageState(6, 7, false), { startIndex: 6, leftPage: 7, rightPage: null });
assert.deepEqual(getPageState(99, 7, true), { startIndex: 6, leftPage: 7, rightPage: null });


assert.match(html, /reader-mobile-touch-recovery-v37/, "Mobile reader interaction and animation recovery styles are missing");
assert.match(html, /mobile-paper-page-turn-v38/, "Mobile paper page-turn animation styles are missing");
assert.match(html, /ios-reader-and-catalog-fixes-v39/, "iOS reader and catalog compatibility fixes are missing");
assert.match(html, /padding-bottom:34px!important/, "Reader pagination must reserve space for the page number footer");
assert.match(html, /style\.paddingBottom/, "Book-wide page metrics cache must account for the reserved page-number footer");
assert.match(html, /aiLibraryIOSPaperFold/, "iOS fallback page-turn animation is missing");
assert.match(html, /function getReaderBookPageMetrics\(/, "Book-wide page metrics are missing");
assert.match(html, /function getBookPageNumber\(/, "Book-wide page numbering is missing");
assert.match(html, /readerArea\.addEventListener\('pointerdown'/, "Mobile edge and center taps must be handled on the reader viewport");
assert.match(html, /const surface=isDesktopReaderSpread\(\)\?bookSpreadArea:bookPageArea/, "Touch hit testing must use the visible page surface, not display:contents spread wrapper");
assert.match(html, /if\(start\.pointerType!=='mouse'\)toggleReaderChrome\(\)/, "A center tap on touch devices must toggle reader controls");
assert.match(html, /@media \(max-width:1099px\), \(hover:none\) and \(pointer:coarse\)/, "Mobile page-turn overlay must be disabled on touch devices");


assert.match(html, /AI Library visual system: editorial tokens v1/, "Editorial visual token layer is missing");
assert.match(html, /--ai-ink-950:[^;]+;/, "Editorial color tokens are missing");
assert.match(html, /#catalog \.toolbar \.search:focus/, "Catalog search focus treatment is missing");
assert.match(html, /#catalog \.genre:focus-visible/, "Catalog genre keyboard focus treatment is missing");
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v52['"]/, "Visual app-shell update must use the current cache version");


assert.match(html, /AI Library book-card actions: accessible sizing v1/, "Book card action sizing layer is missing");
assert.match(html, /#books \.book-back-actions \.read,[\s\S]*#books \.book-back-actions \.offline-download/, "Book card read and offline actions must share accessible sizing");
assert.match(html, /min-height: 48px !important/, "Book card action touch target is too small");
assert.match(html, /CACHE_PREFIX\s*\+\s*['"]v52['"]/, "Book action update must use the current cache version");

assert.match(html, /AI Library lazy book loading: metadata first v1/, "Lazy book loading marker is missing");
assert.match(html, /const loaded = catalog\.books\.map\(entry =>/, "Catalog startup must map metadata without fetching book bodies");
assert.match(html, /Full book JSON is fetched only on explicit read\/download/, "Book content loading policy is missing");
assert.match(html, /async function openBookById\\(id\\)[\\s\\S]*?fetch\\(book\\.contentPath, \\{ cache: 'no-cache' \\}\\)/, "Published book text must load on demand when opening a book");
assert.match(html, /metadataOnly: true,[\\s\\S]*?chapters: \\[\\]/, "Catalog fallback must not retain full book text in local metadata cache");
assert.match(serviceWorker, /CACHE_PREFIX\\s*\\+\\s*['"]v52['"]/, "Lazy book loading update must use the current cache version");

console.log(`AI Library release validation passed: ${scripts.length} inline scripts, service worker, ${ids.length} IDs, manifest and local assets checked.`);
