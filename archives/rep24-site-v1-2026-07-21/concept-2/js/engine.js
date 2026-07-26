/* ============================================================
   engine.js — font-loading gate + Lenis/GSAP wiring.
   Loaded first. Exposes:
     window.__reducedMotion   (bool)
     window.__fontsReady      (Promise, resolves once fonts + gsap/lenis are set up)
     window.__onFontsReady(fn) — run fn once ready (immediately if already ready)
     window.__lenis           (Lenis instance, absent under reduced motion)
   No ScrollTrigger is created anywhere on this page before this promise
   resolves — see engine-recipes.md ("attendre les polices avant de créer
   le moindre ScrollTrigger").
   ============================================================ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__reducedMotion = reduce;

  function waitForFontsLink() {
    return new Promise(function (resolve) {
      var link = document.getElementById('font-link');
      if (!link) return resolve();
      // Already parsed (cached / fast network)
      try { if (link.sheet) return resolve(); } catch (e) { /* cross-origin sheet access can throw */ }
      link.addEventListener('load', function () { resolve(); }, { once: true });
      link.addEventListener('error', function () { resolve(); }, { once: true });
    });
  }

  function fontsTrulyReady() {
    return waitForFontsLink().then(function () {
      return document.fonts && document.fonts.ready ? document.fonts.ready : null;
    });
  }

  window.__fontsReady = new Promise(function (resolve) {
    // Safety ceiling — never block __ready indefinitely on a slow/broken font CDN.
    var capped = false;
    var cap = setTimeout(function () { capped = true; resolve(); }, 2200);
    fontsTrulyReady().then(function () {
      if (!capped) { clearTimeout(cap); resolve(); }
    });
  });

  window.__onFontsReady = function (fn) {
    window.__fontsReady.then(fn);
  };

  // First .then() attached — runs before any section script's callback
  // (each section script attaches its own .then() later, in document order).
  window.__fontsReady.then(function () {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (!reduce && window.Lenis) {
      var lenis = new Lenis({
        duration: 1.05,
        easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  });
})();
