import { createRequire } from "node:module";
const require = createRequire("/Users/julien/julien-os/scripts/playwright/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch({ headless: true, args: ["--hide-scrollbars"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5178/");
await p.waitForFunction("window.__ready === true && !document.body.classList.contains('is-intro')", null, { timeout: 45000 });
await p.waitForTimeout(800);
await p.evaluate(() => { window.__d = []; let l = performance.now(); const f = (t) => { window.__d.push([t - l, scrollY]); l = t; if (window.__run) requestAnimationFrame(f); }; window.__run = true; requestAnimationFrame(f); });
for (let i = 0; i < 70; i++) { await p.mouse.wheel(0, 60); await p.waitForTimeout(16); }
await p.waitForTimeout(1500);
const d = await p.evaluate(() => { window.__run = false; return window.__d; });
const ms = d.map((x) => x[0]).slice(2).sort((a, b) => a - b);
console.log({ frames: ms.length, finalY: Math.round(d.at(-1)[1]), p50: ms[ms.length >> 1].toFixed(1), p95: ms[Math.floor(ms.length * 0.95)].toFixed(1), max: ms.at(-1).toFixed(1), over50: ms.filter((x) => x > 50).length });
console.log("spikes:", d.filter((x) => x[0] > 40).map((x) => `${x[0].toFixed(0)}ms@y${Math.round(x[1])}`).join(" "));
await b.close();
