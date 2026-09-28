import { createRequire } from "node:module";
const require = createRequire("/Users/julien/julien-os/scripts/playwright/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const t0 = Date.now(); let last = "";
p.on("console", (m) => console.log("console", m.type(), m.text()));
await p.goto("http://localhost:5178/", { waitUntil: "commit" });
while (Date.now() - t0 < 12000) {
  const s = await p.evaluate(() => [typeof gsap, !!window.Cosmos, document.fonts.status, !!document.querySelector(".hero__loader.is-driven"), document.body && document.body.classList.contains("is-intro"), !!document.querySelector(".hero__loader"), document.readyState].join(",")).catch(() => "nav");
  if (s !== last) { console.log(((Date.now() - t0) / 1000).toFixed(2), s); last = s; }
  await p.waitForTimeout(50);
}
await b.close();
