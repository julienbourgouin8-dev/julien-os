"use client";

// Anime une miniature du produit qui s'envole du bouton cliqué jusqu'à
// l'icône panier du header (repérée par [data-cart-icon], posée dans
// CartBadge.tsx) puis s'évanouit — élément DOM temporaire, aucun état React
// à gérer côté appelant. Ignoré si l'utilisateur a demandé moins de
// mouvement (prefers-reduced-motion), ou si l'icône panier n'est pas
// visible à l'écran (nav mobile masquée, pas de destination à viser).
export function flyToCart(originEl: HTMLElement, imageUrl: string | null) {
  if (!imageUrl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cartIcon = document.querySelector<HTMLElement>("[data-cart-icon]");
  if (!cartIcon) return;
  const destRect = cartIcon.getBoundingClientRect();
  if (destRect.width === 0) return; // masqué (breakpoint mobile) — pas de cible

  const originRect = originEl.getBoundingClientRect();
  const size = 64;

  const flying = document.createElement("img");
  flying.src = imageUrl;
  flying.style.cssText = `
    position: fixed;
    z-index: 200;
    left: ${originRect.left + originRect.width / 2 - size / 2}px;
    top: ${originRect.top + originRect.height / 2 - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    object-fit: cover;
    border-radius: 9999px;
    box-shadow: 0 10px 28px rgba(36,27,21,0.4);
    pointer-events: none;
  `;
  document.body.appendChild(flying);

  const deltaX = destRect.left + destRect.width / 2 - (originRect.left + originRect.width / 2);
  const deltaY = destRect.top + destRect.height / 2 - (originRect.top + originRect.height / 2);

  // Un seul easing global "vite au début, plat à la fin" faisait parcourir
  // ~80% du trajet dans les 250 premières ms, puis l'image restait figée
  // en blob près de la destination pour le reste de la durée — moche, pas
  // lisible comme un vol. Un easing PAR étape (montée en décélération, puis
  // descente en accélération vers l'icône, comme une vraie trajectoire
  // lancée) répartit le mouvement sur toute la durée.
  const animation = flying.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1, offset: 0, easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
      {
        transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5 - 90}px) scale(0.8)`,
        opacity: 1,
        offset: 0.5,
        easing: "cubic-bezier(0.5, 0, 0.85, 1)",
      },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.25)`, opacity: 0.5, offset: 1 },
    ],
    { duration: 700 },
  );

  animation.onfinish = () => flying.remove();
}
