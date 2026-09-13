"use client";

import { useTransition } from "react";
import { deleteProductAction } from "./actions";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est définitive.`)) return;
    startTransition(() => {
      deleteProductAction(id);
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
