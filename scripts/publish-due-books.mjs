import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const catalogPath = resolve(root, "content/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const now = Date.now();
const updates = [];
const seriesManifests = new Map();
const changedSeriesPaths = new Set();

for (const entry of catalog.books) {
  if (!["prerelease", "scheduled"].includes(entry.status)) continue;
  const releaseTime = Date.parse(entry.releaseAt || "");
  if (!Number.isFinite(releaseTime) || releaseTime > now) continue;

  const bookPath = resolve(root, entry.path);
  let book;
  try {
    book = JSON.parse(readFileSync(bookPath, "utf8"));
  } catch (error) {
    console.warn(`SKIP ${entry.id}: book file is unavailable or invalid (${error.message})`);
    continue;
  }

  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  const complete = chapters.length > 0 &&
    chapters.length === Number(entry.chapterCount) &&
    chapters.every(chapter =>
      typeof chapter === "string" ? chapter.trim().length > 0 :
      chapter && typeof chapter === "object" && typeof chapter.content === "string" && chapter.content.trim().length > 0
    );
  if (!complete) {
    console.warn(`SKIP ${entry.id}: expected ${entry.chapterCount} complete chapters, found ${chapters.length}. Text remains locked.`);
    continue;
  }

  const seriesId = entry.seriesId || book.seriesId || null;
  let seriesPath = null;
  let seriesVolume = null;
  if (seriesId) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(seriesId)) {
      console.warn(`SKIP ${entry.id}: invalid series ID ${seriesId}.`);
      continue;
    }
    seriesPath = resolve(root, "content", "series", `${seriesId}.json`);
    if (!seriesManifests.has(seriesPath)) {
      try {
        seriesManifests.set(seriesPath, JSON.parse(readFileSync(seriesPath, "utf8")));
      } catch (error) {
        console.warn(`SKIP ${entry.id}: series manifest is unavailable or invalid (${error.message})`);
        continue;
      }
    }
    const seriesManifest = seriesManifests.get(seriesPath);
    seriesVolume = Array.isArray(seriesManifest.volumes)
      ? seriesManifest.volumes.find(volume => volume.bookId === entry.id || volume.id === entry.id)
      : null;
    if (!seriesVolume) {
      console.warn(`SKIP ${entry.id}: volume is missing from series manifest ${seriesId}.`);
      continue;
    }
  }

  const revision = String(book.revision || entry.revision || `auto-release-${new Date(releaseTime).toISOString().replace(/[:.]/g, "-")}`);
  book.status = "published";
  book.revision = revision;
  book.tag = "НОВИНКА";
  delete book.metadataOnly;
  entry.status = "published";
  entry.revision = revision;
  entry.tag = "НОВИНКА";
  entry.metadataOnly = true;
  if (seriesVolume) {
    seriesVolume.status = "published";
    changedSeriesPaths.add(seriesPath);
  }
  updates.push({ id: entry.id, path: entry.path, revision, chapterCount: chapters.length, seriesId });
  if (!dryRun) writeFileSync(bookPath, JSON.stringify(book, null, 2) + "\n");
}

if (updates.length) {
  console.log(`${dryRun ? "DRY RUN: would publish" : "Publishing"} ${updates.length} due book(s):`);
  for (const update of updates) console.log(`- ${update.id}: ${update.chapterCount} chapters, revision ${update.revision}`);
  if (!dryRun) {
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
    for (const seriesPath of changedSeriesPaths) {
      const seriesManifest = seriesManifests.get(seriesPath);
      if (Array.isArray(seriesManifest.volumes)) {
        seriesManifest.accessMode = seriesManifest.volumes.every(volume => volume.status === "published")
          ? "published"
          : "scheduled";
      }
      writeFileSync(seriesPath, JSON.stringify(seriesManifest, null, 2) + "\n");
    }
  } else if (changedSeriesPaths.size) {
    console.log(`DRY RUN: would update ${changedSeriesPaths.size} series manifest(s).`);
  }
} else {
  console.log("No due, complete books are ready for publication.");
}
