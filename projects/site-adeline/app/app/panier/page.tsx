"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";
import { formatPrice } from "@/components/ProductCard";
import { useCart } from "@/lib/cart/useCart";

export default function PanierPage() {
  const { items, itemCount, subtotalCents, removeItem, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de créer la commande, réessayez.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Impossible de contacter le serveur, réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <h1 className="font-display text-3xl text-ink">
          Votre panier
          {itemCount > 0 && (
            <span className="ml-3 align-middle text-sm font-semibold uppercase tracking-[0.1em] text-ink/40">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
          )}
        </h1>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.04] text-ink/25">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </div>
            <p className="mt-5 text-ink/60">Votre panier est vide pour l&apos;instant.</p>
            <Link
              href="/#vitrine"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Voir les créations
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-5 rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-4 shadow-[0_1px_2px_rgba(36,27,21,0.04),0_10px_24px_rgba(36,27,21,0.05)] sm:p-5"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-contain" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-teal">
                      {item.category}
                    </p>
                    <p className="mt-0.5 truncate font-display text-lg text-ink">{item.name}</p>
                    <p className="mt-1 text-sm text-ink/50">{formatPrice(item.price_cents)} / pièce</p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-line bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Diminuer la quantité"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.05]"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Augmenter la quantité"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.05]"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-ink">
                          {formatPrice(item.price_cents * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          aria-label="Retirer du panier"
                          className="text-ink/35 transition-colors hover:text-rust"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* résumé — même traitement carte élevée que le reste du site
                (produit, admin), colonne figée pendant que la liste défile. */}
            <div className="rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-6 shadow-[0_1px_2px_rgba(36,27,21,0.04),0_10px_28px_rgba(36,27,21,0.06)] lg:sticky lg:top-8">
              <p className="font-display text-lg italic text-ink">Récapitulatif</p>

              <div className="mt-5 space-y-2.5 border-t border-dashed border-line pt-5 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Sous-total</span>
                  <span className="font-medium text-ink">{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Livraison</span>
                  <span className="font-medium text-teal">Offerte</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-sm font-semibold text-ink">Total</span>
                <span className="font-display text-2xl text-ink">{formatPrice(subtotalCents)}</span>
              </div>

              {error && <p className="mt-4 text-sm text-rust">{error}</p>}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center rounded-full bg-denim py-4 text-sm font-bold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "Redirection…" : "Passer commande"}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink/40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Paiement sécurisé via Stripe
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
