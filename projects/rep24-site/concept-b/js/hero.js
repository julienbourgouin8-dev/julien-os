// Hero — reveal d'entrée : mots du titre qui montent en cascade,
// puis la carte image + pastilles de stats, puis les actions.
function initHero(reducedMotion) {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const words = hero.querySelectorAll(".hero__title .word > span");
  const targets = [
    ".hero__strapline",
    ".hero__lede",
    ".hero__actions",
    ".hero__panel-frame",
    ".hero__pill--top",
    ".hero__pill--bottom",
  ]
    .map((sel) => hero.querySelector(sel))
    .filter(Boolean);

  if (reducedMotion || typeof gsap === "undefined") {
    words.forEach((w) => (w.style.transform = "none"));
    targets.forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    const panelImg = hero.querySelector(".hero__panel-frame img");
    if (panelImg) panelImg.style.transform = "none";
    return;
  }

  gsap.set(words, { yPercent: 130 });
  gsap.set(targets, { opacity: 0, y: 24 });
  gsap.set(".hero__panel-frame", { opacity: 0, scale: 1.06, y: 0 });

  const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
  tl.to(words, { yPercent: 0, duration: 0.9, stagger: 0.05 })
    .to(".hero__strapline", { opacity: 1, y: 0, duration: 0.6 }, "-=0.5")
    .to(".hero__lede", { opacity: 1, y: 0, duration: 0.6 }, "-=0.45")
    .to(".hero__actions", { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
    .to(".hero__panel-frame", { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }, "-=0.9")
    // Zoom arrière au chargement : la photo démarre serrée sur le climatiseur
    // (transform-origin déjà calé dessus en CSS) et dézoome pour révéler la scène.
    .to(".hero__panel-frame img", { scale: 1.04, duration: 2.4, ease: "power2.out" }, "-=1.0")
    .to(".hero__pill--top", { opacity: 1, y: 0, duration: 0.6 }, "-=2.0")
    .to(".hero__pill--bottom", { opacity: 1, y: 0, duration: 0.6 }, "-=1.9");
}
