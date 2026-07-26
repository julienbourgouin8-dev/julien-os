// Parallax horizontal des chiffres fantômes (01-04) et du wordmark hero —
// la mécanique "au moins un élément de texte surdimensionné doit bouger
// horizontalement au scroll" de scroll-design-guidelines.md. Effet d'ambiance
// pur (scrub continu), créé après le pin d'#environnement (voir reveals.js)
// pour respecter l'ordre de création des ScrollTrigger.
window.addEventListener("site:ready-to-animate", initGhostNumerals);

function initGhostNumerals() {
  if (window.__reducedMotion) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  document.querySelectorAll(".service__numeral").forEach((el, i) => {
    const section = el.closest("section");
    if (!section) return;
    const dir = el.classList.contains("service__numeral--right") ? -1 : 1;
    gsap.to(el, {
      x: dir * (60 + i * 10),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  });

  const cineNumeral = document.querySelector(".cinematic__numeral");
  if (cineNumeral) {
    const cineSection = cineNumeral.closest(".cinematic");
    gsap.to(cineNumeral, {
      x: -70,
      ease: "none",
      scrollTrigger: {
        trigger: cineSection,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  }

  const wordmark = document.querySelector(".hero__wordmark");
  if (wordmark) {
    gsap.to(wordmark, {
      x: -50,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  }
}
