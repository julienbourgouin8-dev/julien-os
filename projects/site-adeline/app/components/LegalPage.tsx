import Header from "@/components/Header";

// Mise en page commune aux pages légales (mentions, confidentialité,
// cookies, CGV) — même trame que les pages boutique (Header + colonne
// centrée), mais un seul article de texte au lieu d'une grille produits.
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-14 sm:px-10">
        <h1 className="font-display text-3xl font-black text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-ink/40">
          Dernière mise à jour : {updated}
        </p>
        <div className="mt-10 space-y-6 text-sm leading-relaxed text-ink/80 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:first:mt-0 [&_strong]:text-ink [&_a]:text-denim [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </main>
    </div>
  );
}
