"use client";

import { useState } from "react";

export type DonutDatum = { label: string; value: number; color: string };

const SIZE = 200;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Part-to-whole, ≤6 segments (cf. dataviz skill anti-patterns : un donut
// n'est légitime que pour ça, jamais pour comparer des valeurs proches —
// ici de vraies parts d'un total de vues, pas un classement serré).
// Anneau à trous (surface gap) entre chaque segment plutôt qu'un contour,
// légende toujours présente (identité jamais portée par la couleur seule).
export default function DonutChart({ data }: { data: DonutDatum[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <p className="text-sm text-ink/40">Pas encore de données.</p>;
  }

  const GAP = 3; // surface gap en degrés d'arc, sépare chaque segment
  const segments = data.reduce<Array<DonutDatum & { fraction: number; startAngle: number; sweep: number }>>(
    (acc, d) => {
      const fraction = d.value / total;
      const cursor = acc.length > 0 ? acc[acc.length - 1].startAngle / 360 + acc[acc.length - 1].fraction : 0;
      const startAngle = cursor * 360;
      const sweep = Math.max(0, fraction * 360 - GAP);
      acc.push({ ...d, fraction, startAngle, sweep });
      return acc;
    },
    [],
  );

  const activeSeg = hovered !== null ? segments[hovered] : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Répartition par catégorie">
          <g transform={`translate(${SIZE / 2},${SIZE / 2}) rotate(-90)`}>
            {segments.map((s, i) => {
              const dash = (s.sweep / 360) * CIRCUMFERENCE;
              const gapDash = CIRCUMFERENCE - dash;
              const rotation = (s.startAngle / 360) * 360;
              return (
                <circle
                  key={s.label}
                  r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hovered === null || hovered === i ? STROKE : STROKE - 6}
                  strokeDasharray={`${dash} ${gapDash}`}
                  strokeLinecap="butt"
                  transform={`rotate(${rotation})`}
                  opacity={hovered === null || hovered === i ? 1 : 0.45}
                  className="cursor-pointer transition-all duration-150"
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered(null)}
                />
              );
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-2xl italic text-ink">
            {activeSeg ? `${Math.round(activeSeg.fraction * 100)}%` : total}
          </p>
          <p className="text-[0.65rem] uppercase tracking-[0.1em] text-ink/40">
            {activeSeg ? activeSeg.label : "vues totales"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {segments.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors"
            style={{ backgroundColor: hovered === i ? "rgba(36,27,21,0.04)" : "transparent" }}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="flex items-center gap-2 text-ink/80">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold text-ink">{Math.round(s.fraction * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
