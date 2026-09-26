import type { Product } from "@/lib/db/products";

// Une collection = plusieurs pièces publiées (une ligne `products` chacune)
// qui partagent un collection_id : dans les listes elles ne forment qu'UNE
// carte. `product` = la pièce qui porte le lien (la première en stock, sinon
// la première), `images` = la photo principale de chaque déclinaison, pour
// le diaporama en fondu.
export type ProductGroup = {
  product: Product;
  variants: Product[];
  images: string[];
  soldOut: boolean;
};

export function groupByCollection(products: Product[]): ProductGroup[] {
  const groups: ProductGroup[] = [];
  const byCollection = new Map<string, ProductGroup>();

  for (const p of products) {
    if (!p.collection_id) {
      groups.push({ product: p, variants: [p], images: p.images, soldOut: p.stock <= 0 });
      continue;
    }
    const existing = byCollection.get(p.collection_id);
    if (existing) {
      existing.variants.push(p);
      continue;
    }
    const group: ProductGroup = { product: p, variants: [p], images: [], soldOut: false };
    byCollection.set(p.collection_id, group);
    groups.push(group);
  }

  for (const g of byCollection.values()) {
    // ordre stable des déclinaisons : création (les listes arrivent triées
    // du plus récent au plus ancien).
    g.variants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    g.product = g.variants.find((v) => v.stock > 0) ?? g.variants[0];
    g.images = g.variants.map((v) => v.images[0]).filter((u): u is string => Boolean(u));
    g.soldOut = g.variants.every((v) => v.stock <= 0);
  }
  return groups;
}
