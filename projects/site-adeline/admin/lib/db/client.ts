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
      // Nécessaire pour régénérer une étiquette (bouton manuel admin) avec
      // le même service que celui payé par le client — l'API Sendcloud v3
      // exige un shipping_option_code explicite, ne le devine plus seule.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option_code TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_point JSONB`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_grams INTEGER`;
      // Requis par Mondial Relay pour la livraison à domicile — voir
      // app/lib/db/client.ts (même migration, dupliquée dans les deux apps).
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT`;
      // Voir app/lib/db/client.ts (même migration, dupliquée) : nécessaire au
      // webhook `charge.refunded` pour retrouver la commande.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT`;
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
      // Identifiants admin déplacés des variables d'env (ADMIN_EMAIL/
      // ADMIN_PASSWORD_HASH, figées, nécessitaient de redéployer pour
      // changer) vers la DB, pour qu'Adeline puisse changer son mot de
      // passe elle-même. Une seule ligne (id fixe). `recovery_email` sert
      // UNIQUEMENT au lien de réinitialisation — distinct de `email`
      // (l'identifiant de connexion, ex. "Adeline", pas forcément une
      // vraie adresse) : envoyer un lien sensible au mauvais endroit
      // serait pire que ne pas en envoyer du tout.
      await sql`
        CREATE TABLE IF NOT EXISTS admin_credentials (
          id TEXT PRIMARY KEY DEFAULT 'default',
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          recovery_email TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
      // Plusieurs comptes admin depuis le 2026-09-24 (Adeline + Julien) :
      // `email` (l'identifiant de connexion) doit être unique sans
      // distinction de casse, sinon "Adeline" et "adeline" pourraient
      // coexister comme deux comptes différents.
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS admin_credentials_email_lower_idx ON admin_credentials (lower(email))`;
      // Réinitialisation de mot de passe par email. Seul le hash du token
      // est stocké (même logique qu'un mot de passe) : un accès en
      // lecture à la DB seule ne permet pas de forger un lien valide.
      await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token_hash TEXT PRIMARY KEY,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL
        )
      `;
      // Quel compte ce token concerne — nécessaire depuis qu'il y a
      // plusieurs comptes admin : sans ça, un lien de réinitialisation
      // changerait le mot de passe du mauvais compte.
      await sql`ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`;
      // Marchés/salons affichés section "Nos marchés" du site (voir
      // app/components/Marches.tsx) — gérés depuis l'admin depuis le
      // 2026-09-28 (avant : tableau en dur dans le composant). `lat`/`lng`
      // sont géocodés automatiquement depuis `place` à la création/édition
      // (voir admin/lib/geocode.ts) : la carte du site en a besoin pour
      // placer le pin, mais on ne demande pas à Julien/Adeline de les saisir
      // à la main.
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
      // Seed unique des 2 marchés de Noël déjà en dur sur le site
      // (2026-09-28) pour qu'ils apparaissent d'emblée dans l'admin au lieu
      // de partir d'une liste vide — seulement si la table est encore vide,
      // pour ne jamais les faire réapparaître après suppression.
      await sql`
        INSERT INTO markets (id, title, place, event_date, image, lat, lng, created_at, updated_at)
        SELECT * FROM (VALUES
          ('4e5e6a9e-0f5a-4a2a-9c8a-6b1b6f6a0e01', 'Marché de Noël (APE)', 'Balzac (16430)', DATE '2026-12-06', NULL::TEXT, 45.715981::DOUBLE PRECISION, 0.135735::DOUBLE PRECISION, now(), now()),
          ('4e5e6a9e-0f5a-4a2a-9c8a-6b1b6f6a0e02', 'Marché de Noël (comité des fêtes)', 'Angoulême (Espace Lunesse)', DATE '2026-12-20', NULL::TEXT, 45.656553::DOUBLE PRECISION, 0.175728::DOUBLE PRECISION, now(), now())
        ) AS seed
        WHERE NOT EXISTS (SELECT 1 FROM markets)
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
