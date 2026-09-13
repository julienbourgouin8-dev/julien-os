#!/usr/bin/env node
// Insère/actualise un produit directement en base (upsert sur `slug`) —
// utile pour poser un produit "template" avant d'avoir les vraies photos,
// sans passer par le formulaire admin.
//
// Usage : node scripts/seed-product.js path/to/product.json
// Le JSON doit correspondre aux colonnes de la table `products` (voir
// admin/lib/db/client.ts pour le schéma) : slug, name, category,
// description, price_cents, stock, images, status.
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");

process.loadEnvFile(path.join(__dirname, "..", ".env.local"));

const { neon } = require("@neondatabase/serverless");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/seed-product.js path/to/product.json");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL (ou POSTGRES_URL) manquant dans .env.local");
  process.exit(1);
}
const sql = neon(connectionString);

const product = JSON.parse(fs.readFileSync(file, "utf-8"));

(async () => {
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO products (id, slug, name, category, description, price_cents, stock, images, status, created_at, updated_at)
    VALUES (${randomUUID()}, ${product.slug}, ${product.name}, ${product.category}, ${product.description ?? ""}, ${product.price_cents ?? null}, ${product.stock ?? 0}, ${JSON.stringify(product.images ?? [])}, ${product.status ?? "draft"}, ${now}, ${now})
    ON CONFLICT (slug) DO UPDATE SET
      name = ${product.name}, category = ${product.category}, description = ${product.description ?? ""},
      price_cents = ${product.price_cents ?? null}, stock = ${product.stock ?? 0}, images = ${JSON.stringify(product.images ?? [])},
      status = ${product.status ?? "draft"}, updated_at = ${now}
    RETURNING *
  `;
  console.log("OK:", rows[0]);
})();
