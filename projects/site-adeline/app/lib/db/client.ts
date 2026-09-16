import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Migration 2026-09-13 : SQLite local (fichier partagé avec l'admin) ne
// survit pas de façon fiable sur Vercel serverless (filesystem éphémère,
// pas de garantie de persistance entre invocations) — remplacé par Postgres
// (Neon, intégration Vercel Storage). app/ et admin/ pointent sur la même
// base via DATABASE_URL, plus de fichier partagé. Schéma recréé si absent
// au démarrage (idempotent), pas d'outil de migration séparé pour deux
// tables.
//
// La connexion est créée paresseusement (au premier appel réel), pas à
// l'import du module : Next.js "collect page data" au build importe toutes
// les routes API pour analyse statique, donc une erreur ici au niveau
// module ferait planter le build entier même sur des pages qui ne touchent
// jamais la DB.
let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL (ou POSTGRES_URL) manquant — voir Storage > Postgres sur Vercel.");
    }
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSql()(strings, ...values)) as NeonQueryFunction<false, false>;

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
