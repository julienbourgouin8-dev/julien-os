import "server-only";
import { sql, ensureSchema } from "@/lib/db/client";

// Adresse réelle d'Adeline (confirmée dans les mentions légales du site
// public) — distincte de ADMIN_EMAIL qui n'est qu'un identifiant de
// connexion ("Adeline", pas une adresse valide). Sert de valeur de départ
// pour recovery_email lors de la migration automatique ci-dessous.
const KNOWN_RECOVERY_EMAIL = "deline1001@yahoo.fr";

type AdminCredentials = { email: string; passwordHash: string; recoveryEmail: string };

// Migre une seule fois les identifiants figés dans .env.local/Coolify vers
// la DB (id fixe 'default') — après ça, .env.local n'est plus consulté du
// tout pour l'auth, seule la DB fait foi. Idempotent comme le reste de
// ensureSchema : si la ligne existe déjà, ne la touche jamais.
async function migrateFromEnvIfNeeded(): Promise<void> {
  const rows = (await sql`SELECT id FROM admin_credentials WHERE id = 'default'`) as { id: string }[];
  if (rows.length > 0) return;

  const envEmail = process.env.ADMIN_EMAIL;
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (!envEmail || !envHash) return;

  await sql`
    INSERT INTO admin_credentials (id, email, password_hash, recovery_email, updated_at)
    VALUES ('default', ${envEmail}, ${envHash}, ${KNOWN_RECOVERY_EMAIL}, ${new Date().toISOString()})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function getAdminCredentials(): Promise<AdminCredentials | null> {
  await ensureSchema();
  await migrateFromEnvIfNeeded();
  const rows = (await sql`
    SELECT email, password_hash, recovery_email FROM admin_credentials WHERE id = 'default'
  `) as { email: string; password_hash: string; recovery_email: string }[];
  const row = rows[0];
  if (!row) return null;
  return { email: row.email, passwordHash: row.password_hash, recoveryEmail: row.recovery_email };
}

export async function updateAdminPassword(newHash: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE admin_credentials SET password_hash = ${newHash}, updated_at = ${new Date().toISOString()}
    WHERE id = 'default'
  `;
}
