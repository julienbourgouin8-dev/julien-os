import { chromium } from "/Users/julien/julien-os/scripts/playwright/node_modules/playwright/index.mjs";
const out = new URL("./screens/", import.meta.url).pathname;
const pages = { home: "https://cosmos16.cosmos-tech.fr", contact: "https://cosmos16.cosmos-tech.fr/contact.php", booking: "https://booking.cosmos-tech.fr" };
const b = await chromium.launch({ headless: true });
for (const [vp, size] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: size, deviceScaleFactor: vp === "mobile" ? 2 : 1, reducedMotion: "reduce" });
  for (const [n, u] of Object.entries(pages)) {
    await p.goto(u, { waitUntil: "networkidle" });
    await p.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("in")));
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${out}${n}-${vp}.png`, fullPage: true });
  }
  await p.close();
}
await b.close(); console.log("ok");
