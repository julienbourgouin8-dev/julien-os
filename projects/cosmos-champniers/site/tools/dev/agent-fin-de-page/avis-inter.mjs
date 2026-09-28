// Avis : compteur en cours (scroll réel), cartes dépliées, drag souris. usage: node avis-inter.mjs <w> <h>
import { createRequire } from "node:module";
const require = createRequire("/Users/julien/julien-os/scripts/playwright/package.json");
const { chromium } = require("playwright");
const [w, h] = process.argv.slice(2).map(Number);
const tag = w < 800 ? "m" : "d";
const OUT = "/Users/julien/julien-os/projects/cosmos-champniers/site/_shots/avis";
const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
await page.goto("http://localhost:5178/", { waitUntil: "load" });
await page.waitForFunction("window.__ready === true", null, { timeout: 45000 });
await page.waitForTimeout(500);
// saut direct juste avant la section (Lenis suit la position native)
const top = await page.evaluate(() => document.querySelector("#avis .avis__top").getBoundingClientRect().top + scrollY);
await page.evaluate((y) => { window.Cosmos.lenis ? window.Cosmos.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, top - h * 0.55);
await page.waitForTimeout(450);
const n1 = await page.textContent("#avis .avis__num");
await page.screenshot({ path: `${OUT}/0-compteur-en-cours-${tag}.png` });
await page.waitForTimeout(2600);
const n2 = await page.textContent("#avis .avis__num");
console.log("compteur", n1, "->", n2);
// déplier
await page.evaluate((y) => window.Cosmos.lenis ? window.Cosmos.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y), top + (w < 800 ? h * 0.55 : h * 0.3));
await page.waitForTimeout(800);
const btns = await page.$$("#avis .avis__more:not([hidden])");
console.log("boutons Lire la suite visibles:", btns.length);
for (const bt of btns.slice(0, w < 800 ? 1 : 2)) await bt.click();
await page.waitForTimeout(500);
const state = await page.evaluate(() => [...document.querySelectorAll("#avis .avis__card")].map((c) => {
  const t = c.querySelector(".avis__text");
  return { open: c.classList.contains("is-open"), full: t.scrollHeight <= t.clientHeight + 1, h: Math.round(c.getBoundingClientRect().height) };
}));
console.log(JSON.stringify(state));
await page.screenshot({ path: `${OUT}/3-deplies-${tag}.png` });
// drag souris (desktop) / scroll natif (mobile) vers la 3e carte
if (w >= 800) {
  const box = await (await page.$("#avis .avis__track")).boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + 60, { steps: 12 });
  await page.mouse.up();
} else {
  await page.evaluate(() => document.querySelector("#avis .avis__track").scrollBy({ left: innerWidth * 1.7 }));
}
await page.waitForTimeout(900);
console.log("scrollLeft", await page.evaluate(() => document.querySelector("#avis .avis__track").scrollLeft));
const btns2 = await page.$$("#avis .avis__card:not(.is-open) .avis__more:not([hidden])");
if (btns2.length) { await btns2[btns2.length - 1].click(); await page.waitForTimeout(400); }
await page.screenshot({ path: `${OUT}/4-drag-deplie-${tag}.png` });
console.log("console:", errs.length ? errs : "aucune erreur");
await b.close();
