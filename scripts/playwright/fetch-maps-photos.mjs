// Récupère les photos d'une fiche Google Maps (galerie "Photos") en pleine résolution.
// Usage : node fetch-maps-photos.mjs "<url fiche maps>" <dossier sortie> [max]
import { chromium } from "playwright";
import fs from "node:fs";
const [url, outDir, max = "80"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1512, height: 900 }, locale: "fr-FR" });
await p.goto(url, { waitUntil: "domcontentloaded" });
for (const label of ["Tout refuser", "Reject all", "Tout accepter", "Accept all"]) {
  const btn = p.getByRole("button", { name: label }).first();
  if (await btn.isVisible({ timeout: 2500 }).catch(() => false)) { await btn.click(); break; }
}
await p.waitForTimeout(3000);
// ouvre la galerie (photo principale) : la grille des photos s'affiche à gauche, on la fait défiler
await p.getByRole("button", { name: /^Photo de / }).first().click({ timeout: 10000 });
await p.waitForTimeout(4000);
const urls = new Set();
const grab = async () => {
  for (const s of await p.$$eval('img[src*="googleusercontent"], [style*="googleusercontent"]', (els) =>
    els.map((e) => e.src || ((e.getAttribute("style") || "").match(/url\("?(https:[^")]+)/) || [])[1]).filter(Boolean)))
    if (s.includes("gps-cs") || s.includes("/p/")) urls.add(s.split("=")[0]);
};
let stale = 0;
for (let i = 0; i < 80 && urls.size < +max && stale < 10; i++) {
  const before = urls.size;
  await grab();
  stale = urls.size === before ? stale + 1 : 0;
  await p.mouse.move(300, 500); await p.mouse.wheel(0, 400); await p.waitForTimeout(900);
}
await grab();
console.log("urls:", urls.size);
let n = 0;
for (const u of urls) {
  const r = await p.request.get(u + "=s2400");
  if (!r.ok()) continue;
  fs.writeFileSync(`${outDir}/maps_${String(++n).padStart(2, "0")}.jpg`, await r.body());
}
console.log("saved:", n);
await b.close();
