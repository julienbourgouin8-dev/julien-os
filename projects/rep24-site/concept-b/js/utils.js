// Petit helper de reveal partagé — pas un IntersectionObserver ad hoc,
// juste un wrapper autour de gsap.from + ScrollTrigger pour éviter de
// répéter le même bloc de config dans chaque fichier de section.
// type: "fade-up" | "slide-left" | "slide-right" | "scale-up" | "clip-up"
function revealSection(selector, { type = "fade-up", stagger = 0.09, trigger, start = "top 82%" } = {}) {
  if (typeof gsap === "undefined") return;
  const els = gsap.utils.toArray(selector);
  if (!els.length) return;

  if (window.__REP24_REDUCED_MOTION__) {
    gsap.set(els, { opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0 0 0 0)" });
    return;
  }

  const from = { opacity: 0 };
  if (type === "fade-up") Object.assign(from, { y: 32 });
  if (type === "slide-left") Object.assign(from, { x: 60 });
  if (type === "slide-right") Object.assign(from, { x: -60 });
  if (type === "scale-up") Object.assign(from, { scale: 0.9, y: 16 });
  if (type === "clip-up") Object.assign(from, { clipPath: "inset(100% 0 0 0)", opacity: 1 });

  gsap.from(els, {
    ...from,
    duration: 0.85,
    ease: "power3.out",
    stagger,
    scrollTrigger: {
      trigger: trigger || els[0].closest("section") || els[0],
      start,
      once: true,
    },
  });
}
