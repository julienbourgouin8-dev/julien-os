"use server";

import { getAdminCredentials } from "@/lib/auth/credentials";
import { createResetToken } from "@/lib/auth/reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email/passwordReset";
import { checkLoginAllowed, recordLoginFailure } from "@/lib/auth/rate-limit";
import { logAction } from "@/lib/audit";

export type ForgotPasswordState = { sent?: boolean; error?: string } | undefined;

// Réponse TOUJOURS identique que l'email tapé corresponde ou non au compte
// (même s'il n'y a qu'un seul compte ici, c'est le réflexe correct pour ne
// jamais laisser un formulaire confirmer/infirmer qu'un compte existe) —
// seul un email correspondant déclenche un vrai envoi. `checkLoginAllowed`
// réutilisé avec un identifiant préfixé pour limiter le spam d'emails,
// distinct des tentatives de connexion.
export async function requestPasswordReset(_state: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { error: "Adresse email requise." };
  }

  const rateLimitKey = `reset:${email.toLowerCase()}`;
  const gate = await checkLoginAllowed(rateLimitKey);
  if (!gate.allowed) {
    return { error: `Trop de demandes. Réessayez dans ${gate.retryAfterMinutes} min.` };
  }

  const creds = await getAdminCredentials();
  if (creds && email.toLowerCase() === creds.recoveryEmail.toLowerCase()) {
    const token = await createResetToken();
    await sendPasswordResetEmail(creds.recoveryEmail, token);
    await logAction("password_reset_requested");
  } else {
    // Compte le "non-match" comme un échec côté rate-limit aussi, sinon
    // quelqu'un peut tester des adresses au hasard sans jamais être freiné.
    await recordLoginFailure(rateLimitKey);
  }

  return { sent: true };
}
