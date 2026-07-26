// Grille de services numérotée — entrée "clip-up" par carte (distincte du
// cascade de mots du hero et du scrub du ticker).
function initServiceCards() {
  revealSection(".services__head .eyebrow, .services__head .section-title, .services__head .lede", {
    type: "fade-up",
    stagger: 0.08,
    trigger: ".services__head",
  });
  document.querySelectorAll(".service-panel").forEach((panel) => {
    const contentEls = panel.querySelectorAll(".service-panel__content > *");
    if (contentEls.length) {
      revealSection(contentEls, { type: "fade-up", stagger: 0.06, trigger: panel, start: "top 75%" });
    }
    const modules = panel.querySelectorAll(".service-module");
    if (modules.length) {
      revealSection(modules, { type: "clip-up", stagger: 0.08, trigger: panel.querySelector(".service-panel__modules"), start: "top 88%" });
    }
  });
}
