"use client";

import { useEffect, useState } from "react";
import NouveauteCard, { type NouveauteProduct } from "@/components/NouveauteCard";

const GROUP_INTERVAL_MS = 7500;
const CARD_ROTATE_STAGGER_MS = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Glisse automatiquement d'un groupe de pièces au suivant (2 par 2 sur
// desktop, une par une sur mobile — `groupSize`), en boucle infinie. Chaque
// carte continue en parallèle son propre fondu entre ses photos
// (NouveauteCard) : deux échelles de temps et deux types de mouvement
// différents et volontairement distincts — glissement horizontal ici pour
// "on change de pièce", fondu+zoom dans la carte pour "on change juste de
// face" (demande explicite de Julien : les deux transitions ne doivent pas
// se ressembler).
export default function NouveautesSlider({ products, groupSize }: { products: NouveauteProduct[]; groupSize: number }) {
  const groups = chunk(products, groupSize);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (groups.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % groups.length), GROUP_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  if (groups.length === 0) return null;

  return (
    <div className="overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {groups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="grid w-full shrink-0 gap-x-8 gap-y-10 text-left"
            style={{ gridTemplateColumns: `repeat(${groupSize}, minmax(0, 1fr))` }}
          >
            {group.map((item, i) => (
              <NouveauteCard key={item.href} {...item} startDelayMs={i * CARD_ROTATE_STAGGER_MS} />
            ))}
          </div>
        ))}
      </div>

      {groups.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {groups.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === active ? "1.5rem" : "0.5rem",
                backgroundColor: i === active ? "var(--color-denim)" : "rgba(36,27,21,0.12)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
