import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import {
  createOrder,
  decrementStock,
  getOrderByStripeSessionId,
  updateOrderShipping,
  type OrderItem,
} from "@/lib/db/orders";
import { createParcelAndLabel, type ServicePointDelivery } from "@/lib/sendcloud/client";
import { getCartWeightGrams } from "@/lib/shipping";

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

      // Lecture robuste des coordonnées de livraison (selon version API Stripe)
      const shippingDetails =
        session.collected_information?.shipping_details ??
        (session as unknown as { shipping_details?: { name?: string | null; address?: Stripe.Address | null } })
          .shipping_details;
      const customerName = shippingDetails?.name ?? session.customer_details?.name ?? null;
      const shippingAddress = shippingDetails?.address ? { ...shippingDetails.address } : null;

      const weightGrams = await getCartWeightGrams(
        items.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
      );

      // Génération automatique d'étiquette Sendcloud / Colissimo — point
      // relais accepté avec juste ville + code postal (pas de rue précise,
      // le colis part vers `to_service_point`, voir lib/sendcloud/client.ts).
      const servicePoint: ServicePointDelivery | undefined = session.metadata?.servicePoint
        ? (() => {
            const sp = JSON.parse(session.metadata!.servicePoint!) as { id: number; postNumber?: string };
            return { id: sp.id, postNumber: sp.postNumber };
          })()
        : undefined;

      const order = await createOrder({
        stripeSessionId: session.id,
        items,
        totalCents: session.amount_total ?? 0,
        customerEmail: session.customer_details?.email ?? null,
        shippingAddress,
        shippingMethod: session.metadata?.shippingMethod ?? null,
        shippingOptionCode: session.metadata?.shippingOptionCode ?? null,
        servicePoint: servicePoint ?? null,
        weightGrams,
      });

      if (
        shippingAddress &&
        shippingAddress.postal_code &&
        shippingAddress.city &&
        (servicePoint || shippingAddress.line1)
      ) {
        try {
          const shippingResult = await createParcelAndLabel({
            orderId: order.id,
            customerEmail: order.customer_email,
            customerName,
            address: {
              name: customerName,
              line1: shippingAddress.line1,
              line2: shippingAddress.line2 ?? null,
              city: shippingAddress.city,
              postal_code: shippingAddress.postal_code,
              state: shippingAddress.state ?? null,
              country: shippingAddress.country ?? "FR",
            },
            totalCents: order.total_cents,
            weightKg: weightGrams / 1000,
            servicePoint,
            shippingOptionCode: session.metadata?.shippingOptionCode,
          });

          if (shippingResult.success) {
            await updateOrderShipping(order.id, {
              carrier: shippingResult.carrier,
              labelUrl: shippingResult.labelUrl,
              trackingNumber: shippingResult.trackingNumber,
              trackingUrl: shippingResult.trackingUrl,
              parcelId: shippingResult.parcelId,
            });
          } else {
            console.warn(`[Sendcloud] Génération automatique d'étiquette non complétée (${order.id}):`, shippingResult.error);
          }
        } catch (shippingErr) {
          console.error(`[Sendcloud] Erreur d'expédition pour la commande ${order.id}:`, shippingErr);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
