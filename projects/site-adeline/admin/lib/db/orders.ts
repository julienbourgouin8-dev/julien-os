import "server-only";
import { sql, ensureSchema, parseJsonb } from "./client";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

export type OrderItem = {
  product_id: string;
  name: string;
  price_cents: number;
  quantity: number;
};

export type Order = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  items: OrderItem[];
  total_cents: number;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  shipping_carrier: string | null;
  shipping_label_url: string | null;
  shipping_tracking_number: string | null;
  shipping_tracking_url: string | null;
  shipping_parcel_id: string | null;
  shipping_method: string | null;
  shipping_option_code: string | null;
  service_point: Record<string, unknown> | null;
  weight_grams: number | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: Order): Order {
  return {
    ...row,
    items: parseJsonb<OrderItem[]>(row.items),
    shipping_address: row.shipping_address ? parseJsonb<Record<string, unknown>>(row.shipping_address) : null,
    service_point: row.service_point ? parseJsonb<Record<string, unknown>>(row.service_point) : null,
  };
}

export async function getAllOrdersForAdmin(): Promise<Order[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders ORDER BY created_at DESC`) as Order[];
  return rows.map(fromRow);
}

export async function getOrderById(id: string): Promise<Order | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE id = ${id}`) as Order[];
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function updateOrderShipping(
  orderId: string,
  shipping: {
    carrier?: string;
    labelUrl?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    parcelId?: string | null;
  }
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE orders SET
      shipping_carrier = COALESCE(${shipping.carrier ?? null}, shipping_carrier),
      shipping_label_url = COALESCE(${shipping.labelUrl ?? null}, shipping_label_url),
      shipping_tracking_number = COALESCE(${shipping.trackingNumber ?? null}, shipping_tracking_number),
      shipping_tracking_url = COALESCE(${shipping.trackingUrl ?? null}, shipping_tracking_url),
      shipping_parcel_id = COALESCE(${shipping.parcelId ?? null}, shipping_parcel_id),
      updated_at = ${new Date().toISOString()}
    WHERE id = ${orderId}
  `;
}

export async function markOrderFulfilled(id: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE orders SET status = 'fulfilled', updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

// Annule une commande et remet en stock les articles qu'elle avait
// décrémentés (webhook Stripe, anti-survente) — sinon un article annulé
// reste indisponible à la vente indéfiniment. Idempotent : une commande
// déjà annulée OU déjà remboursée (webhook charge.refunded, voir
// app/lib/db/orders.ts refundOrderAndRestock) n'est jamais re-créditée
// une seconde fois.
export async function cancelOrderAndRestock(id: string): Promise<{ error?: string }> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE id = ${id}`) as Order[];
  const order = rows[0] ? fromRow(rows[0]) : null;
  if (!order) return { error: "Commande introuvable." };
  if (order.status === "cancelled" || order.status === "refunded") return {};

  for (const item of order.items) {
    await sql`
      UPDATE products SET stock = stock + ${item.quantity}, updated_at = ${new Date().toISOString()}
      WHERE id = ${item.product_id}
    `;
  }
  await sql`UPDATE orders SET status = 'cancelled', updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
  return {};
}

// Droit à l'effacement (RGPD Art. 17) : efface l'email et l'adresse de
// livraison, mais garde items/montant/date/statut — ce sont les pièces
// comptables (obligation légale de conservation, Art. 17(3)(b)), pas les
// coordonnées personnelles. Utilisé aussi par le script de purge
// périodique (voir scripts/purge-old-orders.js) et depuis la fiche
// commande admin.
export async function anonymizeOrder(id: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE orders SET customer_email = NULL, shipping_address = NULL, updated_at = ${new Date().toISOString()}
    WHERE id = ${id}
  `;
}

// Pour le script de purge : commandes dont les données personnelles n'ont
// pas encore été effacées et qui datent d'avant `beforeIso`.
export async function getOrdersWithPiiOlderThan(beforeIso: string): Promise<{ id: string; created_at: string }[]> {
  await ensureSchema();
  return (await sql`
    SELECT id, created_at FROM orders WHERE created_at < ${beforeIso} AND (customer_email IS NOT NULL OR shipping_address IS NOT NULL)
  `) as { id: string; created_at: string }[];
}
