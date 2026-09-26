import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/db/products";

// Sélecteur de déclinaisons d'une collection sous le prix : « MODÈLES : nom »
// puis une miniature par pièce, celle affichée est cerclée. Chaque miniature
// est un vrai lien vers la fiche de la déclinaison (URL, stock et panier
// propres à chaque pièce).
export default function VariantPicker({ variants, currentId }: { variants: Product[]; currentId: string }) {
  if (variants.length < 2) return null;
  const current = variants.find((v) => v.id === currentId);

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink">
        Modèles : <span className="font-normal normal-case tracking-normal text-ink/70">{current?.name}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((v) => {
          const selected = v.id === currentId;
          const soldOut = v.stock <= 0;
          return (
            <Link
              key={v.id}
              href={`/boutique/${v.category}/${v.slug}`}
              aria-label={`${v.name}${soldOut ? " (épuisé)" : ""}`}
              aria-current={selected ? "true" : undefined}
              scroll={false}
              className={`relative block aspect-video w-32 overflow-hidden bg-white ring-2 transition-shadow ${
                selected ? "ring-ink" : "ring-ink/15 hover:ring-ink/50"
              }`}
            >
              {v.images[0] && (
                <Image
                  src={v.images[0]}
                  alt=""
                  fill
                  sizes="128px"
                  className={`object-cover scale-[1.15] ${soldOut ? "opacity-40" : ""}`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
