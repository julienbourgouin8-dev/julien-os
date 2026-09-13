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
  created_at: string;
  updated_at: string;
};

function fromRow(row: Order): Order {
  return {
    ...row,
    items: parseJsonb<OrderItem[]>(row.items),
    shipping_address: row.shipping_address ? parseJsonb<Record<string, unknown>>(row.shipping_address) : null,
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
}): Promise<Order> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO orders (id, stripe_session_id, status, items, total_cents, customer_email, shipping_address, created_at, updated_at)
    VALUES (${id}, ${input.stripeSessionId}, 'paid', ${JSON.stringify(input.items)}, ${input.totalCents}, ${input.customerEmail}, ${input.shippingAddress ? JSON.stringify(input.shippingAddress) : null}, ${now}, ${now})
  `;
  return (await getOrderByStripeSessionId(input.stripeSessionId))!;
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
