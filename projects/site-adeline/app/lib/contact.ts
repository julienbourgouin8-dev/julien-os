// TEMPORAIRE : compte Resend créé avec julienbourgouinai@gmail.com, qui
// sans domaine vérifié n'autorise l'envoi de test que vers cette adresse-là
// (voir app/api/contact). Remettre deline1001@yahoo.fr une fois qu'Adeline
// a son propre compte Resend (ou qu'un domaine est vérifié).
//
// Isolé dans ce fichier neutre (ni "use client" ni route serveur) : importer
// une constante depuis un composant "use client" dans une route serveur ne
// marche pas de façon fiable (Next.js la traite comme une référence client,
// la valeur arrive vide côté serveur).
export const CONTACT_EMAIL = "julienbourgouinai@gmail.com";
