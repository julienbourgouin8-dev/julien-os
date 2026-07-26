---
name: video-to-website
description: Turn a video into a premium scroll-driven animated website with GSAP, canvas frame rendering, and layered animation choreography. Includes real-device mobile reliability patterns (autoplay, WebKit freeze bug, scroll-lock, viewport height).
---

# Video to Premium Scroll-Driven Website

Turn a video file into a scroll-driven animated website with **animation variety and
choreography** — multiple animation types working together, not one repeated effect.

**Before shipping anything mobile-facing**, read `mobile-reliability.md` in this
skill's folder. The desktop-only version of this workflow (canvas + GSAP +
ScrollTrigger) looks great in Chrome devtools device emulation and can still be
broken on a real iPhone in ways that never show up in emulation or Playwright —
silent autoplay rejection, a WebKit compositor bug that freezes the video on frame 0
while it's actually still decoding, `100vh` viewport bugs, scroll-lock triggers that
fast flicks skip past entirely. `mobile-reliability.md` documents each of these with
the fix, drawn from a real production site.

**This skill covers the mechanics only** (frame extraction, canvas rendering,
scroll-binding, GSAP wiring, mobile reliability) — it has no opinion on typography,
color, or what makes a design distinctive rather than generic. For that, invoke the
`frontend-design` skill alongside this one for the aesthetic judgment, and read
`scroll-design-guidelines.md` in this folder for the structural rules specific to a
scroll-driven layout (no cards, color zones per section, layout variety, animation
choreography) that `frontend-design` doesn't cover since it's genre-agnostic. Use
`frontend-design` alone (without this skill) when rebuilding or restyling an
existing site that isn't a scroll-driven video build.

## Input

The user provides: a video file path (MP4, MOV, etc.) and optionally:
- A theme/brand name
- Desired text sections and where they appear
- Color scheme preferences
- Any specific design direction

If the user doesn't specify these, ask briefly or use sensible creative defaults.

## Mechanical Checklist (Non-Negotiable)

Engineering/structure rules — for the styling rules (typography scale, cards, color
zones, marquee, counters, layout variety, animation choreography), see
`scroll-design-guidelines.md` instead of duplicating them here.

1. **Lenis smooth scroll** — native scroll feels "web page," Lenis feels "experience"
2. **CTA persists** — `data-persist="true"` keeps final section visible, never disappears
3. **Hero prominence + generous scroll** — hero gets 20%+ scroll range, 800vh+ total for 6 sections
4. **Circle-wipe hero reveal** — hero is standalone 100vh section, canvas reveals via `clip-path: circle()` as hero scrolls away
5. **Frame speed 1.8-2.2** — product animation completes by ~55% scroll. Below 1.8 feels sluggish
6. **Real mobile pass, not just emulation** — see `mobile-reliability.md`. At least one section (usually the hero) needs testing on an actual phone before ship.

## Workflow

**FFmpeg and FFprobe are already installed at `C:\Users\nateh\bin\` and on PATH. Do NOT reinstall.**

### Step 1: Analyze the Video

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate,nb_frames -of csv=p=0 "<VIDEO_PATH>"
```

Determine resolution, duration, frame rate, total frames. Decide:
- **Target frame count**: 150-300 frames for good scroll experience
  - Short video (<10s): extract at original fps, cap at ~300
  - Medium (10-30s): extract at 10-15fps
  - Long (30s+): extract at 5-10fps
- **Output resolution**: Match aspect ratio, cap width at 1920px

### Step 2: Extract Frames

```bash
mkdir -p frames
ffmpeg -i "<VIDEO_PATH>" -vf "fps=<CALCULATED_FPS>,scale=<WIDTH>:-1" -c:v libwebp -quality 80 "frames/frame_%04d.webp"
```

After extraction, count frames: `ls frames/ | wc -l`

### Step 2.5: Decide the mobile delivery strategy

Before scaffolding, decide: will mobile use the same canvas+frames path as desktop,
or fall back to a native compressed `<video>` scrubbed the same way? This isn't
cosmetic — it changes what code you write in Step 6. See `mobile-reliability.md` →
"Decide the mobile delivery strategy before building" for the tradeoff (frame-file
bandwidth/memory vs. the extra engineering a native mobile `<video>` needs to be
reliable). Short/light clips: frames-everywhere is simpler and fine. Long or
high-motion clips, or footage already being encoded as MP4 anyway: hybrid is worth
the extra code.

If going hybrid, also re-encode the mobile video with dense keyframes up front
(`mobile-reliability.md` → "Reverse-scroll scrubbing feels laggy") so reverse-scrub
performance isn't a last-minute fire drill.

### Step 3: Scaffold

```
project-root/
  index.html
  css/style.css
  js/app.js
  frames/frame_0001.webp ...
```

No bundler. Vanilla HTML/CSS/JS + CDN libraries.

### Step 4: Build index.html

Required structure (in this order):

```html
<!-- 1. Loader: #loader > .loader-brand, #loader-bar, #loader-percent -->
<!-- 2. Fixed header: .site-header > nav with logo + links -->
<!-- 3. Hero: .hero-standalone (100vh, solid bg, word-split heading) -->
<!--    Contains: .section-label, .hero-heading (words in spans), .hero-tagline -->
<!--    Scroll indicator with arrow -->
<!-- 4. Canvas: .canvas-wrap > canvas#canvas (fixed, full viewport) -->
<!-- 5. Dark overlay: #dark-overlay (fixed, full viewport, pointer-events:none) -->
<!-- 6. Marquee(s): .marquee-wrap > .marquee-text (fixed, 12vw font) -->
<!-- 7. Scroll container: #scroll-container (800vh+) -->
<!--    Content sections with data-enter, data-leave, data-animation -->
<!--    Stats section with .stat-number[data-value][data-decimals] -->
<!--    CTA section with data-persist="true" -->
```

Content section example:
```html
<section class="scroll-section section-content align-left"
         data-enter="22" data-leave="38" data-animation="slide-left">
  <div class="section-inner">
    <span class="section-label">002 / Feature</span>
    <h2 class="section-heading">Feature Headline</h2>
    <p class="section-body">Description text here.</p>
  </div>
</section>
```

Stats section example:
```html
<section class="scroll-section section-stats"
         data-enter="54" data-leave="72" data-animation="stagger-up">
  <div class="stats-grid">
    <div class="stat">
      <span class="stat-number" data-value="24" data-decimals="0">0</span>
      <span class="stat-suffix">hrs</span>
      <span class="stat-label">Cold retention</span>
    </div>
  </div>
</section>
```

For any word/character-split heading built by JS for a staggered reveal: set
`aria-label` on the container to the full text **before** splitting it into spans —
see `mobile-reliability.md` → "Text-split reveal accessibility".

CDN scripts (end of body, this order):
```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="js/app.js"></script>
```

### Step 5: Build css/style.css

Use the **frontend-design skill** for creative, distinctive styling. Key technical patterns:

```css
:root {
  --bg-light: #f5f3f0;
  --bg-dark: #111111;
  --text-on-light: #1a1a1a;
  --text-on-dark: #f0ede8;
  --font-display: '[DISPLAY FONT]', sans-serif;
  --font-body: '[BODY FONT]', sans-serif;
}

/* Side-aligned text zones — product occupies center */
.align-left { padding-left: 5vw; padding-right: 55vw; }
.align-right { padding-left: 55vw; padding-right: 5vw; }
.align-left .section-inner,
.align-right .section-inner { max-width: 40vw; }
```

- **Hero-first layout**: Hero is standalone 100vh with solid bg. Canvas starts hidden, reveals via circle-wipe as hero scrolls away.
- **Scroll sections**: `position: absolute` within scroll container, positioned at midpoint of enter/leave range, `transform: translateY(-50%)`.
- **Mobile (<768px)**: Collapse side alignment to centered text with dark backdrop overlays. Reduce scroll height to ~550vh.
- **Text contrast**: Never use `#999` for important text on light backgrounds. Use `#666` minimum for body, `var(--text-on-light)` for headings.
- **Full-bleed sections on mobile** (hero, any `100vh` section): use the triple
  height fallback (`height: 100vh; height: 100dvh; height: 100lvh;`) — plain `100vh`
  leaves a visible band on mobile Safari when the address bar hides/shows. See
  `mobile-reliability.md` → "Viewport height on mobile Safari".
- **Never apply `will-change: transform` / `translateZ(0)` to a mobile `<video>`** if
  using the hybrid mobile strategy — see `mobile-reliability.md` → "The WebKit
  frozen frame compositor bug". Scope those hints to desktop canvas only.

### Step 6: Build js/app.js

#### 6a. Lenis Smooth Scroll (MANDATORY)

```js
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

#### 6b. Frame Preloader

Two-phase loading: load first 10 frames immediately (fast first paint), then load
remaining frames in background. Show progress bar during load. Hide loader only
after all frames are ready. For smooth scrubbing in both directions once loaded, also
force-decode a priority window of frames around the current scroll position on every
scroll tick rather than relying solely on the background progressive load — see
`mobile-reliability.md` → "Priority-radius frame prefetch".

#### 6c. Canvas Renderer — Padded Cover Mode

```js
const IMAGE_SCALE = 0.85; // 0.82-0.90 sweet spot
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;
  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.fillStyle = bgColor; // sampled from frame corners
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}
```

- Auto-sample background color from frame edge pixels with `sampleBgColor()` every ~20 frames
- Fill canvas with sampled color BEFORE drawing (fills the thin padded border seamlessly)
- Apply devicePixelRatio scaling for crisp rendering
- Optional: edge feathering gradients for smoother blend (camera project uses this)

#### 6d. Frame-to-Scroll Binding

```js
const FRAME_SPEED = 2.0; // 1.8-2.2, higher = product animation finishes earlier
ScrollTrigger.create({
  trigger: scrollContainer,
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
    const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
    if (index !== currentFrame) {
      currentFrame = index;
      requestAnimationFrame(() => drawFrame(currentFrame));
    }
  }
});
```

If the hybrid mobile strategy applies, the mobile `<video>` uses the *same*
`self.progress` value to drive `video.currentTime = progress * video.duration`
instead of drawing a canvas frame — see `mobile-reliability.md` for the seek
coalescing, priming, and end-epsilon patterns that make this reliable on iOS.

#### 6e. Section Animation System

Each section reads `data-animation` and gets a different entrance. Sections with `data-persist="true"` stay visible once animated in. Position sections absolutely at the midpoint of their enter/leave range with `translateY(-50%)`.

```js
function setupSectionAnimation(section) {
  const type = section.dataset.animation;
  const persist = section.dataset.persist === "true";
  const enter = parseFloat(section.dataset.enter) / 100;
  const leave = parseFloat(section.dataset.leave) / 100;
  const children = section.querySelectorAll(
    ".section-label, .section-heading, .section-body, .section-note, .cta-button, .stat"
  );

  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case "fade-up":
      tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
      break;
    case "slide-left":
      tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
      break;
    case "slide-right":
      tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
      break;
    case "scale-up":
      tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" });
      break;
    case "rotate-in":
      tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" });
      break;
    case "stagger-up":
      tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" });
      break;
    case "clip-reveal":
      tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" });
      break;
  }

  // Play/reverse based on scroll position via ScrollTrigger onUpdate
  // If persist is true, never reverse when scrolling past the leave point
}
```

#### 6f. Counter Animations

```js
document.querySelectorAll(".stat-number").forEach(el => {
  const target = parseFloat(el.dataset.value);
  const decimals = parseInt(el.dataset.decimals || "0");
  gsap.from(el, {
    textContent: 0,
    duration: 2,
    ease: "power1.out",
    snap: { textContent: decimals === 0 ? 1 : 0.01 },
    scrollTrigger: { trigger: el.closest(".scroll-section"), start: "top 70%", toggleActions: "play none none reverse" }
  });
});
```

#### 6g. Horizontal Text Marquee

```js
document.querySelectorAll(".marquee-wrap").forEach(el => {
  const speed = parseFloat(el.dataset.scrollSpeed) || -25;
  gsap.to(el.querySelector(".marquee-text"), {
    xPercent: speed,
    ease: "none",
    scrollTrigger: { trigger: scrollContainer, start: "top top", end: "bottom bottom", scrub: true }
  });
  // Fade marquee in/out based on scroll range using opacity transitions
});
```

#### 6h. Dark Overlay

```js
function initDarkOverlay(enter, leave) {
  const overlay = document.getElementById("dark-overlay");
  const fadeRange = 0.04;
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;
      if (p >= enter - fadeRange && p <= enter) opacity = (p - (enter - fadeRange)) / fadeRange;
      else if (p > enter && p < leave) opacity = 0.9;
      else if (p >= leave && p <= leave + fadeRange) opacity = 0.9 * (1 - (p - leave) / fadeRange);
      overlay.style.opacity = opacity;
    }
  });
}
```

#### 6i. Circle-Wipe Hero Reveal

```js
function initHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      // Hero fades out as scroll begins
      heroSection.style.opacity = Math.max(0, 1 - p * 15);
      // Canvas reveals via expanding circle clip-path
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.01) / 0.06));
      const radius = wipeProgress * 75; // 0% to 75% of viewport
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
    }
  });
}
```

#### 6j. `prefers-reduced-motion` — required, not optional

Every animated piece above (frame-stepping, GSAP entrances, marquee, circle-wipe,
counters) needs a reduced-motion branch that jumps straight to the final state. See
`mobile-reliability.md` → "`prefers-reduced-motion` — always the escape hatch" for
what this means specifically for the video sections.

### Step 7: Test

1. Serve locally: `npx serve .` (or `python -m http.server 8000`)
2. Scroll through fully — verify each section has a DIFFERENT animation type
3. Confirm: smooth scroll, frame playback, staggered reveals, marquee slides, counters count up, dark overlay fades, CTA persists at end
4. **Test on a real phone**, not just devtools device emulation, for any section with
   video/autoplay/scroll-lock — see `mobile-reliability.md` intro for why emulation
   isn't sufficient here.

## Animation Types Quick Reference

| Type | Initial State | Animate To | Duration |
|------|--------------|-----------|----------|
| `fade-up` | y:50, opacity:0 | y:0, opacity:1 | 0.9s |
| `slide-left` | x:-80, opacity:0 | x:0, opacity:1 | 0.9s |
| `slide-right` | x:80, opacity:0 | x:0, opacity:1 | 0.9s |
| `scale-up` | scale:0.85, opacity:0 | scale:1, opacity:1 | 1.0s |
| `rotate-in` | y:40, rotation:3, opacity:0 | y:0, rotation:0, opacity:1 | 0.9s |
| `stagger-up` | y:60, opacity:0 | y:0, opacity:1 | 0.8s |
| `clip-reveal` | clipPath:inset(100% 0 0 0) | clipPath:inset(0% 0 0 0) | 1.2s |

All types use stagger (0.1-0.15s) and ease `power3.out` (except scale-up: `power2.out`, clip-reveal: `power4.inOut`).

## Anti-Patterns

- **Cycling feature cards in a pinned section** — each card gets too little scroll time. Give each feature its own scroll-triggered section (8-10% range) with its own animation type
- **Pure cover mode** (`Math.max` at 1.0) — product clips into header. Use `IMAGE_SCALE` 0.82-0.90
- **Pure contain mode** (`Math.min`) — leaves visible border that doesn't match page bg
- **FRAME_SPEED < 1.8** — product animation feels sluggish, use 1.8-2.2
- **Hero < 20% scroll range** — first impression needs breathing room
- **Same animation for consecutive sections** — never repeat the same entrance type back-to-back
- **Wide centered grids over canvas** — redesign as vertical lists in the 40% side zone
- **Scroll height < 800vh** for 6 sections — everything feels rushed
- **Shipping mobile video sections without a real-device test** — see
  `mobile-reliability.md`. Emulated devtools testing will not catch the autoplay,
  WebKit freeze, or scroll-lock bugs documented there.
- **`IntersectionObserver` with a near-1.0 threshold as a scroll-lock trigger** — a
  fast flick can jump straight over it. Use the geometry+tolerance-band approach
  instead (`mobile-reliability.md`).
- **Plain `100vh` on a full-bleed mobile section** — leaves a band when the address
  bar hides/shows. Use the triple-fallback (`mobile-reliability.md`).

## Clip-Path Variations

- Circle reveal: `circle(0% at 50% 50%)` → `circle(75% at 50% 50%)`
- Wipe from left: `inset(0 100% 0 0)` → `inset(0 0% 0 0)`
- Wipe from bottom: `inset(100% 0 0 0)` → `inset(0% 0 0 0)`
- Custom polygon: `polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)` → `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`

## Troubleshooting

- **Frames not loading**: Must serve via HTTP, not `file://`
- **Choppy scrolling**: Increase `scrub` value, reduce frame count
- **White flashes**: Ensure all frames loaded before hiding loader
- **Blurry canvas**: Apply `devicePixelRatio` scaling to canvas dimensions
- **Lenis conflicts**: Ensure `lenis.on("scroll", ScrollTrigger.update)` is connected
- **Counters not animating**: Verify `data-value` attribute exists and snap settings match decimal places
- **Memory issues on mobile**: Reduce frames to <150, resize to 1280px wide — or switch to the hybrid native-`<video>` mobile strategy (`mobile-reliability.md`)
- **Video frozen but `currentTime` is advancing**: WebKit compositor bug, not a real freeze — see `mobile-reliability.md` → "The WebKit frozen frame compositor bug"
- **Autoplay silently doesn't start on iPhone, no console error**: see `mobile-reliability.md` → "Autoplay reliability on mobile `<video>`"
- **Reverse-scroll scrubbing stutters on mobile**: sparse keyframes or uncoalesced seeks — see `mobile-reliability.md` → "Reverse-scroll scrubbing feels laggy"
- **Scroll-lock section gets skipped entirely on a fast scroll**: `IntersectionObserver` threshold was jumped over — see `mobile-reliability.md` → "Scroll-locking a 'must be watched' video section"
