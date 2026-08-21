// Scroll-scrubbed "video" — flipbook d'images dessinées sur canvas, pilotées
// par la position de scroll. Mécanique suivie à la lettre depuis
// .claude/skills/site-revamp/engine-recipes.md (canvas plutôt que
// video.currentTime pour éviter le stutter de seek ; createImageBitmap pour
// décoder hors thread ; pas de fenêtre d'éviction ; DPR plafonné à 1 ;
// préchargement prioritaire symétrique autour de la frame courante ; garde
// de section hors champ).
//
// Desktop / no-reduced-motion : canvas + frames.
// Mobile / prefers-reduced-motion : <video> native, scrubée par currentTime
// (mobile) ou lue en autoplay/loop simple (reduced motion) — le coût
// bande passante de N images dépasse vite celui d'un flux vidéo compressé.
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".scrollvid");
  if (!sections.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  sections.forEach((section) => initSection(section, { reducedMotion, isMobile }));
});

function initSection(section, { reducedMotion, isMobile }) {
  const sticky = section.querySelector(".scrollvid__sticky");
  const canvas = section.querySelector(".scrollvid__canvas");
  const video = section.querySelector(".scrollvid__video");
  if (!sticky || !canvas || !video) return;

  if (reducedMotion) {
    canvas.remove();
    video.removeAttribute("preload");
    video.setAttribute("preload", "auto");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.play().catch(() => {});
    return;
  }

  if (isMobile) {
    canvas.remove();
    initMobileScrub(section, video);
    return;
  }

  video.remove();
  initCanvasScrub(section, canvas);
}

// --- Desktop : canvas + frames préextraites ---
function initCanvasScrub(section, canvas) {
  const frameCount = parseInt(section.dataset.frameCount, 10);
  const prefix = section.dataset.framePrefix;
  const ext = section.dataset.frameExt || ".jpg";
  const pad = parseInt(section.dataset.framePad || "3", 10);
  if (!frameCount || !prefix) return;

  const ctx = canvas.getContext("2d");
  const dpr = 1; // plafonné volontairement — voir engine-recipes.md
  const rawImages = new Array(frameCount);
  const bitmaps = new Map();
  const pendingDecodes = new Set();
  const pendingFetches = new Set();
  let currentFrame = 0;
  let lastDrawn = -1;

  const frameSrc = (i) => `${prefix}${String(i + 1).padStart(pad, "0")}${ext}`;

  function fetchFrame(i) {
    if (i < 0 || i >= frameCount) return;
    if (rawImages[i] || pendingFetches.has(i)) return;
    pendingFetches.add(i);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      pendingFetches.delete(i);
      rawImages[i] = img;
      decodeFrame(i);
    };
    img.onerror = () => pendingFetches.delete(i);
    img.src = frameSrc(i);
  }

  function decodeFrame(i) {
    if (bitmaps.has(i) || pendingDecodes.has(i)) return;
    const img = rawImages[i];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    pendingDecodes.add(i);
    createImageBitmap(img)
      .then((bitmap) => {
        pendingDecodes.delete(i);
        bitmaps.set(i, bitmap);
        if (i === currentFrame) draw(i);
      })
      .catch(() => pendingDecodes.delete(i));
  }

  function resizeCanvas() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    lastDrawn = -1;
    draw(currentFrame);
  }

  function draw(i) {
    const bmp = bitmaps.get(i);
    if (!bmp || i === lastDrawn) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / bmp.width, ch / bmp.height);
    const w = bmp.width * scale, h = bmp.height * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(bmp, (cw - w) / 2, (ch - h) / 2, w, h);
    lastDrawn = i;
  }

  const PRIORITY_RADIUS = 10;
  function preloadAround(i) {
    fetchFrame(i);
    decodeFrame(i);
    for (let k = 1; k <= PRIORITY_RADIUS; k++) {
      const fwd = i + k, bwd = i - k;
      if (fwd <= frameCount - 1) { fetchFrame(fwd); decodeFrame(fwd); }
      if (bwd >= 0) { fetchFrame(bwd); decodeFrame(bwd); }
    }
  }

  let idleQueueIndex = 0;
  function idleLoadRest() {
    if (idleQueueIndex >= frameCount) return;
    const batch = [];
    for (let n = 0; n < 4 && idleQueueIndex < frameCount; n++, idleQueueIndex++) {
      batch.push(idleQueueIndex);
    }
    batch.forEach((i) => { fetchFrame(i); decodeFrame(i); });
    if (idleQueueIndex < frameCount) {
      (window.requestIdleCallback || ((cb) => setTimeout(cb, 100)))(idleLoadRest);
    }
  }

  function onScroll() {
    const rect = section.getBoundingClientRect();
    if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) return;

    const total = section.offsetHeight - window.innerHeight;
    const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
    const frame = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    currentFrame = frame;
    preloadAround(frame);
    draw(frame);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("scroll", onScroll, { passive: true });
  resizeCanvas();
  preloadAround(0);
  (window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(idleLoadRest);
  onScroll();
}

// --- Mobile : <video> native, scrubée par currentTime ---
function initMobileScrub(section, video) {
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  let primed = false;

  function prime() {
    if (primed) return;
    primed = true;
    video.play().then(() => video.pause()).catch(() => {});
  }

  function onScroll() {
    const rect = section.getBoundingClientRect();
    if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) return;
    if (!video.duration) return;
    prime();
    const total = section.offsetHeight - window.innerHeight;
    const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
    video.currentTime = progress * (video.duration - 0.1);
  }

  video.addEventListener("loadedmetadata", onScroll, { once: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
