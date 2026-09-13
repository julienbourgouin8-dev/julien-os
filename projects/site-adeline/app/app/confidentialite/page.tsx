import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité — CréA'deline" };

// ⚠️ Comme mentions-legales/page.tsx : le responsable de traitement doit
// être identifié nommément (RGPD art. 13) avant publication — [À COMPLÉTER].
export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="[À COMPLÉTER — date de mise en ligne]">
      <p>
        Cette page explique quelles données sont collectées sur ce site, pourquoi, et comment
        les faire modifier ou supprimer.
      </p>

      <h2>Responsable de traitement</h2>
      <p>
        <strong>[NOM COMPLET D&apos;ADELINE / RAISON SOCIALE]</strong>, [ADRESSE À COMPLÉTER],
        joignable à [EMAIL À COMPLÉTER].
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>
          <strong>Formulaire de contact</strong> : nom, email, message et préférences (type de
          pièce, tissu). Ces informations ne sont pas envoyées à un serveur — le formulaire
          ouvre directement votre client mail, c&apos;est vous qui décidez de l&apos;envoyer.
          Une fois reçu par email, ce message est conservé le temps nécessaire pour traiter
          votre demande.
        </li>
        <li>
          <strong>Mesure d&apos;audience (PostHog)</strong> : pages visitées, type d&apos;appareil,
          provenance — uniquement si vous avez donné votre accord via le bandeau cookies (voir{" "}
          <a href="/cookies">politique de cookies</a>). Hébergé en Union Européenne. Conservé 12
          mois maximum.
        </li>
        <li>
          <strong>Commande en ligne</strong> (si vous achetez une pièce) : email, adresse de
          livraison, contenu de la commande. Le paiement lui-même est géré par Stripe, qui ne
          transmet jamais votre numéro de carte à CréA&apos;deline. Votre email et votre adresse
          sont effacés automatiquement 3 ans après la commande ; le montant et le contenu de la
          commande sont conservés 10 ans, sans donnée permettant de vous identifier, pour
          répondre aux obligations comptables légales.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification, l&apos;effacement
        ou la portabilité de vos données, ou vous opposer à leur traitement, en écrivant à{" "}
        [EMAIL À COMPLÉTER]. Vous pouvez aussi déposer une réclamation auprès de la CNIL
        (cnil.fr) si vous estimez que vos droits ne sont pas respectés.
      </p>

      <h2>Partage des données</h2>
      <p>
        Vos données ne sont jamais vendues. Elles sont partagées uniquement avec les
        prestataires nécessaires au fonctionnement du site : Stripe (paiement, États-Unis/UE),
        PostHog (mesure d&apos;audience, avec votre accord, hébergé dans l&apos;Union Européenne),
        Vercel (hébergement, États-Unis — encadré par leurs clauses contractuelles types
        européennes).
      </p>
    </LegalPage>
  );
}
