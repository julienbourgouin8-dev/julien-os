"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Diaporama en fondu simple des photos principales des déclinaisons d'une
// collection (carte de la page catégorie). Reste sur la première photo si
// l'utilisateur préfère les animations réduites.
export default function FadeImages({ images, name, soldOut }: { images: string[]; name: string; soldOut?: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % images.length), 2600);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className={`absolute inset-0 ${soldOut ? "opacity-50" : ""}`}>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? name : `${name} — déclinaison ${i + 1}`}
          fill
          sizes="(min-width: 1280px) 420px, (min-width: 768px) calc((100vw - 344px) / 2), 100vw"
          quality={90}
          className={`object-contain transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
