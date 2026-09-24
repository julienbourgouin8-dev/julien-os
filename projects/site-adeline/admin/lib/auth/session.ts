import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Remplace Supabase Auth : plusieurs comptes admin possibles (voir
// login/actions.ts et app/(protected)/compte/), session = cookie signé
// HMAC-SHA256 avec expiration ET identifiant du compte embarqués, pas de
// table sessions ni de lib externe. Sûr côté proxy.ts : dans cette version
// de Next, proxy.ts tourne par défaut en runtime Node.js (plus Edge), donc
// node:crypto y est utilisable — voir node_modules/next/dist/docs/.../proxy.md.
export const COOKIE_NAME = "admin_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET manquant dans .env.local");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

// Payload = "<expiration>|<email du compte>" — l'email peut contenir des
// points (adresse réelle), donc on sépare payload/signature sur le DERNIER
// "." du token, jamais un split naïf sur tous les points.
export function createSessionToken(email: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${exp}|${email}`;
  return `${payload}.${sign(payload)}`;
}

// Retourne l'email du compte si le token est valide (signature correcte,
// pas expiré), sinon null. `verifySessionToken` ci-dessous n'en garde que
// le booléen pour proxy.ts, qui n'a pas besoin de savoir QUI est connecté.
export function getSessionEmailFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const sepIdx = token.lastIndexOf(".");
  if (sepIdx === -1) return null;
  const payload = token.slice(0, sepIdx);
  const signature = token.slice(sepIdx + 1);

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const barIdx = payload.lastIndexOf("|");
  if (barIdx === -1) return null;
  const exp = Number(payload.slice(0, barIdx));
  if (!Number.isFinite(exp) || Date.now() >= exp) return null;

  const email = payload.slice(barIdx + 1);
  return email || null;
}

export function verifySessionToken(token: string | undefined): boolean {
  return getSessionEmailFromToken(token) !== null;
}
