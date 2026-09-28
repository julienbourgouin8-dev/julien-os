"use client";

import { startTransition, useActionState, useState } from "react";
import type { Market } from "@/lib/db/markets";
import { compressImageForUpload } from "@/lib/compress-image-client";
import type { MarketFormState } from "./actions";

type Action = (state: MarketFormState, formData: FormData) => Promise<MarketFormState>;

export default function MarketForm({ market, action }: { market?: Market; action: Action }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [existingImage, setExistingImage] = useState<string | null>(market?.image ?? null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  return (
    <form
      // Même raison que ProductForm : React 19 réinitialise le formulaire
      // après une action, même en erreur — on envoie donc à la main pour ne
      // rien perdre si l'enregistrement échoue.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="max-w-xl space-y-5 rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-8 shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]"
    >
      <div>
        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Titre
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="ex. Marché de Noël (APE)"
          defaultValue={market?.title}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      <div>
        <label htmlFor="place" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Lieu
        </label>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Ville (+ code postal si besoin) — sert aussi à placer le pin sur la carte du site, ex. « Balzac (16430) »
          ou « Angoulême (Espace Lunesse) ».
        </p>
        <input
          id="place"
          name="place"
          type="text"
          required
          placeholder="ex. Balzac (16430)"
          defaultValue={market?.place}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      <div>
        <label htmlFor="event_date" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Date
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          defaultValue={market?.event_date ?? ""}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Image</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Affichée dans la bulle au clic sur le pin. Optionnelle — une image par défaut est utilisée si vide.
        </p>
        {existingImage && <input type="hidden" name="existingImage" value={existingImage} />}
        <div className="mt-2 flex items-center gap-4">
          {(newImagePreview ?? existingImage) ? (
            <div className="relative h-24 w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={newImagePreview ?? existingImage!}
                alt=""
                className="h-full w-full rounded-lg object-cover ring-2 ring-denim"
              />
              <button
                type="button"
                onClick={() => {
                  setExistingImage(null);
                  setNewImageFile(null);
                  setNewImagePreview(null);
                }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-paper"
                aria-label="Retirer cette image"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="h-24 w-24 rounded-lg bg-ink/5" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const compressed = await compressImageForUpload(file);
              setExistingImage(null);
              setNewImageFile(compressed);
              setNewImagePreview(URL.createObjectURL(compressed));
            }}
            className="text-sm text-ink/60"
          />
        </div>
        <input
          type="file"
          name="newImage"
          hidden
          ref={(el) => {
            if (!el) return;
            const dt = new DataTransfer();
            if (newImageFile) dt.items.add(newImageFile);
            el.files = dt.files;
          }}
        />
      </div>

      {state?.error && <p className="text-sm text-rust">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
