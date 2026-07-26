// Bootstrap : Lenis + GSAP ScrollTrigger, contrat ?jump=<scrollY> / window.__ready,
// et gate sur le chargement des polices avant de créer le moindre ScrollTrigger
// (voir engine-recipes.md — document.fonts.ready seul ne suffit pas si le <link>
// externe n'est pas encore parsé, d'où le plafond de secours ci-dessous).
(function () {
  const params = new URLSearchParams(location.search);
  const hasJump = params.has("jump");
  const JUMP = hasJump ? Number(params.get("jump")) || 0 : null;
  if (hasJump) history.scrollRestoration = "manual";

  window.__reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__lenis = null;

  function boot() {
    const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    if (!window.__reducedMotion && typeof Lenis !== "undefined") {
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on("scroll", () => hasGsap && ScrollTrigger.update());
      if (hasGsap) {
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      } else {
        requestAnimationFrame(function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        });
      }
      window.__lenis = lenis;
    }

    // Signale aux autres scripts (reveals.js, counters.js, ghost-numerals.js) que
    // GSAP/ScrollTrigger/Lenis sont prêts et que les polices sont chargées — c'est
    // la seule autorisation à créer un ScrollTrigger.
    window.dispatchEvent(new CustomEvent("site:ready-to-animate"));

    requestAnimationFrame(() => {
      if (JUMP !== null) {
        // Lenis mesure sa limite de scroll à sa construction, AVANT que le
        // pin d'#environnement (créé juste au-dessus, sur l'event
        // site:ready-to-animate) n'insère son espaceur — sans ce resize(),
        // Lenis plafonne silencieusement scrollTo() à l'ancienne hauteur de
        // page, plus courte, et ?jump=<y> atterrit trop tôt pour toute
        // valeur au-delà d'#environnement.
        if (hasGsap) ScrollTrigger.refresh();
        if (window.__lenis) window.__lenis.resize();
        if (window.__lenis) window.__lenis.scrollTo(JUMP, { immediate: true, force: true });
        else window.scrollTo(0, JUMP);
        if (hasGsap) ScrollTrigger.refresh();
        requestAnimationFrame(() => {
          window.__ready = true;
        });
      } else {
        window.__ready = true;
      }
    });
  }

  function waitFonts(cb) {
    const cap = setTimeout(cb, 2000);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        clearTimeout(cap);
        cb();
      }).catch(() => { clearTimeout(cap); cb(); });
    } else {
      clearTimeout(cap);
      cb();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitFonts(boot));
  } else {
    waitFonts(boot);
  }
})();
