import Image from "next/image";
import type { Product } from "@/lib/products";
import StitchUnderline from "./StitchUnderline";

const ACCENTS = ["var(--color-teal)", "var(--color-rust)", "var(--color-mustard)"];

export default function FeaturePiece({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const reversed = index % 2 === 1;
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Media slot — sized for a future video swap, not a thumbnail crop */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-ink/5 sm:aspect-[3/2] lg:aspect-[4/5]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
      </div>

      <div>
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {product.tag}
        </p>
        <h3 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          {product.name}
        </h3>
        <StitchUnderline color={accent} width={110} className="my-4" />
        <p className="max-w-md leading-relaxed text-ink/75">
          {product.description}
        </p>
        <div className="mt-5 flex items-center gap-4">
          {product.price ? (
            <span
              className="rounded-full px-3 py-1 text-sm font-semibold text-paper"
              style={{ background: accent }}
            >
              {product.price}
            </span>
          ) : (
            <span className="text-sm text-ink/50">
              Pièce unique — sur demande
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
