import "server-only";
import postgres, { type Sql } from "postgres";

// Migration 2026-09-22 : Neon (driver HTTP @neondatabase/serverless) →
// Postgres standard auto-hébergé sur le VPS (Coolify) — voir
// app/lib/db/client.ts pour le détail du choix de driver (`postgres`,
// compatible tel quel avec l'usage `sql\`...\`` déjà écrit partout).
//
// Connexion paresseuse (au premier appel réel), pas à l'import du module —
// voir app/lib/db/client.ts pour le détail (build Vercel qui plantait sinon).
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
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_number TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_url TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_parcel_id TEXT`;
      // Traçabilité des actions admin sur des données personnelles (RGPD
      // Art. 5(2), accountability) — qui a fait quoi et quand, pas le
      // contenu complet.
      await sql`
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          detail TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL
        )
      `;
      // Anti-brute-force login admin (RGPD Art. 32). Un seul compte admin,
      // donc clé = l'email tenté plutôt qu'une IP.
      await sql`
        CREATE TABLE IF NOT EXISTS login_attempts (
          identifier TEXT PRIMARY KEY,
          fail_count INTEGER NOT NULL DEFAULT 0,
          locked_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}

// JSONB revient déjà parsé en objet/array JS avec le driver neon — mais on
// reste défensif au cas où une valeur arrive encore sous forme de chaîne.
export function parseJsonb<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}
