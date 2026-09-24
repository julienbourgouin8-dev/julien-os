import { getLatestActiveProducts } from "@/lib/db/products";
import { getCategoryLabel } from "@/lib/categories";
import WriteOnHeading from "@/components/WriteOnHeading";
import NouveauteCard from "@/components/NouveauteCard";
import NouveautesMobileCarousel, { type NouveauteProduct } from "@/components/NouveautesMobileCarousel";

const PRODUCT_COUNT = 4;
// Décalage entre le démarrage du défilement de chaque carte desktop, pour
// qu'elles ne changent pas toutes de face en même temps (retour Julien :
// il veut du dynamique, pas un flip synchronisé qui ferait "gadget").
const CARD_STAGGER_MS = 500;

export default async function Nouveautes() {
  const products = await getLatestActiveProducts(PRODUCT_COUNT);
  if (products.length === 0) return null;

  const items: NouveauteProduct[] = products.map((p) => ({
    href: `/boutique/${p.category}/${p.slug}`,
    category: getCategoryLabel(p.category),
    name: p.name,
    price_cents: p.price_cents,
    images: p.images,
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

        {/* Desktop/tablette : les 4 pièces côte à côte, chacune fait
            défiler ses propres photos toute seule. */}
        <div className="mt-10 hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <NouveauteCard key={item.href} {...item} startDelayMs={i * CARD_STAGGER_MS} />
          ))}
        </div>

        {/* Mobile : une seule pièce à la fois, le défilement enchaîne les
            photos puis passe à la pièce suivante tout seul. */}
        <div className="mx-auto mt-10 max-w-sm sm:hidden">
          <NouveautesMobileCarousel products={items} />
        </div>
      </div>
    </section>
  );
}
