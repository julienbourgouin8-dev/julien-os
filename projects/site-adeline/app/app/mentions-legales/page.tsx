import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales — CréA'deline",
  description:
    "Mentions légales de CréA'deline : identité de l'éditrice, hébergement du site et propriété intellectuelle.",
};

// Identité légale reprise de l'attestation d'immatriculation INPI/RNE
// (extrait du 13/09/2026, SIREN 878 826 536) : entrepreneur individuel,
// nom d'usage Guyot, nom commercial CréA'deline, activité artisanale
// (code APE 1419Z), adresse du siège 16 route de la Gabote, 16430 Balzac.
export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="2026-09-24">
      <h2>Éditeur du site</h2>
      <p>
        <strong>Adeline Guyot</strong> — nom commercial <strong>CréA&apos;deline</strong>
        <br />
        Statut : Entrepreneur individuel (activité artisanale — fabrication d&apos;accessoires
        en tissu)
        <br />
        SIREN : 878 826 536 — SIRET : 878 826 536 00012
        <br />
        Immatriculée au Registre National des Entreprises (RNE)
        <br />
        TVA non applicable, article 293 B du Code général des impôts (franchise en base de TVA)
        <br />
        Adresse : 16 route de la Gabote, 16430 Balzac, France
        <br />
        Email : deline1001@yahoo.fr
        <br />
        Téléphone : 06 60 05 42 86
      </p>

      <h2>Directeur de la publication</h2>
      <p>Adeline Guyot</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Hostinger International Ltd., 61 Lordou Vironos Street, 6023
        Larnaca, Chypre (
        <a href="https://www.hostinger.fr/contact" target="_blank" rel="noreferrer">
          hostinger.fr
        </a>
        ), sur un serveur situé dans l&apos;Union Européenne. Une copie de secours du site tourne
        également, le temps de finaliser la migration, chez Vercel Inc., 340 S Lemon Ave #4133,
        Walnut, CA 91789, États-Unis (
        <a href="https://vercel.com/legal" target="_blank" rel="noreferrer">
          vercel.com/legal
        </a>
        ).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des textes, photos et créations présentés sur ce site est la
        propriété de CréA&apos;deline. Toute reproduction sans autorisation est interdite.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question concernant le site : deline1001@yahoo.fr ou via le{" "}
        <a href="/#contact">formulaire de contact</a>.
      </p>
    </LegalPage>
  );
}
