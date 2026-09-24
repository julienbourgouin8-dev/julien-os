import "server-only";
import { sql, ensureSchema } from "@/lib/db/client";

// Adresse réelle d'Adeline (confirmée dans les mentions légales du site
// public) — distincte de ADMIN_EMAIL qui n'est qu'un identifiant de
// connexion ("Adeline", pas une adresse valide). Sert de valeur de départ
// pour recovery_email lors de la migration automatique ci-dessous.
const KNOWN_RECOVERY_EMAIL = "deline1001@yahoo.fr";

type AdminCredentials = { email: string; passwordHash: string; recoveryEmail: string };
export type AdminAccountSummary = { email: string; recoveryEmail: string };

// Migre une seule fois les identifiants figés dans .env.local/Coolify vers
// la DB (id fixe 'default', le compte d'Adeline) — après ça, .env.local
// n'est plus consulté du tout pour l'auth, seule la DB fait foi. Idempotent
// comme le reste de ensureSchema : si la ligne existe déjà, ne la touche
// jamais.
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

export async function getAdminCredentialsByEmail(email: string): Promise<AdminCredentials | null> {
  await ensureSchema();
  await migrateFromEnvIfNeeded();
  const rows = (await sql`
    SELECT email, password_hash, recovery_email FROM admin_credentials WHERE lower(email) = lower(${email})
  `) as { email: string; password_hash: string; recovery_email: string }[];
  const row = rows[0];
  if (!row) return null;
  return { email: row.email, passwordHash: row.password_hash, recoveryEmail: row.recovery_email };
}

// Utilisé par "mot de passe oublié" : on cherche le compte par son email de
// RÉCUPÉRATION (distinct de l'identifiant de connexion), pour savoir à qui
// envoyer le lien.
export async function getAdminCredentialsByRecoveryEmail(recoveryEmail: string): Promise<AdminCredentials | null> {
  await ensureSchema();
  await migrateFromEnvIfNeeded();
  const rows = (await sql`
    SELECT email, password_hash, recovery_email FROM admin_credentials WHERE lower(recovery_email) = lower(${recoveryEmail})
  `) as { email: string; password_hash: string; recovery_email: string }[];
  const row = rows[0];
  if (!row) return null;
  return { email: row.email, passwordHash: row.password_hash, recoveryEmail: row.recovery_email };
}

export async function listAdminAccounts(): Promise<AdminAccountSummary[]> {
  await ensureSchema();
  await migrateFromEnvIfNeeded();
  const rows = (await sql`
    SELECT email, recovery_email FROM admin_credentials ORDER BY updated_at ASC
  `) as { email: string; recovery_email: string }[];
  return rows.map((r) => ({ email: r.email, recoveryEmail: r.recovery_email }));
}

// N'importe quel admin déjà connecté peut en créer un autre (voir
// app/(protected)/compte/actions.ts) : pas de route d'inscription publique,
// le vrai verrou est la session existante. `id` n'est qu'une clé primaire
// interne — l'identifiant de connexion réel est `email`, rendu unique par
// l'index sur lower(email) (voir lib/db/client.ts).
export async function createAdminAccount(
  email: string,
  passwordHash: string,
  recoveryEmail: string,
): Promise<{ error?: string }> {
  await ensureSchema();
  const existing = await getAdminCredentialsByEmail(email);
  if (existing) return { error: "Cet identifiant est déjà utilisé." };

  const id = `${email.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  try {
    await sql`
      INSERT INTO admin_credentials (id, email, password_hash, recovery_email, updated_at)
      VALUES (${id}, ${email}, ${passwordHash}, ${recoveryEmail}, ${new Date().toISOString()})
    `;
  } catch (err) {
    // Filet de sécurité contre une course entre le check ci-dessus et
    // l'insertion (index unique sur lower(email)) — improbable ici (deux
    // comptes de confiance) mais moins cher à gérer qu'à ignorer.
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23505") {
      return { error: "Cet identifiant est déjà utilisé." };
    }
    throw err;
  }
  return {};
}

export async function updateAdminPasswordByEmail(email: string, newHash: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE admin_credentials SET password_hash = ${newHash}, updated_at = ${new Date().toISOString()}
    WHERE lower(email) = lower(${email})
  `;
}
