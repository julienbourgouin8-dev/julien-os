/* ===========================================================================
   quick-quote.js — section "devis rapide" : entrée en scroll (même pattern
   que services.js, un cran plus simple car section non numérotée), et
   soumission simulée (site de démonstration, aucun backend) : on empêche le
   rechargement et on bascule la carte sur un état de confirmation.
   =========================================================================== */
function initQuickQuoteSection() {
  const section = document.querySelector(".quick-quote");
  if (!section) return;

  const kicker = section.querySelector(".quick-quote__kicker");
  const heading = section.querySelector(".quick-quote__heading");
  const text = section.querySelector(".quick-quote__text");
  const points = section.querySelectorAll(".quick-quote__point");
  const phone = section.querySelector(".quick-quote__phone");
  const card = section.querySelector(".quick-quote__form-card");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (!reduced && hasGsap) {
    const introTargets = [kicker, heading, text, phone].filter(Boolean);
    gsap.set(introTargets, { opacity: 0, y: 24 });
    gsap.set(points, { opacity: 0, y: 16 });
    if (card) gsap.set(card, { opacity: 0, y: 32 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
      },
      defaults: { ease: "power3.out", duration: 0.8 },
    });
    tl.to(introTargets, { opacity: 1, y: 0, stagger: 0.1 })
      .to(points, { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 }, "-=0.45")
      .to(card, { opacity: 1, y: 0, duration: 0.9 }, "-=0.6");
  }

  // -- Soumission simulée --------------------------------------------------
  const form = section.querySelector(".quick-quote__form");
  if (!form || !card) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    card.classList.add("is-sent");
  });
}
