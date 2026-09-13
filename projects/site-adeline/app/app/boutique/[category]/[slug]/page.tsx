import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { getProductBySlug } from "@/lib/db/products";
import { getDemoProduct } from "@/lib/demo-products";
import { CONTACT_EMAIL } from "@/components/ContactSection";
import { formatPrice } from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import TrackEvent from "@/components/TrackEvent";
import Header from "@/components/Header";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  const product = await getProductBySlug(category, slug);
  // Pas de vraie pièce à cette adresse : on retombe sur le gabarit "Bientôt
  // disponible" s'il correspond, sinon 404 classique — voir lib/demo-products.ts.
  const demo = product ? null : getDemoProduct(category, slug);
  if (!product && !demo) notFound();

  // Un produit démo peut avoir de vraies photos/description prêtes avec
  // juste le prix final qui manque (comingSoon: false) — voir demo-products.ts.
  const comingSoon = !product && (demo?.comingSoon ?? true);
  const name = product?.name ?? demo!.name;
  const description = product?.description ?? demo!.description;
  const price_cents = product?.price_cents ?? demo!.price_cents;
  const images = product?.images ?? demo!.images;
  const dimensions = demo?.dimensions;
  // Un <textarea> soumis en formulaire encode ses retours à la ligne en
  // \r\n (norme HTML), pas \n — sans cette normalisation, la description
  // saisie par Adeline dans l'admin ne se coupait jamais en paragraphes.
  const paragraphs = description.replace(/\r\n/g, "\n").split("\n\n").filter(Boolean);

  const subject = encodeURIComponent(`Demande via le site — ${name}`);
  const body = encodeURIComponent(`Bonjour,\n\nCette pièce m'intéresse : ${name}.\n\n`);
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div className="min-h-screen">
      {product && (
        <TrackEvent
          event="product_viewed"
          properties={{
            product_id: product.id,
            product_name: product.name,
            category,
            price_cents: product.price_cents,
          }}
        />
      )}
      <Header />

      <p className="px-10 pt-6">
        <Link
          href={`/boutique/${category}`}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-teal"
        >
          ← {cat.label}
        </Link>
      </p>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10">

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-16">
        <div>
          <ProductGallery images={images} name={name} />
        </div>

        {/* colonne texte figée pendant que la pile de photos défile derrière
            — sticky + self-start (sinon la grille étire la colonne à la
            hauteur de l'image et le sticky n'a nulle part où "flotter").
            top-24 (pas top-8) : le header est lui-même sticky (Header.tsx,
            ~81px) — sans cette marge la colonne se cale sous le header au
            lieu de rester juste en dessous, visible en permanence. */}
        <div className="lg:sticky lg:top-24 lg:ml-auto lg:max-w-md lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-ink">
              CréA&apos;deline
            </p>
            <button
              type="button"
              aria-label="Ajouter aux favoris"
              className="text-ink transition-colors hover:text-rust"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.7 5 8 5 9.7 6.3 12 9c2.3-2.7 4-4 6.3-4 3.4 0 5.2 3.4 3.7 6.7C19.5 16.4 12 21 12 21Z" />
              </svg>
            </button>
          </div>
          <h1 className="mt-1 font-display text-3xl text-ink">{name}</h1>
          <p className="mt-3 text-xl font-bold text-ink">{formatPrice(price_cents)}</p>

          {!comingSoon && (
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-teal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              En stock · Pièce unique prête à être expédiée
            </p>
          )}

          {/* liseré pointillé — motif couture du reste du site, sépare le
              prix du détail produit. */}
          <div className="mt-5 border-t border-dashed border-line" />

          {paragraphs.length > 0 && (
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink/70">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {dimensions && (
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">
              Dimensions — {dimensions}
            </p>
          )}

          {comingSoon ? (
            <p className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-mustard/20 px-6 py-4 text-sm font-semibold text-ink/70">
              Bientôt disponible — repassez faire un tour
            </p>
          ) : product && product.price_cents !== null ? (
            // Panier réel : seules les vraies pièces en base (avec un prix
            // fixé, pas "sur devis") peuvent être ajoutées — le checkout
            // recalcule tout depuis products.id, une pièce démo n'y existe
            // pas et casserait cette vérification.
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price_cents={product.price_cents}
              image={images[0] ?? null}
              category={cat.label}
              slug={product.slug}
            />
          ) : (
            <a
              href={mailto}
              className="mt-8 flex w-full items-center justify-center rounded-full bg-denim py-4 text-sm font-bold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Nous contacter pour cette pièce · {formatPrice(price_cents)}
            </a>
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
