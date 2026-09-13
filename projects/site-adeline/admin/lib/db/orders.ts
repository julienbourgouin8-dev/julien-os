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

// Pas d'automatisation d'expédition (Sendcloud) pour l'instant — Adeline
// marque elle-même la commande une fois le colis parti.
export async function markOrderFulfilled(id: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE orders SET status = 'fulfilled', updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
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
