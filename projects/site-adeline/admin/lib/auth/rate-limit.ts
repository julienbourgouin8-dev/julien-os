import "server-only";
import { sql, ensureSchema } from "@/lib/db/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

type AttemptRow = { fail_count: number; locked_until: string | null };

// RGPD Art. 32 (sécurité des traitements) : sans ça, le hachage scrypt du
// mot de passe ralentit un brute-force mais ne l'empêche pas. Verrouille
// l'identifiant tenté (pas d'IP fiable ici, un seul compte admin de toute
// façon) après plusieurs échecs.
export async function checkLoginAllowed(identifier: string): Promise<{ allowed: boolean; retryAfterMinutes?: number }> {
  await ensureSchema();
  const rows = (await sql`
    SELECT fail_count, locked_until FROM login_attempts WHERE identifier = ${identifier}
  `) as AttemptRow[];
  const row = rows[0];
  if (!row?.locked_until) return { allowed: true };

  const lockedUntil = new Date(row.locked_until).getTime();
  if (Date.now() < lockedUntil) {
    return { allowed: false, retryAfterMinutes: Math.ceil((lockedUntil - Date.now()) / 60_000) };
  }
  return { allowed: true };
}

export async function recordLoginFailure(identifier: string): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();
  const rows = (await sql`SELECT fail_count FROM login_attempts WHERE identifier = ${identifier}`) as {
    fail_count: number;
  }[];
  const failCount = (rows[0]?.fail_count ?? 0) + 1;
  const lockedUntil =
    failCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString() : null;

  await sql`
    INSERT INTO login_attempts (identifier, fail_count, locked_until, updated_at)
    VALUES (${identifier}, ${failCount}, ${lockedUntil}, ${now})
    ON CONFLICT (identifier) DO UPDATE SET fail_count = ${failCount}, locked_until = ${lockedUntil}, updated_at = ${now}
  `;
}

export async function recordLoginSuccess(identifier: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM login_attempts WHERE identifier = ${identifier}`;
}
