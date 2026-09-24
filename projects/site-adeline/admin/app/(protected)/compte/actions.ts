"use server";

import { getAdminCredentials, updateAdminPassword } from "@/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAction } from "@/lib/audit";

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

  const creds = await getAdminCredentials();
  if (!creds || !verifyPassword(current, creds.passwordHash)) {
    return { error: "Mot de passe actuel incorrect." };
  }

  await updateAdminPassword(hashPassword(next));
  await logAction("password_changed");
  return { success: true };
}
