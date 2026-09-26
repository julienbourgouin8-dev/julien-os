import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/db/products";
import { getCollectionMembers, getAttachableProducts } from "@/lib/db/products";
import { attachProductAction, detachProductAction } from "./actions";

// Panneau « Collection » de la page Modifier : liste des déclinaisons (même
// nom, même prix — une miniature chacune, comme le sélecteur de couleurs
// d'une boutique en ligne) + « + Ajouter une déclinaison ».
export default async function CollectionPanel({ product }: { product: Product }) {
  const members = product.collection_id ? await getCollectionMembers(product.collection_id) : [product];
  const attachable = await getAttachableProducts(product.id, product.collection_id);

  return (
    <section className="max-w-xl rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-6 shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Collection</p>
      <p className="mt-1 text-xs leading-relaxed text-ink/55">
        Plusieurs pièces identiques (même prix, même description) dans des tissus ou coloris différents : elles
        n&apos;apparaissent qu&apos;une fois dans la boutique, et les clients passent de l&apos;une à l&apos;autre
        sur la fiche produit.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {members.map((m) => {
          const current = m.id === product.id;
          return (
            <Link
              key={m.id}
              href={`/products/${m.id}/edit`}
              className={`w-24 text-center ${current ? "" : "opacity-80 hover:opacity-100"}`}
            >
              <div className={`relative h-24 w-24 overflow-hidden rounded-lg bg-white ring-2 ${current ? "ring-denim" : "ring-ink/10"}`}>
                {m.images[0] ? (
                  <Image src={m.images[0]} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-ink/5" />
                )}
              </div>
              <p className="mt-1.5 truncate text-xs font-semibold text-ink">{m.name}</p>
              <p className="text-[0.65rem] text-ink/45">
                {m.status === "active" ? "Publié" : m.status === "draft" ? "Brouillon" : "Archivé"} · stock {m.stock}
              </p>
            </Link>
          );
        })}
        <Link
          href={`/products/new?from=${product.id}`}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-denim/40 text-denim transition-colors hover:bg-denim/[0.06]"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="px-1 text-center text-[0.6rem] font-bold uppercase leading-tight tracking-wide">
            Ajouter une déclinaison
          </span>
        </Link>
      </div>

      {attachable.length > 0 && (
        <form action={attachProductAction.bind(null, product.id)} className="mt-5 flex flex-wrap items-center gap-2">
          <select
            name="otherProductId"
            required
            defaultValue=""
            className="min-w-0 flex-1 rounded-xl bg-ink/[0.04] px-3 py-2 text-sm text-ink outline-none ring-1 ring-transparent focus:bg-white focus:ring-denim"
          >
            <option value="" disabled>
              Rattacher un produit déjà créé…
            </option>
            {attachable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-denim px-4 py-2 text-xs font-bold text-denim transition-colors hover:bg-denim hover:text-paper"
          >
            Rattacher
          </button>
        </form>
      )}

      {product.collection_id && (
        <form action={detachProductAction.bind(null, product.id)} className="mt-4">
          <button type="submit" className="text-xs text-ink/45 underline hover:text-rust">
            Sortir cette pièce de la collection
          </button>
        </form>
      )}
    </section>
  );
}
