"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

// Même effet d'écriture que le wordmark du hero (mot par mot, clip-path +
// blur), mais déclenché au scroll au lieu d'au montage — pour amener un peu
// du dynamisme du hero sur les sections plus bas dans la page.
export default function WriteOnHeading({
  text,
  as: Tag = "h2",
  className = "",
  italicWords = [],
  blueWords = [],
}: {
  text: string;
  as?: ElementType;
  className?: string;
  italicWords?: string[];
  // Mot(s)-clé mis en avant dans le même bleu que "créations" dans le
  // hero (text-denim), même logique que italicWords (retour Julien
  // 2026-09-16 : "les mots importants... même bleu que cette phrase-là").
  blueWords?: string[];
}) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      // rootMargin resserré : sans ça, un titre proche du haut d'une
      // grande section se déclenchait dès qu'il pointait en bas du
      // viewport, bien avant que la section ne soit vraiment "là".
      { threshold: 0.3, rootMargin: "-10% 0px -20% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={[
            italicWords.includes(word) ? "font-display italic" : "",
            blueWords.includes(word) ? "font-bold text-denim" : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined}
          style={{
            display: "inline-block",
            // `clip-path` (même à "pas de clip") crée sa propre zone de
            // recadrage calée sur la boîte de ligne — trop juste pour les
            // descendantes très marquées du Fraunces italique (p, g, q),
            // qui se retrouvaient tronquées à plat. Line-height + marge en
            // bas généreux pour que la boîte contienne tout le glyphe.
            lineHeight: 1.35,
            paddingBottom: "0.12em",
            // délai inclus DANS le raccourci `animation` — le mélanger avec
            // `animationDelay` séparé déclenche un warning React (propriété
            // conflictuelle au rerender).
            animation: revealed
              ? `write-on 0.7s cubic-bezier(0.45,0,0.2,1) ${i * 90}ms both`
              : "none",
            opacity: revealed ? undefined : 0,
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
