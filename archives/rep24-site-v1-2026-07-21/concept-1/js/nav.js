// En-tête fixe : fond translucide + flou une fois qu'on a quitté le hero.
(function initNav() {
  const header = document.getElementById("site-header");
  if (!header) return;

  function update() {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
})();
