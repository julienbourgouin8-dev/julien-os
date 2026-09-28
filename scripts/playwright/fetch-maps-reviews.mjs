// Récupère les avis Google Maps d'une fiche, triés du plus récent au plus ancien.
// Usage : node fetch-maps-reviews.mjs "<url fiche maps>" <sortie.json> [max=60]
import { chromium } from "./node_modules/playwright/index.mjs";
import { writeFileSync } from "fs";
const [url, out, maxArg] = process.argv.slice(2);
const MAX = +(maxArg || 60);
const b = await chromium.launch();
const p = await b.newPage({ locale: "fr-FR", viewport: { width: 1400, height: 1000 } });
await p.goto(url, { waitUntil: "domcontentloaded" });
// mur de consentement Google (profil neuf) : on refuse le non essentiel
for (const label of ["Tout refuser", "Reject all", "Tout accepter", "Accept all"]) {
  const btn = p.getByRole("button", { name: label }).first();
  if (await btn.isVisible().catch(() => false)) { await btn.click(); break; }
}
await p.waitForTimeout(3000);
const tab = p.getByRole("tab", { name: /Avis/ }).first();
if (await tab.isVisible().catch(() => false)) { await tab.click(); await p.waitForTimeout(2000); }
await p.locator('button[aria-label*="Trier"]').first().click();
await p.waitForTimeout(1000);
const opt = await p.evaluate(() => {
  const el = [...document.querySelectorAll('[role="menuitemradio"], [data-index]')].find((e) => /récents|recent/i.test(e.textContent));
  if (el) el.click();
  return el ? el.textContent.trim() : null;
});
if (!opt) { await p.screenshot({ path: out + ".debug.png" }); console.log("tri introuvable, avis par pertinence"); }
await p.waitForTimeout(2500);
let last = 0, still = 0;
for (let i = 0; i < 80; i++) {
  const n = await p.evaluate(() => {
    const first = document.querySelector("div.jftiEf"); let sc = first;
    while (sc && !(sc.scrollHeight > sc.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (sc) sc.scrollTop = sc.scrollHeight;
    return document.querySelectorAll("div.jftiEf").length;
  });
  if (n >= MAX) break;
  still = n === last ? still + 1 : 0; last = n;
  if (still > 6) break;
  await p.waitForTimeout(900);
}
await p.evaluate(() => document.querySelectorAll("button.w8nwRe").forEach((b) => b.click()));
await p.waitForTimeout(800);
const rv = await p.evaluate(() => [...document.querySelectorAll("div.jftiEf")].map((r) => ({
  author: r.querySelector(".d4r55")?.textContent.trim(),
  stars: parseInt(r.querySelector(".kvMYJc")?.getAttribute("aria-label") || "0"),
  date: r.querySelector(".rsqaWe")?.textContent.trim(),
  text: (r.querySelector(".wiI7pd")?.textContent || "").trim(),
})));
writeFileSync(out, JSON.stringify(rv, null, 2));
console.log(rv.length, "avis ->", out);
await b.close();
