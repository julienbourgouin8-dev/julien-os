import "server-only";
import { Resend } from "resend";
import { SITE_URL } from "@/lib/site";

// Même domaine vérifié Resend que le site public (creadeline16.fr) — voir
// app/lib/email/orderConfirmation.ts.
const FROM = "CréA'deline <commandes@creadeline16.fr>";

// Jamais logué en clair (le token complet), jamais renvoyé par l'action —
// seul cet email en contient le lien complet.
export async function sendPasswordResetEmail(recoveryEmail: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const link = `${SITE_URL}/reinitialiser-mot-de-passe/${token}`;
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to: recoveryEmail,
    subject: "Réinitialisation de ton mot de passe — Admin CréA'deline",
    text: `Bonjour,\n\nQuelqu'un (probablement toi) a demandé à réinitialiser le mot de passe de l'espace admin CréA'deline.\n\nClique ici pour choisir un nouveau mot de passe (lien valable 45 minutes) :\n${link}\n\nSi tu n'es pas à l'origine de cette demande, ignore simplement cet email — ton mot de passe actuel reste inchangé.`,
  });
}
