/* ============================================================
   nav-invert.js — toggles the fixed corner nav to its light-on-dark
   variant while it overlaps the avis section or the dark footer
   strip. Deliberately not gsap/ScrollTrigger-based: this is a plain
   geometry check independent of the fonts-ready gate, so the nav
   never sits unreadable while fonts/gsap are still loading.
   ============================================================ */
(function () {
  function init() {
    var mark = document.querySelector('.site-mark');
    var darkSections = document.querySelectorAll('#avis, .contact__footer');
    if (!mark || !darkSections.length) return;

    var ticking = false;

    function check() {
      ticking = false;
      var probeY = mark.getBoundingClientRect().bottom || 40;
      var onDark = false;
      darkSections.forEach(function (sec) {
        var r = sec.getBoundingClientRect();
        if (r.top <= probeY && r.bottom >= probeY) onDark = true;
      });
      mark.classList.toggle('site-mark--on-dark', onDark);
    }

    function requestCheck() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    }

    check();
    window.addEventListener('scroll', requestCheck, { passive: true });
    window.addEventListener('resize', requestCheck);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
