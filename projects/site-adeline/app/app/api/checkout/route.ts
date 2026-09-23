import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getProductById } from "@/lib/db/products";
import { getCartWeightGrams, FALLBACK_SHIPPING_CENTS } from "@/lib/shipping";
import { getShippingQuotes, type ShippingMethod } from "@/lib/sendcloud/rates";
import { getStripe } from "@/lib/stripe/client";
import { SITE_URL } from "@/lib/site";

type ServicePoint = {
  id: number;
  postNumber?: string;
  name?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
};

type CheckoutRequest = {
  items: { productId: string; quantity: number }[];
  shippingMethod?: ShippingMethod;
  servicePoint?: ServicePoint;
};

// Construit la session Stripe Checkout entièrement depuis notre propre DB —
// le panier client n'envoie que des productId + quantités, jamais un prix.
// Vérifie aussi le stock ici (soft check, avant Stripe) pour ne pas envoyer
// une cliente payer une pièce déjà épuisée ; la vérité finale reste la
// décrémentation atomique dans le webhook (anti-survente, voir lib/db/orders.ts).
export async function POST(request: NextRequest) {
  let body: CheckoutRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  const origin = SITE_URL;
  const lineItems: {
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; images: string[] };
    };
    quantity: number;
  }[] = [];

  // Snapshot des lignes validées (id + prix + qty au moment du paiement) —
  // passé en metadata Stripe pour que le webhook reconstruise la commande
  // et décrémente le stock sans avoir à faire confiance à autre chose que
  // ce qu'on a nous-mêmes vérifié ici.
  const orderItems: { product_id: string; name: string; price_cents: number; quantity: number }[] = [];

  for (const { productId, quantity } of body.items) {
    if (typeof productId !== "string" || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Article de panier invalide." }, { status: 400 });
    }
    const product = await getProductById(productId);
    if (!product || product.price_cents === null) {
      return NextResponse.json({ error: `Pièce indisponible : ${productId}` }, { status: 400 });
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: `Stock insuffisant pour "${product.name}".` }, { status: 400 });
    }
    const image = product.images[0];
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: product.price_cents,
        product_data: {
          name: product.name,
          images: image ? [image.startsWith("http") ? image : `${origin}${image}`] : [],
        },
      },
      quantity,
    });
    orderItems.push({ product_id: product.id, name: product.name, price_cents: product.price_cents, quantity });
  }

  // Le prix de port n'est jamais fait confiance au client (même logique que
  // les prix produits ci-dessus) : recalculé ici à partir du poids réel des
  // articles et de la méthode choisie sur la page panier.
  const metadata: Record<string, string> = { items: JSON.stringify(orderItems) };

  if (body.shippingMethod === "domicile" || body.shippingMethod === "point_relais") {
    const weightGrams = await getCartWeightGrams(body.items);
    const quotes = await getShippingQuotes(weightGrams);
    const quote = quotes?.find((q) => q.method === body.shippingMethod);

    if (body.shippingMethod === "point_relais" && !body.servicePoint) {
      return NextResponse.json({ error: "Choisis un point relais avant de payer." }, { status: 400 });
    }

    if (quote) {
      lineItems.push({
        price_data: {
          currency: "eur",
          unit_amount: quote.priceCents,
          product_data: { name: quote.label, images: [] },
        },
        quantity: 1,
      });
      metadata.shippingMethod = body.shippingMethod;
      if (body.shippingMethod === "point_relais" && body.servicePoint) {
        metadata.servicePoint = JSON.stringify(body.servicePoint);
      }
    } else if (FALLBACK_SHIPPING_CENTS > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          unit_amount: FALLBACK_SHIPPING_CENTS,
          product_data: { name: "Livraison", images: [] },
        },
        quantity: 1,
      });
    }
  } else if (FALLBACK_SHIPPING_CENTS > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: FALLBACK_SHIPPING_CENTS,
        product_data: { name: "Livraison", images: [] },
      },
      quantity: 1,
    });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ["FR"] },
    success_url: `${origin}/commande/confirmee?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/panier?checkout=annule`,
    metadata,
  });

  return NextResponse.json({ url: session.url });
}
