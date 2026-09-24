import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { sql, ensureSchema } from "@/lib/db/client";

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 45;

function hashToken(token: string): string {
  // SHA-256 simple suffit ici (contrairement aux mots de passe, scrypt) :
  // l'entropie vient entièrement des 32 octets aléatoires, pas d'une
  // saisie utilisateur devinable — le seul but est qu'une fuite en
  // lecture seule de la DB ne permette pas de rejouer le token.
  return createHash("sha256").update(token).digest("hex");
}

// Retourne le token EN CLAIR (à mettre dans le lien de l'email, jamais
// stocké tel quel) — un seul jeton actif à la fois PAR COMPTE : les anciens
// tokens non utilisés DU MÊME compte sont purgés pour qu'un lien de reset
// précédent ne traîne pas indéfiniment, sans toucher à ceux d'un autre
// compte admin.
export async function createResetToken(accountEmail: string): Promise<string> {
  await ensureSchema();
  await sql`DELETE FROM password_reset_tokens WHERE used_at IS NULL AND lower(email) = lower(${accountEmail})`;

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60_000).toISOString();
  await sql`
    INSERT INTO password_reset_tokens (token_hash, email, expires_at, created_at)
    VALUES (${hashToken(token)}, ${accountEmail}, ${expiresAt}, ${new Date().toISOString()})
  `;
  return token;
}

// Vérifie le token (existe, pas expiré, pas déjà utilisé) sans le
// consommer — utilisé pour afficher le formulaire seulement si le lien est
// valide, avant que la cliente ait tapé son nouveau mot de passe.
export async function isResetTokenValid(token: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`
    SELECT expires_at, used_at FROM password_reset_tokens WHERE token_hash = ${hashToken(token)}
  `) as { expires_at: string; used_at: string | null }[];
  const row = rows[0];
  if (!row || row.used_at) return false;
  return new Date(row.expires_at).getTime() > Date.now();
}

// Marque le token comme utilisé et retourne l'email du COMPTE concerné
// (null si déjà invalide/expiré/consommé) — c'est cet email qui indique à
// l'appelant quel compte mettre à jour, maintenant qu'il y en a plusieurs.
export async function consumeResetToken(token: string): Promise<string | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT email, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ${hashToken(token)}
  `) as { email: string; expires_at: string; used_at: string | null }[];
  const row = rows[0];
  if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) return null;

  await sql`
    UPDATE password_reset_tokens SET used_at = ${new Date().toISOString()} WHERE token_hash = ${hashToken(token)}
  `;
  return row.email;
}
