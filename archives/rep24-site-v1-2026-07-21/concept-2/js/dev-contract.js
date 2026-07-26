/* ============================================================
   dev-contract.js — the ?jump=<scrollY> / window.__ready contract
   from engine-recipes.md, so scripts/verify.js can drive this page.
   Attached last: its __onFontsReady callback runs after every other
   section script's callback (same promise, attachment order), so
   all ScrollTriggers already exist by the time we jump + refresh.
   ============================================================ */
(function () {
  function initDevContract() {
    var params = new URLSearchParams(location.search);
    var jump = params.get('jump');
    if (jump !== null) history.scrollRestoration = 'manual';

    function settle() {
      if (jump !== null) {
        var y = +jump || 0;
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.__ready = true;
        });
      });
    }

    requestAnimationFrame(settle);
  }

  window.__onFontsReady(initDevContract);
})();
