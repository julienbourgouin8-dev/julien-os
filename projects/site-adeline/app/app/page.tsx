import Image from "next/image";
import VitrineArc from "@/components/VitrineArc";
import Marches from "@/components/Marches";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <>
      <a
        href="#vitrine"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Aller aux créations
      </a>

      <main className="flex-1">
        {/* HERO — nav + photo + texte fusionnés dans un seul bloc */}
        <section id="hero" className="relative scroll-mt-0 overflow-hidden bg-paper">
          <div className="relative w-full" style={{ aspectRatio: "3016 / 1536" }}>
            <div className="hero-media absolute inset-0">
              <Image
                src="/brand/hero-v4.jpg"
                alt="Sac cabas, portefeuille et pochette assortis, en simili cuir bleu et écru, CréA'deline"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>

            {/* logo — coin, hors zone bandoulière */}
            <div className="absolute inset-x-0 top-0 flex items-center px-6 py-4 sm:px-10 sm:py-5">
              <a href="#hero" className="font-script text-5xl font-bold text-ink">
                CréA&apos;deline
              </a>
            </div>

            {/* nav — espacement régulier entre les 3 liens, le 2e écart
                (Marchés → Contact) tombe sur la bandoulière, mesurée fine
                (~53%-58% à la hauteur de la nav, pas plus large). Boutique
                partage le même top que les autres liens, sinon la hauteur
                du logo (dans une autre ligne) décale son alignement. */}
            <nav className="absolute inset-x-0 top-[1.5rem] hidden font-display text-sm font-medium uppercase tracking-[0.18em] text-ink sm:top-[1.9rem] sm:block">
              <a href="#vitrine" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "30%" }}>
                Créations
              </a>
              <a href="#marches" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "48%" }}>
                Marchés
              </a>
              <a href="#contact" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "66%" }}>
                Contact
              </a>
              <a
                href="#vitrine"
                aria-label="Panier (bientôt)"
                className="absolute right-6 flex items-center gap-2 transition-colors hover:text-rust sm:right-10"
              >
                Panier
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 8h12l-1 12H7L6 8Z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </a>
            </nav>

            {/* icône boutique seule, visible même sous le breakpoint sm où
                la nav texte est masquée */}
            <a
              href="#vitrine"
              aria-label="Boutique (bientôt)"
              className="absolute right-6 top-4 text-ink transition-colors hover:text-rust sm:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </a>

            {/* wordmark — posé dans la boucle des anses, effet d'écriture par mot
                (pas lettre par lettre : ça cassait les ligatures de l'italique) */}
            <h1
              className="absolute inset-x-0 top-[13%] select-none text-center font-display font-black leading-[0.82] text-ink sm:top-[15%]"
              style={{
                fontSize: "clamp(3.2rem, 11.5vw, 9.5rem)",
                letterSpacing: "0.01em",
                transform: "translateX(2%)",
              }}
            >
              <span className="write-on">CréA&apos;</span>
              <span className="write-on italic text-denim" style={{ animationDelay: "0.35s" }}>
                deline
              </span>
            </h1>

            {/* CTA — reste à droite, juste un peu plus bas et plus vers le
                bord (rien à gauche). Arrive après l'écriture du titre. */}
            <div className="absolute right-[4%] top-[58%] max-w-[16rem] -translate-y-1/2 text-right sm:right-[8%]">
              <p
                className="hero-rise font-display text-2xl font-medium italic text-ink sm:text-3xl"
                style={{ animationDelay: "1.3s" }}
              >
                Trouvez votre{" "}
                <span className="not-italic font-sans font-bold text-denim">
                  pièce
                </span>{" "}
                parfaite.
              </p>
              <a
                href="#vitrine"
                className="hero-pop group mt-5 items-center gap-2 rounded-full bg-denim px-8 py-3.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
                style={{ animationDelay: "1.6s" }}
              >
                Voir les créations
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* VITRINE — essai socle + survol, pas final */}
        <section id="vitrine" className="scroll-mt-20 bg-paper pb-8">
          <VitrineArc />
        </section>

        <Marches />
      </main>

      <ContactSection />
    </>
  );
}
