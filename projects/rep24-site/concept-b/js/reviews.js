// Avis clients — l'en-tête (score + eyebrow) apparaît en fade-up ; le
// marquee lui-même est une boucle CSS continue (voir reviews.css), pas du
// scroll-driven, cohérent avec la marquee de partenaires d'ets-leveque-site.
function initReviews() {
  revealSection(".reviews__eyebrow, .reviews__summary, .reviews__head .lede", {
    type: "fade-up",
    stagger: 0.08,
    trigger: ".reviews__head",
  });
}
