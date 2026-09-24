import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CréA'deline",
  description:
    "Quelles données sont collectées sur creadeline16.fr, pourquoi, et comment les faire modifier ou supprimer.",
};

// Responsable de traitement identifié à partir de l'attestation
// d'immatriculation INPI/RNE (SIREN 878 826 536, voir mentions-legales).
export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="2026-09-24">
      <p>
        Cette page explique quelles données sont collectées sur ce site, pourquoi, et comment
        les faire modifier ou supprimer.
      </p>

      <h2>Responsable de traitement</h2>
      <p>
        <strong>Adeline Guyot</strong> (CréA&apos;deline), 16 route de la Gabote, 16430 Balzac,
        joignable à deline1001@yahoo.fr.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>
          <strong>Formulaire de contact</strong> : nom, email, message et préférences (type de
          pièce, tissu). Ces informations sont transmises à Adeline par email via notre serveur
          et le prestataire d&apos;envoi Resend (États-Unis, encadré par des clauses
          contractuelles types européennes). Elles sont conservées 3 ans à compter de votre
          dernier contact, puis supprimées.
        </li>
        <li>
          <strong>Mesure d&apos;audience (PostHog et Google Analytics)</strong> : pages visitées,
          type d&apos;appareil, provenance — uniquement si vous avez donné votre accord via le
          bandeau cookies (voir <a href="/cookies">politique de cookies</a>). PostHog est hébergé
          en Union Européenne (conservé 12 mois maximum) ; Google Analytics est hébergé par
          Google aux États-Unis, encadré par les clauses contractuelles types européennes
          (conservé 14 mois maximum).
        </li>
        <li>
          <strong>Performance technique (Vercel Speed Insights)</strong> : temps de chargement des
          pages, mesurés de façon anonyme pour surveiller la rapidité du site. Aucun cookie, aucune
          donnée permettant de vous identifier individuellement.
        </li>
        <li>
          <strong>Commande en ligne</strong> (si vous achetez une pièce) : email, adresse de
          livraison, téléphone, contenu de la commande. Le paiement lui-même est géré par
          Stripe, qui ne transmet jamais votre numéro de carte à CréA&apos;deline. Votre nom,
          votre adresse et votre téléphone sont transmis à Sendcloud (Pays-Bas, Union Européenne)
          pour générer l&apos;étiquette d&apos;expédition et sont ensuite communiqués au
          transporteur choisi (Mondial Relay, Chronopost) le temps de la livraison. Ces données
          sont stockées dans une base de données hébergée en Union Européenne. Votre email et
          votre adresse sont effacés automatiquement 3 ans après la commande ; le montant et le
          contenu de la commande sont conservés 10 ans, sans donnée permettant de vous
          identifier, pour répondre aux obligations comptables légales.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification, l&apos;effacement
        ou la portabilité de vos données, ou vous opposer à leur traitement, en écrivant à{" "}
        deline1001@yahoo.fr. Vous pouvez aussi déposer une réclamation auprès de la CNIL
        (cnil.fr) si vous estimez que vos droits ne sont pas respectés.
      </p>

      <h2>Partage des données</h2>
      <p>
        Vos données ne sont jamais vendues. Elles sont partagées uniquement avec les
        prestataires nécessaires au fonctionnement du site : Stripe (paiement, États-Unis/UE),
        Sendcloud (génération de l&apos;étiquette d&apos;expédition, Pays-Bas, Union Européenne),
        les transporteurs Mondial Relay et Chronopost (livraison de votre colis), Resend (envoi
        du formulaire de contact, États-Unis, clauses contractuelles types européennes), PostHog
        et Google Analytics (mesure d&apos;audience, avec votre accord —
        PostHog hébergé dans l&apos;Union Européenne, Google Analytics aux États-Unis sous
        clauses contractuelles types européennes), Hostinger (hébergement principal, Union
        Européenne), Vercel (hébergement de secours, États-Unis — encadré par leurs clauses
        contractuelles types européennes, le temps de finaliser la migration).
      </p>
    </LegalPage>
  );
}
