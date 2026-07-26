// Certifications — bandeau plein largeur empilé (tags + plaquette), reveal
// en fade-up par vagues, distinct du split texte/plaquette d'environnement
// juste au-dessus.
function initCertifications() {
  revealSection(".certifications__eyebrow, .certifications__title, .certifications__intro", {
    type: "fade-up",
    stagger: 0.08,
    trigger: ".certifications__head",
  });
  revealSection(".certifications__tag", {
    type: "fade-up",
    stagger: 0.03,
    trigger: ".certifications__tags",
  });
  revealSection(".certifications__plate-full", {
    type: "scale-up",
    trigger: ".certifications__plate-full",
  });
}
