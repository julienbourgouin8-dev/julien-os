import "server-only";
import { getProductById } from "@/lib/db/products";

// Poids par défaut pour un produit sans poids renseigné en admin — évite de
// planter le calcul de port, mais reste approximatif (à compléter produit
// par produit dans l'admin pour un tarif exact).
const DEFAULT_ITEM_WEIGHT_GRAMS = 300;

export async function getCartWeightGrams(items: { productId: string; quantity: number }[]): Promise<number> {
  let total = 0;
  for (const { productId, quantity } of items) {
    const product = await getProductById(productId);
    total += (product?.weight_grams ?? DEFAULT_ITEM_WEIGHT_GRAMS) * quantity;
  }
  return total;
}

// Tant que Sendcloud n'est pas configuré (clés absentes, adresse expéditeur
// manquante) ou que l'appel échoue, la livraison reste gratuite plutôt que
// de bloquer le paiement — voir lib/sendcloud/rates.ts pour le calcul réel.
export const FALLBACK_SHIPPING_CENTS = 0;
