import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import {
  createOrder,
  decrementStock,
  getOrderByStripeSessionId,
  getOrderByPaymentIntentId,
  refundOrderAndRestock,
  updateOrderShipping,
  type OrderItem,
} from "@/lib/db/orders";
import { createParcelAndLabel, type ServicePointDelivery } from "@/lib/sendcloud/client";
import { getCartWeightGrams } from "@/lib/shipping";
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import { sendNewOrderNotification } from "@/lib/email/newOrderNotification";

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
      // Collecté via phone_number_collection sur la session Checkout —
      // requis par Mondial Relay pour la livraison à domicile, voir
      // lib/sendcloud/client.ts.
      const customerPhone = session.customer_details?.phone ?? null;

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

      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

      const order = await createOrder({
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        items,
        totalCents: session.amount_total ?? 0,
        customerEmail: session.customer_details?.email ?? null,
        customerPhone,
        shippingAddress,
        shippingMethod: session.metadata?.shippingMethod ?? null,
        shippingOptionCode: session.metadata?.shippingOptionCode ?? null,
        servicePoint: servicePoint ?? null,
        weightGrams,
      });

      // Rempli par la génération d'étiquette ci-dessous si elle réussit à
      // temps — l'email de confirmation part juste après, avec ou sans lien
      // de suivi selon que Sendcloud a répondu à temps.
      let trackingUrl: string | null = null;
      let trackingNumber: string | null = null;

      if (
        session.metadata?.shippingMethod !== "retrait" &&
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
              phone: customerPhone,
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
            trackingUrl = shippingResult.trackingUrl ?? null;
            trackingNumber = shippingResult.trackingNumber ?? null;
          } else {
            console.warn(`[Sendcloud] Génération automatique d'étiquette non complétée (${order.id}):`, shippingResult.error);
          }
        } catch (shippingErr) {
          console.error(`[Sendcloud] Erreur d'expédition pour la commande ${order.id}:`, shippingErr);
        }
      }

      try {
        await sendOrderConfirmationEmail({
          customerEmail: order.customer_email,
          customerName,
          orderId: order.id,
          items,
          totalCents: order.total_cents,
          shippingMethod: session.metadata?.shippingMethod ?? null,
          trackingUrl,
          trackingNumber,
        });
      } catch (emailErr) {
        // Jamais bloquant : une commande payée et bien enregistrée ne doit
        // jamais échouer à cause d'un souci d'envoi d'email.
        console.error(`[Email] Échec de l'envoi de confirmation pour la commande ${order.id}:`, emailErr);
      }

      try {
        await sendNewOrderNotification({
          orderId: order.id,
          items,
          totalCents: order.total_cents,
          shippingMethod: session.metadata?.shippingMethod ?? null,
          customerEmail: order.customer_email,
        });
      } catch (notifErr) {
        console.error(`[Email] Échec de la notification nouvelle commande ${order.id}:`, notifErr);
      }
    }
  }

  // Remboursement fait directement depuis le dashboard Stripe (pas via notre
  // admin) : sans ce handler, la commande restait marquée "payée" et
  // l'article ne revenait jamais en stock — bug remonté par Julien après le
  // premier vrai test de remboursement (voir PROGRESS.md 2026-09-23).
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : (charge.payment_intent?.id ?? null);

    if (paymentIntentId) {
      const order = await getOrderByPaymentIntentId(paymentIntentId);
      if (order) {
        const result = await refundOrderAndRestock(order.id);
        if (result.error) {
          console.error(`[Stripe] Échec de la remise en stock après remboursement (${order.id}):`, result.error);
        }
      } else {
        console.warn(`[Stripe] charge.refunded reçu sans commande correspondante (payment_intent ${paymentIntentId}).`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
