import { categories } from "@/lib/categories";

// Palette catégorielle validée (node scripts/validate_palette.js dans le
// skill dataviz — voir décision dans PROGRESS.md) : les tons "froids" bruts
// de la marque (denim #4f6c8f, teal #2f5f63) sont trop désaturés pour un
// usage catégoriel (échec "chroma floor" — se lisent gris, illisibles côte
// à côte). Ces 6 teintes sont des variantes plus saturées de la même
// famille (bleu-denim, vert-teal, + rust/mustard réels de la marque, +
// 2 teintes ajoutées pour couvrir les 6 catégories), dans un ORDRE FIXE —
// jamais recyclées — qui passe tous les checks CVD/contraste du skill.
// Assignation 1:1 avec l'ordre de app/lib/categories.ts, ne pas réordonner
// l'un sans l'autre.
const PALETTE = ["#3163a8", "#0e8a6e", "#ad4a34", "#d6a23c", "#7a4fa0", "#d64a6a"];

export const categoryColor: Record<string, string> = Object.fromEntries(
  categories.map((c, i) => [c.slug, PALETTE[i % PALETTE.length]]),
);
