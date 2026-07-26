// Orchestrateur — R.E.P 24 "Dark Signal"
// Ordre obligatoire (voir engine-recipes.md) :
//   1. attendre les polices web réellement chargées avant tout ScrollTrigger
//   2. créer les scènes épinglées (pin:true) en premier
//   3. créer les effets d'ambiance/reveal ensuite
//   4. contrat de dev ?jump=/__ready en dernier

(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__REP24_REDUCED_MOTION__ = prefersReducedMotion;

  function waitForFonts() {
    return new Promise((resolve) => {
      const cap = setTimeout(resolve, 2000); // plafond de secours, ne jamais bloquer indéfiniment
      const link = document.getElementById("gfonts-link");
      const afterLinkLoaded = () => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            clearTimeout(cap);
            resolve();
          });
        } else {
          clearTimeout(cap);
          resolve();
        }
      };
      if (link && !link.sheet) {
        link.addEventListener("load", afterLinkLoaded, { once: true });
        link.addEventListener("error", () => {
          clearTimeout(cap);
          resolve();
        }, { once: true });
      } else {
        afterLinkLoaded();
      }
    });
  }

  function setupLenis() {
    if (prefersReducedMotion || typeof Lenis === "undefined") return null;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  async function boot() {
    await waitForFonts();

    let lenis = null;
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      lenis = setupLenis();
    }

    // 1. Hero — animation d'entrée (pas de ScrollTrigger, joue au chargement)
    if (typeof initHero === "function") initHero(prefersReducedMotion);

    // 2. Ticker horizontal — texte surdimensionné qui dérive avec le scroll
    if (typeof initTicker === "function") initTicker(prefersReducedMotion);

    // 3. Scène épinglée EN PREMIER parmi les ScrollTrigger (chiffres clés)
    if (typeof initStatsPin === "function") initStatsPin(prefersReducedMotion);

    // 4. Reveals d'ambiance ensuite (créés après la scène pinnée)
    if (typeof initServiceCards === "function") initServiceCards(prefersReducedMotion);
    if (typeof initEnvironnement === "function") initEnvironnement(prefersReducedMotion);
    if (typeof initCertifications === "function") initCertifications(prefersReducedMotion);
    if (typeof initReviews === "function") initReviews(prefersReducedMotion);
    if (typeof initContact === "function") initContact(prefersReducedMotion);

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }

    // Contrat de dev : ?jump=<scrollY> doit charger la page déjà scrollée, état figé.
    const JUMP = new URLSearchParams(location.search).get("jump");
    if (JUMP !== null) {
      history.scrollRestoration = "manual";
      const y = +JUMP || 0;
      // Le spacer injecté par ScrollTrigger (pin de .stats) peut avoir changé
      // la hauteur du document après la construction de Lenis — forcer un
      // recalcul de ses bornes avant le scrollTo, sinon un jump profond se
      // fait clamper silencieusement sur l'ancienne limite (bug réel trouvé
      // en review : jump=7680/8700 restait bloqué vers la section avis).
      if (lenis) {
        lenis.resize();
        window.scrollTo(0, y);
        lenis.scrollTo(y, { immediate: true, force: true });
      } else {
        window.scrollTo(0, y);
      }
      if (typeof ScrollTrigger !== "undefined") {
        requestAnimationFrame(() => {
          ScrollTrigger.update();
          requestAnimationFrame(() => {
            // second recalage : certains navigateurs headless repaintent le
            // scroll une frame en retard après un scrollTo "immediate".
            if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
            ScrollTrigger.update();
            window.__ready = true;
          });
        });
      } else {
        window.__ready = true;
      }
    } else {
      window.__ready = true;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
