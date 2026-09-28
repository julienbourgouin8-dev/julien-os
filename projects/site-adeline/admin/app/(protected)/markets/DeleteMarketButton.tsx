"use client";

import { useTransition } from "react";
import { deleteMarketAction } from "./actions";

export default function DeleteMarketButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(`Supprimer "${title}" ? Cette action est définitive.`)) return;
    startTransition(() => {
      deleteMarketAction(id);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="ml-4 text-ink/50 hover:text-rust disabled:opacity-50"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
