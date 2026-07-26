/* ============================================================
   hero.js — one-shot hero-loader entrance (media settles from a
   slight over-scale, wordmark + content stagger in after), plus
   a subtle scroll-linked parallax on the photo. See visual-craft
   motion-recipes.md ("le hero qui sert de loader").
   ============================================================ */
(function () {
  function initHero() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var wordmarkWrap = hero.querySelector('[data-hero-wordmark]');
    var media = hero.querySelector('[data-hero-media]');
    var content = hero.querySelectorAll('[data-reveal]');
    var cue = hero.querySelector('[data-scroll-cue]');
    var img = hero.querySelector('[data-parallax]');

    if (window.__reducedMotion || !window.gsap) {
      if (wordmarkWrap) { wordmarkWrap.style.opacity = 1; wordmarkWrap.style.transform = 'none'; }
      if (media) { media.style.opacity = 1; media.style.transform = 'none'; }
      content.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(media, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.3 }, 0)
      .fromTo(wordmarkWrap, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.05 }, 0.18)
      .fromTo(content, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.75, stagger: 0.1 }, 0.6);

    if (img && window.ScrollTrigger) {
      gsap.to(img, {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    if (cue && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=220',
        onUpdate: function (self) { cue.style.opacity = String(1 - self.progress); },
      });
    }
  }

  window.__onFontsReady(initHero);
})();
