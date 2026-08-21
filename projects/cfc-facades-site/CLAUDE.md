# CLAUDE.md

Refonte du site CFC Façades (Antoine Navarro, Ruelle-sur-Touvre/Angoulême/Cognac) — offre d'entrée gratuite pour décrocher ce prospect BTP. Site statique HTML/CSS/JS, pas de build. `npx --yes serve -l 8080 .` pour tester en local.

## Contenu réel — sources et où le retrouver

Le vrai site actuel (`cfc-facades.com`, agence 16h33, 2022) a été scrapé le 2026-08-20 avec `scripts/playwright/fetch-rendered.js` et `scripts/playwright/cfc-image-inventory.js`. **Tout le texte métier (accroches, historique, descriptions services, FAQ, certifications Qualibat) vient de ce scrape — ne jamais inventer/raccourcir, voir garde-fou `site-revamp`.**

- Historique : CFC créée en 1987 par Henri Navarro (enduits façades neuves), 1995 rénovation habitat ancien, 2007 échafaudage, 2008 virage ITE (nomination Navarro président UNEEF-FFB), 2015 polyuréthane projeté, 2017 reprise par Sophie et Antoine Navarro. 35 ans d'expérience, 40 employés, 5 grandes activités, 5 certifications énergétiques.
- 4 services réels, chacun avec sa propre page/certif Qualibat :
  - **Isolation par l'extérieur** — Qualibat 7131, partenaire PAREXLANKO
  - **Ravalement de façade** — Qualibat 2121
  - **Restauration de façade** — Qualibat 2121 + 2132 (façades enduites/pierre/peintes)
  - **Enduit neuf** — Qualibat 2132
- Coordonnées réelles : Parc de la Rocade, 16600 Ruelle-sur-Touvre — 05 45 37 34 00.
- Formulaire de devis réel (page `/contact/`) : Nom, Prénom, Code postal, E-mail, Téléphone, Message — repris tel quel (la home a une version simplifiée à 3 champs, on garde la version complète).
- **Avis Google réels** — scrapés via `scripts/playwright/scrape-google-reviews.js <cid_decimal>` (CID CFC Façades : `10334629174977753948`, trouvé dans l'URL `/maps/place/...` du lien `goo.gl/maps` du site). Note globale réelle **4,2 ★ / 52 avis**. Le scrape ne remonte de façon fiable que 5 avis uniques (Laurie-Anne Diguet, Maryse Drobieux, pascal audoin, Daniel Lauxire, Laure Villatte, tous 5★, texte intégral dans `scripts/playwright/` output JSON) — Google sert une "vue limitée" sans onglet Avis sur un profil non connecté ~1 essai sur 3 même avec le CID, le script retente automatiquement jusqu'à 5-6 fois. Si besoin de plus d'avis un jour, relancer le script (`node scrape-google-reviews.js 10334629174977753948 out.json 60 8`) — mais 5 avis vérifiés valent mieux que d'en inventer.
- **Trous constatés sur le vrai site** : les cartes services "Restauration de façade" et "Enduit neuf" ont des images grises manquantes (bug du site actuel) ; la section "Les témoignages de nos clients" est vide côté vrai site (pas d'avis affichés du tout) — cette refonte comble les deux.

## Images

- `assets/img/logos/logo-cfc.png` (674×767, fond transparent, propre) — logo à utiliser partout. `logo-cfc.svg` existe aussi mais très petit (120×137), préférer le PNG. Couleurs de marque **échantillonnées sur ce PNG** (pixels dominants) : rouge `#E30613`, jaune `#FFCC00`, encre `#1D1D1B` — voir `css/tokens.css`.
- `assets/img/logos/cfc-enseigne-photo.jpg` — photo réelle de l'enseigne (bâtiment CFC), fournie par Julien, utilisée dans la section "Qui sommes-nous".
- `assets/img/realisations/` — photos réelles de chantiers CFC fournies par Julien le 2026-08-20 (pas de stock, pas d'IA) :
  - `villa-enduit-neuf.jpg` — villa moderne toit incurvé, enduit neuf (aussi utilisée en hero)
  - `immeuble-ravalement.jpg` — immeuble incurvé beige, ravalement
  - `patrimoine-echafaudage.jpg` — bâtiment ancien ocre en cours de restauration, échafaudage
  - `immeuble-orange.jpg` — immeuble moderne orange/blanc
  - `pavillon-neuf.jpg` — pavillon toit tuile, construction neuve
  - `avant-apres-isolation.jpg` — collage avant/après ITE (avant : façade beige nue ; après : façade blanche isolée)
- `assets/img/equipe/`, `assets/img/patrimoine/`, `assets/img/services/` — assets d'une session antérieure sur un concept différent ("Le Patrimoine Charentais" : Grandes Forges, caserne de pompiers, manoir de Cognac, voir `projects/_index.md`). Pas utilisés dans cette version (structure alignée sur le vrai site actuel plutôt que sur ce concept narratif), gardés en réserve si un futur concept les réutilise.

## Vidéos (à venir)

Julien a prévu 2 emplacements vidéo dans "Nos réalisations" (item 2 et 4, alternance image/vidéo/image/vidéo) mais n'a fourni que des images pour l'instant ("je te donnerai les vidéos t'inquiète pas", 2026-08-20). Rappel : le skill `site-revamp` interdit la vidéo par défaut depuis le 2026-07-21 (stratégie de volume) — dérogation acceptée pour ce client précis une fois les fichiers fournis. En attendant, les 4 slots réalisations sont en image ; la structure HTML/CSS est faite pour qu'un item puisse devenir `<video>` sans réécrire la grille (voir `#realisations` dans `index.html`).

## Palette & typo (verrouillées 2026-08-20)

- `--red: #E30613`, `--yellow: #FFCC00`, `--ink: #1D1D1B`, `--white: #FFFFFF` — couleurs de marque réelles, jamais retouchées.
- Typo : `Archivo` (display, gras, énergique — cohérent avec le rouge/jaune) + `Inter` (corps de texte). Chiffres clés en `Archivo` aussi (contrairement à ETS Lévesque qui isole une police dédiée pour les stats — ici un seul display suffit vu la taille du site).

## Nav header — historique des itérations (2026-08-21)

Le vrai site a le texte de nav en noir directement sur le dégradé bleu ciel du hero, lisibilité jugée insuffisante par Julien. Itérations le même jour, dans l'ordre :
1. Pilule sombre pleine avec les liens dedans (fidèle à une réf "Rosewood" fournie par Julien pour la forme du bandeau).
2. Pilule blanche fine avec anneau dégradé rouge/jaune animé (couleurs du logo cFc) autour, liens toujours dedans.
3. Pilule compacte "Menu ☰" (fond ink) qui ouvrait au clic un panneau plein écran `.mobile-nav` avec tous les liens — trop lourd, Julien voulait un simple survol.
4. Pastille minuscule "Menu ☰" à fond plein (blanc → jaune logo `#FFCE0A` en tâtonnant) avec anneau rouge/jaune animé, puis une variante "nuage" (fond blanc/bleu pâle, contour blobby). Toutes deux au survol/focus, pas au clic, pas de JS.
   - **Piège rencontré sur cette mécanique de survol** : animer le `max-width` d'un enfant interne (`.site-header__nav-links-wrap`) pendant que le parent (`.site-header__nav`) se redimensionne en `width: fit-content` pour suivre — ça désynchronise (le texte se révèle avant que le contour de la pastille ne rattrape). Fix retenu depuis : une seule boîte animée — `max-width` + `overflow` (retardé) vivent sur `.site-header__nav` lui-même, l'enfant interne bascule juste en tout-ou-rien (`width: 0` ↔ `max-content`, même délai que `overflow`) pour ne jamais dépasser du bord au repos. Ce fix survit à tous les changements de skin suivants.
5. Verre dépoli transparent (`rgba(255,255,255,.14)` + `backdrop-filter: blur`), avec la même pastille "Menu ☰" qui s'agrandissait au survol. Texte blanc + ombre portée sur le hero, bascule en `--ink` une fois `.site-header.is-scrolled`.
6. **Version actuelle** : Julien a préféré la barre affichée directement, sans étape "Menu ☰" à survoler — verre dépoli inchangé sinon, `width: fit-content` fixe (plus de `max-width`/`overflow` animés, plus de risque de désync). Sous-menus par catégorie toujours au survol. À ≤700px la pastille n'a plus de fond du tout (les 4 catégories seraient illisibles compressées dedans) ; à la place un petit panneau opaque (`rgba(255,255,255,.92)`, texte ink) s'affiche juste en dessous, toujours visible (plus de hover-gate à cette taille non plus).

## Séquence d'apparition au chargement (2026-08-21)

Toute la zone header/hero arrive comme un seul geste chorégraphié au chargement (une fois, jamais lié au scroll — l'ancien effet dézoom+voile sombre sur la photo du hero a été retiré à la demande de Julien). Dans l'ordre : logo (0.1s) → titre ligne 1 (0.45s) → nav (0.35s, chevauche le titre) → titre ligne 2 (0.68s) → trait rouge sous le titre (1.5s) → bouton devis (0.6s) → reflet en boucle sur le bouton (1.4s, se répète).
- **Logo** (`css/header.css`, `.site-header__logo img`) : "focus pull" — flou + échelle réduite + opacité 0 vers net, `--ease-premium` (expo-out).
- **Titre hero** (`css/hero.css`, `.hero__title-line`) : rideau par ligne — `overflow:hidden` sur la ligne, le texte glisse depuis en-dessous avec un flou qui se résorbe (`.hero__title-line__inner`), stagger entre les 2 lignes. Remplace un essai précédent en "machine à écrire" (`steps()` + caret clignotant) jugé trop plat.
- **Trait rouge** (`.hero__title-accent`) : signature de marque, `scaleX(0)→1`, ancre le rouge cFc dès la première seconde plutôt que d'attendre le logo/bouton.
- **Nav** (`.site-header__nav`) : le verre se "condense" — `backdrop-filter: blur(0)→16px` anime en même temps que `opacity`/`scale`, pas un simple slide.
- **Bouton devis** (`.site-header__actions .btn-red`) : pop avec léger overshoot (`--ease-pop`, cubic-bezier back), puis le reflet en boucle déjà en place prend le relai.
- Tokens ajoutés dans `css/tokens.css` : `--ease-premium` (entrées), `--ease-pop` (élément qui "pop"). Tout est coupé sous `prefers-reduced-motion: reduce`.
