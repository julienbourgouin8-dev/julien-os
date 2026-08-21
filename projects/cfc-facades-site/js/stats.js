// Compteurs animés de la section "chiffres clés" — texte brut (pas de colonnes
// de chiffres individuelles, cf. leçon ets-leveque-site/CLAUDE.md : background-clip
// et kerning cassent avec une structure par digit).
document.addEventListener("DOMContentLoaded", () => {
  const stats = document.querySelectorAll(".stat__value[data-target]");
  if (!stats.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (el) => {
    const target = Number(el.dataset.target);
    if (reduceMotion || typeof gsap === "undefined") {
      el.textContent = target.toLocaleString("fr-FR");
      return;
    }
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString("fr-FR");
      },
    });
  };

  if (typeof ScrollTrigger === "undefined") {
    stats.forEach((el) => animate(el));
    return;
  }

  stats.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => animate(el),
    });
  });
});
