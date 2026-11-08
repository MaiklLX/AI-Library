import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, mkdirSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = resolve(root, "artifacts/duology-visual");
mkdirSync(output, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  const file = resolve(root, "." + pathname);
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
  response.end(readFileSync(file));
});

await new Promise(resolveServer => server.listen(4173, "127.0.0.1", resolveServer));
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000, columns: 2 },
    { name: "mobile-390", width: 390, height: 844, columns: 1 },
    { name: "mobile-360", width: 360, height: 800, columns: 1 }
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    page.on("pageerror", error => pageErrors.push(viewport.name + ": " + error.message));
    await page.clock.install({ time: new Date("2026-11-08T12:00:00+03:00") });
    await page.goto("http://127.0.0.1:4173/collection.html?id=poka-nas-ne-naydut", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelectorAll("#volumeList .volume").length === 2);

    const cards = page.locator("#volumeList .volume");
    assert.equal(await cards.count(), 2, viewport.name + ": exactly two volume cards must render");
    assert.equal(await page.locator(".volume-primary").count(), 1, viewport.name + ": Book I primary treatment missing");
    assert.equal(await page.locator(".volume-continuation").count(), 1, viewport.name + ": Book II continuation treatment missing");
    assert.equal(await page.locator(".volume-primary").getAttribute("aria-label"), "Книга I — первая часть дилогии");
    assert.equal(await page.locator(".volume-continuation").getAttribute("aria-label"), "Книга II — продолжение дилогии");

    const layout = await page.evaluate(() => {
      const list = document.querySelector("#volumeList");
      const boxes = [...list.querySelectorAll(".volume")].map(card => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      return {
        columns: getComputedStyle(list).gridTemplateColumns.trim().split(" ").length,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        boxes,
        artCount: list.querySelectorAll(".volume-art").length,
        heroCoverLoaded: document.querySelector("#cover").complete && document.querySelector("#cover").naturalWidth > 0,
        headerHeights: [...document.querySelector(".topbar").children].map(item => item.getBoundingClientRect().height)
      };
    });
    assert.equal(layout.columns, viewport.columns, viewport.name + ": incorrect responsive column count");
    assert.ok(layout.scrollWidth <= layout.viewportWidth + 1, viewport.name + ": horizontal page overflow detected");
    assert.equal(layout.artCount, 2, viewport.name + ": both volumes must have distinct visual artwork");
    assert.ok(layout.heroCoverLoaded, viewport.name + ": the collection cover did not load");
    if (viewport.width <= 380) assert.ok(layout.headerHeights[0] <= 40 && layout.headerHeights[1] <= 16, viewport.name + ": the collection header wraps awkwardly on a narrow screen");
    if (viewport.columns === 2) {
      assert.ok(layout.boxes[0].left < layout.boxes[1].left, "Desktop cards must sit side by side");
      assert.ok(layout.boxes[0].right <= layout.boxes[1].left, "Desktop cards must not overlap");
    } else {
      assert.ok(layout.boxes[1].top >= layout.boxes[0].bottom, viewport.name + ": mobile cards must stack without overlap");
    }

    const firstAnnotation = await page.locator(".volume-primary .volume-info").textContent();
    const secondAnnotationBeforeReveal = await page.locator(".volume-continuation .volume-info").textContent();
    assert.ok(firstAnnotation && !firstAnnotation.includes("Аннотация откроется"), viewport.name + ": Book I annotation must be visible");
    assert.equal(secondAnnotationBeforeReveal, "Аннотация откроется за 48 часов до релиза.", viewport.name + ": Book II annotation must remain hidden before reveal");
    await page.screenshot({ path: resolve(output, "collection-" + viewport.name + ".png"), fullPage: true });

    await page.clock.setFixedTime(new Date("2026-11-18T18:00:00+03:00"));
    await page.waitForTimeout(1100);
    const secondAnnotationAfterReveal = await page.locator(".volume-continuation .volume-info").textContent();
    assert.ok(secondAnnotationAfterReveal && secondAnnotationAfterReveal !== "Аннотация откроется за 48 часов до релиза.", viewport.name + ": Book II annotation did not reveal at the scheduled instant");
    if (viewport.name === "mobile-390") await page.screenshot({ path: resolve(output, "collection-mobile-390-annotation-revealed.png"), fullPage: true });
    await page.close();
  }

  const premiere = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  premiere.on("pageerror", error => pageErrors.push("premiere: " + error.message));
  await premiere.goto("http://127.0.0.1:4173/premiere.html?book=poka-nas-ne-naydut", { waitUntil: "networkidle" });
  await premiere.locator("#duologyDetailsLink").waitFor({ state: "visible" });
  assert.equal(await premiere.locator("#duologyDetailsLink").getAttribute("href"), "./collection.html?id=poka-nas-ne-naydut");
  await premiere.screenshot({ path: resolve(output, "premiere-collection-link.png"), fullPage: true });
  await premiere.close();

  assert.deepEqual(pageErrors, [], "Browser console/runtime errors were reported");
  process.stdout.write("Visual checks passed: desktop, 390px mobile, 360px mobile, annotation reveal, and premiere navigation. Screenshots saved to artifacts/duology-visual/.");
} finally {
  await browser.close();
  await new Promise(resolveServer => server.close(resolveServer));
}
