// Bandeau plein largeur — texte surdimensionné qui dérive horizontalement
// avec le scroll (scrub GSAP), pas une simple boucle CSS à vitesse fixe.
function initTicker(reducedMotion) {
  const track = document.querySelector(".ticker__track");
  if (!track) return;

  if (reducedMotion || typeof gsap === "undefined") {
    track.style.transform = "none";
    return;
  }

  const distance = () => track.scrollWidth / 2;

  gsap.set(track, { x: 0 });
  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: ".ticker",
      start: "top bottom",
      end: "bottom top",
      scrub: 0.6,
    },
  });
}
