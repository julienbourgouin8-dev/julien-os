/* ===========================================================================
   hero.js — entrée du wordmark géant + pastilles de verre, parallax photo
   et dérive horizontale du wordmark au scroll (technique Hotle/VANTA).
   =========================================================================== */
function initHeroSection() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const wordmark = hero.querySelector(".hero__wordmark");
  const frame = hero.querySelector(".hero__frame");
  const photo = hero.querySelector(".hero__photo");
  const glasses = hero.querySelectorAll(".hero__glass");
  const eyebrows = hero.querySelectorAll(".hero__eyebrow");
  const ctaRow = hero.querySelector(".hero__cta-row");
  const tagline = hero.querySelector(".hero__tagline");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || typeof gsap === "undefined") {
    if (photo) photo.style.transform = "none";
    return;
  }

  gsap.set(wordmark, { opacity: 0, y: 28 });
  gsap.set(frame, { opacity: 0 });
  gsap.set(glasses, { opacity: 0, y: 16 });
  gsap.set(eyebrows, { opacity: 0 });
  gsap.set([ctaRow, tagline].filter(Boolean), { opacity: 0, y: 14 });

  const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
  tl.to(eyebrows, { opacity: 1, duration: 0.6, stagger: 0.1 })
    .to(wordmark, { opacity: 1, y: 0, duration: 0.9 }, "-=0.3")
    .to(frame, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.55")
    // Zoom arrière au chargement : la photo démarre serrée sur le climatiseur
    // (transform-origin déjà calé dessus) et dézoome pour révéler la scène.
    .to(photo, { scale: 1.08, duration: 2.2, ease: "power2.out" }, "-=0.9")
    .to(glasses, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, "-=1.8")
    .to([tagline, ctaRow].filter(Boolean), { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=1.6");

  // Parallax : le wordmark dérive horizontalement pendant qu'on traverse le
  // hero — élément surdimensionné qui bouge légèrement au scroll (voir
  // scroll-design-guidelines.md).
  if (typeof ScrollTrigger !== "undefined") {
    gsap.to(wordmark, {
      x: -60,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  }

  // Respiration réversible de la photo au scroll : une fois le zoom arrière
  // de chargement terminé (photo à scale(1.08), ci-dessus), on attache un
  // scrub très amorti — 1.08 en haut du hero jusqu'à 1.02 en bas — pour que
  // remonter dans le hero fasse légèrement "re-zoomer" la photo. Amplitude
  // volontairement minuscule (0.06, contre 0.5 dans l'ancienne version
  // scale(1.5)->scale(1)) : l'ancien scrub sur toute l'amplitude de charge-
  // ment donnait un aller-retour de zoom trop marqué à chaque oscillation
  // de scroll près du haut du hero (retour Julien, 2026-07-22) — ici on
  // reste sur un effet discret, jamais le grand zoom spectaculaire.
  if (typeof ScrollTrigger !== "undefined") {
    tl.eventCallback("onComplete", () => {
      gsap.to(photo, {
        scale: 1.02,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    });
  }
}
