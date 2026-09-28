# Cosmos : comment le site a été construit

Refonte premium du site du restaurant Cosmos (buffet à volonté asiatique, 650 couverts,
1156 Rte de la Braconne, Champniers). Démo de prospection construite les 27 et 28 septembre 2026, puis retravaillée section par section
avec Julien le 28 septembre (voir §14 : ce qui a changé et pourquoi).
Ce document retrace tout : le scraping, les décisions, le filtre photo, l'architecture, chaque
effet section par section, l'organisation en agents, la vérification et ce qui reste à faire.

**Lancer le site en local**
```
cd projects/cosmos-champniers/site
python3 -m http.server 5178        # puis http://localhost:5178/ et /evenements.html
node tools/build.mjs               # après toute modif d'un fichier de partials/
```
Sur téléphone (même Wi-Fi) : `http://<IP du Mac>:5178/`.

---

## 1. Chronologie du process

| Étape | Ce qui a été fait | Résultat |
|---|---|---|
| 1. Scraping du site actuel | `curl` des pages (home, contact, module de réservation), CSS, JS, 19 images ; captures Playwright desktop + mobile ; décodage de l'email protégé par Cloudflare | `site-scrape/` + `site-scrape/SCRAPE.md` (copy intégrale, branding, fonctionnalités, faiblesses) |
| 2. Photos Instagram | 39 images du compte @cosmos.champniers (récupérées avant, via Chrome connecté) | `assets/instagram/` |
| 3. Références de Julien | 12 captures de reels (sites "premium" montrés sur écran) | `references/reels/` |
| 4. Interview | 3 séries de questions (voir §2) | Direction figée |
| 5. Avis Google | Recherche de la fiche par Playwright, conversion de l'identifiant (CID), scraping des avis | Note 4,6 / 1 536 avis + 5 avis complets dans `data/google-reviews.json` |
| 6. Logo | Photo de profil Instagram (100 px seulement) + visuels "Recrutement" 2048 px | Logo redessiné en SVG : `site/assets/logo/cosmos-mark.svg` |
| 7. Filtre photo | Script d'étalonnage commun, testé en avant/après puis renforcé | 53 photos exportées en 2 tailles : `site/assets/img/` |
| 8. Socle commun | Charte CSS, moteur JS, contenu réel centralisé, nav, build, brief | `site/css/base.css`, `js/core.js`, `js/content.js`, `BRIEF.md` |
| 9. Construction | 5 agents en parallèle, un par groupe de sections | 10 sections + page Événements + panneau résa |
| 10. Intégration | Vérification globale par le thread principal, corrections | Voir §9 et §10 |

## 2. Les décisions (interview du 27/09)

- **Objectif** : démo de prospection (pas de back-office, pas de mise en ligne réelle).
- **Direction artistique** : « Nuit cosmique néon », fidèle à leur vraie déco (tunnels bleus,
  plafonds planètes, néons).
- **Mouvement** : immersif ET dynamique mélangés dans un seul site (scroll narratif pour les
  grands moments, carrousels et parallaxe entre les deux).
- **Vidéo** : non. Tout le mouvement vient du code, à partir de photos fixes.
- **Rendus 3D d'avant l'ouverture** : oui, avec un filtre commun pour les fondre aux vraies photos.
- **Ajouts** : tarif du moment + badge Ouvert/Fermé, page Événements + devis, avis Google + carte.
- **Réservation** : interface refaite dans la charte, en panneau intégré (maquette).
- **Structure** : one-page + page Événements.
- **Hero** : « le voyage dans le tunnel ».
- **Priorité** : qualité max, pas de délai.

Les références de reels ont servi de **structure, jamais de peau** : ERA Residence (titre serif
géant sur photo plein écran, image qui se scinde en panneaux), jakeuiux (écran coupé liste à gauche
et photo à droite, gros plans plein écran). Couleurs et typo restent celles de Cosmos.

## 3. Les photos

**Sources** : 39 photos Instagram (dont environ la moitié de rendus 3D d'avant l'ouverture) +
19 photos du site actuel (buffet, salle). Inventaire : `docs/images/01-inventaire-photos-sources.jpg`.

**Le problème** : rendus 3D léchés et photos téléphone très blanches ne ressemblent pas à la même
série. **La solution** : un étalonnage commun, `site/tools/grade.py`.

Ce que fait le filtre, dans l'ordre :
1. **Saturation sélective** : tout est désaturé (×0,62) sauf les bleus (néons, écrans) et les tons
   chauds (nourriture), qui gardent leur couleur. Le regard va sur ce qui compte.
2. **Noirs écrasés** : le point noir remonte de 6 %, puis gamma ×1,28 pour baisser l'exposition
   (ambiance nuit), puis contraste renforcé.
3. **Mi-tons refroidis** : léger décalage vers le bleu (R ×0,9, B ×1,12).
4. **Split-toning** : les ombres tirent vers un bleu nuit profond, les hautes lumières vers un
   blanc chaud (lumière de lampe). C'est ce qui fait que la nourriture reste appétissante.

Avant/après : `docs/images/02-filtre-avant-apres.jpg`. Première version jugée trop discrète,
paramètres poussés ensuite.

**Export** : `site/tools/export-images.py` contient le mapping nom lisible → fichier source
(ex. `tunnel-render` → `cosmos_DaKZ5IHDA98_3.jpg`) et sort chaque photo en `nom.webp` (2000 px) et
`nom-sm.webp` (1000 px), WebP qualité 80. Toutes les images du site utilisent `srcset` pour que
le mobile charge la petite taille. Résultat : `docs/images/03-photos-etalonnees-exportees.jpg`.

**Piège noté** : il n'existe aucune photo de wok en action. La photo `wok.webp` du site actuel
montre en fait des brochettes (légende d'origine « Brochettes »). Aucune photo n'est légendée
« wok » sur le nouveau site.

Un **grain film** global (bruit SVG en `mix-blend-mode: overlay`, opacité 7 %) finit de lier
rendus et photos.

## 4. Le logo

La seule source propre est la photo de profil Instagram, qui ne fait que 100 px. La même icône
existe en 2048 px sur les visuels « Recrutement », mais entourée de texte. Le logo a donc été
**redessiné en SVG** : cercle d'orbite, planète bleue `#039ae4` (couleur mesurée sur le visuel),
3 anneaux inclinés qui passent derrière la moitié haute de la planète (masque SVG).
Comparaison : `docs/images/04-logo-original-vs-svg.png`. C'est une approximation : il faudra
demander le fichier vectoriel d'origine au client.

## 5. La charte (`site/css/base.css`)

Palette tirée du vrai matériau, pas inventée :

| Token | Valeur | D'où ça vient |
|---|---|---|
| `--night` | `#020812` | fond espace profond |
| `--navy` | `#041930` | bleu nuit du site actuel |
| `--blue` | `#039ae4` | la planète du logo : accent principal, boutons, halos |
| `--neon` | `#5fc8ff` | halos néon, focus |
| `--warm` | `#f2bb96` | pêche du titre « Tarifs » du site actuel : prix, nourriture |
| `--text-2` | `#9db0c6` | bleu gris du slogan actuel |

- **Typo** : Marcellus (titres, wordmark, prix) + Karla (texte), les deux polices du site actuel,
  gardées pour la continuité de marque.
- **Boutons « Orbite »** (un seul style sur tout le site, choisi par Julien le 28/09 parmi une
  quinzaine de variantes, planches dans `site/_variants/boutons*.html`) : pilule fond nuit
  translucide, et un anneau bleu planète → blanc qui **tourne en continu autour du bouton**
  (`@property --orbit` + `conic-gradient` masqué en bordure), plus vite au survol. `--primary` et
  `--ghost` existent encore comme classes mais n'ont plus de différence visuelle.
- **Eyebrows** (petites capitales + point lumineux) : la classe existe encore mais **Julien les a
  toutes fait retirer** (jugées « AI slop »). Ne pas en remettre.
- **Badge en direct** : point vert qui pulse ; retiré de la nav et du hero, encore présent dans
  Infos pratiques.

## 6. Architecture technique

```
site/
  index.html            GÉNÉRÉ (ne pas éditer) par tools/build.mjs
  evenements.html       page autonome
  BRIEF.md              règles données aux agents
  partials/             00-nav, 10-hero, 20-buffet, 22-reserver, 25-avis, 27-tarifs,
                        28-prive, 50-salle, 80-infos, 89-close-main, 90-footer (+ _head, _foot)
                        (l'ordre alphabétique = l'ordre de la page)
  css/base.css          charte partagée
  css/sections/*.css    un fichier par section (préfixé #id)
  css/pages/            styles propres à evenements.html
  js/content.js         TOUT le contenu réel + logique « tarif du moment »
  js/core.js            moteur partagé
  js/sections/*.js      un script par section
  js/pages/             scripts propres à evenements.html
  assets/img/           photos étalonnées (2 tailles)
  assets/logo/          logo SVG
  tools/                grade.py, export-images.py, build.mjs, dev/ (scripts de test)
  _variants/            planches de comparaison (boutons) + sections retirées (retire-wok/)
  _shots/               captures de vérification (non versionnées, ~134 Mo)
```

**Pile** : HTML/CSS/JS sans framework, GSAP 3.12 + ScrollTrigger (animations liées au scroll),
Lenis (défilement fluide), le tout en CDN.

**Le build** (`tools/build.mjs`) : assemble les partials par ordre alphabétique et injecte
automatiquement tous les CSS et JS de sections. Il ajoute aussi un `?v=<horodatage>` à chaque
CSS/JS local (aussi dans `evenements.html`) : sans ça le navigateur gardait l'ancienne version en
cache et Julien voyait des corrections « pas faites ». Ça a permis aux 5 agents de travailler en même
temps sans jamais toucher au même fichier.

**Le moteur** (`js/core.js`) :
- `Cosmos.register("id", fn)` : chaque section s'enregistre ; le moteur les lance **dans l'ordre
  du DOM** (important pour que les sections épinglées se calculent dans le bon ordre), après le
  chargement des polices, puis recalcule toutes les positions.
- Lenis branché sur ScrollTrigger.
- Remplit tout `[data-live-status]` (« Ouvert · ce soir 29,90 € ») et `[data-live-price]`,
  rafraîchi chaque minute.
- Tout bouton `[data-resa]` ouvre le panneau de réservation (repli : lien vers leur module actuel).
- Nav **toujours visible, jamais de bande sombre derrière** (demande de Julien) : liens dans une
  pastille de verre centrée, logo et téléphone lisibles grâce à une ombre portée. Burger + menu
  plein écran sous 1280 px.
- `body.is-intro` masque la nav pendant l'intro du logo ; la classe `.nav.is-away` (posée par la
  timeline du hero) la cache pendant la plongée dans le tunnel, elle revient sur l'écran 2.
- **Contrat de vérification** : `?jump=<y>` charge la page déjà scrollée avec tous les états
  d'animation figés au bon endroit, puis `window.__ready = true`. C'est ce qui permet de
  capturer n'importe quel instant d'une animation au scroll.
- `prefers-reduced-motion` : Lenis désactivé, chaque section affiche son état final sans
  animation ni épinglage.

**Le contenu** (`js/content.js`) : prix, horaires, textes, avis complets, champs du formulaire de
réservation, recopiés exactement du site actuel. Les agents avaient interdiction d'inventer un
fait. Tous les textes sont aussi écrits en dur dans le HTML (référencement).

## 7. Les effets, section par section

Ordre actuel de la home : **hero → buffet → réserver → avis → tarifs → salles privées → la salle
→ infos → footer**.

### Hero « le voyage dans le tunnel » (`hero.*`)
1. **Intro (≈2,9 s, une seule fois)** : écran noir, l'orbite puis les 3 anneaux du logo se
   **tracent** (`stroke-dashoffset`), la planète **s'allume avec 3 grésillements** façon enseigne
   néon, puis la photo arrive trop grande (×1,2) et se pose. Scroll et nav bloqués pendant l'intro,
   filet de sécurité CSS si le JS plante.
2. **Écran tunnel** : « COSMOS » géant, **Ken Burns** lent, **parallaxe souris** (desktop). Sous le
   mot : la **note Google** (4,6, 5 étoiles avec la dernière remplie à 60 % par un `clipPath`,
   « 1 558 avis », sans le mot Google) puis les 2 boutons Orbite agrandis. Tout est centré.
   Retirés à la demande de Julien : pastille « Fermé · ouvre ce midi », eyebrow « Buffet à volonté
   · 7 jours sur 7 », indicateur vertical « ENTREZ ».
3. **Plongée** (pin 280 %, scrubé) : la nav s'efface, l'UI part, zoom ×3,4 dans le tunnel sur le
   point de fuite réel, « COS » / « MOS » s'écartent.
4. **Atterrissage** : passage par le noir, puis la grande salle (`salle-bleue`, vraie photo au
   coucher du soleil choisie par Julien parmi 10) arrive à ×1,1 et recule. La nav revient.
5. **Écran 2 « Le plus grand restaurant asiatique de la Charente »** :
   - titre mot par mot (chaque mot monte avec une légère rotation) ;
   - paragraphe **mot à mot, du flou au net** ;
   - **650 en compteur déroulant** façon odomètre : chaque chiffre est une bande 0-9 (deux tours)
     qui roule jusqu'à sa valeur, décalée ; largeur de colonne mesurée sur le chiffre final
     (Marcellus n'a pas de chiffres à chasse fixe) ; `clip-path` au lieu d'`overflow` et halo en
     `drop-shadow` sur une rangée parente, sinon un rectangle sombre apparaît autour du halo ;
   - trait néon qui se dessine sous le 650, « couverts » qui glisse ;
   - **ambiance continue très légère** : la photo respire (zoom 18 s aller-retour), un voile de
     lumière bleue traverse la salle (~11 s), le 650 pulse. Coupé en `reduced-motion`.
   - Lisibilité : **ombre localisée derrière le texte** (dégradé radial), pas de bande sombre
     pleine largeur (Julien refuse d'assombrir les photos).
6. Sous le pin, le second paragraphe s'allume mot par mot.

### Buffet (`buffet.*`)
- Titre **« Le meilleur de l'Asie, à volonté »** (retour à la ligne forcé après la virgule sur
  desktop), sous-titre « Sushis roulés sur place, fruits de mer, plats chauds, grill et desserts.
  Servez-vous autant que vous voulez. »
- **6 photos seulement**, **toutes carrées et de même taille** (y compris la carte titre et la
  carte finale) : grill, sushis, fruits de mer, pizzas, sashimis, desserts.
- Défilement horizontal épinglé (desktop) avec parallaxe dans chaque carte et zoom qui se relâche ;
  carrousel au doigt sur mobile.
- Retirés : compteurs « 01 / 12 », barre de progression, « Faites défiler → », eyebrows, badge
  statut, bouton « Voir les tarifs ». Carte finale : « Il ne manque plus que vous. » + un seul
  bouton Réserver, centrés.

### Réserver (`reserver.*`, nouvelle section du 28/09)
Réservation **pas à pas, une question à la fois** (Julien ne voulait pas « un vieux formulaire
chiant ») :
1. « Combien serez-vous ? » : gros compteur −/+ (10 à 30, règle réelle du module actuel ;
   au-delà, renvoi au téléphone) ;
2. « Quel jour ? » : les 14 prochains jours en pastilles ;
3. « Midi ou soir ? » : 2 cartes avec horaires et **prix réel du jour choisi** ;
4. « À quelle heure ? » : créneaux tous les 15 min (heures passées masquées si c'est aujourd'hui) ;
5. « À quel nom ? » : nom, téléphone (regex FR du module actuel), email, message facultatif.

Les étapes glissent de l'une à l'autre, barre de progression en haut. À gauche, une **carte
d'embarquement Cosmos** se remplit à chaque réponse (chaque ligne est cliquable pour revenir la
modifier) et calcule une **estimation** (nb × tarif adulte). À la fin, **tampon « Confirmé »**
qui s'imprime sur la carte + message de succès du module actuel. Envoi simulé (démo).
Note : les boutons « Réserver » de la nav/autres sections ouvrent encore l'ancien panneau latéral
(`resa.*`), pas cette section.

### Avis (`avis.*`, déplacé sous la réservation)
- Titre « Ce qu'en disent nos clients » + note 4,6 / « 1 558 avis Google ↗ » centrés (lien fiche).
- **Bandeau qui défile à l'infini** (série clonée en `aria-hidden`, animation CSS décalée d'une
  série exacte, 62 px/s), pause au survol, bords fondus au masque.
- **Cartes toutes identiques** (même taille, verre très léger, étoiles dorées), texte coupé à
  4 lignes ; « Lire l'avis » (seulement si le texte est coupé) ouvre l'avis complet dans un
  `<dialog>`.
- **17 avis réels** (`data/google-reviews-2026-09-28.json`) : uniquement 4 et 5 étoiles avec un vrai
  texte, **notes et dates alternées** (heures / jours / semaine / mois) pour que ça ne fasse pas
  « que des 5 ». Écartés : 1-3 étoiles, les 4 étoiles qui sont en fait des critiques, les
  « Très bien » d'un mot, l'avis sur les desserts. Les dates (« il y a 17 heures ») sont figées :
  sur un vrai site, brancher l'API Google Places.
- Récupération : Google ne montre que 3-5 avis sans compte, et Maps fige l'extension Chrome. Ce
  qui a marché : Julien trie par « plus récents » dans son navigateur et colle un petit script dans
  la console Safari (`copy(JSON.stringify(...))` sur `div.jftiEf`, `.d4r55`, `.kvMYJc`, `.rsqaWe`,
  `.wiI7pd`). Sous Safari, `copy` ne marche pas dans un `setTimeout`.

### Tarifs (`tarifs.*`, déplacé sous les avis)
- Fond conservé : planète floutée + étoiles canvas.
- **3 cartes adultes identiques** (Midi 20,90 / Soir 27,90 / Week-end 29,90) avec le prix en très
  grand, puis une **bande Enfants** pleine largeur (6-9 ans, 3-5 ans midi/soir, moins de 3 ans
  gratuit). Choisi par Julien (« incroyable b ») contre une version 2 cartes Adultes/Enfants.
- Carte du service en cours : surélevée, **anneau Orbite** (même effet que les boutons) + étiquette
  « En ce moment » / « Prochain service » (mise à jour chaque minute).
- Effets : cartes empilées et inclinées au centre qui **s'ouvrent en éventail** au scroll (scrub),
  **tilt 3D + lumière bleue qui suit le curseur + liseré qui s'allume** au survol. Cartes en verre
  bleu nuit plus clair que le fond, reflet en haut, ombre + lueur bleue (« qu'elles ressortent »).
- Retirés : gros bloc « tarif du moment » avec compteur, carte Paiements (les paiements restent
  dans Infos pratiques), eyebrow.

### Salles privées (`prive.*`, déplacé sous les tarifs)
- Plein écran sur la **table ronde aux fauteuils orange** (`prive-table-ronde`), qui se scinde en
  3 panneaux ; gauche = salle à la grande table en marbre, droite = vraie photo de salle privée.
- **Minimaliste, sur l'image dès l'arrivée** (plus d'animation de titre) : « Salles privées »,
  une ligne « Anniversaires, repas de famille, soirées d'entreprise. », bouton « Découvrir » vers
  `evenements.html`. Ombre localisée derrière le texte. Le long paragraphe, les pastilles et
  « Demander un devis » ont été retirés (ils sont sur la page Événements).

### La salle « Bienvenue à bord » (`salle.*`)
- Carrousel coverflow en boucle (drag avec inertie, flèches, clavier) et ouverture plein écran
  FLIP, inchangés. Retirés : eyebrow, pastille « 650 couverts », « Faites glisser pour
  explorer », compteurs « 01 / 11 ».

### Infos pratiques « Cap sur Cosmos » (`infos.*`)
- Façade qui s'ouvre, statut en direct, horaires, adresse, téléphone, email, **paiements**, carte
  Google teintée nuit, Itinéraire. Eyebrow retiré.

### Wok & grill : retiré le 28/09
Fichiers rangés dans `site/_variants/retire-wok/` (remettable en les recopiant dans `partials/`,
`css/sections/`, `js/sections/`).

### Footer (`footer.*`)
- Logo qui tourne lentement, 4 colonnes, wordmark « COSMOS » qui monte lettre par lettre.

### Panneau de réservation (`resa.*`, sur toutes les pages)
- Reproduit exactement le module actuel (champs, créneaux, 10-30 personnes, messages), tarif du
  jour en tête, envoi simulé. Ouvert par tout `[data-resa]`.

### Page Événements (`evenements.html`)
Hero avec zoom d'entrée et titre mot par mot, texte réel, 4 occasions en défilement horizontal,
galerie, formulaire de devis (démo). **Tous les eyebrows retirés** le 28/09.

## 8. Fonctionnalités ajoutées

- **Tarif du moment + Ouvert/Fermé** (`content.js` → `status()`) : applique la vraie grille
  (midi lun-ven 20,90 € ; soir lun-jeu 27,90 € ; vendredi soir, samedi, dimanche et fériés
  29,90 €), avec les jours fériés français calculés (dont Pâques, Ascension, Pentecôte). Testé
  sur 7 cas.
- **Référencement de base**, absent du site actuel : vrai titre et description, balises de
  partage, favicon, données structurées Google « Restaurant » (adresse, horaires, note 4,6,
  paiements).

## 9. Organisation en agents

Après le socle posé par le thread principal, **5 agents en parallèle** :

| Agent | Fichiers |
|---|---|
| Hero | `10-hero`, `hero.css/js` |
| Buffet + wok | `20-buffet`, `30-wok` |
| Tarifs + salle | `40-tarifs`, `50-salle` |
| Fin de page | `60-prive`, `70-avis`, `80-infos`, `90-footer` |
| Résa + Événements | `resa.css/js`, `evenements.html`, `css/js/pages/` |

**Ce qui a fait marcher le parallèle** :
- Un `BRIEF.md` commun lu en entier avant de coder : direction figée, palette imposée, règles de
  contenu, API du moteur, protocole de vérification.
- Chaque agent **propriétaire de ses fichiers**, lecture seule sur le reste. Le build assemble
  tout, donc jamais d'écriture concurrente.
- Scénario d'animation déjà décrit section par section dans chaque consigne : les agents
  exécutaient, ils ne renégociaient pas la direction.
- Obligation de **regarder leurs captures** (début, milieu, fin de chaque animation, desktop et
  mobile) avant de rendre.

**Leçon** : le dossier temporaire était partagé entre agents, et l'un a écrasé un script d'un
autre. À l'avenir, imposer un sous-dossier par agent dès le brief.

## 10. Vérification et corrections d'intégration

Contrôles faits par le thread principal sur le site assemblé :
- Audit (`tools/dev/audit.cjs`) : **0 erreur console**, **0 débordement horizontal**, **1 seul h1**
  par page, sur desktop et mobile, home et Événements.
- Parcours complet par captures (`tools/dev/walk.cjs`) : planches `docs/images/06` à `11`.
- Intro filmée en conditions réelles (sans raccourci) : `docs/images/05-intro-hero-resa.jpg`.
- Test de fluidité (`.agents/skills/site-revamp/scripts/verify.js jank`) sur toute la home :
  **PASS, max 20 ms par image, aucune au-dessus de 50 ms**.

Corrections faites à l'intégration :
1. **Polices** : le moteur attendait toujours 3 s (une feuille Google Fonts externe ne se laisse
   pas inspecter). Corrigé avec `document.fonts.load` : page prête en **0,3 s au lieu de 3,2 s**.
2. **Nav invisible** tant que le hero n'existait pas : la classe d'intro est maintenant retirée
   par le moteur à la fin de l'intro, et tout de suite en mode capture ou mouvement réduit.
3. **Buffet trop long** (≈11 écrans de scroll) : la piste avance maintenant 1,7× plus vite que le
   scroll (≈6 écrans).
4. **Vide mobile** entre buffet et wok : resserré.
5. **Footer** sorti de `<main>` (partial `89-close-main`).
6. Corrigés par les agents eux-mêmes : double exposition du fondu tunnel/salle, écran de succès
   affiché sous le formulaire (conflit `display:flex` / `hidden`), coins blancs de la carte,
   saccade à l'entrée du buffet, horaires coupés.

## 11. Points faibles et suite

**Connus**
- Au bout du zoom tunnel, l'image est un peu floue (1787 px agrandis ×3,4), en grande partie
  masquée par le fondu.
- Photos buffet du site actuel petites (900-1200 px) : un peu molles sur écran Retina.
- Panneaux des salles privées étroits sur mobile (≈107 px chacun).
- Deux systèmes de réservation coexistent (section pas à pas + ancien panneau latéral) : à
  unifier (faire pointer les boutons « Réserver » vers `#reserver`).
- Dates des avis figées au 28/09 ; pas de mise à jour automatique.
- Réservation limitée à 10-30 personnes (règle réelle) : proposer au client de l'ouvrir à tous.
- Galerie de la page Événements sans lightbox.
- Jamais testé sur un vrai iPhone (swipe, inertie, barre d'adresse Safari).

**Avant de montrer au client / de déployer**
- Tester sur téléphone réel.
- Demander au client : logo vectoriel, photos HD du buffet, photos de vraies salles privées.
- Télécharger GSAP et Lenis en local au lieu du CDN.
- Déployer (Vercel ou le VPS, voir `.agents/skills/vps-deploy/`) en ne copiant que `index.html`,
  `evenements.html`, `css/`, `js/`, `assets/` (pas `_shots/`, `tools/`, `partials/`).
- Brancher les vrais formulaires (résa + devis) si le client signe.

## 12. Où se trouve quoi

| Dossier | Contenu |
|---|---|
| `site/` | le site |
| `site/_shots/<section>/` | captures de vérification (≈134 Mo, exclues de git) |
| `site/_variants/` | planches boutons + section wok retirée |
| `site/tools/` | filtre photo, export, build ; `dev/` = scripts de test et de scraping |
| `site-scrape/` | le site actuel scrapé + `SCRAPE.md` |
| `assets/instagram/` | 39 photos Instagram brutes |
| `assets/logo/` | avatar Instagram d'origine |
| `data/google-reviews.json` | 5 premiers avis Google bruts (27/09) |
| `data/google-reviews-2026-09-28.json` | les 17 avis affichés (sélection du 28/09) |
| `references/reels/` | les 12 captures de reels de Julien |
| `docs/images/` | planches avant/après, logo, parcours complet desktop/mobile |

## 13. Réutiliser la méthode pour un autre client

1. Scraper le site actuel + Instagram + avis Google (scripts dans `site/tools/dev/`).
2. Interview courte : objectif, DA, intensité de mouvement, vidéo ou non, ajouts, structure.
3. Écrire un filtre commun adapté à l'ambiance (partir de `grade.py`, changer les couleurs de
   split-toning), exporter en 2 tailles.
4. Poser le socle : `content.js` (vrai contenu uniquement), `base.css` (palette tirée du
   matériau réel), `core.js` + `build.mjs` réutilisables tels quels.
5. Écrire le `BRIEF.md`, décrire le scénario de chaque section, lancer un agent par groupe de
   sections avec des fichiers séparés.
6. Vérifier soi-même le site assemblé (audit, parcours par captures, fluidité, intro réelle)
   avant d'annoncer que c'est prêt.

## 14. Session du 28/09 avec Julien : ce qui a changé et les règles à retenir

Retouches faites en direct, section par section, à partir de captures d'écran de Julien.

**Règles de goût de Julien (à appliquer d'office sur ses prochains sites)**
- **Pas d'« AI slop »** : aucun eyebrow à point lumineux, aucun compteur « 01 / 12 », aucune
  barre de progression décorative, aucun « Faites défiler / glisser », aucune pastille de statut
  décorative, aucun indicateur de scroll vertical. Tous retirés du site.
- **Minimaliste sur les photos** : titre court, une ligne de texte, un bouton. Pas de pavé.
- **Ne pas assombrir les images** : pas de bande noire pleine largeur ; une ombre radiale
  localisée derrière le texte.
- **Nav jamais masquée au scroll, jamais de bande sombre** ; cachée seulement pendant l'intro du
  logo et la plongée du tunnel.
- **Un seul style de bouton partout** (Orbite).
- **Cartes uniformes** (même format, même taille) dans les galeries et les avis.
- **Des effets, mais légers** : apparitions au scroll, tilt, lumière qui suit la souris, compteur
  déroulant. Une version « propre mais sans effet » a été jugée trop plate.
- **Copy** : concret, ni plat ni trop « punchy ». Rejetés : « Un comptoir qui donne faim »,
  « Une assiette ne suffira pas », « sous un même toit ». Retenu : « Le meilleur de l'Asie, à
  volonté » (repris de la description officielle).
- Quand un choix de design n'est pas évident : **montrer une variante dans une page à part**
  (`index-xxx.html` généré depuis `index.html`), Julien compare et tranche.

**Réorganisation** : buffet → réserver → avis → tarifs → salles privées → salle → infos. Wok
retiré.

**Piège cache** : sans le `?v=` ajouté par le build, Julien voyait l'ancienne version ; lui
rappeler Cmd + Maj + R en cas de doute.
