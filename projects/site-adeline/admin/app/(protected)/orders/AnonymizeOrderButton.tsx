"use client";

import { useTransition } from "react";
import { anonymizeOrderAction } from "./actions";

// RGPD Art. 17 — confirmation avant clic car irréversible (email/adresse
// écrasés en base, pas récupérables ensuite).
export default function AnonymizeOrderButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Effacer l'email et l'adresse de cette commande ? Action irréversible.")) return;
        startTransition(() => anonymizeOrderAction(id));
      }}
      className="text-xs font-medium text-ink/40 underline decoration-line underline-offset-2 transition-colors hover:text-rust disabled:opacity-60"
    >
      {pending ? "…" : "Effacer les données personnelles"}
    </button>
  );
}
