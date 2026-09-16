"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";

// Remplace le lien statique "Panier (bientôt)" dans Header.tsx et la nav
// hero — compteur live + petit "pulse" (voir .cart-bump dans globals.css)
// rejoué en changeant la `key` du <span> à chaque changement de compteur.
export default function CartBadge({ className, hideLabel }: { className?: string; hideLabel?: boolean }) {
  const { itemCount } = useCart();

  return (
    <Link
      href="/panier"
      aria-label={itemCount > 0 ? `Panier (${itemCount} article${itemCount > 1 ? "s" : ""})` : "Panier"}
      className={className ?? "flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-rust"}
    >
      {!hideLabel && <span className="hidden sm:inline">Panier</span>}
      {/* data-cart-icon : cible visée par l'animation d'envol du produit au
          clic sur "Ajouter au panier" (voir lib/cart/flyToCart.ts) — le
          fait d'être hors écran ici (nav mobile masquée) désactive
          proprement l'animation côté flyToCart plutôt que de viser dans le
          vide. */}
      <span data-cart-icon className="relative inline-flex">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        {/* pastille qui chevauche le sac (comme la référence de Julien) —
            liseré "paper" pour que le cercle reste net et uniforme même
            là où il recouvre le trait de l'icône (sans lui, la frontière du
            cercle se "fond" par endroits dans le trait noir et lit comme
            une forme irrégulière plutôt qu'un rond propre). */}
        {itemCount > 0 && (
          <span
            key={itemCount}
            className="cart-bump absolute right-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-paper bg-ink text-[0.68rem] font-bold leading-none text-paper"
          >
            {itemCount}
          </span>
        )}
      </span>
    </Link>
  );
}
