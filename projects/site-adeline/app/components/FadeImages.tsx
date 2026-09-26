"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const FADE_INTERVAL_MS = 2800;

// Diaporama en fondu simple des photos d'une carte de la page catégorie :
// toutes les photos du produit, ou la photo principale de chaque déclinaison
// pour une collection. Reste sur la première photo si l'utilisateur préfère
// les animations réduites.
export default function FadeImages({ images, name, soldOut }: { images: string[]; name: string; soldOut?: boolean }) {
  // Horloge partagée : toutes les cartes de la page changent de photo au même
  // instant (même principe que le slider Nouveautés de la home), en s'alignant
  // sur des multiples de FADE_INTERVAL_MS plutôt qu'un minuteur par carte.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setTick(Math.floor(Date.now() / FADE_INTERVAL_MS));
      interval = setInterval(() => setTick(Math.floor(Date.now() / FADE_INTERVAL_MS)), FADE_INTERVAL_MS);
    }, FADE_INTERVAL_MS - (Date.now() % FADE_INTERVAL_MS));
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, []);

  const active = tick % images.length;

  return (
    <div className={`absolute inset-0 ${soldOut ? "opacity-50" : ""}`}>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? name : `${name} — vue ${i + 1}`}
          fill
          sizes="(min-width: 1280px) 420px, (min-width: 768px) calc((100vw - 344px) / 2), 100vw"
          quality={90}
          className={`object-contain transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
