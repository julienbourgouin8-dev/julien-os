// Captures sections 60-90. Chaque capture : mesure live -> ?jump=y -> contrôle de dérive -> screenshot.
// Même contrat que verify.js shot (attend __ready, puis 1200 ms). usage: node shoot.mjs <w> <h> [filtre] [--verify]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const require = createRequire("/Users/julien/julien-os/scripts/playwright/package.json");
const { chromium } = require("playwright");
const args = process.argv.slice(2);
const [w, h] = args.slice(0, 2).map(Number);
const filter = args[2] && !args[2].startsWith("--") ? args[2] : "";
const useVerify = args.includes("--verify");
const SITE = "/Users/julien/julien-os/projects/cosmos-champniers/site";
const VERIFY = "/Users/julien/julien-os/.agents/skills/site-revamp/scripts/verify.js";
const tag = w < 800 ? "m" : "d";

const measure = () => {
  const top = (s) => {
    let e = document.querySelector(s); if (!e) return null;
    if (e.parentElement && e.parentElement.classList.contains("pin-spacer")) e = e.parentElement;
    return Math.round(e.getBoundingClientRect().top + scrollY);
  };
  return {
    stage: top("#prive .prive__stage"), body: top("#prive .prive__body"),
    avis: top("#avis"), facade: top("#infos .infos__facade"), grid: top("#infos .infos__grid"),
    max: document.documentElement.scrollHeight - innerHeight, vh: innerHeight,
  };
};
const specs = (pos) => {
  const pin = Math.round(pos.vh * 1.2);
  return [
    ["prive", "0-approche", "stage", -Math.round(pos.vh * 0.5)],
    ["prive", "1-debut", "stage", 0],
    ["prive", "2-scission", "stage", Math.round(pin * 0.22)],
    ["prive", "3-milieu", "stage", Math.round(pin * 0.45)],
    ["prive", "4-titre", "stage", Math.round(pin * 0.68)],
    ["prive", "5-fin", "stage", pin],
    ["prive", "6-corps", "body", -Math.round(pos.vh * 0.45)],
    ["avis", "1-haut", "avis", -Math.round(pos.vh * 0.1)],
    ["avis", "2-cartes", "avis", Math.round(pos.vh * 0.35)],
    ["infos", "1-facade-debut", "facade", -Math.round(pos.vh * 0.85)],
    ["infos", "2-facade-milieu", "facade", -Math.round(pos.vh * 0.5)],
    ["infos", "3-facade-fin", "facade", -Math.round(pos.vh * 0.15)],
    ["infos", "4-grille", "grid", -Math.round(pos.vh * 0.12)],
    ["footer", "1-entree", "max", -Math.round(pos.vh * 0.55)],
    ["footer", "2-milieu", "max", -Math.round(pos.vh * 0.2)],
    ["footer", "3-fin", "max", 0],
  ].filter(([id, n]) => (id + "/" + n).includes(filter));
};

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: w, height: h } });
const page = await ctx.newPage();
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text() + " @ " + (m.location().url || "").slice(0, 80)));
page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
const load = async (y) => {
  await page.goto(`http://localhost:5178/?jump=${y}&t=${Date.now()}`, { waitUntil: "load" });
  await page.waitForFunction("window.__ready === true", null, { timeout: 45000 });
};
await load(0);
let pos = await page.evaluate(measure);
console.log(JSON.stringify(pos));
for (const [id, name, key, off] of specs(pos)) {
  let y, tries = 0;
  for (;;) {
    y = Math.max(0, Math.min(pos[key] + off, pos.max));
    await load(y);
    const now = await page.evaluate(measure);
    if (now[key] === pos[key] || tries++ >= 2) { pos = now; break; }
    pos = now; // la page a changé entre-temps : on recale
  }
  await page.waitForTimeout(1200);
  mkdirSync(`${SITE}/_shots/${id}`, { recursive: true });
  const out = `${SITE}/_shots/${id}/${name}-${tag}.png`;
  if (useVerify) execFileSync("node", [VERIFY, "shot", `http://localhost:5178/?jump=${y}`, out, String(w), String(h)], { stdio: "inherit", cwd: "/Users/julien/julien-os/.agents/skills/site-revamp/scripts" });
  else { await page.screenshot({ path: out }); console.log("captured", out, "y=" + y); }
}
console.log("console:", errs.length ? errs : "aucune erreur");
await b.close();
