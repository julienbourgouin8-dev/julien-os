"use client";

import { useState, useTransition } from "react";
import { generateShippingLabelAction } from "./actions";

export default function GenerateShippingLabelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setErrorMsg(null);
          startTransition(async () => {
            const res = await generateShippingLabelAction(id);
            if (!res.success) {
              setErrorMsg(res.error || "Une erreur est survenue.");
            }
          });
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal/90 disabled:opacity-50"
      >
        {isPending ? "Génération..." : "Générer l'étiquette Sendcloud"}
      </button>
      {errorMsg && <p className="mt-2 text-xs text-rust">{errorMsg}</p>}
    </div>
  );
}
