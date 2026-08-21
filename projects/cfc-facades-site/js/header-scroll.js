// Header transparent sur le hero (fidèle à la référence), opaque dès qu'on
// scrolle plus bas — sinon la nav flotte en permanence sur le contenu qui
// défile derrière et devient illisible/superposée.
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  if (!header || !hero) return;

  const toggle = () => {
    const threshold = hero.offsetHeight - 80;
    header.classList.toggle("is-scrolled", window.scrollY > threshold);
  };

  toggle();
  window.addEventListener("scroll", toggle, { passive: true });
});
