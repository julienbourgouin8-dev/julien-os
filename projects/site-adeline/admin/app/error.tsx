"use client";

import Link from "next/link";

// Sans ce fichier, la moindre exception non interceptée (panne DB, upload
// trop lourd, Sendcloud injoignable...) tombait sur l'écran d'erreur
// générique de Next — souvent en anglais, sans indication ni retour
// possible, illisible pour Adeline qui n'est pas développeuse.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fdfbf7] px-6 text-center">
      <p className="font-display text-2xl text-ink">Une erreur est survenue</p>
      <p className="max-w-sm text-sm text-ink/60">
        Quelque chose s&apos;est mal passé. Réessaie — si ça persiste, préviens Julien.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-denim px-5 py-2.5 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
        >
          Réessayer
        </button>
        <Link href="/" className="text-sm font-semibold text-ink/60 underline hover:text-ink">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
