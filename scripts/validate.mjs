import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const seriesPage = readFileSync(resolve(root, "series.html"), "utf8");
const seriesManifest = JSON.parse(readFileSync(resolve(root, "content/series/ty-v-moih-planah.json"), "utf8"));
const premiereSeriesBook = JSON.parse(readFileSync(resolve(root, "content/books/ty-v-moih-planah.json"), "utf8"));
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
assert.match(downloadManager, /catalogRevision: String\(entry\.revision \|\| book\.revision \|\| ''\)/, "Offline downloads must remember the catalog revision");
assert.match(downloadManager, /if \(entry\.revision && String\(book\.revision \|\| ''\) !== String\(entry\.revision\)\)/, "Offline downloads must reject a text body whose revision differs from the catalog");
const updateCheckBody = downloadManager.match(/async function checkForUpdate\(id\)\s*\{([\s\S]*?)\n  \}\n\n  async function load/);
assert.ok(updateCheckBody, "Could not isolate the offline update-check workflow");
assert.match(updateCheckBody[1], /entry\.revision/, "Offline update checks must compare catalog revision metadata");
assert.doesNotMatch(updateCheckBody[1], /fetch\(entry\.path/, "Checking for an update must not download the full book body");
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
assert.match(html, /id="my-library-desktop-grid-v2"/, "Personal library responsive grid refinement is missing");
assert.match(html, /#myLibrary \.library-shelf:last-child\s*\{\s*grid-column:1 \/ -1;/, "Offline shelf must use the full desktop/tablet row");
assert.match(html, /#myLibrary #myLibraryDownloads\s*\{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);\s*\}/, "Downloaded books must use a balanced two-column wide layout");
assert.match(html, /@media \(max-width:680px\)\s*\{\s*#myLibrary #myLibraryDownloads\s*\{\s*grid-template-columns:minmax\(0,1fr\);/, "Downloaded books must return to one column on mobile");
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
  if (entry.status !== "prerelease") assert.ok(typeof entry.revision === "string" && entry.revision.trim(), `Published catalog revision is required: ${entry.id}`);
  const bookPath = resolve(root, entry.path);
  assert.ok(existsSync(bookPath), `Published book file is missing: ${entry.path}`);
  const book = JSON.parse(readFileSync(bookPath, "utf8"));
  assert.equal(book.id, entry.id, `Book ID does not match catalog entry: ${entry.id}`);
  assert.ok(typeof book.title === "string" && book.title.trim(), `Book title is missing: ${entry.id}`);
  if (book.status === "prerelease") {
    assert.ok(!Array.isArray(book.chapters) || book.chapters.length === 0, `Prerelease book must not expose chapters: ${entry.id}`);
  } else {
    assert.ok(Array.isArray(book.chapters) && book.chapters.length > 0, `Book must contain at least one chapter: ${entry.id}`);
    assert.equal(String(book.revision || ""), String(entry.revision || ""), `Published book revision must match its catalog metadata: ${entry.id}`);
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
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v60['"]/, "Visual app-shell update must use the current cache version");


assert.match(html, /AI Library book-card actions: accessible sizing v1/, "Book card action sizing layer is missing");
assert.match(html, /#books \.book-back-actions \.read,[\s\S]*#books \.book-back-actions \.offline-download/, "Book card read and offline actions must share accessible sizing");
assert.match(html, /min-height: 48px !important/, "Book card action touch target is too small");
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v60['"]/, "Book action update must use the current cache version");

assert.match(html, /PUBLISHED_CATALOG_STATE_KEY/, "Catalog update state key is missing");
assert.match(html, /function getCatalogMetadataSnapshot\(catalog\)/, "Catalog metadata snapshot helper is missing");
assert.match(html, /function checkCatalogMetadataUpdate\(catalog\)/, "Catalog metadata update comparison is missing");
assert.match(html, /checkCatalogMetadataUpdate\(catalog\)/, "Catalog metadata update check must run after successful catalog validation");
assert.match(html, /id="catalogUpdateNotice"/, "Catalog update notice UI is missing");
assert.match(html, /id="dismissCatalogUpdate"/, "Catalog update notice must be dismissible");
assert.match(html, /message\.textContent=/, "Catalog update notice must use safe text rendering");
assert.match(html, /Тексты книг не загружались\./, "Catalog update notice must clarify that book bodies were not downloaded");
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v60['"]/, "Catalog update notice must use the refreshed app-shell cache");
assert.match(html, /AI Library lazy book loading: metadata first v1/, "Lazy book loading marker is missing");
assert.match(html, /const loaded = catalog\.books\.map\(entry =>/, "Catalog startup must map metadata without fetching book bodies");
assert.match(html, /Full book JSON is fetched only on explicit read\/download/, "Book content loading policy is missing");
assert.match(html, /async function openBookById\(id\)[\s\S]*?fetch\(book\.contentPath, \{ cache: 'no-cache' \}\)/, "Published book text must load on demand when opening a book");
assert.match(html, /metadataOnly: true,[\s\S]*?chapters: \[\]/, "Catalog fallback must not retain full book text in local metadata cache");
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*['"]v60['"]/, "Lazy book loading update must use the current cache version");


assert.equal(seriesManifest.id, "ty-v-moih-planah", "Series manifest ID is incorrect");

assert.equal(premiereSeriesBook.status, "prerelease", "The premiere book must remain prerelease");
assert.equal(premiereSeriesBook.seriesId, seriesManifest.id, "The premiere book must carry its series ID");
assert.equal(premiereSeriesBook.seriesVolume, 1, "The premiere book must carry its volume number");
assert.ok(!Array.isArray(premiereSeriesBook.chapters) || premiereSeriesBook.chapters.length === 0, "The prerelease book must not expose chapter content");
for (const volume of seriesManifest.volumes.filter(item => item.status === "published")) {
  const catalogEntry = publishedCatalog.books.find(entry => entry.id === volume.bookId);
  assert.ok(catalogEntry, `Published series volume is missing from the public catalog: ${volume.bookId}`);
  const publishedSeriesBook = JSON.parse(readFileSync(resolve(root, catalogEntry.path), "utf8"));
  assert.equal(publishedSeriesBook.seriesId, seriesManifest.id, `Published series volume has an incorrect seriesId: ${volume.bookId}`);
  assert.equal(publishedSeriesBook.seriesVolume, volume.number, `Published series volume has an incorrect seriesVolume: ${volume.bookId}`);
}

assert.equal(seriesManifest.volumes.length, 6, "The series must contain exactly six volumes");
assert.ok(seriesManifest.volumes.every(volume => typeof volume.bookId === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(volume.bookId)), "Every series volume must define a valid bookId");
assert.equal(new Set(seriesManifest.volumes.map(volume => volume.bookId)).size, 6, "Series book IDs must be unique");
assert.equal(seriesManifest.volumes[0].bookId, seriesManifest.volumes[0].premiereBookId, "Volume one must preserve the existing premiere book ID");
assert.match(html, /target\.status === [\x27"]prerelease[\x27"]/, "Direct reader links must not bypass prerelease access");
assert.match(html, /await loadDownloadedBooks\(\)[\s\S]*?new URLSearchParams\(window\.location\.search\)/, "Direct reader links must resolve after published and offline books load");
assert.match(seriesPage, /progress\[\x27published-\x27\+\(volume\.bookId\|\|volume\.id\)\]/, "Series progress must use the actual published book ID");
assert.match(seriesPage, /index\.html\?book=/, "Published series volumes must deep-link to the reader");
assert.match(html, /new URLSearchParams\(window\.location\.search\)\.get\(\x27book\x27\)/, "Reader must support direct book links from the series page");
assert.deepEqual(seriesManifest.volumes.map(volume => volume.number), [1,2,3,4,5,6], "Volume order must be continuous");
assert.equal(seriesManifest.volumes[0].status, "prerelease", "The first volume must remain in prerelease");
assert.ok(seriesManifest.volumes.slice(1).every(volume => volume.status === "planned"), "Future volumes must remain planned until individually approved");
assert.ok(seriesManifest.volumes.every(volume => ["planned","prerelease","published"].includes(volume.status)), "Unknown volume status found");
assert.deepEqual(seriesManifest.volumes.map(volume => [volume.chapters.from,volume.chapters.to]), [[1,16],[17,34],[35,56],[57,66],[67,80],[81,93]], "Volume chapter boundaries changed");
assert.match(seriesPage, /content\/series\/ty-v-moih-planah\.json/, "Series page must load its manifest");
assert.match(seriesPage, /if\(location\.hash\)\{const target=document\.getElementById\(decodeURIComponent\(location\.hash\.slice\(1\)\)\);if\(target\)requestAnimationFrame\(\(\)=>target\.scrollIntoView\(\{block:[\x27"]start[\x27"]\}\)\);\}/, "Series hash navigation must scroll after async cards are rendered");

assert.match(seriesPage, /premiere\.html\?book=/, "Prerelease volume must link to the existing premiere page");
assert.match(html, /function showSeriesCompletion\(/, "Reader series completion panel is missing");
assert.ok(html.includes("Завершить роман") && html.includes("К следующему тому") && html.includes("aria-label"), "Series completion button must expose the correct accessible label");
assert.match(html, /current\?\.seriesId===["']ty-v-moih-planah["']/, "Reader must route series completion to the series page");

const completionSource = html.match(/function showSeriesCompletion\(\)\{([\s\S]*?)\n\}/);
assert.ok(completionSource, "Series completion panel is missing");
assert.match(completionSource[1], /role/, "Series completion panel must expose a status role");
assert.match(completionSource[1], /aria-live/, "Series completion panel must announce updates to assistive technology");
assert.match(completionSource[1], /const finalVolume=volume===6/, "The final volume must be handled separately");
assert.match(completionSource[1], /finalVolume\?6:volume\+1/, "Earlier volumes must point to the next volume, while the final volume must not create volume seven");
assert.match(completionSource[1], /finalVolume\?"Вернуться к серии":"Посмотреть следующий том"/, "Completion action must reflect whether the reader finished the series");
assert.match(completionSource[1], /\.\/series\.html#volume-/, "Completion must route through the series page rather than bypassing volume access status");
assert.match(seriesPage, /if\(volume\.status==='prerelease'&&volume\.premiereBookId\)/, "Prerelease cards must link only to the existing premiere page");
assert.match(seriesPage, /else if\(volume\.status==='published'\)/, "Only published volumes may expose a reading link");
assert.match(seriesPage, /action\.setAttribute\('aria-disabled','true'\)/, "Planned volumes must remain non-interactive");

assert.match(seriesPage, /const canNavigate=\(volume\.status==='prerelease'&&volume\.premiereBookId\)\|\|volume\.status==='published'/, "Only prerelease and published cards may be navigable");
assert.match(seriesPage, /document\.createElement\(canNavigate\?'a':'span'\)/, "Planned volume actions must not be rendered as links");
assert.doesNotMatch(seriesPage, /action\.href='#'/, "Planned volume actions must not contain a clickable placeholder URL");
assert.match(seriesPage, /progress\['published-'\+\(volume\.bookId\|\|volume\.id\)\]/, "Series progress must be keyed by the actual book ID");
assert.match(serviceWorker, /CACHE_PREFIX\s*\+\s*["']v60["']/, "Series presentation must use the refreshed app-shell cache");
assert.ok(serviceWorker.includes("url.pathname.includes('/content/series/')"), "Series manifest must use network-first caching");
assert.ok(serviceWorker.includes("\'./content/series/ty-v-moih-planah.json\'"), "Six-volume series manifest must be available in the offline app shell");

console.log(`AI Library release validation passed: ${scripts.length} inline scripts, service worker, ${ids.length} IDs, manifest and local assets checked.`);


assert.match(html, /catalog-single-book-balance-v1/, "Single-book catalog balance styles are missing");
assert.match(html, /#books\.grid:has\(> \.book:only-child\)/, "A one-book catalog must use a centered, constrained card column");
assert.match(html, /grid-template-columns: minmax\(0, min\(100%, 360px\)\)/, "The single catalog card must remain responsive without overflowing");


assert.match(html, /ai-library-star-sheen-v2/, "Enhanced signature star lighting layer is missing");
assert.match(html, /@keyframes aiLogoSheen/, "Logo metallic highlight animation is missing");
assert.match(html, /@keyframes aiLogoParticles/, "Logo ambient particles animation is missing");
assert.match(html, /@keyframes aiStarOrbit/, "Hero star orbit animation is missing");
assert.match(html, /@keyframes aiStarParticles/, "Hero star particles animation is missing");
assert.match(html, /@keyframes aiHeroStarGlow/, "Hero star glow animation is missing");
assert.ok(html.includes("0%, 8%, 100% { transform: translateX(-115%) rotate(12deg); opacity: 0; }"), "Logo sheen must return to an invisible identical start/end state");
assert.ok(html.includes("@media (prefers-reduced-motion: reduce)"), "Signature star animations must respect reduced-motion preferences");
assert.ok(html.includes(".hero .spark::after"), "Hero star ambient particle layer is missing");
assert.ok(html.includes(".hero .spark,\n  .hero .spark::before"), "Hero star and ambient layers must be disabled for reduced-motion users");

const openBookByIdSource = html.match(/async function openBookById\(id\) \{([\s\S]*?)\n\}/);
assert.ok(openBookByIdSource, "Could not isolate the reader book-opening workflow");
assert.match(openBookByIdSource[1], /return true;/, "Reader book opening must report successful completion");
assert.match(openBookByIdSource[1], /return false;/, "Reader book opening must report failed or blocked completion");
assert.match(openBookByIdSource[1], /book\.title[\s\S]*пререлиз/, "Prerelease notices must use the current book title");
assert.doesNotMatch(openBookByIdSource[1], /Автоматическая полночь/, "Prerelease notices must not name an unrelated book");
assert.match(html, /const opened = await openBookById\(requestedBook\);[\s\S]{0,180}?if \(opened\) \{[\s\S]{0,180}?history\.replaceState/, "Direct reader links must be preserved when a book cannot be opened");


const publishedNormalizer = html.match(/function normalizePublishedBook\(book\) \{([\s\S]*?)\n\}/);
assert.ok(publishedNormalizer, "Could not isolate published-book metadata normalization");
assert.match(publishedNormalizer[1], /\.\.\.book/, "Published-book normalization must preserve source metadata");
const normalizeFixture = new Function("book", `${publishedNormalizer[0]}; return normalizePublishedBook(book);`);
const seriesFixture = {
  id: "fixture-volume-six",
  title: "Fixture volume six",
  status: "published",
  metadataOnly: false,
  seriesId: "ty-v-moih-planah",
  seriesVolume: 6,
  chapters: ["Fixture final chapter"]
};
const normalizedSeriesFixture = normalizeFixture(seriesFixture);
assert.equal(normalizedSeriesFixture.seriesId, "ty-v-moih-planah", "Published-book normalization must preserve seriesId");
assert.equal(normalizedSeriesFixture.seriesVolume, 6, "Published-book normalization must preserve seriesVolume");
const metadataFixture = normalizeFixture({ ...seriesFixture, metadataOnly: true, chapters: [] });
assert.equal(metadataFixture.seriesId, "ty-v-moih-planah", "Metadata-only catalog records must retain seriesId");
assert.equal(metadataFixture.seriesVolume, 6, "Metadata-only catalog records must retain seriesVolume");
assert.match(html, /const loaded = catalog\.books\.map\(entry =>[\s\S]*?normalizePublishedBook\(\{ \.\.\.entry, metadataOnly: true \}\)/, "Published catalog metadata must pass through the series-aware normalizer");
assert.match(html, /const loadedBook = normalizePublishedBook\(\{ \.\.\.source, contentPath: book\.contentPath \}\)[\s\S]*?Object\.assign\(book, loadedBook, \{ metadataOnly: false \}\)/, "Loaded book content must preserve series metadata on the active book record");
assert.match(html, /function openBook\(id\) \{[\s\S]*?current = getAllBooks\(\)\.find\(b => String\(b\.id\) === String\(id\)\)/, "Reader must use the normalized book record, including its series metadata");
assert.match(html, /current\?\.seriesId===["']ty-v-moih-planah["'][\s\S]*?showSeriesCompletion\(\)/, "Final-chapter completion must be gated by the active book's series metadata");


const showPartStart = html.indexOf("function showPart() {");
assert.ok(showPartStart >= 0, "Reader chapter renderer is missing");
const showPartEnd = html.indexOf("\n}", showPartStart);
assert.ok(showPartEnd > showPartStart, "Could not isolate reader chapter renderer");
const showPartSource = html.slice(showPartStart, showPartEnd);
assert.match(showPartSource, /getElementById\(["']seriesCompletionPanel["']\)[\s\S]*?completionPanel\.hidden=true/, "Navigating to another chapter must hide the series completion panel");
const nextChapterStart = html.indexOf("document.querySelector(\"#nextChapter\").onclick=");
assert.ok(nextChapterStart >= 0, "Next-chapter handler is missing");
const nextChapterEnd = html.indexOf("document.querySelector(\"#closeModal\").onclick", nextChapterStart);
assert.ok(nextChapterEnd > nextChapterStart, "Could not isolate next-chapter handler");
const nextChapterHandler = html.slice(nextChapterStart, nextChapterEnd);
assert.match(nextChapterHandler, /part<current\.chapters\.length-1[\s\S]*?part\+\+[\s\S]*?else if\(current\?\.seriesId===["']ty-v-moih-planah["']\)\{showSeriesCompletion\(\)\}/, "Series completion must appear only after the final chapter");
