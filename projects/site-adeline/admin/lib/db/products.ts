import "server-only";
import { sql, ensureSchema, parseJsonb } from "./client";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/uploads";

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

export type ProductInput = {
  name: string;
  category: string;
  description: string;
  price_cents: number | null;
  stock: number;
  images: string[];
  status: ProductStatus;
};

function fromRow(row: Product): Product {
  return { ...row, images: parseJsonb<string[]>(row.images) };
}

// U+0300–U+036F = marques diacritiques combinantes, produites par
// normalize("NFD") qui décompose "é" en "e" + accent séparé — on les
// retire pour obtenir un slug ASCII propre ("Pochette éventail" → "pochette-eventail").
const COMBINING_MARKS = /[̀-ͯ]/g;

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM products ORDER BY created_at DESC`) as Product[];
  return rows.map(fromRow);
}

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

export async function getProductById(id: string): Promise<Product | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM products WHERE id = ${id}`) as Product[];
  return rows[0] ? fromRow(rows[0]) : null;
}

// Génère un slug unique en suffixant -2, -3... si le nom existe déjà.
// `excludeId` permet d'éditer un produit sans se bloquer sur son propre slug.
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  for (;;) {
    const rows = excludeId
      ? await sql`SELECT 1 FROM products WHERE slug = ${slug} AND id != ${excludeId}`
      : await sql`SELECT 1 FROM products WHERE slug = ${slug}`;
    if ((rows as unknown[]).length === 0) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(input.name);
  const now = new Date().toISOString();
  await sql`
    INSERT INTO products (id, slug, name, category, description, price_cents, stock, images, status, created_at, updated_at)
    VALUES (${id}, ${slug}, ${input.name}, ${input.category}, ${input.description}, ${input.price_cents}, ${input.stock}, ${JSON.stringify(input.images)}, ${input.status}, ${now}, ${now})
  `;
  return (await getProductById(id))!;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  await ensureSchema();
  const slug = await uniqueSlug(input.name, id);
  const now = new Date().toISOString();
  await sql`
    UPDATE products SET slug = ${slug}, name = ${input.name}, category = ${input.category}, description = ${input.description},
      price_cents = ${input.price_cents}, stock = ${input.stock}, images = ${JSON.stringify(input.images)}, status = ${input.status}, updated_at = ${now}
    WHERE id = ${id}
  `;
  return (await getProductById(id))!;
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await getProductById(id);
  if (product) {
    await Promise.all(product.images.map((url) => deleteUploadedFile(url)));
  }
  await sql`DELETE FROM products WHERE id = ${id}`;
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await saveUploadedFile(file));
  }
  return urls;
}
