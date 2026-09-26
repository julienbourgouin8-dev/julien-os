import "server-only";
import { sql, ensureSchema, parseJsonb } from "./client";

export type ProductStatus = "draft" | "active" | "archived";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  collection_id: string | null;
  variant_label: string | null;
  description: string;
  price_cents: number | null;
  stock: number;
  images: string[];
  status: ProductStatus;
  weight_grams: number | null;
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

// Section "Nouveautés" de la home — les pièces les plus RÉCEMMENT créées
// (created_at, jamais updated_at qui bouge à chaque modif de stock/prix).
export async function getLatestActiveProducts(limit: number): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT ${limit}
  `) as Product[];
  return rows.map(fromRow);
}

// Utilisé par app/sitemap.ts pour lister toutes les fiches produit, toutes
// catégories confondues.
export async function getAllActiveProducts(): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE status = 'active' ORDER BY updated_at DESC
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

// Déclinaisons publiées d'une collection (voir admin/lib/db/products.ts) :
// la fiche produit affiche leurs miniatures et permet de passer de l'une à
// l'autre. Ordre = ordre de création.
export async function getCollectionVariants(collectionId: string): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE collection_id = ${collectionId} AND status = 'active' ORDER BY created_at ASC
  `) as Product[];
  return rows.map(fromRow);
}
