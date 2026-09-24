"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/components/ProductCard";

const ROTATE_INTERVAL_MS = 2600;

// Fait défiler tout seul les photos d'UNE pièce (face, dos, intérieur...)
// en fondu — pas de survol nécessaire, demande explicite de Julien ("il n'y
// a pas besoin de mettre son curseur dessus"). `startDelayMs` décale le
// départ de chaque carte de la grille desktop pour qu'elles ne changent pas
// toutes en même temps (plus vivant qu'un flip synchronisé).
export default function NouveauteCard({
  href,
  category,
  name,
  price_cents,
  images,
  startDelayMs = 0,
}: {
  href: string;
  category: string;
  name: string;
  price_cents: number | null;
  images: string[];
  startDelayMs?: number;
}) {
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
      <div className="relative aspect-[16/9] overflow-hidden bg-white">
        {images.length > 0 ? (
          images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={name}
              fill
              sizes="(min-width: 1024px) 25vw, 90vw"
              quality={82}
              unoptimized={src.startsWith("/uploads/")}
              className="object-contain transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/50">{category}</p>
          <p className="mt-0.5 truncate text-ink">{name}</p>
        </div>
        <span className="shrink-0 font-semibold text-ink">{formatPrice(price_cents)}</span>
      </div>

      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-denim transition-colors group-hover:text-rust">
        Découvrir
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
