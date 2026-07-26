#!/usr/bin/env node
/*
 * capture-reel.js — records a scripted top-to-bottom scroll of a page as a vertical MP4,
 * ready to post as an Instagram Reel/Story. Mechanical, no model.
 *
 *   node capture-reel.js <url> <out.mp4> [durationSeconds]
 *
 * Uses puppeteer-core + your system Chrome, at a real phone CSS viewport (430x932, so the
 * site's own mobile responsive layout is what gets recorded — this is what showcase-reel
 * sites should be designed for). Captures via Puppeteer's built-in screencast (requires
 * ffmpeg on PATH — same dependency as `verify.js`'s jank test, no extra install beyond
 * `npm i puppeteer-core`), then re-encodes to an exact 1080x1920 H.264/yuv420p MP4 so the
 * final output resolution is correct regardless of the capture device-pixel-ratio math.
 *
 * The page must implement the dev contract from motion-vocabulary.md:
 * window.__ready === true once the first screen is visually settled — this script refuses
 * to start scrolling before that, so a slow-loading hero never gets recorded half-loaded.
 *
 * Setup once: npm i puppeteer-core   (Google Chrome + ffmpeg installed and on PATH)
 * Chrome path is auto-detected for macOS/Linux/Windows; override with CHROME_PATH=/path.
 */
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const p = process.platform;
  if (p === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (p === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  return '/usr/bin/google-chrome';
}

// Real phone CSS width so mobile responsive layout (not desktop) is what gets recorded.
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 2 };
const FPS = 30;

async function ready(page) {
  await page.waitForFunction('window.__ready === true', { timeout: 45000 })
    .catch(() => { throw new Error('window.__ready never fired — implement the dev contract in motion-vocabulary.md'); });
}

async function main(url, out, durationSeconds) {
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: 'new',
    args: ['--hide-scrollbars', '--no-sandbox'],
  });
  let tmpWebm;
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await ready(page);
    await new Promise(r => setTimeout(r, 500)); // let any load-in animation settle first

    const scrollHeight = await page.evaluate(() =>
      (document.scrollingElement || document.documentElement).scrollHeight - window.innerHeight
    );
    if (scrollHeight <= 0) throw new Error('page has no scrollable height — is the build finished?');

    tmpWebm = path.join(os.tmpdir(), `capture-reel-${Date.now()}.webm`);
    const recorder = await page.screencast({ path: tmpWebm });

    const totalFrames = Math.round(durationSeconds * FPS);
    for (let f = 0; f <= totalFrames; f++) {
      const t = f / totalFrames;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-in-out, not mechanical on camera
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(eased * scrollHeight));
      await new Promise(r => setTimeout(r, 1000 / FPS));
    }

    await recorder.stop();

    execFileSync('ffmpeg', [
      '-y', '-i', tmpWebm,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
      '-an', out,
    ], { stdio: 'inherit' });

    console.log('captured', out);
  } finally {
    if (tmpWebm && fs.existsSync(tmpWebm)) fs.unlinkSync(tmpWebm);
    await browser.close().catch(() => {});
  }
}

const [url, out, duration] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node capture-reel.js <url> <out.mp4> [durationSeconds=18]');
  process.exit(1);
}
main(url, out, duration ? Number(duration) : 18).catch(e => { console.error(e.message); process.exit(1); });
