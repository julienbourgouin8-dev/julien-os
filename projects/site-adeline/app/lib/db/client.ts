import "server-only";
import postgres, { type Sql } from "postgres";

// Migration 2026-09-22 : Neon (driver HTTP @neondatabase/serverless) →
// Postgres standard auto-hébergé sur le VPS (Coolify), plus de proxy HTTP
// Neon disponible — driver TCP classique avec pool de connexions (`postgres`,
// alias porsager/postgres, choisi car son API "tagged template" est
// compatible telle quelle avec l'usage `sql\`...\`` déjà écrit dans tout le
// code : products.ts, orders.ts, audit.ts, rate-limit.ts n'ont pas eu besoin
// de changer).
//
// La connexion est créée paresseusement (au premier appel réel), pas à
// l'import du module : Next.js "collect page data" au build importe toutes
// les routes API pour analyse statique, donc une erreur ici au niveau
// module ferait planter le build entier même sur des pages qui ne touchent
// jamais la DB.
let sqlInstance: Sql | null = null;

function getSql(): Sql {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL (ou POSTGRES_URL) manquant.");
    }
    sqlInstance = postgres(connectionString);
  }
  return sqlInstance;
}

export const sql: Sql = ((strings: TemplateStringsArray, ...values: any[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getSql() as any)(strings, ...values)) as Sql;

let schemaReady: Promise<void> | null = null;

// Chaque cold start serverless relance ça une fois (mémoïsé par instance) —
// coût négligeable, CREATE TABLE IF NOT EXISTS est idempotent.
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          price_cents INTEGER,
          stock INTEGER NOT NULL DEFAULT 0,
          images JSONB NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          stripe_session_id TEXT UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending',
          items JSONB NOT NULL DEFAULT '[]',
          total_cents INTEGER NOT NULL,
          customer_email TEXT,
          shipping_address JSONB,
          shipping_carrier TEXT,
          shipping_label_url TEXT,
          shipping_tracking_number TEXT,
          shipping_tracking_url TEXT,
          shipping_parcel_id TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
      // Migrations progressives idempotentes pour bases déjà existantes
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_number TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_url TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_parcel_id TEXT`;
      // Nécessaire pour régénérer une étiquette (bouton manuel admin) avec
      // le même service que celui payé par le client — l'API Sendcloud v3
      // exige un shipping_option_code explicite, ne le devine plus seule.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option_code TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_point JSONB`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_grams INTEGER`;
      // Requis par Mondial Relay pour la livraison à domicile — sans lui,
      // l'annonce du colis échoue côté transporteur (constaté en test
      // réel). Collecté via Stripe (phone_number_collection), stocké ici
      // pour que le bouton manuel "Générer l'étiquette" en admin puisse
      // aussi le renvoyer, pas seulement la première tentative du webhook.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT`;
      // Nécessaire pour retrouver une commande depuis un webhook
      // `charge.refunded` — cet événement ne porte pas l'id de session
      // Checkout, seulement le PaymentIntent (voir lib/db/orders.ts).
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT`;
      // Poids en grammes, nécessaire pour demander un tarif de port réel à
      // l'API Sendcloud (voir lib/shipping.ts) — nullable, les produits déjà
      // créés n'en ont pas encore, à compléter en admin.
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams INTEGER`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT`;
      // Collections : plusieurs pièces (une ligne chacune, avec son stock, ses
      // photos, son URL) regroupées sous un même collection_id — voir
      // admin/lib/db/products.ts (synchro des champs communs).
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id TEXT`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_label TEXT`;
      // Même table que admin/lib/db/client.ts (schéma dupliqué, gérée
      // uniquement côté admin — voir ce fichier pour le détail et le seed).
      await sql`
        CREATE TABLE IF NOT EXISTS markets (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          place TEXT NOT NULL,
          event_date DATE,
          image TEXT,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}

// JSONB revient déjà parsé en objet/array JS avec le driver neon — mais on
// reste défensif au cas où une valeur arrive encore sous forme de chaîne
// (ex. ancienne ligne écrite différemment).
export function parseJsonb<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}
