/* ===========================================================================
   reveal.js — reveal générique GSAP/ScrollTrigger pour tout élément .reveal
   (intro, certifications, contact…) — remplace l'IntersectionObserver ad hoc.
   =========================================================================== */
function initGenericReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    items.forEach((el) => (el.style.opacity = 1));
    return;
  }

  // Un ScrollTrigger individuel par élément plutôt que ScrollTrigger.batch —
  // batch ne "rattrape" pas fiablement les éléments déjà dépassés après un
  // saut de scroll (?jump=), même après refresh() ; un trigger simple par
  // élément (même mécanique que services.js/stats.js) le fait correctement.
  gsap.set(items, { y: 24 });
  items.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
      },
    });
  });
}
