import "server-only";
import { neon } from "@neondatabase/serverless";

// Migration 2026-09-13 : SQLite local (fichier partagé avec la vitrine) ne
// survit pas de façon fiable sur Vercel serverless (filesystem éphémère,
// pas de garantie de persistance entre invocations) — remplacé par Postgres
// (Neon, intégration Vercel Storage). app/ et admin/ pointent sur la même
// base via DATABASE_URL, plus de fichier partagé. Schéma recréé si absent
// au démarrage (idempotent), pas d'outil de migration séparé.
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (ou POSTGRES_URL) manquant dans .env.local — voir Storage > Postgres sur Vercel.");
}

export const sql = neon(connectionString);

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
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
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
