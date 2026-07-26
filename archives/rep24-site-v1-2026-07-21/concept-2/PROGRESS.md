# Progress — concept-2 "Artisan Dordogne"

- [x] Read all governing docs (SKILL.md, scroll-design-guidelines, engine-recipes, mobile-reliability, INDEX.md design refs, visual-craft sub-files, frontend-design) + calibrated against ets-leveque-site/js + css/tokens.css
- [x] Read data.js + SOURCES.md + all 7 real images — content/pairing locked in, no invented copy
- [x] Direction artistique arrêtée : warm cream/ink palette, Fraunces + Instrument Sans, single blue (#0088CC) accent
- [x] File structure scaffolded: index.html, css/ (9 files), js/ (8 files)
- [x] Hero built — full-bleed photo, oversized serif wordmark overlapping photo edge, hero-loader entrance
- [x] Équipe section — centered, "60+" animated stat counter, atouts row (real data)
- [x] 3 alternating service rows wired to data.js content verbatim (chauffage 01 / plomberie 02 w/ inset photo / environnement 03), ghost numerals
- [x] Autres prestations (ramonage + hottes) — two-col grid, distinct layout family
- [x] Certifications — real CAPEB/RGE logos (untouched) + full 8-item list, generously spaced
- [x] Avis client — dark ink section, editorial pull-quote, real review/author/rating verbatim
- [x] Contact/footer — split layout, real address/hours/zone/phone/email
- [x] GSAP + ScrollTrigger + Lenis wired (CDN), font-loading gate before any ScrollTrigger creation
- [x] ?jump / window.__ready dev contract implemented (js/dev-contract.js)
- [x] prefers-reduced-motion branches in every animated script + CSS fallback
- [x] Bug found + fixed: served concept-2/ in isolation broke ../assets + ../data.js relative paths — must serve from rep24-site/ root, access via /concept-2/
- [x] verify.js jank: first run JANK (max 124.8ms, cold CDN/font fetch) — reran clean 3x, max ~17-18ms, PASS, over50:0
- [x] Bug found + fixed: fixed corner nav (site-mark) was ink-on-ink over the dark avis section, unreadable — first tried mix-blend-mode:difference (rendered pale/low-contrast, abandoned), replaced with js/nav-invert.js (geometry-based class toggle) — verified correct on both light and dark zones
- [x] Bug found + fixed: mobile hero wordmark had white-space:nowrap, overflowed off-screen showing only "R." behind the photo — replaced with clean stacked mobile layout (wordmark full-width on top, photo below) under 640px
- [x] verify.js jank rerun after fixes: still PASS (max ~18ms, over50:0)
- [x] Reviewed remaining mobile screenshots (plomberie row, certifications, avis, contact/footer) — all correct, stacked cleanly, nav-invert behaves right at every scroll depth tested
- [x] Final verify.js jank rerun: PASS (max 18ms, over50:0) — stable across 6+ consecutive runs
- [x] Self-critique vs. "generic next to ets-leveque-site?" — 6 distinct layout families used (full-bleed overlap hero, centered stat block, alternating ghost-numeral rows w/ inset photo, two-col grid, dark editorial pull-quote, split footer), not one reveal effect repeated. Judged acceptable given zero video/fewer photos than ETS Lévesque.
- [x] BUILD COMPLETE — concept-2 done, ready for report to Julien

## Revision pass — design references applied (post-client-feedback)

Client said the site didn't draw on the 8 reference screenshots he'd shared.
Read 4 assigned references (Enblox gradient blob, Wander photo-hero+cards,
Hotle oversized wordmark, Greenspace organic texture) and applied techniques
specific to concept-2, distinct from concept-1's references.

- [x] **Hero bug fixed**: "24" was disappearing completely — root cause was
  `.hero__media` (photo, z-index 2) painted over `.hero__wordmark-wrap`
  (z-index 1), so any glyph falling under the photo's opaque rectangle was
  100% erased. Confirmed with a before-screenshot (`hero-before.png`
  equivalent): only "R.E.P" visible, "24" gone. Fix: flipped stacking so the
  wordmark renders in front (z-index 3, above the photo's z-index 2) —
  opaque ink-on-top guarantees legibility regardless of what's under it,
  per Hotle's dark-serif-over-photo technique. Also: bumped wordmark scale
  (13.5rem → 15.5rem max, 16vw → 18.5vw) for more Hotle/Wander-style
  viewport-dominating confidence; recolored the "24" to the brand blue
  accent (was plain italic ink) for extra pop/contrast against the photo;
  shifted `object-position` on the hero photo (50%→38% horizontal) so the
  wordmark's overlap zone lands on the plain white van door instead of the
  technician's face. Verified at 1440px, 1024px, and 390px mobile — every
  character legible at all three.
- [x] **Enblox gradient-mesh wash**: added a diffuse warm blob (peach/amber/
  dusty-rose radial gradients, blurred, low-opacity) as a background wash
  behind the "autres prestations" section — the transition moment right
  after the 3 service rows. Kept low-key, doesn't fight the cream/ink/blue
  palette.
- [x] **Enblox italic-serif emphasis**: team heading now reads "Une équipe
  dynamique et *polyvalente* à votre service" — single word switches to
  italic 400-weight Fraunces against the bold 600-weight heading, same
  contrast trick as Enblox's "...With Less *Stress*".
- [x] **Wander card grid**: converted "autres prestations" (ramonage +
  hottes) from a plain 2-up image+caption grid into real photo-cards —
  rounded corners, dark gradient scrim, bold title overlaid on the photo
  (title text derived from the existing verbatim copy, e.g. "Ramonage de
  cheminées" / "Nettoyage de hottes pro" — no new claims, same 2 real
  images, data.js untouched).
- [x] **Greenspace organic texture**: added a subtle all-over paper-fiber
  grain (inline SVG feTurbulence, tiled, multiply blend) to the
  certifications section, which was previously flat cream. Tuned opacity by
  screenshot-testing 0.05 (invisible) → 0.3 (too strong) → landed on 0.14 —
  visible on close inspection, doesn't touch text contrast.
- [x] Verified guardrails held: data.js and assets/images untouched (checked
  via git diff scope — only concept-2/ files touched); concept-1/ and
  rep24-site root untouched; `?jump=`/`window.__ready` contract still works
  (used throughout for all verification screenshots); prefers-reduced-motion
  untouched (all new work is static CSS backgrounds + one hover transition,
  no new scroll-linked motion added).
- [x] verify.js jank rerun after all changes: PASS, max ~17-19ms, over50:0,
  stable across 3 consecutive runs — no regression from the new gradient/
  texture/card layers.
- [x] REVISION COMPLETE — ready for client re-review

