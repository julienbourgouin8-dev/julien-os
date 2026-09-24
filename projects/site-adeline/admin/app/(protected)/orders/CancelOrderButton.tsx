"use client";

import { useState, useTransition } from "react";
import { cancelOrderAction } from "./actions";

export default function CancelOrderButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleClick = () => {
    if (!confirm("Annuler cette commande et remettre les articles en stock ?")) return;
    startTransition(async () => {
      const result = await cancelOrderAction(id);
      setError(result.error ?? null);
      setWarning(result.warning ?? null);
    });
  };

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-full border border-rust/40 px-5 py-2.5 text-sm font-semibold text-rust transition-colors hover:bg-rust/[0.06] disabled:opacity-60"
      >
        {pending ? "…" : "Annuler la commande"}
      </button>
      {error && <p className="mt-2 text-xs text-rust">{error}</p>}
      {warning && <p className="mt-2 text-xs text-ink/60">{warning}</p>}
    </div>
  );
}
