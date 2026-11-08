import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8765;
const baseUrl = `http://127.0.0.1:${port}`;
const artifacts = resolve(root, "artifacts");
mkdirSync(artifacts, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", root], {
  stdio: "ignore"
});
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise(resolvePromise => setTimeout(resolvePromise, 250));
  }
  throw new Error("Local preview server did not start");
}

async function newPage(viewport, timestamp) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width <= 600,
    hasTouch: viewport.width <= 600,
    serviceWorkers: "block"
  });
  await context.addInitScript(time => {
    const NativeDate = Date;
    class FrozenDate extends NativeDate {
      constructor(...args) {
        if (args.length === 0) super(time);
        else super(...args);
      }
      static now() { return time; }
    }
    window.Date = FrozenDate;
  }, timestamp);
  return { context, page: await context.newPage() };
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  if (dimensions.document > dimensions.viewport + 1) {
    throw new Error(`${label}: horizontal overflow ${dimensions.document}px > ${dimensions.viewport}px`);
  }
}

async function loadCollection(page) {
  await page.goto(`${baseUrl}/collection.html?id=poka-nas-ne-naydut`, { waitUntil: "networkidle" });
  await page.locator(".volume-primary").waitFor();
  await page.locator(".volume-continuation").waitFor();
  await page.locator(".volume-cover").evaluateAll(images => images.forEach(image => { image.loading = "eager"; }));
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  if (await page.locator(".volume").count() !== 2) throw new Error("Duology must render exactly two volume cards");
  if (await page.locator(".countdown").count() !== 2) throw new Error("Both volumes must show release countdowns");
  const labels = await page.locator(".countdown-date").allTextContents();
  if (!labels[0].includes("13 ноября") || !labels[1].includes("20 ноября")) {
    throw new Error("Volume release labels do not match the public schedule");
  }
  const firstAnnotation = (await page.locator(".volume-primary .volume-info").innerText()).trim();
  const secondAnnotation = (await page.locator(".volume-continuation .volume-info").innerText()).trim();
  if (!firstAnnotation.includes("Мира Соколова")) throw new Error("Book I annotation must be visible immediately");
  if (secondAnnotation !== "Аннотация откроется за 48 часов до релиза.") {
    throw new Error("Book II annotation must remain hidden before the 48-hour reveal");
  }
  for (const card of await page.locator(".volume").all()) {
    const action = card.locator(".action");
    if (await action.getAttribute("aria-disabled") !== "true" || await action.getAttribute("href")) {
      throw new Error("A volume must not open before its official reader-catalog entry exists");
    }
  }
}

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  const beforeReveal = Date.parse("2026-11-08T20:00:00+03:00");
  const desktop = await newPage({ width: 1440, height: 1000 }, beforeReveal);
  await loadCollection(desktop.page);
  const desktopColumns = await desktop.page.locator("#volumeList").evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\\s+/).length
  );
  if (desktopColumns !== 2) throw new Error(`Desktop layout must have two columns, got ${desktopColumns}`);
  const desktopStyles = await desktop.page.evaluate(() => {
    const first = getComputedStyle(document.querySelector(".volume-primary"));
    const second = getComputedStyle(document.querySelector(".volume-continuation"));
    return {
      firstBorder: first.borderTopColor,
      firstBackground: first.backgroundImage,
      secondBorder: second.borderTopColor,
      secondBackground: second.backgroundImage
    };
  });
  if (!desktopStyles.firstBorder.includes("0.52") || !desktopStyles.firstBackground.includes("linear-gradient")) {
    throw new Error("Book I primary emphasis is being overridden by base card styles");
  }
  if (!desktopStyles.secondBorder.includes("0.16") || !desktopStyles.secondBackground.includes("linear-gradient")) {
    throw new Error("Book II continuation styling is not being applied");
  }
  await assertNoHorizontalOverflow(desktop.page, "Desktop collection");
  await desktop.page.screenshot({ path: resolve(artifacts, "duology-desktop.png"), fullPage: true });
  await desktop.context.close();

  const mobile = await newPage({ width: 390, height: 844 }, beforeReveal);
  await loadCollection(mobile.page);
  const mobileColumns = await mobile.page.locator("#volumeList").evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\\s+/).length
  );
  if (mobileColumns !== 1) throw new Error(`Mobile layout must have one column, got ${mobileColumns}`);
  await assertNoHorizontalOverflow(mobile.page, "Mobile collection");
  await mobile.page.screenshot({ path: resolve(artifacts, "duology-mobile.png"), fullPage: true });
  await mobile.context.close();

  const reveal = await newPage({ width: 1280, height: 900 }, Date.parse("2026-11-18T18:00:00+03:00"));
  await loadCollection(reveal.page);
  const revealedAnnotation = (await reveal.page.locator(".volume-continuation .volume-info").innerText()).trim();
  if (!revealedAnnotation.startsWith("Вторая часть дилогии.")) {
    throw new Error("Book II annotation must appear exactly at the 48-hour reveal");
  }
  await reveal.context.close();

  const afterRelease = await newPage({ width: 1280, height: 900 }, Date.parse("2026-11-20T18:00:00+03:00") + 1000);
  await loadCollection(afterRelease.page);
  for (const card of await afterRelease.page.locator(".volume").all()) {
    const action = card.locator(".action");
    if (await action.getAttribute("aria-disabled") !== "true" || await action.getAttribute("href")) {
      throw new Error("Release time alone must not unlock a volume without an official catalog entry");
    }
  }
  await afterRelease.context.close();

  const premiere = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  const premierePage = await premiere.newPage();
  await premierePage.goto(`${baseUrl}/premiere.html?book=poka-nas-ne-naydut`, { waitUntil: "networkidle" });
  const collectionLink = premierePage.locator("#duologyDetailsLink");
  await collectionLink.waitFor({ state: "visible" });
  await premierePage.screenshot({ path: resolve(artifacts, "duology-premiere-link.png"), fullPage: true });
  await collectionLink.click();
  await premierePage.waitForURL(/collection\\.html\\?id=poka-nas-ne-naydut/);
  await premierePage.locator(".volume-primary").waitFor();
  await premiere.close();

  console.log("Visual QA passed: desktop, mobile, annotation reveal, release lock and premiere-to-collection navigation.");
} finally {
  if (browser) await browser.close();
  server.kill();
}
