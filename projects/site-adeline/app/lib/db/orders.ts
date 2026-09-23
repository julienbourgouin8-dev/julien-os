import "server-only";
import { sql, ensureSchema, parseJsonb } from "./client";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export type OrderItem = {
  product_id: string;
  name: string;
  price_cents: number;
  quantity: number;
};

export type Order = {
  id: string;
  stripe_session_id: string | null;
  status: OrderStatus;
  items: OrderItem[];
  total_cents: number;
  customer_email: string | null;
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

export async function createOrder(input: {
  stripeSessionId: string;
  items: OrderItem[];
  totalCents: number;
  customerEmail: string | null;
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
    INSERT INTO orders (id, stripe_session_id, status, items, total_cents, customer_email, shipping_address, shipping_method, shipping_option_code, service_point, weight_grams, created_at, updated_at)
    VALUES (${id}, ${input.stripeSessionId}, 'paid', ${JSON.stringify(input.items)}, ${input.totalCents}, ${input.customerEmail}, ${input.shippingAddress ? JSON.stringify(input.shippingAddress) : null}, ${input.shippingMethod ?? null}, ${input.shippingOptionCode ?? null}, ${input.servicePoint ? JSON.stringify(input.servicePoint) : null}, ${input.weightGrams ?? null}, ${now}, ${now})
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
