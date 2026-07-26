#!/usr/bin/env node
// Usage: node teardown.js <youtube-url> <output-dir> [sceneThreshold=0.15]
// Downloads a video + its captions, detects scene changes (variable spacing,
// not a fixed interval), extracts one frame per detected change, and writes
// a manifest pairing each frame with the transcript lines spoken around it.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [, , url, outDir, sceneThresholdArg] = process.argv;
if (!url || !outDir) {
  console.error('Usage: node teardown.js <youtube-url> <output-dir> [sceneThreshold=0.15]');
  process.exit(1);
}
const sceneThreshold = sceneThresholdArg || '0.15';

fs.mkdirSync(outDir, { recursive: true });
const videoPath = path.join(outDir, 'source.mp4');
const framesDir = path.join(outDir, 'frames');
fs.mkdirSync(framesDir, { recursive: true });

console.log('Downloading video...');
execSync(
  `yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" --merge-output-format mp4 ` +
  `-o "${videoPath}" "${url}"`,
  { stdio: 'inherit' }
);

// Captions are best-effort and fetched as a separate step: YouTube rate-limits
// (HTTP 429) when asking for multiple caption languages in one go, and a
// caption failure should never take down the video download with it. Try
// languages one at a time, keep whichever succeeds first.
console.log('Fetching captions (best-effort)...');
let gotSubs = false;
for (const lang of ['en', 'fr']) {
  if (gotSubs) break;
  try {
    execSync(
      `yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "${lang}" ` +
      `--convert-subs vtt -o "${videoPath}" "${url}"`,
      { stdio: 'inherit' }
    );
    gotSubs = true;
  } catch {
    console.warn(`Captions in "${lang}" unavailable or rate-limited, trying next language...`);
  }
}
if (!gotSubs) console.warn('No captions could be fetched — frames will have empty context.');

const subFile = fs.readdirSync(outDir).find((f) => f.endsWith('.vtt'));

console.log(`Detecting scene changes (threshold ${sceneThreshold})...`);
const sceneLog = path.join(outDir, 'scenes.log');
execSync(
  `ffmpeg -i "${videoPath}" -vf "select='gt(scene,${sceneThreshold})',showinfo" ` +
  `-vsync vfr -f null - 2> "${sceneLog}"`
);

const log = fs.readFileSync(sceneLog, 'utf8');
const timestamps = [...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => parseFloat(m[1]));
console.log(`Found ${timestamps.length} candidate frames.`);

if (timestamps.length === 0) {
  console.error('No scene changes detected — try a lower sceneThreshold (e.g. 0.08).');
  process.exit(1);
}

console.log('Extracting frames...');
timestamps.forEach((t, i) => {
  const framePath = path.join(framesDir, `frame_${String(i).padStart(4, '0')}_${t.toFixed(1)}s.png`);
  execSync(`ffmpeg -ss ${t} -i "${videoPath}" -frames:v 1 -q:v 2 "${framePath}" -y`, { stdio: 'ignore' });
});

function parseVtt(content) {
  const cues = [];
  const blocks = content.split(/\r?\n\r?\n/);
  const toSec = (ts) => {
    const [h, m, s] = ts.split(':');
    return Number(h) * 3600 + Number(m) * 60 + parseFloat(s);
  };
  for (const block of blocks) {
    const timeMatch = block.match(/(\d\d:\d\d:\d\d\.\d\d\d) --> (\d\d:\d\d:\d\d\.\d\d\d)/);
    if (!timeMatch) continue;
    const text = block.split('\n').slice(1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) cues.push({ start: toSec(timeMatch[1]), end: toSec(timeMatch[2]), text });
  }
  return cues;
}

let manifest = timestamps.map((t, i) => ({
  frame: `frames/frame_${String(i).padStart(4, '0')}_${t.toFixed(1)}s.png`,
  timestamp: t,
  context: '',
}));

if (subFile) {
  const cues = parseVtt(fs.readFileSync(path.join(outDir, subFile), 'utf8'));
  manifest = manifest.map((entry) => {
    const nearby = cues.filter((c) => Math.abs(c.start - entry.timestamp) < 8);
    // dedupe consecutive repeated auto-caption lines (common in YouTube auto-subs)
    const seen = new Set();
    const text = nearby
      .map((c) => c.text)
      .filter((t) => (seen.has(t) ? false : seen.add(t)))
      .join(' ');
    return { ...entry, context: text };
  });
} else {
  console.warn('No captions found for this video — frames will have empty context.');
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Done. ${timestamps.length} frames in ${framesDir}`);
console.log(`Manifest: ${path.join(outDir, 'manifest.json')}`);
