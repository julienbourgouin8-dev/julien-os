/* ============================================================
   team.js — fade-up reveal for the équipe section + the "60+"
   stat counter (counts up once, on scroll into view).
   ============================================================ */
(function () {
  function initTeam() {
    var section = document.querySelector('.team');
    if (!section) return;

    var reveals = section.querySelectorAll('[data-reveal]');
    var counter = section.querySelector('[data-count-to]');

    if (window.__reducedMotion || !window.gsap || !window.ScrollTrigger) {
      reveals.forEach(function (el) { el.style.opacity = 1; });
      if (counter) counter.textContent = counter.getAttribute('data-count-to');
      return;
    }

    gsap.set(reveals, { opacity: 0, y: 20 });
    ScrollTrigger.create({
      trigger: section,
      start: 'top 82%',
      once: true,
      onEnter: function () {
        gsap.to(reveals, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.1 });
      },
    });

    if (counter) {
      var target = +counter.getAttribute('data-count-to') || 0;
      var proxy = { val: 0 };
      ScrollTrigger.create({
        trigger: counter,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(proxy, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function () { counter.textContent = String(Math.round(proxy.val)); },
          });
        },
      });
    }
  }

  window.__onFontsReady(initTeam);
})();
