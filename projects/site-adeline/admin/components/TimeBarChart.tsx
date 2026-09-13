"use client";

import { useState } from "react";

export type TimeBarDatum = { day: string; value: number };

const HEIGHT = 160;
const BAR_MAX_WIDTH = 22; // spec dataviz : colonne ≤24px

// Colonnes verticales, une seule teinte (magnitude, pas identité) — la
// barre survolée (ou la plus haute par défaut) se détache en pleine
// couleur, les autres en version tramée du même hue. Callout flottant
// façon étiquette, cf. référence apportée par Julien. Gridlines hairline
// à gauche, comme LineChart, pour donner une échelle de lecture.
export default function TimeBarChart({ data }: { data: TimeBarDatum[] }) {
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(maxIndex);

  if (data.length === 0) {
    return <p className="text-sm text-ink/40">Pas encore de données.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const active = activeIndex !== null ? data[activeIndex] : null;
  const gridSteps = 3;
  const gridValues = Array.from(new Set(Array.from({ length: gridSteps + 1 }, (_, i) => Math.round((max / gridSteps) * i))));

  // Le callout reste centré sur la barre active, mais sans jamais dépasser
  // les bords de la carte (sinon il chevauche le titre/sous-titre au-dessus).
  const rawPct = activeIndex !== null ? ((activeIndex + 0.5) / data.length) * 100 : 50;
  const calloutPct = Math.min(88, Math.max(12, rawPct));

  return (
    <div>
      <div className="relative">
        {active && (
          <div
            className="pointer-events-none absolute -top-2 flex -translate-x-1/2 -translate-y-full flex-col items-center rounded-xl bg-ink px-3 py-2 text-paper shadow-lg"
            style={{ left: `${calloutPct}%` }}
          >
            <span className="font-display text-lg italic leading-none">{active.value}</span>
            <span className="mt-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-paper/60">
              {new Date(active.day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          </div>
        )}

        <div className="mt-8 flex gap-2">
          <div className="flex shrink-0 flex-col justify-between text-right text-[0.6rem] text-ink/35" style={{ height: HEIGHT, width: 18 }}>
            {[...gridValues].reverse().map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>

          <div className="relative flex-1">
            {/* gridlines hairline recessives */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {gridValues.map((v) => (
                <div key={v} className="h-px bg-ink/[0.06]" />
              ))}
            </div>

            <div className="flex items-end gap-1.5" style={{ height: HEIGHT }}>
              {data.map((d, i) => {
                const isActive = i === activeIndex;
                const h = Math.max(3, (d.value / max) * HEIGHT);
                return (
                  <div
                    key={d.day}
                    className="flex flex-1 cursor-pointer flex-col items-center justify-end"
                    onPointerEnter={() => setActiveIndex(i)}
                    onPointerLeave={() => setActiveIndex(maxIndex)}
                  >
                    <div
                      className="w-full rounded-t-[4px] transition-[height,opacity] duration-150"
                      style={{
                        height: h,
                        maxWidth: BAR_MAX_WIDTH,
                        backgroundColor: "var(--color-denim)",
                        opacity: isActive ? 1 : 0.25,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-1.5 pl-[26px] text-[0.6rem] text-ink/40">
        {data.map((d, i) => {
          const showEvery = Math.max(1, Math.ceil(data.length / 7));
          return (
            <div key={d.day} className="flex-1 text-center">
              {i % showEvery === 0 ? new Date(d.day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
