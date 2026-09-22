"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { categories } from "@/lib/categories";
import type { Product } from "@/lib/db/products";
import type { ProductFormState } from "./actions";

type Action = (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;

export default function ProductForm({ product, action }: { product?: Product; action: Action }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [primaryImage, setPrimaryImage] = useState<{ type: "existing" | "new"; value: string } | null>(
    product?.images[0] ? { type: "existing", value: product.images[0] } : null,
  );

  const removeExisting = (url: string) => {
    setExistingImages((imgs) => imgs.filter((u) => u !== url));
    if (primaryImage?.type === "existing" && primaryImage.value === url) setPrimaryImage(null);
  };
  const removeNew = (index: number) => {
    setNewFiles((files) => files.filter((_, i) => i !== index));
    setPrimaryImage((primary) => {
      if (primary?.type !== "new") return primary;
      const currentIndex = Number(primary.value);
      if (currentIndex === index) return null;
      return currentIndex > index ? { type: "new", value: String(currentIndex - 1) } : primary;
    });
  };

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-5 rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-8 shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]"
    >
      <div>
        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={product?.name}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      <div>
        <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Catégorie
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={product?.category ?? categories[0].slug}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="mt-1.5 w-full resize-none rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Prix (€, vide = sur devis)
          </label>
          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            defaultValue={product?.price_cents != null ? (product.price_cents / 100).toFixed(2) : ""}
            placeholder="ex. 45.00"
            className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
          />
        </div>
        <div>
          <label htmlFor="stock" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Statut
        </label>
        <select
          id="status"
          name="status"
          defaultValue={product?.status ?? "draft"}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        >
          <option value="draft">Brouillon (invisible sur le site)</option>
          <option value="active">Publié</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Photos</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Choisis la vue de face comme photo principale. Elle sera toujours affichée en premier sur la boutique.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {existingImages.map((url) => (
            <div key={url} className="group relative h-24 w-24">
              <input type="hidden" name="existingImages" value={url} />
              <Image
                src={url}
                alt=""
                fill
                className={`rounded-lg object-cover ring-2 ${
                  primaryImage?.type === "existing" && primaryImage.value === url
                    ? "ring-denim"
                    : "ring-transparent"
                }`}
              />
              <button
                type="button"
                onClick={() => setPrimaryImage({ type: "existing", value: url })}
                className="absolute inset-x-1 bottom-1 rounded-full bg-white/95 px-2 py-1 text-[0.58rem] font-bold uppercase tracking-wide text-ink shadow-sm"
              >
                {primaryImage?.type === "existing" && primaryImage.value === url ? "Principale ✓" : "Mettre en 1er"}
              </button>
              <button
                type="button"
                onClick={() => removeExisting(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-paper"
                aria-label="Retirer cette photo"
              >
                ×
              </button>
            </div>
          ))}
          {newFiles.map((file, i) => (
            <div key={`${file.name}-${file.lastModified}`} className="group relative h-24 w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className={`h-full w-full rounded-lg object-cover ring-2 ${
                  primaryImage?.type === "new" && primaryImage.value === String(i)
                    ? "ring-denim"
                    : "ring-transparent"
                }`}
              />
              <button
                type="button"
                onClick={() => setPrimaryImage({ type: "new", value: String(i) })}
                className="absolute inset-x-1 bottom-1 rounded-full bg-white/95 px-2 py-1 text-[0.58rem] font-bold uppercase tracking-wide text-ink shadow-sm"
              >
                {primaryImage?.type === "new" && primaryImage.value === String(i) ? "Principale ✓" : "Mettre en 1er"}
              </button>
              <button
                type="button"
                onClick={() => removeNew(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-paper"
                aria-label="Retirer cette photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            setNewFiles((prev) => {
              if (!primaryImage && selected.length > 0) {
                setPrimaryImage({ type: "new", value: String(prev.length) });
              }
              return [...prev, ...selected];
            });
          }}
          className="mt-3 text-sm text-ink/60"
        />
        {primaryImage && (
          <>
            <input type="hidden" name="primaryImageType" value={primaryImage.type} />
            <input type="hidden" name="primaryImageValue" value={primaryImage.value} />
          </>
        )}
        {/* DataTransfer permet d'attacher la sélection de fichiers courante à
            un <input type="file"> normal, seul type que FormData sait lire. */}
        <input
          type="file"
          name="newImages"
          multiple
          hidden
          ref={(el) => {
            if (!el) return;
            const dt = new DataTransfer();
            newFiles.forEach((f) => dt.items.add(f));
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
