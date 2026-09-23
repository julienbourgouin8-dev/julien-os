// Isolé dans ce fichier neutre (ni "use client" ni route serveur) : importer
// une constante depuis un composant "use client" dans une route serveur ne
// marche pas de façon fiable (Next.js la traite comme une référence client,
// la valeur arrive vide côté serveur).
//
// Domaine creadeline16.fr vérifié sur Resend (2026-09-23) — remis sur la
// vraie adresse d'Adeline, plus besoin du détour par le compte Julien.
export const CONTACT_EMAIL = "deline1001@yahoo.fr";
