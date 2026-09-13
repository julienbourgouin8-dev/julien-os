import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createOrder, decrementStock, getOrderByStripeSessionId, type OrderItem } from "@/lib/db/orders";

// Source de vérité du paiement : Stripe appelle cette route, jamais le
// navigateur du client. Signature vérifiée avant toute lecture du contenu
// (constructEvent a besoin du corps brut, pas du JSON déjà parsé).
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Signature invalide : ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Idempotence : Stripe peut renvoyer le même événement plusieurs fois.
    const existing = await getOrderByStripeSessionId(session.id);
    if (!existing) {
      const items: OrderItem[] = session.metadata?.items ? JSON.parse(session.metadata.items) : [];

      // Anti-survente (TODO.md §6) : décrémenté ici, jamais au clic
      // "acheter" — un panier abandonné ne doit jamais bloquer de stock.
      for (const item of items) {
        await decrementStock(item.product_id, item.quantity);
      }

      await createOrder({
        stripeSessionId: session.id,
        items,
        totalCents: session.amount_total ?? 0,
        customerEmail: session.customer_details?.email ?? null,
        shippingAddress: session.collected_information?.shipping_details?.address
          ? { ...session.collected_information.shipping_details.address }
          : null,
      });
    }
  }

  return NextResponse.json({ received: true });
}
