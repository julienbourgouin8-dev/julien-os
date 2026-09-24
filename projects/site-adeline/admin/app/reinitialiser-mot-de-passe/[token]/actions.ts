"use server";

import { consumeResetToken } from "@/lib/auth/reset-tokens";
import { updateAdminPassword } from "@/lib/auth/credentials";
import { hashPassword } from "@/lib/auth/password";
import { logAction } from "@/lib/audit";

export type ResetPasswordState = { error?: string; done?: boolean } | undefined;

const MIN_LENGTH = 8;

export async function resetPassword(
  token: string,
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || typeof confirm !== "string" || !password) {
    return { error: "Mot de passe requis." };
  }
  if (password.length < MIN_LENGTH) {
    return { error: `Au moins ${MIN_LENGTH} caractères.` };
  }
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  // Consommé (marqué utilisé) seulement si tout le reste est valide — sinon
  // une erreur de saisie sur un mot de passe trop court grillerait le lien
  // pour rien.
  const valid = await consumeResetToken(token);
  if (!valid) {
    return { error: "Ce lien a expiré ou a déjà été utilisé. Refais une demande." };
  }

  await updateAdminPassword(hashPassword(password));
  await logAction("password_reset_completed");
  return { done: true };
}
