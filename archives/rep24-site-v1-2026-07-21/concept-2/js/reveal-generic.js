/* ============================================================
   reveal-generic.js — shared fade-up-on-scroll for every section
   that doesn't have its own bespoke script (autres prestations,
   certifications, avis, contact). Grouped per enclosing <section>
   so each staggers independently of the others.
   ============================================================ */
(function () {
  function initGenericReveals() {
    var els = document.querySelectorAll(
      'section:not(.hero):not(.team):not(.service-row) [data-reveal]'
    );
    if (!els.length) return;

    if (window.__reducedMotion || !window.gsap || !window.ScrollTrigger) {
      els.forEach(function (el) { el.style.opacity = 1; });
      return;
    }

    var bySection = new Map();
    els.forEach(function (el) {
      var sec = el.closest('section') || document.body;
      if (!bySection.has(sec)) bySection.set(sec, []);
      bySection.get(sec).push(el);
    });

    bySection.forEach(function (group) {
      gsap.set(group, { opacity: 0, y: 22 });
      ScrollTrigger.create({
        trigger: group[0],
        start: 'top 84%',
        once: true,
        onEnter: function () {
          gsap.to(group, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 });
        },
      });
    });
  }

  window.__onFontsReady(initGenericReveals);
})();
