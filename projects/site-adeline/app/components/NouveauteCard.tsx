"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/components/ProductCard";

const ROTATE_INTERVAL_MS = 2600;

export type NouveauteProduct = {
  href: string;
  category: string;
  name: string;
  price_cents: number | null;
  images: string[];
};

// Fait défiler tout seul les photos d'UNE pièce (face, dos, intérieur...) —
// pas de survol nécessaire, demande explicite de Julien. Fondu + très léger
// zoom arrière (scale 1.04 → 1) plutôt qu'un fondu plat : distinct de la
// transition de glissement entre pièces (voir NouveautesSlider), qui elle
// déplace au lieu d'estomper — deux mouvements différents, jamais confondus.
// `startDelayMs` décale le départ de chaque carte pour qu'elles ne changent
// pas toutes de face en même temps.
export default function NouveauteCard({
  href,
  category,
  name,
  price_cents,
  images,
  startDelayMs = 0,
}: NouveauteProduct & { startDelayMs?: number }) {
  const [active, setActive] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    if (images.length <= 1) return;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % images.length;
        setActive(indexRef.current);
      }, ROTATE_INTERVAL_MS);
    }, startDelayMs);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [images.length, startDelayMs]);

  return (
    <Link href={href} className="group block">
      {/* 16/9 = ratio réel des photos produit (même convention que
          ProductCard.tsx) — un autre ratio ferait apparaître des bandes
          blanches au-dessus/dessous de la photo (`object-contain` dans un
          cadre trop haut), constaté par Julien en 4/3 sur la v1 mobile. */}
      <div className="relative aspect-[16/9] overflow-hidden bg-white">
        {images.length > 0 ? (
          images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={name}
              fill
              sizes="(min-width: 640px) 45vw, 92vw"
              quality={85}
              unoptimized={src.startsWith("/uploads/")}
              className="object-contain transition-[opacity,transform] duration-[900ms] ease-out"
              style={{
                opacity: i === active ? 1 : 0,
                transform: i === active ? "scale(1)" : "scale(1.045)",
              }}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
          </div>
        )}
      </div>

      {/* Catégorie seule sur sa ligne, puis nom + prix alignés sur la même
          ligne (items-center) — avant, le prix s'alignait avec la catégorie
          plutôt qu'avec le nom, décalage visible signalé par Julien. */}
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-ink/50 sm:text-sm">{category}</p>
      <div className="mt-1 flex items-center justify-between gap-4">
        <p className="min-w-0 flex-1 truncate text-lg text-ink sm:text-xl">{name}</p>
        <span className="shrink-0 text-lg font-semibold text-ink sm:text-xl">{formatPrice(price_cents)}</span>
      </div>

      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-denim transition-colors group-hover:text-rust sm:text-sm">
        Découvrir
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
