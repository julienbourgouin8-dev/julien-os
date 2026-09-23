import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Politique de cookies — CréA'deline" };

export default function CookiesPage() {
  return (
    <LegalPage title="Politique de cookies" updated="2026-09-13">
      <p>
        Ce site utilise deux outils de mesure d&apos;audience, et rien n&apos;est activé tant que
        vous n&apos;avez pas donné votre accord via le bandeau affiché en bas de page.
      </p>

      <h2>Pourquoi un bandeau de consentement ?</h2>
      <p>
        Les outils de mesure d&apos;audience utilisés (PostHog et Google Analytics) déposent des
        identifiants dans votre navigateur pour reconnaître vos visites. Ce n&apos;est pas
        strictement nécessaire au fonctionnement du site — la loi (CNIL, directive ePrivacy)
        impose donc de demander votre accord avant de les activer. Votre choix (accepté/refusé)
        est lui-même mémorisé localement sur votre appareil, sans que ça nécessite d&apos;accord —
        c&apos;est ce qui permet de ne pas vous redemander à chaque page. Un seul et même accord
        active les deux outils ensemble.
      </p>

      <h2>Ce que font ces outils</h2>
      <ul>
        <li>Comptent les pages visitées et le type d&apos;appareil utilisé.</li>
        <li>Ne collectent ni nom, ni email, ni contenu du formulaire de contact.</li>
        <li>PostHog : données hébergées en Union Européenne (PostHog Cloud EU), conservées 12 mois maximum.</li>
        <li>
          Google Analytics : données hébergées par Google (États-Unis, encadré par les clauses
          contractuelles types européennes), conservées 14 mois maximum.
        </li>
      </ul>

      <h2>Changer d&apos;avis</h2>
      <p>
        Vous pouvez accepter, refuser, ou retirer votre accord à tout moment via le lien
        &laquo; Gérer les cookies &raquo; en bas de chaque page.
      </p>
    </LegalPage>
  );
}
