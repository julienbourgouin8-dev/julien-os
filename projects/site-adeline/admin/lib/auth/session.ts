import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Remplace Supabase Auth : un seul compte admin (voir login/actions.ts),
// session = cookie signé HMAC-SHA256 avec expiration embarquée, pas de
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

export function createSessionToken(): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}
