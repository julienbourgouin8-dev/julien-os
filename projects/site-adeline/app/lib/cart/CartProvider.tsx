"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price_cents: number;
  image: string | null;
  category: string;
  slug: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "creadeline-cart";

// Pas de compte client / session serveur : le panier vit uniquement dans le
// navigateur (localStorage), cohérent avec un site sans authentification
// visiteur — voir PROGRESS.md pour le contexte du pivot panier/Stripe.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponible (navigation privée stricte, etc.) — panier
      // reste vide pour cette session, pas d'erreur bloquante.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // évite d'écraser le panier sauvegardé avec [] au tout premier rendu
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };

  const clear = () => setItems([]);

  const { itemCount, subtotalCents } = useMemo(
    () => ({
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalCents: items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),
    }),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotalCents, addItem, removeItem, updateQuantity, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}
