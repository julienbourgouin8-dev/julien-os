"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth/session";
import { checkLoginAllowed, recordLoginFailure, recordLoginSuccess } from "@/lib/auth/rate-limit";
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

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash || email !== adminEmail || !verifyPassword(password, adminHash)) {
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
