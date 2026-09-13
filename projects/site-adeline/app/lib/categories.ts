// Taxonomie retravaillée avec Adeline le 2026-08-18 (remplace l'ancienne
// taxonomie issue des légendes Facebook) — source unique partagée entre
// l'admin (formulaire produit) et le catalogue public (/boutique/[category]).
// Ne pas en inventer d'autres sans repasser par ce fichier.
export type Category = {
  slug: string;
  label: string;
};

export const categories: Category[] = [
  { slug: "sac-et-sacoche", label: "Sac et sacoche" },
  { slug: "ecole", label: "École" },
  { slug: "toilette", label: "Toilette" },
  { slug: "accessoires", label: "Accessoires" },
  { slug: "repas", label: "Repas" },
  { slug: "pieces-cadeaux", label: "Pièces cadeaux" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryLabel(slug: string): string {
  return getCategoryBySlug(slug)?.label ?? slug;
}
