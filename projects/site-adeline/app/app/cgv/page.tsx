import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "CGV & remboursement — CréA'deline" };

// Identité reprise de l'attestation d'immatriculation INPI/RNE (voir
// mentions-legales). Régime de TVA déduit du statut (entrepreneur
// individuel, aucun numéro de TVA intracommunautaire sur l'attestation) —
// franchise en base par défaut pour un micro-entrepreneur, À CONFIRMER avec
// Adeline si son chiffre d'affaires a dépassé le seuil de franchise.
//
// Point de droit à trancher avec Adeline avant publication : le droit de
// rétractation de 14 jours (Code de la consommation art. L221-18) NE
// S'APPLIQUE PAS aux "biens confectionnés selon les spécifications du
// consommateur ou nettement personnalisés" (art. L221-28, 3°). Si une pièce
// est cousue sur-mesure (tissu/taille choisis par la cliente via le
// formulaire de contact), elle est probablement exclue du droit de
// rétractation — mais ça doit être annoncé explicitement AVANT la commande
// (pas juste dans les CGV), sinon le droit de rétractation s'applique quand
// même par défaut. Si en revanche une pièce est vendue "prête", non
// personnalisée, via /boutique avec un prix fixe, le droit de rétractation
// standard s'applique. D'où les deux cas ci-dessous — à confirmer/adapter
// selon comment les ventes seront réellement faites.
export default function CGVPage() {
  return (
    <LegalPage title="Conditions générales de vente" updated="2026-09-19">
      <h2>Vendeur</h2>
      <p>
        <strong>Adeline Guyot</strong> (CréA&apos;deline), 16 route de la Gabote, 16430 Balzac,
        France, SIRET 878 826 536 00012. TVA non applicable, art. 293 B du Code général des
        impôts (franchise en base de TVA).
      </p>

      <h2>Produits et prix</h2>
      <p>
        Les prix affichés sont en euros, toutes taxes comprises, hors frais de livraison
        indiqués avant validation de la commande. CréA&apos;deline se réserve le droit de
        modifier ses prix à tout moment ; le prix appliqué est celui en vigueur au moment de
        la commande.
      </p>

      <h2>Commande et paiement</h2>
      <p>
        Le paiement est réalisé en ligne via Stripe (carte bancaire). La commande est
        confirmée par email une fois le paiement validé.
      </p>

      <h2>Livraison</h2>
      <p>
        Les pièces sont expédiées en France métropolitaine. Le délai de préparation et
        d&apos;expédition est communiqué avant validation de la commande.
      </p>

      <h2>Droit de rétractation</h2>
      <p>
        <strong>Pièces vendues prêtes, non personnalisées (boutique)</strong> : vous disposez
        d&apos;un délai de 14 jours à compter de la réception pour exercer votre droit de
        rétractation, sans avoir à justifier de motif, conformément à l&apos;article L221-18 du
        Code de la consommation. La pièce doit être retournée dans son état d&apos;origine.
      </p>
      <p>
        <strong>Pièces confectionnées sur-mesure (commande via le formulaire de contact,
        tissu/dimensions choisis par la cliente)</strong> : conformément à l&apos;article
        L221-28, 3° du Code de la consommation, le droit de rétractation ne s&apos;applique pas
        aux biens confectionnés selon vos spécifications ou nettement personnalisés. Cette
        exclusion vous est signalée explicitement avant validation de toute commande
        personnalisée.
      </p>

      <h2>Politique de remboursement</h2>
      <ul>
        <li>
          Rétractation recevable (pièce non personnalisée, dans les 14 jours) : remboursement
          intégral, frais de livraison initiaux inclus, sous 14 jours après réception du
          retour.
        </li>
        <li>Produit reçu défectueux ou non conforme : échange ou remboursement intégral, frais de retour pris en charge par CréA&apos;deline.</li>
        <li>
          Pièce personnalisée hors défaut de fabrication : non remboursable, sauf accord
          commercial exceptionnel.
        </li>
        <li>Le remboursement est effectué avec le même moyen de paiement que celui utilisé pour la commande.</li>
      </ul>

      <h2>Litiges</h2>
      <p>
        En cas de litige, vous pouvez recourir gratuitement à un médiateur de la consommation.
        [Coordonnées du médiateur à compléter dès qu&apos;Adeline aura adhéré à un service de
        médiation agréé — obligatoire pour tout professionnel vendant à des consommateurs,
        ex. CMAP, Médicys ou le médiateur de la chambre de métiers et de l&apos;artisanat. Cette
        adhésion ne peut pas être inventée ici, c&apos;est la seule étape encore bloquante avant
        une mise en conformité complète des CGV.]
      </p>
    </LegalPage>
  );
}
