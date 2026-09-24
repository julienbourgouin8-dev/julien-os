"use client";

import { useEffect, useRef, useState } from "react";

const PULSE_DURATION_MS = 8_000;

// Petit indicateur visuel quand le nombre de commandes à traiter augmente
// entre deux rafraîchissements automatiques (voir AutoRefresh.tsx) — pas de
// son ni de notification navigateur (permission à demander, plus intrusif
// que ce qui a été demandé), juste un repère qu'Adeline peut remarquer du
// coin de l'œil pendant qu'elle travaille dans l'admin.
export default function NewOrderPulse({ count }: { count: number }) {
  const previous = useRef<number | null>(null);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (previous.current !== null && count > previous.current) {
      setPulsing(true);
      const timeout = setTimeout(() => setPulsing(false), PULSE_DURATION_MS);
      previous.current = count;
      return () => clearTimeout(timeout);
    }
    previous.current = count;
  }, [count]);

  if (!pulsing) return null;

  return (
    <span
      aria-label="Nouvelle commande"
      className="relative flex h-2.5 w-2.5"
    >
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: "var(--color-rust)" }}
      />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-rust)" }} />
    </span>
  );
}
