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

export async function getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE stripe_session_id = ${stripeSessionId}`) as Order[];
  return rows[0] ? fromRow(rows[0]) : null;
}

// Le webhook `charge.refunded` ne porte pas l'id de session Checkout, juste
// le PaymentIntent — seule clé disponible pour retrouver la commande.
export async function getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE stripe_payment_intent_id = ${paymentIntentId}`) as Order[];
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function createOrder(input: {
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  items: OrderItem[];
  totalCents: number;
  customerEmail: string | null;
  customerPhone?: string | null;
  shippingAddress: Record<string, unknown> | null;
  shippingMethod?: string | null;
  shippingOptionCode?: string | null;
  servicePoint?: Record<string, unknown> | null;
  weightGrams?: number | null;
}): Promise<Order> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO orders (id, stripe_session_id, stripe_payment_intent_id, status, items, total_cents, customer_email, customer_phone, shipping_address, shipping_method, shipping_option_code, service_point, weight_grams, created_at, updated_at)
    VALUES (${id}, ${input.stripeSessionId}, ${input.stripePaymentIntentId ?? null}, 'paid', ${JSON.stringify(input.items)}, ${input.totalCents}, ${input.customerEmail}, ${input.customerPhone ?? null}, ${input.shippingAddress ? JSON.stringify(input.shippingAddress) : null}, ${input.shippingMethod ?? null}, ${input.shippingOptionCode ?? null}, ${input.servicePoint ? JSON.stringify(input.servicePoint) : null}, ${input.weightGrams ?? null}, ${now}, ${now})
  `;
  return (await getOrderByStripeSessionId(input.stripeSessionId))!;
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

// Symétrique de cancelOrderAndRestock (admin/lib/db/orders.ts) : appelé
// depuis le webhook `charge.refunded` quand Adeline rembourse directement
// depuis le dashboard Stripe, pour que le stock et le statut se remettent à
// jour sans action manuelle. Idempotent (une commande déjà réglée —
// annulée ou remboursée — n'est jamais recréditée deux fois).
export async function refundOrderAndRestock(id: string): Promise<{ error?: string; notRestocked?: string[] }> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE id = ${id}`) as Order[];
  const order = rows[0] ? fromRow(rows[0]) : null;
  if (!order) return { error: "Commande introuvable." };
  if (order.status === "cancelled" || order.status === "refunded") return {};

  // Un produit supprimé depuis (pièce unique déjà vendue, retirée du
  // catalogue) n'a plus de ligne à créditer — sans ce contrôle, l'UPDATE ne
  // touche silencieusement rien. Ce chemin (webhook Stripe) n'a personne en
  // face pour voir un message, donc on remonte juste la liste à l'appelant
  // pour qu'il la journalise clairement.
  const notRestocked: string[] = [];
  for (const item of order.items) {
    const updated = (await sql`
      UPDATE products SET stock = stock + ${item.quantity}, updated_at = ${new Date().toISOString()}
      WHERE id = ${item.product_id}
      RETURNING id
    `) as { id: string }[];
    if (updated.length === 0) notRestocked.push(item.name);
  }
  await sql`UPDATE orders SET status = 'refunded', updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
  return notRestocked.length > 0 ? { notRestocked } : {};
}

// Anti-survente (TODO.md §6) : une seule requête atomique qui ne décrémente
// que si le stock restant suffit encore au moment du paiement — jamais au
// clic "acheter". `rowCount === 0` veut dire stock insuffisant (ou produit
// disparu) : à traiter par l'appelant (webhook), pas une erreur silencieuse.
export async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  await ensureSchema();
  // RETURNING id : le seul moyen fiable de savoir si l'UPDATE a touché une
  // ligne avec ce driver (pas de rowCount exposé en mode "simple query").
  const rows = (await sql`
    UPDATE products SET stock = stock - ${quantity}, updated_at = ${new Date().toISOString()}
    WHERE id = ${productId} AND stock >= ${quantity}
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}
