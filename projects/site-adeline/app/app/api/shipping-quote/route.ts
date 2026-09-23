import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getCartWeightGrams } from "@/lib/shipping";
import { getShippingQuotes, cheapestPointRelais } from "@/lib/sendcloud/rates";

type QuoteRequest = {
  items: { productId: string; quantity: number }[];
};

// Appelée depuis la page panier pour afficher un prix de livraison avant
// paiement — jamais utilisée pour facturer : /api/checkout refait le même
// calcul côté serveur au moment de créer la session Stripe.
export async function POST(request: NextRequest) {
  let body: QuoteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  const weightGrams = await getCartWeightGrams(body.items);
  const quotes = await getShippingQuotes(weightGrams);

  return NextResponse.json({
    domicile: quotes?.domicile ?? null,
    // Prix "à partir de" affiché avant que le client choisisse un point
    // précis — le prix par transporteur complet est renvoyé à côté pour que
    // la page panier facture le bon montant une fois un point choisi.
    point_relais: quotes ? cheapestPointRelais(quotes) : null,
    pointRelaisByCarrier: quotes?.pointRelaisByCarrier ?? {},
  });
}
