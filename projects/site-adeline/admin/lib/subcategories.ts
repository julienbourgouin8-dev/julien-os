// Sous-catégories par catégorie — source unique, copie identique dans
// admin/lib/subcategories.ts et app/lib/subcategories.ts. Le champ
// `products.subcategory` stocke le libellé tel quel. Listes
// relevées sur les feuilles manuscrites d'Adeline (2026-09-26) ; noms définitifs = ceux de la 1re feuille.
export const subcategoriesByCategory: Record<string, string[]> = {
  repas: ["Lunch box", "Range-couverts", "Porte-plat à tarte", "Sac à pain", "Panière à pain", "Set de table"],
  toilette: ["Trousse de toilette", "Trousse à maquillage", "Boîte à bijoux", "Lingettes", "Chouchou"],
  ecole: ["Protège-ardoise", "Protège-livre", "Trousses"],
  "sac-et-sacoche": ["Bananes", "Sac seau", "Sac à anses", "Sacoche ordinateur", "Sacoche tablette"],
  accessoires: ["Pieds au sec (sortie piscine)", "Bouillotte graines de lin", "Étui à lunettes"],
};

export function isValidSubcategory(category: string, sub: string): boolean {
  return (subcategoriesByCategory[category] ?? []).includes(sub);
}
