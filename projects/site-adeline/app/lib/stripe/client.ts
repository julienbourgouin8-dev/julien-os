import "server-only";
import Stripe from "stripe";

// Instancié paresseusement (pas au chargement du module) : permet à l'app de
// démarrer même sans clé Stripe encore renseignée (dev en cours), l'erreur
// n'arrive qu'au moment réel d'un appel Stripe (checkout / webhook).
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquant dans app/.env.local");
    stripe = new Stripe(key);
  }
  return stripe;
}
