# Scrape cosmos16.cosmos-tech.fr (2026-09-27)

Site vitrine one-page en PHP maison (pas de CMS), derrière Cloudflare. 2 pages + 1 sous-domaine de résa.
Tout est en local ici : `html/` (sources brutes), `css/`, `js/`, `images/`, `screens/` (desktop 1440 + mobile 390, pleine page).
Refaire les captures : `node shots.mjs`.

## Pages
- `/` (index.php) : la vitrine
- `/contact.php` : formulaire de contact
- `https://booking.cosmos-tech.fr` : module de réservation (app séparée, autre charte)

## Branding
**Vitrine**
- Polices : **Marcellus** (titres, logo texte "COSMOS") + **Karla** 400-700 (texte, UI). Google Fonts.
- Pas de logo image : logo = texte "COSMOS" en Marcellus + slogan "CUISINE DU MONDE · CHAMPNIERS" (capitales, tracking .22em).
- Couleurs :
  - Bleu nuit `#041930` (header, bloc infos, footer)
  - Rouge brique `#b23a20` (CTA "Réserver", eyebrows, accent)
  - Crème `#faf7f2` (fond carte), `#f3ede3` (section événements), fond page `#d9d8d3`
  - Encre `#1c1917`, texte secondaire `#5b534c` / `#6b635c`
  - Bleu gris `#9db0c6` (slogan, footer), pêche `#f2bb96` / `#f0b682` (titre tarifs sur fond espace)
  - Accents cartes tarifs : `#96703a` (ocre), `#5f7052` (olive), `#8a5a7a` (prune), `#2f5d76` (bleu pétrole)
- Layout : "carte" centrée max 1080px, radius 6px, grosse ombre, sur fond gris. Boutons pilule (CTA rouge) ou rectangles (sombre / outline).
- Thème visuel : cosmos/espace (fond planète sur la section tarifs, plafond "système solaire" dans la salle, néons bleus).

**Booking** (charte différente, incohérente avec la vitrine)
- Polices **Bodoni Moda** + **Manrope**. Navy `#16304a`, fond `#f1f2f3`. Look sobre type hôtel.

## Sections (ordre de la home) + copy
1. **Header** : COSMOS / Cuisine du monde · champniers — liens Contact, 05 45 38 11 07, bouton "Réserver une table".
2. **Bannière** photo plein largeur 360px (salle néons + lanternes + cerisier), effet Ken Burns.
3. **Hero** (texte + photo salle plafond planètes)
   - Eyebrow : "Buffet à volonté · 7 jours sur 7"
   - H1 : "Le plus grand restaurant asiatique de la Charente"
   - "Avec sa capacité exceptionnelle de 650 couverts, le Restaurant COSMOS vous accueille dans un espace moderne et chaleureux au cœur de Champniers."
   - "Venez découvrir un gigantesque buffet à volonté réunissant le meilleur de la cuisine chinoise et asiatique : un assortiment d'entrées, des sushis préparés sur place, un large choix de plats chauds, ainsi qu'un espace wok et grillades sur-mesure, sans oublier un buffet complet de desserts."
   - Paragraphe salles privées (doublon avec la section 6).
   - CTA : "Réserver en ligne" / "Voir les tarifs" (#tarifs)
4. **Galerie** — Eyebrow "Le buffet en images", titre "Un comptoir qui donne faim". 2 marquees défilants en sens inverse, légende au survol :
   - Ligne 1 : Grill & brochettes, Sushis & makis, Fruits de mer, Pizzas au four, La salle, Fruits & entrées, Sashimis
   - Ligne 2 : Viandes à griller, Le comptoir, Sushis & sashimis, Brochettes, Fromages & charcuterie, Desserts, La salle à manger
5. **Tarifs du buffet** (#tarifs) — "Par personne, boissons non incluses", fond planète
   - Adulte · Midi — Du lundi au vendredi — **20,90 €**
   - Adulte · Soir — Du lundi au jeudi — **27,90 €**
   - Adulte · Tarif week-end — Vendredi soir, samedi, dimanche et jours fériés, midi et soir — **29,90 €**
   - Enfant — 6-9 ans : 10,90 € midi · 13,90 € soir / 3-5 ans : 7,90 € midi · 8,90 € soir / -3 ans : Gratuit — "dès 7,90 €"
   - Paiements acceptés : CB, Titre-Restaurant, Chèque-Vacances, Espèces
6. **Le wok & le grill** — "Cuisiné devant vous, à la minute"
   - "Vous composez votre assiette (légumes croquants, nouilles, gambas, bœuf mariné) et nos cuisiniers la saisissent au wok sous vos yeux. Le grill prend le relais pour les brochettes, le saumon et les Saint-Jacques."
   - "Le comptoir japonais est réapprovisionné en continu : sushis, makis et sashimis."
   - Tags : Sushis & sashimis, Dim sum vapeur, Fruits de mer, Desserts maison
7. **Groupes & événements** (#evenements) — "Des salles privées pour tous vos événements"
   - "Vous organisez un anniversaire, un repas de famille, un banquet ou une soirée d'entreprise ? Le Restaurant COSMOS met à votre disposition des salles privées. Profitez d'un espace réservé pour réunir vos proches ou vos collaborateurs dans des conditions idéales, tout en bénéficiant du choix et de la convivialité du buffet à volonté."
   - Tags : 650 couverts, Salles privatisables, Parking gratuit
8. **Infos** (#contact, fond bleu nuit) — Horaires : Lundi au dimanche · 12h00–14h30 et 19h00–22h30 / Adresse : 1156 Rte de la Braconne, 16430 Champniers / 05 45 38 11 07, cosmos.champniers@gmail.com / bouton "Réserver en ligne →"
9. **Footer** : "COSMOS · Buffet à volonté · Réservation conseillée le week-end ( A partir de 10 personnes )"

## Photos (`images/`)
- `uploads/21e7f42e….webp` : bannière (salle néons/lanternes)
- `uploads/hero-cosmos.webp` : salle plafond planètes
- `uploads/f9cb0989….webp` : comptoir saumon/sushis (1280×1707)
- `uploads/salles-privees.webp` : salle privée table ronde
- `planetes.jpeg` : fond espace de la section tarifs
- `salle/*.webp` (14) : galerie buffet (grill, sushi2/3/4, fruits-de-mer, pizzas, salle-tunnel, fruits, brochettes-cru, buffet, wok, fromages, desserts, salle). 675 à 1200px.

## Fonctionnalités
- **Animations** : Ken Burns sur la bannière, reveal au scroll (IntersectionObserver), zoom photo au survol, cartes tarifs qui montent au survol, double marquee galerie (pause au survol, respecte prefers-reduced-motion).
- **Contact** (`contact.php`) : Nom, Email, Téléphone (opt.), Sujet (opt.), Message. POST PHP avec CSRF + honeypot.
- **Réservation** (booking.cosmos-tech.fr, `js/booking-app.js`) :
  - Date (pas de date passée), choix Midi (12h00–14h00) / Soir (19h00–21h30), créneaux tous les 15 min
  - **Groupes uniquement : 10 à 30 personnes** (en dessous table sans résa, au-delà appeler)
  - Nom, téléphone (regex FR), email, message 500 car. (allergies, occasion)
  - API JSON `/api/reservations` + `/api/csrf-token`, rate limit (429), honeypot, écran de confirmation récap
  - Pas de confirmation auto : "confirmée par nos équipes" par téléphone/email. Table gardée 5 min. Animaux non acceptés.
- CSS contient des styles `admin-*` / `login-shell` : il existe un back-office pour éditer textes/images (non exposé).
- Email protégé par l'obfuscation Cloudflare (décodé ci-dessus).

## Faiblesses repérées (angle refonte)
- `<title>` = "COSMOS" seul, **aucune meta description**, pas d'Open Graph, pas de favicon, pas de données structurées Restaurant.
- Domaine technique `cosmos16.cosmos-tech.fr` au lieu de cosmos16.fr.
- Pas de logo, pas de lien Instagram, pas de carte/Google Maps, pas d'avis clients, pas de menu détaillé.
- Hero trop long (3 paragraphes, le 3e duplique la section événements).
- Galerie : images en `decoding=async` sans dimensions, le marquee rend noir en capture pleine page.
- Label "Horaires/Adresse" en `#6b635c` sur `#041930` : contraste très faible.
- Booking avec une autre charte (Bodoni/Manrope, navy différent) : rupture de marque.
- Incohérences : horaires 12h–14h30 sur la home vs créneaux jusqu'à 14h00 ; "Braconne" / "braconne".
