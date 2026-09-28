// Drag carrousel + lightbox. Usage: node interact.mjs desktop|mobile
import { chromium } from "/Users/julien/julien-os/scripts/playwright/node_modules/playwright/index.mjs";
const mode = process.argv[2] || "desktop";
const OUT = "/Users/julien/julien-os/projects/cosmos-champniers/site/_shots/salle/";
const mob = mode === "mobile";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext(mob ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
await p.goto("http://localhost:5178/"); await p.waitForFunction("window.__ready===true", null, { timeout: 45000 });
await p.waitForTimeout(4500); // intro du hero
const pre = (s) => p.screenshot({ path: OUT + (mob ? "m-" : "d-") + s + ".png" });
const state = () => p.evaluate(() => ({
  cap: document.querySelector("[data-sl-caption]").textContent,
  lb: !document.querySelector(".sl-lb").hidden,
  stopped: document.documentElement.classList.contains("lenis-stopped"),
  focus: document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName,
  y: Math.round(scrollY),
}));
// aller au carrousel (bas de l'entrée)
await p.evaluate(() => { const r = document.querySelector(".sl-carousel"); const y = r.getBoundingClientRect().top + scrollY - innerHeight * 0.22; Cosmos.lenis ? Cosmos.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
await p.waitForTimeout(2200);
await pre("x-avant-drag");
const box = await p.locator(".sl-carousel").boundingBox();
const cy = box.y + box.height / 2, W = mob ? 390 : 1440;
// drag rapide vers la gauche (lancer)
await p.mouse.move(W * 0.7, cy); await p.mouse.down();
for (let i = 1; i <= 8; i++) { await p.mouse.move(W * 0.7 - i * (W * 0.045), cy + i * 0.5); await p.waitForTimeout(16); }
await pre("x-drag-pendant");
await p.mouse.up();
await p.waitForTimeout(250); await pre("x-drag-inertie");
await p.waitForTimeout(1500); await pre("x-drag-fin");
console.log("après drag", await state());
// clic / tap sur la slide active -> lightbox
const act = p.locator(".sl-slide.is-active");
if (mob) await act.tap(); else await act.click();
await p.waitForTimeout(420); await pre("x-lb-ouverture");
await p.waitForTimeout(1300); await pre("x-lb");
console.log("lightbox", await state());
// suivante
if (mob) await p.locator("[data-lb-next]").tap(); else await p.keyboard.press("ArrowRight");
await p.waitForTimeout(450); await pre("x-lb-transition");
await p.waitForTimeout(1100); await pre("x-lb-suivante");
console.log("lb suivante", await p.evaluate(() => document.querySelector("[data-lb-caption]").textContent));
// fermer
if (mob) await p.locator("[data-lb-close]").tap(); else await p.keyboard.press("Escape");
await p.waitForTimeout(400); await pre("x-lb-fermeture");
await p.waitForTimeout(1200); await pre("x-apres-fermeture");
console.log("fermé", await state());
// scroll de nouveau possible ?
await p.mouse.wheel(0, 400); await p.waitForTimeout(900);
console.log("scroll après fermeture", await state());
console.log("ERREURS:", errs.length ? errs : "aucune");
await b.close();
