import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getCartWeightGrams } from "@/lib/shipping";
import { getShippingQuotes, cheapestPointRelais, type ShippingQuote } from "@/lib/sendcloud/rates";

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

  // Légende affichée avant que le client choisisse un point précis : le
  // moins cher par transporteur (casier ou boutique, peu importe à ce
  // stade — le prix exact est retranché une fois un point réel choisi).
  const cheapestByCarrier: Record<string, ShippingQuote> = {};
  for (const q of quotes?.pointRelaisOptions ?? []) {
    const existing = cheapestByCarrier[q.carrierCode];
    if (!existing || q.priceCents < existing.priceCents) cheapestByCarrier[q.carrierCode] = q;
  }

  return NextResponse.json({
    domicile: quotes?.domicile ?? null,
    // Prix "à partir de" affiché avant que le client choisisse un point
    // précis — le prix exact est recalculé au moment du paiement une fois
    // le vrai point (et son type casier/boutique) connu.
    point_relais: quotes ? cheapestPointRelais(quotes) : null,
    pointRelaisByCarrier: cheapestByCarrier,
    // Liste complète (casier + boutique par transporteur) pour que la page
    // panier puisse afficher le vrai prix une fois un point précis choisi —
    // /api/checkout refait le même calcul côté serveur pour facturer.
    pointRelaisOptions: quotes?.pointRelaisOptions ?? [],
  });
}
