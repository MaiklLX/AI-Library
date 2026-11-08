import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const catalogPath = resolve(root, "content/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const now = Date.now();
const updates = [];

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

  const revision = String(book.revision || entry.revision || `auto-release-${new Date(releaseTime).toISOString().replace(/[:.]/g, "-")}`);
  book.status = "published";
  book.revision = revision;
  book.tag = "НОВИНКА";
  delete book.metadataOnly;
  entry.status = "published";
  entry.revision = revision;
  entry.tag = "НОВИНКА";
  entry.metadataOnly = true;
  updates.push({ id: entry.id, path: entry.path, revision, chapterCount: chapters.length });
  if (!dryRun) writeFileSync(bookPath, JSON.stringify(book, null, 2) + "\n");
}

if (updates.length) {
  console.log(`${dryRun ? "DRY RUN: would publish" : "Publishing"} ${updates.length} due book(s):`);
  for (const update of updates) console.log(`- ${update.id}: ${update.chapterCount} chapters, revision ${update.revision}`);
  if (!dryRun) writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
} else {
  console.log("No due, complete books are ready for publication.");
}
