import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/components/ProductCard";

export type NouveauteProduct = {
  href: string;
  category: string;
  name: string;
  price_cents: number | null;
  images: string[];
};

// Purement présentationnel : ne gère plus son propre minuteur — `activeIndex`
// vient du parent (NouveautesSlider), pour que toutes les cartes visibles
// changent de face EXACTEMENT en même temps (retour Julien : "face avant
// pour les deux produits, face arrière pour les deux produits..."). Fondu
// simple, sans zoom — la version avec léger zoom ne plaisait pas à Julien.
export default function NouveauteCard({
  href,
  category,
  name,
  price_cents,
  images,
  activeIndex,
}: NouveauteProduct & { activeIndex: number }) {
  const active = images.length > 0 ? activeIndex % images.length : 0;

  return (
    <Link href={href} className="group block">
      {/* 16/9 = ratio réel des photos produit (même convention que
          ProductCard.tsx) — un autre ratio ferait apparaître des bandes
          blanches au-dessus/dessous de la photo. */}
      <div className="relative aspect-[16/9] overflow-hidden bg-white">
        {images.length > 0 ? (
          images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={name}
              fill
              sizes="(min-width: 640px) 45vw, 92vw"
              quality={85}
              unoptimized={src.startsWith("/uploads/")}
              className="object-contain transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
          </div>
        )}
      </div>

      {/* Catégorie seule sur sa ligne, puis nom + prix alignés sur la même
          ligne (items-center). */}
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-ink/50 sm:text-sm">{category}</p>
      <div className="mt-1 flex items-center justify-between gap-4">
        <p className="min-w-0 flex-1 truncate text-lg text-ink sm:text-xl">{name}</p>
        <span className="shrink-0 text-lg font-semibold text-ink sm:text-xl">{formatPrice(price_cents)}</span>
      </div>

      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-denim transition-colors group-hover:text-rust sm:text-sm">
        Découvrir
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
