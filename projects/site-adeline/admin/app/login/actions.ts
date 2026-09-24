"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth/session";
import { checkLoginAllowed, recordLoginFailure, recordLoginSuccess } from "@/lib/auth/rate-limit";
import { getAdminCredentials } from "@/lib/auth/credentials";
import { logAction } from "@/lib/audit";

export type LoginState = { error?: string } | undefined;

export async function signIn(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const gate = await checkLoginAllowed(email);
  if (!gate.allowed) {
    return { error: `Trop de tentatives. Réessayez dans ${gate.retryAfterMinutes} min.` };
  }

  // Identifiants en DB (admin_credentials), plus dans .env.local/Coolify —
  // migrés automatiquement une seule fois depuis les anciennes variables
  // d'env au premier appel (voir lib/auth/credentials.ts). Adeline peut
  // désormais changer son mot de passe elle-même (page /compte) sans
  // dépendre d'un redéploiement.
  const creds = await getAdminCredentials();
  if (!creds || email !== creds.email || !verifyPassword(password, creds.passwordHash)) {
    await recordLoginFailure(email);
    await logAction("login_failed");
    return { error: "Identifiants incorrects." };
  }

  await recordLoginSuccess(email);
  await logAction("login_success");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  redirect("/");
}
