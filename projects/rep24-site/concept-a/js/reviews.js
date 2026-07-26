/* ===========================================================================
   reviews.js — bandeau d'avis en défilement continu (marquee CSS, piste
   dupliquée dans le HTML), reveal en cascade de l'en-tête à l'entrée dans
   le viewport. Le défilement horizontal lui-même est géré par CSS
   (@keyframes reviews-scroll, voir reviews.css) — pause au survol/focus,
   remplacé par un scroll manuel si prefers-reduced-motion.
   =========================================================================== */
function initReviewsSection() {
  const section = document.querySelector(".reviews");
  if (!section) return;

  const track = section.querySelector(".reviews__track");
  const head = section.querySelector(".reviews__head");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (!reduced && hasGsap) {
    gsap.set(head, { opacity: 0, y: 24 });

    gsap.to(head, {
      opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 82%" },
    });

    if (track) {
      gsap.set(track, { opacity: 0, y: 20 });
      gsap.to(track, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: track, start: "top 90%" },
      });
    }
  }
}
