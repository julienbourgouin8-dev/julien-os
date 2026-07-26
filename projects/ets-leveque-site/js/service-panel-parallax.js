// Parallax léger sur le bloc de texte des panneaux "Nos services"
// (#service-sanitaire / #service-pac) : un discret glissement vertical
// continu, lié au scroll, en plus du fondu d'apparition ponctuel au
// scroll-into-view (`.reveal` + IntersectionObserver, voir le bas de
// css/gallery-duo.css). Même recette que `.meter`/`.meter__readout` dans
// js/stats.js : la dérive continue est portée par la propriété CSS
// autonome `translate` (pas le raccourci `transform`) pour ne jamais
// entrer en conflit avec l'entrée .reveal, qui elle anime `opacity` /
// `filter` / `transform` sur les enfants (kicker/titre/texte/CTA) — jamais
// `translate` sur .service-panel__content lui-même, donc les deux animations
// peuvent tourner en même temps sans se marcher dessus.
function initServicePanelParallax() {
  const panels = document.querySelectorAll(".service-panel__content");
  if (!panels.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  // Amplitude volontairement faible (quelques pixels) et identique sur les
  // deux panneaux (sanitaire/pac) pour que l'effet se lise pareil des deux
  // côtés — ce n'est pas un gadget, juste de quoi faire "respirer" le bloc
  // de texte au-dessus de la vidéo/du diaporama pendant le scroll.
  const AMPLITUDE = 14;

  const targets = Array.from(panels).map((el) => ({
    el,
    section: el.closest(".service-panel") || el,
  }));

  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    targets.forEach(({ el, section }) => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const progress = Math.min(Math.max((center - vh / 2) / vh, -1), 1);
      el.style.translate = `0 ${(progress * AMPLITUDE).toFixed(1)}px`;
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

document.addEventListener("DOMContentLoaded", initServicePanelParallax);
