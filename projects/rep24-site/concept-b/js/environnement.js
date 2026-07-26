// Bloc "environnement" — texte glisse depuis la gauche, la plaquette RGE
// entre en scale-up depuis la droite : deux mouvements opposés, distinct
// de la grille de services juste au-dessus.
function initEnvironnement() {
  revealSection(".environnement__eyebrow, .environnement__title, .environnement__lede, .environnement__list li, .environnement__cta", {
    type: "slide-right",
    stagger: 0.07,
    trigger: ".environnement__inner",
  });
  revealSection(".environnement__badge-panel", {
    type: "scale-up",
    trigger: ".environnement__inner",
  });
}
