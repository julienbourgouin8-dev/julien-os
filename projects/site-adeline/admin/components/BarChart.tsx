"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number };

// Barres horizontales, teinte unique (séquentiel, pas catégoriel — un seul
// hue = pas de problème de palette CVD). Longueur = magnitude, label direct
// (nom de page + valeur) à l'extrémité — cf. dataviz skill : bord arrondi
// 4px, épaisseur plafonnée, jamais un stroke pour séparer.
export default function BarChart({ data }: { data: BarDatum[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-sm text-ink/40">Pas encore de données.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div
          key={d.label}
          className="group"
          onPointerEnter={() => setHovered(i)}
          onPointerLeave={() => setHovered(null)}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-ink/70" title={d.label}>
              {d.label}
            </span>
            <span className="ml-2 shrink-0 font-semibold text-ink">{d.value}</span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-ink/5">
            <div
              className="h-full rounded-full transition-[width,opacity] duration-200"
              style={{
                width: `${Math.max(4, (d.value / max) * 100)}%`,
                backgroundColor: "var(--color-denim)",
                opacity: hovered === null || hovered === i ? 1 : 0.55,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
