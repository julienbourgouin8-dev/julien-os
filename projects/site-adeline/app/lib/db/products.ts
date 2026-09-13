import "server-only";
import { sql, ensureSchema, parseJsonb } from "./client";

export type ProductStatus = "draft" | "active" | "archived";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price_cents: number | null;
  stock: number;
  images: string[];
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

function fromRow(row: Product): Product {
  return { ...row, images: parseJsonb<string[]>(row.images) };
}

// Lecture seule : la gestion des produits (création, édition, suppression,
// upload) vit dans l'app admin séparée (projects/site-adeline/admin), qui
// pointe sur la même base Postgres. Ce site public ne fait que lire les
// produits publiés pour la boutique.

export async function getActiveProductsByCategory(category: string): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE category = ${category} AND status = 'active' ORDER BY created_at DESC
  `) as Product[];
  return rows.map(fromRow);
}

export async function getProductBySlug(category: string, slug: string): Promise<Product | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE category = ${category} AND slug = ${slug} AND status = 'active'
  `) as Product[];
  return rows[0] ? fromRow(rows[0]) : null;
}

// Utilisé par le checkout (app/api/checkout/route.ts) pour recalculer prix
// et stock depuis la DB à partir des productId envoyés par le panier client
// — jamais confiance dans un prix venu du navigateur.
export async function getProductById(id: string): Promise<Product | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE id = ${id} AND status = 'active'
  `) as Product[];
  return rows[0] ? fromRow(rows[0]) : null;
}
