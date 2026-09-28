import { createRequire } from "node:module";
const require = createRequire("/Users/julien/julien-os/scripts/playwright/package.json");
const { chromium } = require("playwright");
const [w, h] = process.argv.slice(2).map(Number);
const tag = w < 800 ? "m" : "d";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
const errs = []; p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
await p.goto("http://localhost:5178/", { waitUntil: "load" });
await p.waitForFunction("window.__ready === true");
const info = await p.evaluate(() => ({
  pinSpacers: [...document.querySelectorAll("#prive .pin-spacer, #avis .pin-spacer, #infos .pin-spacer, #footer .pin-spacer")].length,
  num: document.querySelector("#avis .avis__num").textContent,
  cardsOpacity: getComputedStyle(document.querySelector("#avis .avis__item")).opacity,
  letterT: getComputedStyle(document.querySelector("#footer .ft__letter > span")).transform,
}));
console.log(JSON.stringify(info));
for (const id of ["prive", "avis", "infos"]) {
  await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `/Users/julien/julien-os/projects/cosmos-champniers/site/_shots/${id}/reduced-${tag}.png` });
}
await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(300);
await p.screenshot({ path: `/Users/julien/julien-os/projects/cosmos-champniers/site/_shots/footer/reduced-${tag}.png` });
console.log(errs.length ? errs : "console: aucune erreur");
await b.close();
