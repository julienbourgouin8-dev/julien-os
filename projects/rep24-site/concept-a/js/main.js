/* ===========================================================================
   main.js — bootstrap : Lenis + GSAP/ScrollTrigger, attente des polices,
   contrat de dev (?jump=/__ready), nav mobile.
   =========================================================================== */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -- Attendre que les polices web soient vraiment chargées avant de créer
   le moindre ScrollTrigger (document.fonts.ready seul ignore une feuille de
   style externe pas encore parsée) — voir engine-recipes.md. Plafond de
   sécurité pour ne jamais bloquer __ready indéfiniment. */
function waitForFonts() {
  return new Promise((resolve) => {
    const cap = setTimeout(resolve, 1600);
    const link = document.getElementById("google-fonts-link");
    const done = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { clearTimeout(cap); resolve(); });
      } else {
        clearTimeout(cap);
        resolve();
      }
    };
    if (link && !link.sheet) {
      link.addEventListener("load", done, { once: true });
      link.addEventListener("error", () => { clearTimeout(cap); resolve(); }, { once: true });
    } else {
      done();
    }
  });
}

/* -- Nav mobile ----------------------------------------------------------- */
function initMobileNav() {
  const burger = document.querySelector(".site-header__burger");
  const panel = document.querySelector(".mobile-nav");
  if (!burger || !panel) return;

  const close = () => document.body.classList.remove("nav-open");
  burger.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) close();
  });
}

/* -- Lenis smooth scroll, ponté sur ScrollTrigger ------------------------- */
let lenisInstance = null;
function initLenis() {
  if (REDUCED_MOTION || typeof Lenis === "undefined") return null;
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* -- Boot ------------------------------------------------------------------ */
async function boot() {
  initMobileNav();

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  await waitForFonts();

  lenisInstance = initLenis();
  window.__lenis = lenisInstance;

  // Chorégraphie d'animation — sections épinglées créées en premier (règle
  // d'ordre ScrollTrigger, voir engine-recipes.md), effets d'ambiance après.
  if (typeof initStatsSection === "function") initStatsSection();
  if (typeof initServicesSections === "function") initServicesSections();
  if (typeof initHeroSection === "function") initHeroSection();
  if (typeof initQuickQuoteSection === "function") initQuickQuoteSection();
  if (typeof initReviewsSection === "function") initReviewsSection();
  if (typeof initGenericReveal === "function") initGenericReveal();

  if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  // Lenis mesure la hauteur scrollable à son initialisation, avant que les
  // pin-spacers (chiffres clés) n'existent — sans resize(), son "limit"
  // interne reste périmé et un scrollTo() vers le bas de page est clampé
  // trop court (repéré en testant ?jump= près du bas de la page).
  if (lenisInstance) lenisInstance.resize();

  // -- Contrat de dev pour scripts/verify.js --------------------------------
  // Important : le saut de scroll doit arriver AVANT le refresh final, sinon
  // les ScrollTrigger d'entrée (toggleActions par défaut) ne "rattrapent" pas
  // les sections déjà dépassées par le jump — refresh() après coup force
  // GSAP à réévaluer/déclencher chaque trigger par rapport à la position
  // finale, pin (chiffres clés) inclus.
  const params = new URLSearchParams(location.search);
  const jump = params.get("jump");
  if (jump !== null) {
    history.scrollRestoration = "manual";
    const y = +jump || 0;
    if (lenisInstance) {
      lenisInstance.scrollTo(y, { immediate: true, force: true });
      lenisInstance.raf(performance.now());
    } else {
      window.scrollTo(0, y);
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
      if (lenisInstance) {
        lenisInstance.resize();
        lenisInstance.scrollTo(y, { immediate: true, force: true });
      } else {
        window.scrollTo(0, y);
      }
      ScrollTrigger.update();
    }
  }

  requestAnimationFrame(() => {
    window.__ready = true;
  });
}

document.addEventListener("DOMContentLoaded", boot);
