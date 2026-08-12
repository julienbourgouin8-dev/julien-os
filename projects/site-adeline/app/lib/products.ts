export type Product = {
  slug: string;
  name: string;
  tag: string;
  image: string;
  price?: string;
  description: string;
};

// Sélection resserrée — les meilleures pièces seulement. Le reste des
// photos scrappées vit dans assets/facebook/selected pour retouche future.
export const featured: Product[] = [
  {
    slug: "pochette-tablette",
    name: "Pochette tablette",
    tag: "Fleurs bleues",
    image: "/brand/hero.jpg",
    description:
      "Doublée, fermeture zippée, portée en bandoulière. Le tissu fleuri contraste avec une base unie pour un rendu net.",
  },
  {
    slug: "sac-quilte-fleurs",
    name: "Sac matelassé fleuri",
    tag: "Piqué main",
    image: "/products/sac-quilte-fleurs-2.jpg",
    description:
      "Matelassage fait main, anse tissée, doublure assortie. Une pièce qui prend le temps qu'il faut.",
  },
  {
    slug: "sac-cabas-tour-eiffel",
    name: "Sac cabas, anses cuir",
    tag: "Paris",
    image: "/products/sac-cabas-cuir-rouge.jpg",
    description:
      "Toile imprimée, finitions cuir rouge, poignées rigides. Un même tissu, décliné aussi en sacoche — voir ci-dessous.",
  },
  {
    slug: "sacoche-book",
    name: "Sacoche \"book\"",
    tag: "Même tissu, autre usage",
    image: "/products/sacoche-book.jpg",
    description:
      "La version compacte du même imprimé, pensée pour transporter un ordinateur ou des documents.",
  },
  {
    slug: "trousse-maquillage",
    name: "Trousse maquillage",
    tag: "Pièce à l'unité",
    image: "/products/trousse-maquillage-15e.jpg",
    price: "15 €",
    description:
      "Format compact, fermeture éclair, doublure résistante. La pièce la plus demandée sur les marchés.",
  },
  {
    slug: "pochette-pied-de-poule",
    name: "Pochette pied-de-poule",
    tag: "Sur mesure",
    image: "/products/sac-motif-pied-de-poule.jpg",
    description:
      "Rabat boutonné, tissu à carreaux, doublure jaune moutarde. Élégante et discrète.",
  },
];

export type Fabric = {
  name: string;
  color: string;
  image: string;
};

// Pas de composition matière trouvée sur Facebook (aucun post ne la
// mentionne) — uniquement couleur + motif, lus sur les photos.
export const fabrics: Fabric[] = [
  { name: "Fleuri", color: "Bleu marine", image: "/products/swatch-fleuri-teal.jpg" },
  { name: "Tour Eiffel", color: "Noir & rose", image: "/products/swatch-eiffel.jpg" },
  { name: "Éventail", color: "Gris perle", image: "/products/swatch-eventail.jpg" },
  { name: "Pied-de-poule", color: "Camel", image: "/products/swatch-pied-de-poule.jpg" },
];
