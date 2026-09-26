import "server-only";
import { sql, ensureSchema, parseJsonb } from "./client";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/uploads";

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

export type ProductInput = {
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
async function uniqueSlug(name: string, excludeId?: string, variantLabel?: string | null): Promise<string> {
  const base = slugify(variantLabel ? `${name} ${variantLabel}` : name);
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
  const slug = await uniqueSlug(input.name, undefined, input.variant_label);
  const now = new Date().toISOString();
  await sql`
    INSERT INTO products (id, slug, name, category, subcategory, collection_id, variant_label, description, price_cents, stock, images, status, weight_grams, created_at, updated_at)
    VALUES (${id}, ${slug}, ${input.name}, ${input.category}, ${input.subcategory}, ${input.collection_id}, ${input.variant_label}, ${input.description}, ${input.price_cents}, ${input.stock}, ${JSON.stringify(input.images)}, ${input.status}, ${input.weight_grams}, ${now}, ${now})
  `;
  return (await getProductById(id))!;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  await ensureSchema();
  const slug = await uniqueSlug(input.name, id, input.variant_label);
  const now = new Date().toISOString();
  await sql`
    UPDATE products SET slug = ${slug}, name = ${input.name}, category = ${input.category}, subcategory = ${input.subcategory}, variant_label = ${input.variant_label}, description = ${input.description},
      price_cents = ${input.price_cents}, stock = ${input.stock}, images = ${JSON.stringify(input.images)}, status = ${input.status},
      weight_grams = ${input.weight_grams}, updated_at = ${now}
    WHERE id = ${id}
  `;
  const updated = (await getProductById(id))!;
  if (updated.collection_id) await syncCollectionSharedFields(updated);
  return updated;
}

// ─── Collections ─────────────────────────────────────────────────────────
// Une collection = plusieurs lignes `products` (une par déclinaison : son
// stock, ses photos, son URL, son libellé) qui partagent un collection_id.
// Catégorie, sous-catégorie, description, prix et poids sont COMMUNS :
// modifier l'un des membres recopie ces champs sur les autres. Le statut
// (brouillon/publié) et le nom (affiché sous « Modèles ») restent propres à
// chaque déclinaison.
export async function getCollectionMembers(collectionId: string): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE collection_id = ${collectionId} ORDER BY created_at ASC
  `) as Product[];
  return rows.map(fromRow);
}

async function syncCollectionSharedFields(source: Product): Promise<void> {
  const members = await getCollectionMembers(source.collection_id!);
  const now = new Date().toISOString();
  for (const m of members) {
    await sql`
      UPDATE products SET category = ${source.category},
        subcategory = ${source.subcategory}, description = ${source.description},
        price_cents = ${source.price_cents}, weight_grams = ${source.weight_grams}, updated_at = ${now}
      WHERE id = ${m.id}
    `;
  }
}

// Renvoie l'identifiant de collection du produit, en le créant (et en
// l'attribuant au produit) s'il n'en avait pas encore.
export async function ensureCollection(productId: string): Promise<string> {
  const product = await getProductById(productId);
  if (!product) throw new Error("Produit introuvable.");
  if (product.collection_id) return product.collection_id;
  const collectionId = crypto.randomUUID();
  await sql`UPDATE products SET collection_id = ${collectionId} WHERE id = ${productId}`;
  await syncCollectionSharedFields({ ...product, collection_id: collectionId });
  return collectionId;
}

// Rattache un produit existant à la collection de `targetId` : il adopte les
// champs communs de la collection ; son ancien nom devient son libellé.
export async function attachToCollection(productId: string, targetId: string): Promise<void> {
  if (productId === targetId) return;
  const collectionId = await ensureCollection(targetId);
  const product = await getProductById(productId);
  if (!product) throw new Error("Produit introuvable.");
  await sql`
    UPDATE products SET collection_id = ${collectionId} WHERE id = ${productId}
  `;
  const target = (await getProductById(targetId))!;
  await syncCollectionSharedFields(target);
}

export async function detachFromCollection(productId: string): Promise<void> {
  const product = await getProductById(productId);
  if (!product) return;
  await sql`
    UPDATE products SET collection_id = NULL, variant_label = NULL, updated_at = ${new Date().toISOString()}
    WHERE id = ${productId}
  `;
}

export async function getAttachableProducts(excludeId: string, collectionId: string | null): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM products WHERE id != ${excludeId} AND (collection_id IS NULL ${collectionId ? sql`OR collection_id != ${collectionId}` : sql``}) ORDER BY name ASC
  `) as Product[];
  return rows.map(fromRow);
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
