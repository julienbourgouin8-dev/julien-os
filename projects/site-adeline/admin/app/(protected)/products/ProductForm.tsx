"use client";

import { startTransition, useActionState, useState } from "react";
import { categories } from "@/lib/categories";
import { subcategoriesByCategory } from "@/lib/subcategories";
import type { Product } from "@/lib/db/products";
import { compressImageForUpload, imageWidth } from "@/lib/compress-image-client";
import type { ProductFormState } from "./actions";

type NewPhoto = { id: string; kind: "new"; file: File; preview: string };
type Photo = { id: string; kind: "existing"; url: string } | NewPhoto;

type Action = (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;

export default function ProductForm({
  product,
  source,
  action,
}: {
  product?: Product;
  // Produit d'origine quand on crée une déclinaison : ses champs communs
  // préremplissent le formulaire (et sont recopiés côté serveur).
  source?: Product;
  action: Action;
}) {
  const shared = product ?? source;
  const [state, formAction, pending] = useActionState(action, undefined);
  // Liste unique des photos, dans l'ordre d'affichage sur la boutique : la
  // 1re est la photo principale. On la réorganise par glisser-déposer.
  const [photos, setPhotos] = useState<Photo[]>(() =>
    Array.from(new Set(product?.images ?? [])).map((url) => ({ id: `e:${url}`, kind: "existing" as const, url })),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  // largeur réelle des nouvelles photos (px), pour signaler celles trop petites
  const [widths, setWidths] = useState<Record<string, number>>({});

  const newPhotos = photos.filter((p): p is NewPhoto => p.kind === "new");
  const photoOrder = photos.map((p) => (p.kind === "existing" ? `e:${p.url}` : `n:${newPhotos.indexOf(p)}`));
  const move = (from: number, to: number) => {
    if (from === to || to < 0) return;
    setPhotos((list) => {
      if (from >= list.length || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  const dropOn = (targetId: string) => {
    const from = photos.findIndex((p) => p.id === dragId);
    const to = photos.findIndex((p) => p.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from >= 0 && to >= 0) move(from, to);
  };

  const [category, setCategory] = useState(shared?.category ?? categories[0].slug);
  const subcategoryOptions = subcategoriesByCategory[category] ?? [];

  return (
    <form
      // Pas de `action={formAction}` : React 19 réinitialise (form.reset())
      // tout formulaire après une action, même en erreur. Les menus
      // Catégorie/Sous-catégorie revenaient alors sur leur première option
      // à l'écran alors que l'état React gardait l'ancien choix, d'où
      // « sous-catégorie invalide » au renvoi suivant. On envoie donc les
      // données à la main : rien n'est remis à zéro si l'enregistrement
      // échoue (photos, choix et saisies restent en place).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
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
          defaultValue={shared?.name}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      {source && <input type="hidden" name="fromProductId" value={source.id} />}

      <div>
        <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Catégorie
        </label>
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {subcategoryOptions.length > 0 && (
        <div>
          <label htmlFor="subcategory" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Sous-catégorie
          </label>
          <select
            id="subcategory"
            name="subcategory"
            key={category}
            defaultValue={category === shared?.category ? (shared?.subcategory ?? "") : ""}
            className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
          >
            <option value="">Aucune</option>
            {subcategoryOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={shared?.description}
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
            defaultValue={shared?.price_cents != null ? (shared.price_cents / 100).toFixed(2) : ""}
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
        <label htmlFor="weight" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Poids emballé (grammes)
        </label>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Nécessaire pour calculer les frais de port réels au moment du paiement (article + emballage).
        </p>
        <input
          id="weight"
          name="weight"
          type="number"
          min={0}
          step={1}
          defaultValue={shared?.weight_grams ?? ""}
          placeholder="ex. 250"
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
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
          Glisse les photos pour les mettre dans l&apos;ordre (ou utilise les flèches). La photo n°1, à gauche, est la
          photo principale : mets-y la vue de face, elle s&apos;affiche en premier sur la boutique.
        </p>
        <input type="hidden" name="photoOrder" value={JSON.stringify(photoOrder)} />
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((photo, i) => {
            const width = photo.kind === "new" ? widths[photo.id] : undefined;
            return (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  setDragId(photo.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  if (overId !== photo.id) setOverId(photo.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOn(photo.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`group relative h-24 w-24 cursor-grab active:cursor-grabbing ${
                  dragId === photo.id ? "opacity-40" : ""
                }`}
              >
                {photo.kind === "existing" && <input type="hidden" name="existingImages" value={photo.url} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.kind === "existing" ? photo.url : photo.preview}
                  alt=""
                  draggable={false}
                  className={`h-full w-full rounded-lg object-cover ring-2 ${
                    overId === photo.id && dragId !== photo.id
                      ? "ring-rust"
                      : i === 0
                        ? "ring-denim"
                        : "ring-transparent"
                  }`}
                />
                <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink/80 px-1 text-[0.65rem] font-bold text-paper">
                  {i + 1}
                </span>
                {i === 0 && (
                  <span className="absolute inset-x-1 bottom-1 rounded-full bg-white/95 px-2 py-1 text-center text-[0.58rem] font-bold uppercase tracking-wide text-ink shadow-sm">
                    Principale
                  </span>
                )}
                {width !== undefined && width < 1400 && (
                  <span
                    title={`Photo de ${width} px de large : trop petite, elle sera floue sur le site (idéal : 1600 px ou plus).`}
                    className="absolute inset-x-1 top-8 rounded bg-rust px-1 py-0.5 text-center text-[0.55rem] font-bold uppercase leading-tight text-paper"
                  >
                    Trop petite · floue
                  </span>
                )}
                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  {i > 0 ? (
                    <button
                      type="button"
                      onClick={() => move(i, i - 1)}
                      aria-label="Décaler vers la gauche"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink shadow"
                    >
                      ‹
                    </button>
                  ) : (
                    <span />
                  )}
                  {i < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      aria-label="Décaler vers la droite"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink shadow"
                    >
                      ›
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotos((list) => list.filter((p) => p.id !== photo.id))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-paper"
                  aria-label="Retirer cette photo"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const input = e.target;
            const selected = await Promise.all(Array.from(input.files ?? []).map(compressImageForUpload));
            input.value = "";
            const added: NewPhoto[] = selected.map((file) => ({
              id: `n:${crypto.randomUUID()}`,
              kind: "new",
              file,
              preview: URL.createObjectURL(file),
            }));
            setPhotos((list) => [...list, ...added]);
            const found = await Promise.all(added.map(async (p) => [p.id, await imageWidth(p.file)] as const));
            setWidths((w) => ({ ...w, ...Object.fromEntries(found.filter((e): e is readonly [string, number] => e[1] !== null)) }));
          }}
          className="mt-3 text-sm text-ink/60"
        />
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
            newPhotos.forEach((p) => dt.items.add(p.file));
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
