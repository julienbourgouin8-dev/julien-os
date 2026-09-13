"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/useCart";

// La page de confirmation est un Server Component (lit la commande en DB) —
// ce petit composant client isolé se charge juste de vider le panier
// localStorage une fois le paiement confirmé, sans rendre toute la page
// "use client".
export default function ClearCartOnSuccess() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // Une seule fois au montage (nouvelle page = paiement confirmé une fois).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
