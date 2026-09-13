// Aperçus posés avant que les vraies pièces existent en base. Purement
// local, jamais lu depuis la base SQLite : dès qu'un vrai produit actif existe
// dans une catégorie, getActiveProductsByCategory le retourne et cette
// entrée n'est plus jamais affichée pour cette catégorie — rien à retirer à
// la main plus tard.
export type DemoProduct = {
  slug: string;
  name: string;
  // Paragraphes séparés par des lignes vides ("\n\n") — rendu un <p> par
  // paragraphe sur la fiche produit.
  description: string;
  price_cents: number | null;
  images: string[];
  // "23 x 11 x 12 cm" par ex. — affiché sur la fiche produit si présent.
  dimensions?: string;
  // Doit correspondre à un libellé de lib/subcategories.ts — absent = pas
  // encore rattaché à une sous-catégorie précise.
  subcategory?: string;
  // false = vraies photos/description prêtes, juste le prix final qui
  // manque encore ("Sur devis" plutôt que "Bientôt disponible"). Par défaut
  // true (ancien comportement : rien de prêt du tout).
  comingSoon?: boolean;
};

export const demoProductsByCategory: Record<string, DemoProduct[]> = {
  toilette: [
    {
      slug: "trousse-de-toilette-corail",
      name: "Trousse de toilette corail",
      description:
        "Découvrez cette jolie trousse de toilette CréA'deline, à la fois pratique, élégante et originale.\n\n" +
        "Son joli coloris corail et son tissu nid d'abeille lui donnent un charme délicat et féminin. À l'intérieur, on découvre une doublure rouge corail fleurie, qui apporte une belle touche de couleur et de fantaisie.\n\n" +
        "Grâce à sa forme généreuse, à son fond suffisamment large, et à sa poche intérieure, elle permet de ranger facilement produits de toilette, maquillage et accessoires.\n\n" +
        "Sa structure souple lui permet également de s'adapter à son contenu. Un accessoire idéal pour la salle de bain, les voyages ou les week-ends.\n\n" +
        "Bref, une création féminine, pratique et unique, réalisée avec passion.",
      price_cents: 5000,
      dimensions: "23 x 11 x 12 cm",
      images: [
        "/products/toilette/trousse-toilette-corail-1.jpg",
        "/products/toilette/trousse-toilette-corail-2.jpg",
        "/products/toilette/trousse-toilette-corail-3.jpg",
        "/products/toilette/trousse-toilette-corail-4.jpg",
      ],
      comingSoon: false,
    },
  ],
};

export function getDemoProduct(category: string, slug: string): DemoProduct | null {
  return demoProductsByCategory[category]?.find((p) => p.slug === slug) ?? null;
}
