"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/components/ProductCard";

const SLIDE_INTERVAL_MS = 1900;

export type NouveauteProduct = {
  href: string;
  category: string;
  name: string;
  price_cents: number | null;
  images: string[];
};

type Slide = { product: NouveauteProduct; image: string | null };

// Un seul emplacement sur mobile (pas la place pour 4 cartes) : défile tout
// seul à travers les photos de la pièce en cours, puis enchaîne sur la
// pièce suivante — demande explicite de Julien ("on peut voir une face,
// une autre face, et après ça passe au produit suivant").
export default function NouveautesMobileCarousel({ products }: { products: NouveauteProduct[] }) {
  const slides: Slide[] = products.flatMap<Slide>((p) =>
    p.images.length > 0 ? p.images.map((image) => ({ product: p, image })) : [{ product: p, image: null }],
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (slides.length === 0) return null;
  const current = slides[active].product;

  return (
    <Link href={current.href} className="block">
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        {slides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            {s.image ? (
              <Image
                src={s.image}
                alt={s.product.name}
                fill
                sizes="90vw"
                quality={82}
                unoptimized={s.image.startsWith("/uploads/")}
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/50">{current.category}</p>
          <p className="mt-0.5 truncate text-ink">{current.name}</p>
        </div>
        <span className="shrink-0 font-semibold text-ink">{formatPrice(current.price_cents)}</span>
      </div>

      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-denim">
        Découvrir
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>

      {/* Petits repères de progression — laquelle des pièces est en cours,
          discret, pas un vrai contrôle (le défilement est automatique). */}
      <div className="mt-3 flex justify-center gap-1.5">
        {products.map((p, i) => {
          const isCurrentProduct = p === current;
          return (
            <span
              key={p.href}
              aria-hidden
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: isCurrentProduct ? "1.25rem" : "0.375rem",
                backgroundColor: isCurrentProduct ? "var(--color-denim)" : "rgba(36,27,21,0.12)",
              }}
            />
          );
        })}
      </div>
    </Link>
  );
}
