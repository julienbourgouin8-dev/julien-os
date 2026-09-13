// Sous-catégories par catégorie — affichage seulement pour l'instant (pas de
// champ "sous-catégorie" dans la table products, donc pas encore de filtre
// réel derrière). À ajouter au schéma le jour où on veut vraiment filtrer.
export const subcategoriesByCategory: Record<string, string[]> = {
  toilette: ["Trousse à maquillage", "Trousse à bijoux", "Lingettes", "Chouchou"],
};
