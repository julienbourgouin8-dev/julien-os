"use client";

import { useRef, useState } from "react";
import { useCart } from "@/lib/cart/useCart";
import { flyToCart } from "@/lib/cart/flyToCart";

type Props = {
  productId: string;
  name: string;
  price_cents: number;
  image: string | null;
  category: string;
  slug: string;
};

// Bascule brièvement en "Ajouté ✓" au clic (voir .hero-pop dans globals.css
// pour la même famille d'animation "pop") — pas de vrai state "loading",
// l'ajout au panier est synchrone (localStorage). L'envol de la photo vers
// l'icône panier (flyToCart) est ce qui rend l'ajout vraiment visible,
// le texte du bouton n'est qu'une confirmation secondaire.
export default function AddToCartButton({ productId, name, price_cents, image, category, slug }: Props) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (buttonRef.current) flyToCart(buttonRef.current, image);
    addItem({ productId, name, price_cents, image, category, slug });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className="mt-8 flex w-full items-center justify-center rounded-full bg-denim py-4 text-sm font-bold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
    >
      <span key={justAdded ? "added" : "idle"} className="hero-pop inline-flex items-center gap-2">
        {justAdded ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Ajouté au panier
          </>
        ) : (
          "Ajouter au panier"
        )}
      </span>
    </button>
  );
}
