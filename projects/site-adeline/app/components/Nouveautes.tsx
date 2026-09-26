import { getLatestActiveProducts } from "@/lib/db/products";
import { getCategoryLabel } from "@/lib/categories";
import { groupByCollection } from "@/lib/collections";
import WriteOnHeading from "@/components/WriteOnHeading";
import NouveautesSlider from "@/components/NouveautesSlider";
import type { NouveauteProduct } from "@/components/NouveauteCard";

const PRODUCT_COUNT = 4;

export default async function Nouveautes() {
  // On récupère plus de lignes que d'emplacements : les déclinaisons d'une
  // même collection ne forment qu'une seule carte (voir lib/collections.ts).
  const groups = groupByCollection(await getLatestActiveProducts(PRODUCT_COUNT * 6)).slice(0, PRODUCT_COUNT);
  if (groups.length === 0) return null;

  const items: NouveauteProduct[] = groups.map(({ product: p, images }) => ({
    href: `/boutique/${p.category}/${p.slug}`,
    category: getCategoryLabel(p.category),
    name: p.name,
    price_cents: p.price_cents,
    images,
  }));

  return (
    <section id="nouveautes" className="scroll-mt-20 bg-paper px-4 py-14 sm:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-xl font-semibold uppercase tracking-[0.2em] text-teal">Nouveautés</p>
        <WriteOnHeading
          as="h2"
          text="Les dernières pièces sorties de l'atelier"
          italicWords={["dernières"]}
          blueWords={["pièces"]}
          className="mt-2 font-display text-[clamp(1.4rem,4.5vw,2.5rem)] text-ink"
        />
      </div>

      {/* Desktop/tablette : 2 grandes pièces à la fois (conteneur resserré
          à max-w-5xl, pas 7xl, pour qu'elles restent grandes plutôt que
          diluées sur toute la largeur) — glisse vers les 2 suivantes,
          boucle à l'infini. Retour Julien : 4 côte à côte les rendait trop
          petites. */}
      <div className="mx-auto mt-10 hidden max-w-5xl sm:block">
        <NouveautesSlider products={items} groupSize={2} />
      </div>

      {/* Mobile : une seule pièce à la fois, même mécanique. */}
      <div className="mx-auto mt-10 max-w-sm sm:hidden">
        <NouveautesSlider products={items} groupSize={1} />
      </div>
    </section>
  );
}
