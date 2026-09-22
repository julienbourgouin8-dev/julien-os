"use server";

import { revalidatePath } from "next/cache";
import { markOrderFulfilled, anonymizeOrder, getOrderById, updateOrderShipping } from "@/lib/db/orders";
import { createParcelAndLabel } from "@/lib/sendcloud/client";
import { logAction } from "@/lib/audit";

export async function markOrderFulfilledAction(id: string): Promise<void> {
  await markOrderFulfilled(id);
  await logAction("order_fulfilled", id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function generateShippingLabelAction(id: string): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderById(id);
  if (!order) {
    return { success: false, error: "Commande introuvable." };
  }

  const addr = order.shipping_address as {
    line1?: string;
    line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    name?: string;
  } | null;

  if (!addr || !addr.line1 || !addr.postal_code || !addr.city) {
    return { success: false, error: "Adresse de livraison incomplète ou absente." };
  }

  const result = await createParcelAndLabel({
    orderId: order.id,
    customerEmail: order.customer_email,
    customerName: addr.name || null,
    address: {
      line1: addr.line1,
      line2: addr.line2 ?? null,
      postal_code: addr.postal_code,
      city: addr.city,
      country: addr.country ?? "FR",
    },
    totalCents: order.total_cents,
    weightKg: 0.5,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Échec de génération d'étiquette Sendcloud." };
  }

  await updateOrderShipping(order.id, {
    carrier: result.carrier,
    labelUrl: result.labelUrl,
    trackingNumber: result.trackingNumber,
    trackingUrl: result.trackingUrl,
    parcelId: result.parcelId,
  });

  await logAction("shipping_label_generated", id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { success: true };
}

// RGPD Art. 17 (droit à l'effacement) : bouton pour répondre à une demande
// cliente sans attendre la purge périodique.
export async function anonymizeOrderAction(id: string): Promise<void> {
  await anonymizeOrder(id);
  await logAction("order_anonymized", id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}
