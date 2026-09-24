"use client";

import { useState } from "react";
import Image from "next/image";

// Desktop : carrousel dans un cadre fixe (flèches + points, navigation
// manuelle — jamais d'auto-défilement ici, contrairement à Nouveautes.tsx :
// une cliente qui examine une pièce avant d'acheter doit pouvoir s'attarder
// sur une photo). Avant, les photos s'empilaient en pleine hauteur et il
// fallait faire défiler toute la page pour voir la suite, ce qui vidait de
// son sens la colonne de texte "figée" (sticky) à côté (retour Julien
// 2026-09-24). Mobile : empilement vertical classique conservé, adapté à
// ce format (pas de colonne sticky à préserver en dessous de `lg`).
export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 bg-white">
        <svg width="40" height="40" viewBox="0 0 34 34" fill="none" className="text-ink/20">
          <rect x="5" y="11" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11V9a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 18h24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 3" />
        </svg>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
      </div>
    );
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <>
      <div className="hidden lg:block">
        <div className="relative aspect-[16/9] overflow-hidden bg-white">
          {images.map((url, i) => (
            <Image
              key={url}
              src={url}
              alt={i === 0 ? name : `${name} — vue ${i + 1}`}
              fill
              sizes="690px"
              quality={85}
              priority={i === 0}
              className="object-contain transition-opacity duration-500 ease-in-out"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Photo précédente"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Photo suivante"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Voir la photo ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === active ? "1.5rem" : "0.5rem",
                  backgroundColor: i === active ? "var(--color-denim)" : "rgba(36,27,21,0.15)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:hidden">
        {images.map((url, i) => (
          <Image
            key={url}
            src={url}
            alt={i === 0 ? name : `${name} — vue ${i + 1}`}
            width={1600}
            height={900}
            sizes="100vw"
            quality={82}
            priority={i === 0}
            className="block h-auto w-full bg-white"
          />
        ))}
      </div>
    </>
  );
}
