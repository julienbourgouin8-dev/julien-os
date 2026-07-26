// Contact — bloc centré (seule section centrée du site, distincte de tous
// les splits précédents) : titre + actions en fade-up, puis la grille de
// coordonnées en scale-up léger une fois franchie.
function initContact() {
  revealSection(".contact__eyebrow, .contact__title, .contact__lede, .contact__actions", {
    type: "fade-up",
    stagger: 0.08,
    trigger: ".contact__inner",
  });
  revealSection(".contact__cell", {
    type: "scale-up",
    stagger: 0.08,
    trigger: ".contact__grid",
    start: "top 85%",
  });
}
