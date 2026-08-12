import Reveal from "./Reveal";
import StitchUnderline from "./StitchUnderline";

const STEPS = [
  { label: "Choisissez un tissu", detail: "Parmi ceux du site, ou une autre envie" },
  { label: "Choisissez un modèle", detail: "Sac, trousse, pochette — même sur mesure" },
  { label: "Récupérez la pièce", detail: "Sur un marché, ou envoyée chez vous" },
];

export default function HowToOrder() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust">
          Commander
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Trois étapes, une pièce unique
          </h2>
          <StitchUnderline color="var(--color-rust)" width={90} />
        </div>
      </Reveal>

      <div className="mt-12 grid gap-10 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.label} delay={i * 100}>
            <span className="font-script text-4xl text-rust">
              {i + 1}
            </span>
            <p className="mt-2 font-display text-lg text-ink">
              {step.label}
            </p>
            <p className="mt-1 text-sm text-ink/60">{step.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
