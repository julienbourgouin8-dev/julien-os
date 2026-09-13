import Link from "next/link";
import CartBadge from "@/components/CartBadge";

// Navbar réutilisable pour toutes les pages hors accueil (catégorie, fiche
// produit) — l'accueil garde sa propre nav superposée à la photo hero, pas
// celle-ci (sinon double nav empilée). Structure calquée sur la référence
// e-commerce que Julien a montrée (logo à gauche, liens au centre, panier à
// droite, bordure basse) mais avec les polices/couleurs de la marque
// (script + Fraunces + tokens ink/paper/line), jamais celles de l'exemple.
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-5 sm:px-10">
        <Link href="/" className="font-script text-3xl font-bold text-ink sm:text-4xl">
          CréA&apos;deline
        </Link>

        <nav className="hidden items-center justify-self-center gap-10 font-display text-sm font-medium uppercase tracking-[0.18em] text-ink sm:flex">
          <Link href="/#vitrine" className="transition-colors hover:text-rust">
            Créations
          </Link>
          <Link href="/#marches" className="transition-colors hover:text-rust">
            Marchés
          </Link>
          <Link href="/#contact" className="transition-colors hover:text-rust">
            Contact
          </Link>
        </nav>

        <CartBadge className="flex items-center gap-2 justify-self-end font-display text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-rust" />
      </div>
    </header>
  );
}
