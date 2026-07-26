# Scroll-Driven Site Styling Rules

Genre-specific styling rules for scroll-driven video sites built with this skill.
These apply **in addition to** the `frontend-design` skill, not instead of it —
`frontend-design` handles the general aesthetic judgment (typography pairing,
color restraint, avoiding generic AI look, the plan→critique loop); this file
handles the structural rules specific to a scroll-scrubbed-video layout that
`frontend-design` has no opinion on either way (it's genre-agnostic).

Load both when building a from-scratch scroll-driven site. Load only
`frontend-design` when rebuilding/restyling an existing non-scroll site.

## Typography as Design

- Hero headings: **6rem minimum**, tight line-height (0.9-1.0), heavy weight (700-800)
- Section headings: **3rem minimum**, confident weight (600-700)
- Horizontal marquee text: **10-15vw**, uppercase, letterspaced
- Section labels: small (0.7rem), uppercase, letterspaced (0.15em+), muted color — like "001 / Features"
- Text hierarchy replaces card containers. Size, weight, and color ARE the structure

## No Cards, No Boxes

- **NEVER** use glassmorphism cards, frosted glass, or visible containers around text on scroll-driven sites
- Text sits directly on the background — clean, confident, editorial
- Readability comes from: font weight (600+), text-shadow if needed, and ensuring video frames have clean backgrounds at text scroll points
- The only acceptable "container" is generous padding on the section itself

## Color Zones

- Background color must shift between sections (light → dark → accent → light)
- Define color zones in CSS variables: `--bg-light`, `--bg-dark`, `--bg-accent`
- Text color inverts automatically: `--text-on-light`, `--text-on-dark`
- Transitions happen via GSAP, not CSS transitions

## Layout Variety

Every scroll-driven page needs at least 3 different layout patterns:
1. **Centered** — hero sections, CTAs
2. **Left-aligned** — feature descriptions with product on right
3. **Right-aligned** — alternate features
4. **Full-width** — horizontal marquee text, stats rows
5. **Split** — text on one side, supporting visual on the other

Never use the same layout for consecutive sections.

## Animation Choreography

- Every section must use a DIFFERENT entrance animation (fade-up, slide-left, slide-right, scale-up, clip-path reveal)
- Elements within a section enter with staggered delays (0.08-0.12s between items)
- Sequence: label first → heading → body text → CTA/button
- At least one section must pin (stay fixed) while its contents animate internally
- At least one oversized text element must move horizontally on scroll

## Stats & Numbers

- Display stats at **4rem+** font size
- Numbers MUST count up via GSAP (never appear statically)
- Use a suffix element for units (x, M, %, etc.) at a smaller size
- Labels below in small caps or uppercase muted text
