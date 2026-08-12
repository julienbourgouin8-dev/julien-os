import Image from "next/image";
import Reveal from "./Reveal";
import StitchUnderline from "./StitchUnderline";
import { fabrics } from "@/lib/products";

export default function Fabrics() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          Les tissus
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Chaque pièce, un tissu choisi
          </h2>
          <StitchUnderline color="var(--color-teal)" width={90} />
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {fabrics.map((fabric, i) => (
          <Reveal key={fabric.name} delay={i * 80}>
            <div className="group relative aspect-square overflow-hidden rounded-full border-4 border-paper shadow-[0_1px_4px_rgba(36,27,21,0.15)]">
              <Image
                src={fabric.image}
                alt={`Tissu ${fabric.name}, ${fabric.color}`}
                fill
                sizes="(min-width: 640px) 22vw, 45vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <p className="mt-3 text-center font-display text-lg text-ink">
              {fabric.name}
            </p>
            <p className="text-center text-xs uppercase tracking-wide text-ink/50">
              {fabric.color}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
