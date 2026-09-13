import Link from "next/link";
import Image from "next/image";

export function formatPrice(cents: number | null): string {
  if (cents === null) return "Sur devis";
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

type ProductCardProps = {
  href: string;
  category: string;
  name: string;
  price_cents: number | null;
  images: string[];
  comingSoon?: boolean;
};

export default function ProductCard({ href, category, name, price_cents, images, comingSoon }: ProductCardProps) {
  return (
    <div className="relative">
      {comingSoon && (
        <span className="absolute left-0 top-0 z-10 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink">
          Bientôt
        </span>
      )}
      {/* favori — hors du <Link> (un <button> ne peut pas être imbriqué
          dans un <a>), positionné par-dessus au même endroit visuel. */}
      <button
        type="button"
        aria-label="Ajouter aux favoris"
        className="absolute right-0 top-0 z-10 text-ink transition-colors hover:text-rust"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.7 5 8 5 9.7 6.3 12 9c2.3-2.7 4-4 6.3-4 3.4 0 5.2 3.4 3.7 6.7C19.5 16.4 12 21 12 21Z" />
        </svg>
      </button>

      <Link href={href} className="block">
        {/* bande blanche pleine longueur derrière l'image — sinon, sans
            vraie photo (fond transparent), la pièce flotte à même le fond
            crème de la page, aucune séparation visible. Ratio 16/9 (format
            réel des photos produit) plutôt que carré : un carré forçait
            object-contain à ajouter des bandes blanches au-dessus/dessous
            en plus de celles déjà dans la photo — on ne doit voir QUE la
            photo d'origine, pas une marge ajoutée par le gabarit. */}
        <div className="relative aspect-[16/9] bg-white">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={name}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="text-ink/20">
                <rect x="5" y="11" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11V9a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 18h24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 3" />
              </svg>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-base font-bold text-ink">{category}</p>
          <p className="mt-1 text-ink/80">{name}</p>
          <p className="mt-3 text-lg font-bold text-ink">{formatPrice(price_cents)}</p>
        </div>
      </Link>
    </div>
  );
}
