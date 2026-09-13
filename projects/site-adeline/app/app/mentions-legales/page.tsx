import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Mentions légales — CréA'deline" };

// ⚠️ Page non finalisable sans les infos réelles d'Adeline (voir les
// [À COMPLÉTER] ci-dessous) : nom/raison sociale, statut juridique, SIRET,
// adresse, email de contact. Obligatoire pour tout site pro en France (LCEN
// art. 6-III), pas seulement pour l'e-commerce — à publier avant tout
// partage large du site tant que ces champs ne sont pas remplis.
export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="[À COMPLÉTER — date de mise en ligne]">
      <h2>Éditeur du site</h2>
      <p>
        <strong>[NOM COMPLET D&apos;ADELINE / RAISON SOCIALE]</strong>
        <br />
        Statut : [À COMPLÉTER — ex. Micro-entrepreneur / Entreprise individuelle]
        <br />
        SIRET : [À COMPLÉTER]
        <br />
        Adresse : [À COMPLÉTER]
        <br />
        Email : [À COMPLÉTER]
        <br />
        Téléphone : 06 60 05 42 86
      </p>

      <h2>Directeur de la publication</h2>
      <p>[NOM COMPLET D&apos;ADELINE]</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
        États-Unis (adresse à vérifier sur{" "}
        <a href="https://vercel.com/legal" target="_blank" rel="noreferrer">
          vercel.com/legal
        </a>{" "}
        avant publication).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des textes, photos et créations présentés sur ce site est la
        propriété de CréA&apos;deline. Toute reproduction sans autorisation est interdite.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question concernant le site : [EMAIL À COMPLÉTER] ou via le{" "}
        <a href="/#contact">formulaire de contact</a>.
      </p>
    </LegalPage>
  );
}
