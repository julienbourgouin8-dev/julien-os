"use client";

import { useTransition } from "react";
import { markOrderFulfilledAction } from "./actions";

export default function MarkFulfilledButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markOrderFulfilledAction(id))}
      className="rounded-full bg-denim px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      {pending ? "…" : "Marquer comme expédiée"}
    </button>
  );
}
