/* ============================================================
   service-rows.js — chauffage/plomberie/environnement alternating
   rows: text slides in from its own side, media fades up, ghost
   numeral scales/fades in behind the kicker+title, the plomberie
   inset photo trails in last.
   ============================================================ */
(function () {
  function initServiceRows() {
    var rows = document.querySelectorAll('.service-row');
    if (!rows.length) return;

    rows.forEach(function (row) {
      var side = row.getAttribute('data-side');
      var text = row.querySelector('.service-row__text');
      var media = row.querySelector('.service-row__media');
      var ghost = row.querySelector('.service-row__ghost');
      var inset = row.querySelector('.service-row__media-inset');

      if (window.__reducedMotion || !window.gsap || !window.ScrollTrigger) {
        [text, media, ghost, inset].forEach(function (el) {
          if (el) { el.style.opacity = 1; el.style.transform = 'none'; }
        });
        if (ghost) ghost.style.opacity = 0.07;
        return;
      }

      var fromX = side === 'left' ? 28 : -28;
      gsap.set(text, { opacity: 0, x: fromX });
      gsap.set(media, { opacity: 0, y: 30 });
      if (ghost) gsap.set(ghost, { opacity: 0, scale: 0.9 });
      if (inset) gsap.set(inset, { opacity: 0, y: 16 });

      ScrollTrigger.create({
        trigger: row,
        start: 'top 78%',
        once: true,
        onEnter: function () {
          var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (ghost) tl.to(ghost, { opacity: 0.07, scale: 1, duration: 0.9 }, 0);
          tl.to(text, { opacity: 1, x: 0, duration: 0.85 }, 0.1)
            .to(media, { opacity: 1, y: 0, duration: 0.9 }, 0.18);
          if (inset) tl.to(inset, { opacity: 1, y: 0, duration: 0.7 }, 0.55);
        },
      });
    });
  }

  window.__onFontsReady(initServiceRows);
})();
