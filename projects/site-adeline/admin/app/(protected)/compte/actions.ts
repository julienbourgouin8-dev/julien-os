"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAdminCredentialsByEmail, updateAdminPasswordByEmail, createAdminAccount } from "@/lib/auth/credentials";
import { COOKIE_NAME, getSessionEmailFromToken } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAction } from "@/lib/audit";

async function currentAccountEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return getSessionEmailFromToken(cookieStore.get(COOKIE_NAME)?.value);
}

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

const MIN_LENGTH = 8;

export async function changePassword(_state: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const current = formData.get("current");
  const next = formData.get("next");
  const confirm = formData.get("confirm");
  if (typeof current !== "string" || typeof next !== "string" || typeof confirm !== "string" || !current || !next) {
    return { error: "Tous les champs sont requis." };
  }
  if (next.length < MIN_LENGTH) {
    return { error: `Le nouveau mot de passe doit faire au moins ${MIN_LENGTH} caractères.` };
  }
  if (next !== confirm) {
    return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  }

  const email = await currentAccountEmail();
  if (!email) return { error: "Session expirée, reconnecte-toi." };

  const creds = await getAdminCredentialsByEmail(email);
  if (!creds || !verifyPassword(current, creds.passwordHash)) {
    return { error: "Mot de passe actuel incorrect." };
  }

  await updateAdminPasswordByEmail(email, hashPassword(next));
  await logAction("password_changed");
  return { success: true };
}

export type CreateAccountState = { error?: string; success?: boolean } | undefined;

const ACCOUNT_MIN_LENGTH = 8;

// N'importe quel admin déjà connecté peut créer un nouveau compte admin —
// pas de route d'inscription publique, le vrai verrou est la session
// existante (proxy.ts protège tout /compte). Délibérément permissif entre
// admins (Adeline + Julien, deux comptes de confiance), pas un système à
// plusieurs rôles/permissions.
export async function createAccount(_state: CreateAccountState, formData: FormData): Promise<CreateAccountState> {
  const requester = await currentAccountEmail();
  if (!requester) return { error: "Session expirée, reconnecte-toi." };

  const email = formData.get("email");
  const password = formData.get("password");
  const recoveryEmail = formData.get("recoveryEmail");
  if (
    typeof email !== "string" ||
    !email ||
    typeof password !== "string" ||
    !password ||
    typeof recoveryEmail !== "string" ||
    !recoveryEmail
  ) {
    return { error: "Tous les champs sont requis." };
  }
  if (password.length < ACCOUNT_MIN_LENGTH) {
    return { error: `Le mot de passe doit faire au moins ${ACCOUNT_MIN_LENGTH} caractères.` };
  }

  const result = await createAdminAccount(email, hashPassword(password), recoveryEmail);
  if (result.error) return { error: result.error };

  await logAction("admin_account_created");
  // Rafraîchit la liste "Comptes existants" affichée par le server
  // component page.tsx, sinon le nouveau compte n'apparaît qu'au prochain
  // rechargement manuel malgré le message de succès.
  revalidatePath("/compte");
  return { success: true };
}
