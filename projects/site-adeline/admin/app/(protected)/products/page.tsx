import Link from "next/link";
import Image from "next/image";
import { getAllProductsForAdmin } from "@/lib/db/products";
import { getCategoryLabel } from "@/lib/categories";
import DeleteProductButton from "./DeleteProductButton";

const CARD = "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "Brouillon", bg: "rgba(36,27,21,0.06)", fg: "var(--color-ink)" },
  active: { label: "Publié", bg: "rgba(47,95,99,0.12)", fg: "var(--color-teal)" },
  archived: { label: "Archivé", bg: "rgba(173,74,52,0.1)", fg: "var(--color-rust)" },
};

function formatPrice(cents: number | null): string {
  if (cents === null) return "Sur devis";
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export default async function AdminProductsPage() {
  const products = await getAllProductsForAdmin();

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Catalogue</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Produits</h1>
        </div>
        <Link
          href="/products/new"
          className="rounded-full bg-denim px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.3)] transition-transform hover:-translate-y-0.5"
        >
          + Ajouter un produit
        </Link>
      </div>

      {products.length === 0 ? (
        <div className={`${CARD} mt-10 max-w-md p-10 text-center`}>
          <p className="text-ink/70">Aucun produit pour l&apos;instant.</p>
          <Link
            href="/products/new"
            className="mt-5 inline-flex rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
          >
            Ajouter le premier produit
          </Link>
        </div>
      ) : (
        <div className={`${CARD} mt-8 overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.1em] text-ink/40">
                <th className="px-6 py-4 font-medium">Produit</th>
                <th className="px-4 py-4 font-medium">Catégorie</th>
                <th className="px-4 py-4 font-medium">Prix</th>
                <th className="px-4 py-4 font-medium">Stock</th>
                <th className="px-4 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {products.map((p) => {
                const status = STATUS_STYLE[p.status];
                return (
                  <tr key={p.id} className="transition-colors hover:bg-ink/[0.015]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-ink/5" />
                        )}
                        <span className="font-medium text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">{getCategoryLabel(p.category)}</td>
                    <td className="px-4 py-3.5 text-ink/60">{formatPrice(p.price_cents)}</td>
                    <td className="px-4 py-3.5 text-ink/60">{p.stock}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: status.bg, color: status.fg }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/products/${p.id}/edit`} className="text-ink/45 hover:text-denim">
                        Modifier
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
