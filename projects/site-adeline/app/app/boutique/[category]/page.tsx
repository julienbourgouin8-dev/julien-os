import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WriteOnHeading from "@/components/WriteOnHeading";
import TrackEvent from "@/components/TrackEvent";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import { getCategoryBySlug } from "@/lib/categories";
import { getActiveProductsByCategory, type Product } from "@/lib/db/products";
import { demoProductsByCategory } from "@/lib/demo-products";
import { subcategoriesByCategory } from "@/lib/subcategories";
import { groupByCollection } from "@/lib/collections";

// Sans ceci, la page héritait du title/description génériques du layout
// racine — identiques sur tout le site, donc Google ne pouvait pas
// distinguer cette page de la home ni des autres catégories (constaté :
// les mêmes title/description génériques ressortaient sur "Toilette" et
// sur "Politique de cookies" dans les résultats de recherche).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};
  return {
    title: `${cat.label} — CréA'deline`,
    description: `Créations "${cat.label}" de CréA'deline : accessoires en tissu cousus main sur mesure en Charente, pièces uniques et idées cadeaux personnalisées.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ minPrice?: string; maxPrice?: string; sort?: string; subcategory?: string }>;
}) {
  const { category } = await params;
  const { minPrice, maxPrice, sort, subcategory } = await searchParams;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  let products = await getActiveProductsByCategory(category);
  // Tant qu'aucune vraie pièce n'est active dans cette catégorie, on montre
  // le gabarit "Bientôt disponible" plutôt qu'un rayon vide — voir
  // lib/demo-products.ts. Le filtre prix ne s'applique qu'aux vraies pièces.
  let demoProducts = products.length === 0 ? (demoProductsByCategory[category] ?? []) : [];
  if (subcategory) products = products.filter((p) => p.subcategory === subcategory);
  if (subcategory) demoProducts = demoProducts.filter((p) => p.subcategory === subcategory);

  const min = minPrice ? Number(minPrice) * 100 : undefined;
  const max = maxPrice ? Number(maxPrice) * 100 : undefined;
  if (min !== undefined) products = products.filter((p) => p.price_cents !== null && p.price_cents >= min);
  if (max !== undefined) products = products.filter((p) => p.price_cents !== null && p.price_cents <= max);

  const byPriceAsc = (a: Product, b: Product) => (a.price_cents ?? 0) - (b.price_cents ?? 0);
  if (sort === "price-asc") products = [...products].sort(byPriceAsc);
  if (sort === "price-desc") products = [...products].sort((a, b) => byPriceAsc(b, a));

  const isFiltered = Boolean(minPrice || maxPrice);
  const subcategories = subcategoriesByCategory[category] ?? [];

  return (
    <div className="min-h-screen">
      <TrackEvent event="category_viewed" properties={{ category, product_count: products.length }} />

      <Header />

      {/* nom de la catégorie — grand, centré, sans fil d'ariane au-dessus
          (retiré : "Accueil / Toilette" juste au-dessus de "Toilette" en
          gros lisait mal). */}
      <div className="px-10 pb-4 pt-6 text-center">
        <WriteOnHeading
          as="h1"
          text={cat.label}
          className="font-display font-black text-ink text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.9]"
        />

        {subcategories.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {subcategories.map((s) => {
              const active = subcategory === s;
              return (
                <Link
                  key={s}
                  href={active ? `/boutique/${category}` : `/boutique/${category}?subcategory=${encodeURIComponent(s)}`}
                  className={
                    active
                      ? "rounded-full border border-denim bg-denim px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper"
                      : "rounded-full border border-line px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  }
                >
                  {s}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <main className="w-full px-4 pb-16 pt-4 sm:px-10">
      {products.length === 0 && demoProducts.length === 0 && !isFiltered && !subcategory ? (
        <p className="mt-4 text-ink/50">
          Aucune pièce publiée dans cette catégorie pour l&apos;instant — revenez bientôt.
        </p>
      ) : (
        <div className="relative mt-4 grid grid-cols-1 gap-y-12 md:grid-cols-[200px_1fr] md:gap-x-12 xl:block">
          <aside className="mx-auto w-full max-w-xs md:mx-0 md:max-w-none xl:absolute xl:left-0 xl:top-0 xl:w-40">
            <p className="font-display text-lg italic text-ink">Filtrer par</p>
            <details className="group mt-4 border-t border-line py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.15em] text-ink">
                Prix
                <span className="text-ink/40 transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <form method="get" className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    min={0}
                    defaultValue={minPrice}
                    placeholder="Min €"
                    className="w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm"
                  />
                  <span className="text-ink/40">–</span>
                  <input
                    type="number"
                    name="maxPrice"
                    min={0}
                    defaultValue={maxPrice}
                    placeholder="Max €"
                    className="w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm"
                  />
                </div>
                {sort && <input type="hidden" name="sort" value={sort} />}
                <button
                  type="submit"
                  className="rounded-full bg-denim px-4 py-2 text-xs font-semibold text-paper transition-transform hover:-translate-y-0.5"
                >
                  Appliquer
                </button>
                {isFiltered && (
                  <Link
                    href={`/boutique/${category}${sort ? `?sort=${sort}` : ""}`}
                    className="text-center text-xs text-ink/50 underline hover:text-ink"
                  >
                    Réinitialiser
                  </Link>
                )}
              </form>
            </details>

            <div className="border-t border-line py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink">Trier</p>
              <form method="get" className="mt-4 flex flex-col gap-3">
                {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
                {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
                <select
                  name="sort"
                  defaultValue={sort ?? ""}
                  className="w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm"
                >
                  <option value="">Plus récent</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink"
                >
                  Trier
                </button>
              </form>
            </div>
          </aside>

          <div className="xl:mx-auto xl:w-fit">
            {products.length === 0 && demoProducts.length === 0 ? (
              <p className="text-ink/50">Aucune pièce ne correspond à ce filtre.</p>
            ) : (
              /* `minmax(360px,1fr)` imposait une largeur de colonne MINIMALE
                 de 360px même quand le conteneur disponible est plus étroit
                 (mobile : ~310px une fois les paddings de `main` et de
                 l'aside filtres déduits) — la grille refusait de rétrécir
                 sous ce plancher et débordait de 50px à droite du
                 conteneur (retour Julien 2026-09-16, capture d'écran :
                 "toujours à droite par rapport à la page", vérifié en
                 mesurant le DOM réel : carte produit à left:40px
                 right:400px dans un parent large de 310px). `min(360px,
                 100%)` plafonne le minimum à la largeur réellement
                 disponible, donc la colonne peut redescendre sous 360px
                 sur un écran étroit au lieu de déborder. xl:gap-x-24 (retour
                 Julien 2026-09-24, capture annotée) : marge horizontale
                 nettement plus large entre les 2 colonnes desktop —
                 gap-x-10 par défaut inchangé en dessous de xl, où il n'y a
                 qu'une seule colonne visible de toute façon. */
              <div className="grid justify-center grid-cols-[repeat(auto-fit,minmax(min(390px,100%),420px))] gap-x-10 gap-y-16 xl:grid-cols-[repeat(2,420px)] xl:gap-x-24">
                {groupByCollection(products).map(({ product: p, images, soldOut, variants }) => (
                  <ProductCard
                    key={p.id}
                    href={`/boutique/${category}/${p.slug}`}
                    category={cat.label}
                    name={p.name}
                    price_cents={p.price_cents}
                    images={images}
                    soldOut={soldOut}
                    fade={variants.length > 1}
                  />
                ))}
                {demoProducts.map((p) => (
                  <ProductCard
                    key={p.slug}
                    href={`/boutique/${category}/${p.slug}`}
                    category={cat.label}
                    name={p.name}
                    price_cents={p.price_cents}
                    images={p.images}
                    comingSoon={p.comingSoon ?? true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
