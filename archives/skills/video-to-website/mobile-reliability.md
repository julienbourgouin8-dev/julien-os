# Mobile Video Reliability — real-device lessons

Patterns below come from shipping a real scroll-scrubbed-video site to production and
fixing what actually broke on real phones. **Several of these bugs are NOT
reproducible in Chromium DevTools device emulation or Playwright** — they only show
up on real iOS Safari hardware. Confirmed via a temporary on-screen debug overlay
(Safari's console isn't reachable on a connected phone without a Mac). Budget a real
device pass for any video-heavy section before calling it done — emulated testing
alone will pass while the real thing is broken.

## Decide the mobile delivery strategy before building

The core skill workflow (canvas + extracted image frames, scrubbed by scroll
position) works well on desktop. On mobile it has a real bandwidth/memory cost: N
separate image files (even at 80-150 frames and ~100-150KB each in WebP) can cost
more total bytes than a single well-compressed H.264/VP9 video stream covering the
same footage, and phones have to hold every decoded `ImageBitmap` in memory at once
if there's no eviction window.

Two valid strategies — pick based on clip length/richness, not by default:

- **Frames-on-mobile-too** (what this skill does by default): fine for short clips
  (<10s) or when the "reduce to <150 frames, cap width at 1280px" troubleshooting tip
  is enough. Simpler — one code path for all viewports.
- **Hybrid: canvas+frames on desktop, real compressed `<video>` on mobile**: swap the
  canvas out for a native `<video>` element under a `max-width: 768px` media query (or
  `prefers-reduced-motion: reduce`), and drive it with `video.currentTime = progress *
  video.duration` on the same scroll-progress value the desktop canvas path uses. Costs
  more implementation complexity (see the pitfalls below) but is meaningfully lighter
  on mobile data for anything beyond a few seconds of footage. Use this when the
  source clip is long, high-motion, or already being served as an MP4 elsewhere on the
  page anyway.

If going hybrid, everything below applies to the mobile `<video>` path.

## Autoplay reliability on mobile `<video>`

A muted + `playsinline` `<video>` is normally exempt from autoplay restrictions, but
iOS can still block `.play()` outright (Low Power Mode, or the per-site Safari
"Auto-Play" setting) — **with no error event at all**. The failure mode looks like:
`readyState` stuck at 1 (metadata only), `paused: true`, forever. The only visible
signal is the rejection reason on the `play()` promise itself.

Fix: never let a silent `.catch(() => {})` be the only handling. Register a one-time
`touchstart`/`click` listener that retries `.play()` on the next real user gesture —
iOS always allows a gesture-triggered play — instead of giving up permanently.

```js
video.play().catch(() => {
  const retry = () => { video.play().catch(() => {}); cleanup(); };
  const cleanup = () => {
    window.removeEventListener("touchstart", retry);
    window.removeEventListener("click", retry);
  };
  window.addEventListener("touchstart", retry, { once: true });
  window.addEventListener("click", retry, { once: true });
});
```

## Mid-stream stalls (flaky connection recovery)

Watch for `error`/`stalled` events and a `waiting`-without-progress timeout (~5s).
Recover by calling `video.load()` (forces a fresh fetch of the source), then restore
`currentTime` and resume playback. Cap retries — a handful, not infinite.

## The WebKit "frozen frame" compositor bug

On a real iPhone, a `<video>` that has `will-change: transform` or `transform:
translateZ(0)` applied can get forced onto its own GPU layer that iOS then never
repaints after autoplay starts: `currentTime` keeps advancing, `readyState` reaches 4
(HAVE_ENOUGH_DATA), decode is genuinely happening — but the screen stays visually
frozen on the first frame. Not reproducible in Chromium or Playwright.

Fix: don't apply those hints to `<video>` elements on mobile. They exist to help a
desktop `<canvas>`'s repeated `drawImage()` calls — they have no equivalent benefit on
a native mobile `<video>` and actively break it. Scope any `will-change`/`translateZ`
rule to desktop only (e.g. `@media (min-width: 769px)`), or apply a `transform`
toggle on the video's `playing` event as a forced-repaint workaround if you must keep
the hint for another reason.

## Reverse-scroll scrubbing feels laggy

A `currentTime` seek backwards has to redecode from the last keyframe — expensive if
keyframes are sparse. Re-encode with dense keyframes:

```bash
ffmpeg -i input.mp4 -g 6 -keyint_min 6 -sc_threshold 0 -c:v libx264 output.mp4
```

(one keyframe every 6 frames, scene-cut detection disabled so the encoder can't space
keyframes out further on its own). Any future re-encode of the same file must keep
these flags or the reverse-scrub lag regresses.

Also **coalesce scroll-driven seeks** — a fast flick can fire dozens of scroll events
per second, each wanting a `currentTime` write. Gate to one in-flight seek at a time,
chase only the latest target, and confirm via the `seeked` event (with a ~1.5s safety
timeout in case `seeked` never fires):

```js
let seekInFlight = false, pendingTarget = null;
function scrubTo(time) {
  pendingTarget = time;
  if (seekInFlight) return;
  seekInFlight = true;
  video.currentTime = pendingTarget;
  const done = () => {
    video.removeEventListener("seeked", done);
    seekInFlight = false;
    if (pendingTarget !== video.currentTime) scrubTo(pendingTarget);
  };
  video.addEventListener("seeked", done);
  setTimeout(() => { if (seekInFlight) done(); }, 1500);
}
```

Without this, a single scroll pass can queue 50-80+ overlapping seeks and the video
visibly stutters trying to service all of them.

## Priming the video before the first seek

iOS Safari can ignore `currentTime` seeks on a `<video>` that has never played,
leaving it frozen on frame 0 while everything else (chapter text, progress) moves.
Prime it silently before the first real scrub:

```js
video.play().then(() => video.pause()).catch(() => {});
```

## Avoid landing exactly on `duration`

Scrubbing to the exact end value can trigger loop/restart behavior in some engines,
visibly "superimposing" frame 0 back over the last frame. Keep a small epsilon away
from the edge: `video.duration - 0.15`.

## Priority-radius frame prefetch (canvas/frames path)

For the canvas+frames path (desktop, or mobile if going frames-everywhere): don't
rely purely on progressive background loading. Force-fetch and decode a window of
frames (e.g. ±12) symmetrically around the current scroll position on every scroll
tick, in both directions — this keeps fast scrolling smooth (forward or backward)
even ahead of wherever the background progressive load has reached. Combine with a
`priority: "high"` first-N-frames eager fetch for whichever section is above the
fold, and `requestIdleCallback`-deferred fetching for every other section so it never
competes with the first section's initial load.

## Viewport height on mobile Safari (`100vh` isn't safe)

A full-bleed `100vh` section can leave a visible white/black band on mobile because
`100vh` doesn't account for the address bar showing/hiding. `100dvh` (dynamic
viewport height) is closer but can still be a frame behind exactly when it matters —
e.g. right as a video starts playing and the address bar auto-collapses. Use a
triple fallback, last-wins:

```css
.full-bleed-section {
  height: 100vh;
  height: 100dvh;
  height: 100lvh; /* "large viewport height" — size when address bar is fully collapsed */
}
```

Trade-off: `100lvh` can very rarely extend a few px past the fold when the address
bar is showing — acceptable versus a guaranteed-short section. A
`window.visualViewport`-driven custom property is a heavier alternative; only reach
for it if `100lvh` demonstrably doesn't cover your case.

## Scroll-locking a "must be watched" video section

If a section should play a video to completion before the user can scroll past it,
don't use `IntersectionObserver` with a near-1.0 threshold as the trigger — a fast
scroll (wheel flick, trackpad momentum) can jump straight over a near-single-pixel
intersection ratio without ever crossing it, so the lock never fires and the section
sails past fully in view.

Use a direct geometry check instead, with a generous tolerance band (60-200px, tune
to taste), compared against the section's own bounding rect on every scroll tick.
Snap the scroll position to exact alignment right before locking
(`window.scrollTo({ top, behavior: "instant" })` — `"instant"` matters specifically if
the page has `scroll-behavior: smooth` globally, or the snap will animate instead of
cutting instantly).

Lock with the `position: fixed` body technique, not `overflow: hidden` alone:

```js
const scrollY = window.scrollY;
document.body.style.position = "fixed";
document.body.style.top = `-${scrollY}px`;
// ...on unlock:
document.body.style.position = "";
window.scrollTo(0, scrollY);
```

`overflow: hidden` alone is insufficient — trackpad/touch momentum scrolling is
sometimes driven by the browser's compositor rather than dispatchable `wheel`/
`touchmove` events, so it can keep drifting the scroll position for a few dozen
pixels *after* the lock engages. `position: fixed` removes the viewport from any
scrollable context at all, which momentum can't act on. Keep `wheel`/`touchmove`/
`keydown` listeners with `preventDefault()` as a first line of defense, but they
aren't load-bearing on their own.

Also add an idle-scroll fallback: a fast fling can skip even a widened tolerance
band between two scroll events. Debounce (~250ms) and force-trigger if the section
is still substantially visible (e.g. ≥60%) once scrolling settles, even if the
tolerance window was also skipped.

Give this pattern multiple unlock paths so a user is never permanently stuck: the
video's `ended` event, a `loadedmetadata`-computed timeout fallback
(`duration / playbackRate + buffer`), and a `play()`-rejection handler (see Autoplay
above) that eventually gives up and unlocks after a grace window if playback never
starts.

## Text-split reveal accessibility

Any effect that splits `textContent` into per-word/per-character `<span>`s for a
staggered reveal must set `aria-label` on the *container* to the full original string
**before** splitting — otherwise a screen reader gets fragments instead of the
sentence.

## `prefers-reduced-motion` — always the escape hatch

Every scroll-driven effect in this skill (canvas frame-stepping, GSAP entrance
animations, marquee, circle-wipe reveal, scroll-lock) needs a `prefers-reduced-motion:
reduce` branch that skips straight to the final/static state — no frame-by-frame
decode, no scroll-lock (locking scroll behind a video that won't autoplay under
reduced motion traps the user), no staggered entrance. For a scroll-scrubbed video
section specifically, swap to a plain autoplay+loop `<video>` (or a static poster
image) under this media query.

## Preload the above-the-fold video early

If the mobile path uses a native `<video>` for a hero/first-section, add a
mobile-scoped preload hint in `<head>` so the browser starts fetching before any JS
runs:

```html
<link rel="preload" as="video" href="hero.mp4" media="(max-width: 768px)">
```

Flipping a `preload="auto"` attribute via JS on `DOMContentLoaded` starts the fetch
noticeably later — the gap was large enough on a real device to read as "the video
takes too long to start."
