# AGENTS.md

Site pour Driving Sens — "Perfectionnement au pilotage" (coaching/stage de conduite sportive,
perfectionnement circuit). Client réel, **hors BTP** (comme `navarro-location-voiture`,
`brulerie-mouton-noir`) — ne pas mélanger avec les priorités 90 jours BTP. Pas de site existant
identifié à ce jour — build neuf, pas une refonte au sens `site-revamp`. Site statique HTML/CSS/JS,
pas de build — `npx --yes serve -l 8123 .` pour tester en local (serveur généralement déjà lancé,
vérifier avant d'en relancer un).

## Marque

- **Logos sources fournis par Julien** (2026-09-09) : `assets/brand/logo-1.png` (blanc, fond
  transparent) et `logo-2.png` (couleur, bleu `#34478f` échantillonné au pixel). Gardés tels quels
  en référence — plus utilisés directement dans le site (voir vectorisation ci-dessous).
- **Vectorisé en SVG le 2026-09-13** via `potrace` (outil local, `brew install potrace`, aucun
  service tiers) — le logo est un dessin plat (silhouette + typo), donc une vraie vectorisation bat
  largement un upscale IA : résultat net à n'importe quelle taille, fichier minuscule. Process :
  extraire le canal alpha du PNG source → inverser (forme en noir, fond blanc, ce que `potrace`
  attend par défaut) → tracer → recolorer `fill` en `#ffffff`. Fichiers actuels, tous dérivés de
  `logo-1.png` :
  - `logo-full.svg` — lockup complet, utilisé dans le header (`.site-header__brand img`). **Pas une
    trace directe** : composite de 3 morceaux (`logo-icon.svg` + `logo-word.svg` + un tracé de
    baseline durci, voir ci-dessous), chacun repositionné par `<g transform="translate(x,y)">` à sa
    coordonnée exacte dans le lockup 462×156 (icône à `33,0`, wordmark à `0,88`, baseline à
    `66,143` avec `scale(0.25)` en plus car sa trace vient d'un bitmap 4× plus grand).
  - `logo-icon.svg` (voiture, viewBox 388×63), `logo-word.svg` ("DRIVINGSENS", viewBox 462×43),
    `logo-tag.svg` (baseline "PERFECTIONNEMENT AU PILOTAGE", viewBox 1296×48) — les 3 pièces
    utilisées séparément par l'animation d'intro (voir plus bas).
  - **Piège rencontré et corrigé (2026-09-14)** : la baseline tracée directement depuis le PNG
    source (bitmap 324×12 seulement, donc trait très fin) restait illisible à l'échelle réelle du
    site — signalé par Julien via capture. Un `-morphology Dilate` classique sur le bitmap à sa
    résolution native **blobbe/fusionne les lettres** (1px de dilate sur un texte haut de 12px est
    énorme). Fix : **upscaler le bitmap ×4 (Lanczos) avant de dilater** (`magick ... -resize 400%`
    puis `-morphology Dilate Octagon:1`), ce qui donne l'équivalent d'un dilate à ~0,25px — texte
    bien plus épais et net, sans fusion. Si un futur élément tracé ressort trop fin, réappliquer
    cette recette (upscale d'abord, dilate ensuite) plutôt qu'un dilate direct.
  - Si Julien retrouve un jour le vrai fichier vectoriel d'origine (Illustrator/Figma/Canva), le
    substituer directement — toujours mieux qu'une trace, même propre.

## Header / nav

- Layout : logo à gauche, nav centrée, CTA "Réserver un stage" à droite (`css/header.css`).
- **4 vrais noms de section confirmés par Julien le 2026-09-14** (capture d'écran, format 4
  colonnes fond sombre avec lettres A/B/C/D — voir note plus bas, ce visuel a un potentiel pour une
  section "nos univers" plus loin sur la page, pas juste pour le menu) :
  1. **Performance & Passion**
  2. **Sérénité & Confiance**
  3. **Entreprise & Collectif**
  4. **Industrie & Marques**
  Utilisés tels quels dans `.site-header__nav` (`index.html`). Les ancres (`#performance-passion`
  etc.) ne pointent vers rien encore — les 4 sections correspondantes restent à construire une fois
  le contenu de chacune connu.

## Références vidéo (2026-09-13) — analysées, jamais committées au repo

8 screen-recordings de Reels Instagram fournis par Julien (`~/Downloads/ScreenRecording_09-13-2026
*.MOV`, portrait 828×1792, natif **60fps**, tous très courts 1-3.6s), **une animation distincte
par fichier — les 8 doivent être répliquées dans le site, aucune à laisser de côté ni à
fusionner**. Frames extraites en scratchpad, analysées puis supprimées une fois le principe
transposé (même garde-fou que le skill `video-teardown` : jamais le contenu tiers tel quel).

**Historique de l'analyse — 3 passes, à ne pas répéter** : une 1ère passe à 8-12fps a donné des
descriptions trop vagues/fausses (ex. logo décrit comme "extrusion 3D à répliquer en Blender",
clip 2 décrit comme "image qui s'agrandit en plein écran"). Julien a signalé que le mouvement réel
tient dans une fraction de seconde à ces vidéos très courtes — invisible à cet échantillonnage.
**2e passe à 24fps** un peu mieux mais toujours insuffisante sur les transitions rapides. **3e
passe au frame-rate natif (60fps, toutes les frames, aucune sautée)** a permis de voir le vrai
mécanisme de chacune — c'est cette 3e passe qui fait foi, ci-dessous. **Leçon pour toute future
analyse vidéo courte/rapide sur ce projet : toujours extraire au frame-rate natif dès le départ,
jamais un fps arbitraire réduit — ces Reels sont montés pour des transitions de 0,15-0,25s que
8-24fps rate ou floute.**

1. **`12.MOV` — logo reveal ("SetBy", `ayzz.thedesigner`)** — tenue statique fond rouge + wordmark
   (~1,3s), puis transition rapide (~0,2s, 10-12 frames) : **des barres verticales de largeurs
   inégales qui se lèvent en escalier avec un léger décalage de timing entre elles** (façon volet
   vénitien/glitch — pas un pliage/extrusion 3D), qui révèlent un objet 3D rendu (boîte produit),
   tenu statique ensuite. **Décision : pas besoin de Blender** — le balayage à barres se fait en
   CSS/canvas (largeurs + délais différents par barre), et ce qu'il révèle pour nous c'est
   directement la vraie photo hero (voiture sur circuit), pas une scène à modéliser.
2. **`17-53-36_1.MOV` — titre qui grandit sur photo fixe (mag "Cookie", kryntixstudio)** — la photo
   magazine reste fixe (pas d'agrandissement plein écran, correction vs. passes précédentes) ; un
   gros titre serif ("ARCHITECTURE") se fond en transparence par-dessus et **grandit en échelle +
   letter-spacing qui s'ouvre** au fil de la séquence.
3. **`17-59-56_1.MOV` — objet 3D en rotation continue + fond dégradé (mockup écran, `jakeuiux`)** —
   ruban/arc matériau 3D en **rotation continue** (pas de coupures), fond qui cycle en dégradé de
   couleur en continu (orange → taupe → violet → magenta → rouge), contenu de site visible en
   filigrane derrière/à travers l'objet translucide. Même famille que la vidéo 7 (`21.MOV`).
4. **`18.MOV` — split texte/image, wipe diagonal (`jakeuiux`)** — mockup laptop, chaque exemple
   (route sinueuse "360° partner for safety in electromobility" → usine/logistique) tenu ~0,5-0,7s
   puis remplacé par **un wipe diagonal** (pas un crossfade simple, pas un panoramique horizontal),
   label texte qui change en même temps. Se termine par **un zoom qui grossit un objet 3D orange
   jusqu'à remplir l'écran** — c'est la bascule vers `21.MOV`, ces deux vidéos sont deux morceaux
   du même Reel enregistrés séparément.
5. **`19.MOV` — même mécanique de wipe diagonal, 6 exemples (`jakeuiux`)** — suite du même Reel que
   `18.MOV` : gaz/flammes bleues → cookware → colis/logistique → étincelles de soudure → terrain de
   foot → robotique/F1, chaque panneau tenu puis wipe diagonal vers le suivant.
6. **`20.MOV` — fondu-enchaîné éditorial, pas de wipe (immobilier de luxe "Golden Embers",
   kryntixstudio)** — mécanique différente de 4/5 : **fondu-enchaîné lent** (dissolve, pas de bord
   dur) entre photos plein cadre et cartons de titre serif ("NEW GOLDEN MILE", "THE COAST YOU
   WANTED THIS YEAR"), accent floral fixe en coin (à remplacer par un motif propre à Driving Sens),
   rythme calme, tenues longues entre chaque fondu.
7. **`21.MOV` — objet 3D batterie en rotation + fond dégradé + vue éclatée (`jakeuiux`)** — même
   famille que `17-59-56_1.MOV` (3) : pack/arc 3D en rotation continue, fond en dégradé continu
   (rouge → orange → taupe → gris → bleu) synchronisé à des labels qui se fondent ("Up to 1,000°C" →
   "Flammability" → "Electrical Insulation"), **se termine en vue éclatée** (les pièces de l'objet
   se séparent/s'écartent).
8. **`22.MOV` — zoom + compteur odomètre, pas de panoramique (`jakeuiux`)** — **zoom** (le cadre
   écran du mockup disparaît progressivement, l'image de la piste vue du ciel en "C" remplit tout),
   puis un **compteur qui s'incrémente très vite** (100 000 000 → 150 000 000 par pas de ~2M),
   tenue statique au maximum. **Match thématique le plus direct avec Driving Sens** (circuit +
   chiffres de perf/expérience) — bonne base pour une section chiffres-clés (heures de coaching,
   tours de piste, élèves formés...).

**Scroll horizontal-puis-vertical (question de Julien, non confirmé)** : Julien a décrit une
vidéo où le scroll devient horizontal vers la droite puis repart soudainement en vertical. Examen
frame par frame natif des 8 vidéos : **aucune ne montre ce mouvement** — que des wipes diagonaux
(4, 5), fondus (2, 6), zooms (8) ou rotations d'objet (3, 7). Le plus proche est le wipe diagonal
de 4/5, mais c'est une diagonale, pas un vrai horizontal. Si Julien confirme une 9e vidéo non
envoyée, l'ajouter ici avant de conclure que la technique n'existe pas dans ce lot.

## Architecture voulue

Pas une suite de sections empilées classiques : **un seul fond continu** (noir dominant, parfois
blanc) sur lequel les éléments (texte, images) apparaissent/disparaissent/se transforment au fil
du scroll — une progression narrative continue plutôt que des blocs. Statut : intro + hero codés et
validés par Julien, prestations pas commencées (attend contenu + une nouvelle idée de Julien pour
le hero, voir "Ouvert" plus bas).

### 1. Intro logo — codé, validé (`css/intro.css` + `js/intro.js`)

**Pas** la mécanique à barres décrites dans l'analyse vidéo initiale (celle-ci reste documentée
plus bas pour mémoire mais ne s'applique plus qu'à `12.MOV` en tant que référence, pas à notre
logo). Julien a demandé autre chose pour notre propre logo, en 2 itérations :
- 1ère demande : "il éclate" → interprété comme 3 morceaux **écartés et tournés** (rotation +
  décalage horizontal, effet "cassé/craqué") puis qui se resserrent. Rejeté par Julien : "je veux
  vraiment... un burger... à la verticale... pas de rotation".
- **Version retenue** : les 3 vraies pièces du logo (`logo-icon.svg` / `logo-word.svg` /
  `logo-tag.svg`) empilées à leur position réelle, écartées **verticalement uniquement** au départ
  (icône vers le haut, baseline vers le bas, aucune rotation ni décalage latéral — façon "burger" à
   étages qui s'ouvre), qui se resserrent pour former le logo exact, tenue courte, puis **séparation
  à nouveau** (plus ample cette fois) pendant que tout l'overlay s'efface — c'est cette 2e
  séparation qui sert de transition de reveal vers le hero, pas un mécanisme séparé.
- Fond de l'intro : **noir** (`var(--ink)`), pas bleu — demande explicite de Julien 2026-09-13
  ("le logo est blanc, l'écriture est blanche, j'avais oublié" que ça ne matchait pas sur bleu).
  Le token `--blue` (`#2A4CE0`, choisi parmi 4 propositions faute de réponse de Julien sur le
  comparatif envoyé) reste défini dans `tokens.css` mais n'est plus utilisé nulle part sur la page
  actuellement — dispo si un accent bleu revient quelque part plus tard.
- **Piège technique résolu** : `transform: translateY(%)` en CSS est relatif à la taille de
  l'élément **lui-même**, pas du conteneur — avec l'icône (grande) et la baseline (minuscule), un
  même pourcentage donnait un écart minuscule pour la baseline. Fix : variable CSS partagée
  `--stage-h` sur `.intro__stage` (hauteur de la scène calculée depuis `min(46vw,340px)` × ratio
  156/462), et les 3 pièces utilisent `translateY(calc(var(--stage-h) * X))` — même unité de
  déplacement pour les 3, écart proportionnel cohérent.
- **Robustesse ajoutée** : l'ancienne version (barres générées dynamiquement en JS) pouvait laisser
  un écran noir bloqué si le JS plantait avant d'avoir peuplé les barres (signalé par Julien : "un
  fond noir, il se passe rien"). La version actuelle n'a plus ce genre de construction DOM
  dynamique fragile, et `js/intro.js` a un filet de sécurité (`setTimeout(unlock, 4500)`) qui
  débloque le scroll de force quoi qu'il arrive — jamais de blocage permanent possible.

### 2. Hero — codé, validé (`css/hero.css` + `js/hero-parallax.js`)

- Photo actuelle : `assets/img/hero-car.jpg` (fond complet) + `assets/img/hero-car-cutout.png`
  (voiture détourée, même canvas 768×432, alignement pixel-perfect automatique par superposition).
  Détourage fait en local via **`rembg`** (venv Python jetable, `pip install "rembg[cli]"` — jamais
  utilisé Higgsfield pour ça, pas besoin d'autorisation, résultat très correct). **Cette photo va
  être remplacée** — voir "Ouvert" plus bas, Julien cherche un "panning shot" profil sur Pinterest.
  Basse résolution actuelle (768×432, tout ce que contenait le fichier fourni) : à re-détourer avec
  `rembg` dès que la nouvelle photo arrive, idéalement en plus haute résolution.
- **Mécanique retenue après 2 corrections de Julien** : le fond **reste fixe et visible en
  permanence** (jamais de fondu vers le noir), la voiture (calque détouré) **grandit** au scroll,
  ancrée par `transform-origin` sur sa propre position dans l'image (`53% 64%`, bbox alpha mesurée
  au pixel) — grossir depuis ce point garantit qu'elle recouvre toujours sa propre silhouette sur
  le fond, donc jamais de "voiture fantôme" en double ni de trou qui révèle le fond nu.
  - **1er essai rejeté** : fond qui fait un fondu vers le noir pendant que la voiture translate et
    rapetisse en sortant du cadre — Julien : "tu dois pas faire reculer la voiture et qu'il y ait
    plus de fond, c'est pas ça que je voulais".
  - **Limite technique expliquée à Julien et actée** : une seule photo statique ne peut pas donner
    une vraie sensation "la voiture avance" (roues qui tournent, parallaxe entre plans, flou de
    bougé réel) — un `scale()` CSS reste optiquement un zoom, pas un mouvement, quoi qu'on fasse en
    compositing. Julien l'a confirmé lui-même via capture ("ça fait un gros zoom"). Pour du vrai
    mouvement il faudra soit une vraie vidéo, soit une génération vidéo IA (voir "Ouvert").
- Texte hero dans le ciel (haut-gauche de la photo), police `Space Grotesk` (display) + `Inter`
  (corps) — voir `tokens.css`.

## Historique de l'analyse vidéo (2026-09-13) — pour mémoire, ne pilote plus l'intro/hero actuels

8 screen-recordings de Reels Instagram fournis par Julien (`~/Downloads/ScreenRecording_09-13-2026
*.MOV`, portrait 828×1792, natif **60fps**, tous très courts 1-3.6s), **une animation distincte
par fichier — les 8 doivent être répliquées dans le site, aucune à laisser de côté ni à
fusionner**. Frames extraites en scratchpad, analysées puis supprimées une fois le principe
transposé (même garde-fou que le skill `video-teardown` : jamais le contenu tiers tel quel). Les
techniques 2 à 8 (magazine, objets 3D rotatifs, wipes diagonaux, fondu éditorial, compteur) restent
à construire dans la section "Prestations" — seule la n°1 (logo) a fini par diverger de la réf
au profit de la demande directe de Julien (voir section Intro ci-dessus).

## Nouveau concept hero — validé le 2026-09-14, pas encore construit

Remplace **complètement** l'ancien hero photo statique (`hero-car.jpg`/`hero-car-cutout.png`,
`css/hero.css`, `js/hero-parallax.js` — à jeter une fois le nouveau construit, pas à garder en
fallback). Détail complet de la décision dans `decisions/log.md` (entrée "Driving Sens : nouveau
concept hero"), résumé ici pour piloter la construction :

**Séquence finale (verrouillée le 2026-09-14)**, dans l'ordre :

1. **Grille de départ** — plan d'établissement extérieur, voiture (référence : Porsche 911 GT3
   RS, **pas de toit ouvrant** — hypothèse posée à Julien, jamais corrigée, considérée confirmée)
   statique sur la ligne de départ.
2. **Entrée en cockpit** — la caméra plonge vers le pare-brise ; au moment où elle "devrait"
   traverser la carrosserie, un motion blur très fort masque la transition (pas de coupe visible,
   pas besoin d'ouverture physique réelle — technique choisie précisément parce que la voiture de
   référence n'a pas de toit ouvrant). La caméra ressort du flou déjà installée derrière le volant.
3. **Départ immédiat** — dès l'arrivée en vue cockpit, la voiture est **déjà en mouvement** sur le
   circuit. Pas de beat statique à l'intérieur avant que ça roule.
4. **Séquence des 4 portiques** — style gantry F1, un par grosse catégorie, **successifs pendant
   la conduite** (pas un arrêt groupé), rythme soutenu, **durée totale 10-14s pour ce passage**.
   Sur chacun : un **speed-ramp léger** (~20-30% de ralenti perçu + réduction du motion blur, pas
   un arrêt ni un vrai ralenti façon bullet-time) le temps de lire le texte, reprise immédiate de
   la vitesse normale après. **Pas cliquable à ce stade** — pur effet d'atmosphère/teaser, les 4
   s'enchaînent vite. Texte modélisé en dur en 3D sur chaque portique (pas un overlay CSS) :
   1. **Performance & Passion** — *"Vous êtes en quête de sensations fortes."*
   2. **Sérénité & Confiance** — *"Retrouvez de la sérénité derrière un volant."*
   3. **Entreprise & Collectif** — *"Une expérience automobile pensée pour rassembler."*
   4. **Industrie & Marques** — *"Un service automobile taillé pour les professionnels."*
5. **Virage vers l'arrivée** — après le 4e portique, une **courbe légère et longue** (pas un
   virage serré, pas une ligne droite plate) qui redresse la voiture pile au moment de franchir la
   ligne.
6. **Ligne d'arrivée** — la caméra se stabilise, **les 4 sections réapparaissent groupées, en
   grand, et c'est là qu'elles deviennent cliquables** — c'est le vrai moment de choix. Mécanisme :
   la vidéo se met en pause sur cette fenêtre stable ; 4 zones cliquables HTML positionnées **en %**
   (pas en pixels fixes) par-dessus la vidéo à cet instant précis. Ne marche que parce que la
   caméra est fixe à ce moment — les coordonnées ne bougent pas.

**Pourquoi 4 portiques et pas 14 (une par sous-catégorie)** : la 1ère version de l'idée
(catégories fines affichées sur les rambardes pendant la conduite) posait un problème de
lisibilité (texte illisible à vitesse de conduite) et de durée (14s+ de plan-séquence rien que
pour tenir chaque sous-catégorie 1s). 4 portiques par grosse catégorie, formulés comme des phrases
de qualification ("vous êtes/vous cherchez...") plutôt que des noms de catégorie, règle les deux.

**Direction artistique** : rendu **photoréaliste façon scène de film, surtout pas un rendu jeu
vidéo**. Vocabulaire/traitement caméra à soigner (types de plan, mouvements, profondeur de champ,
motion blur, speed ramping) précisément pour éviter tout effet "lunaire"/flottant/artificiel.

**Workflow de production** : Blender pour bloquer la scène — **géométrie schématique seulement**
(voiture, cockpit, portiques, route en proxy simple), l'important à ce stade étant les mouvements
de caméra, le timing et les proportions, pas le détail visuel final (qui vient de l'étape
suivante). Puis génération vidéo IA à partir d'images de référence (voiture, cockpit) pour le
rendu final photoréaliste. Probablement Higgsfield (motion control) pour cette 2e étape — **pas
encore autorisé**, revalider explicitement avant tout appel (règle du connecteur, jamais sans
validation préalable même en pleine tâche). L'étape 1 (Blender) peut démarrer sans cette
autorisation.

**Process de construction voulu par Julien** : séparer clairement les rôles. Le plan de tournage
(découpage et vocabulaire cinématique) est confié au modèle Codex disponible le plus capable, avec
un niveau de raisonnement élevé, uniquement pour la planification. Une fois le plan validé, la
construction Blender est confiée à un agent de réalisation distinct, choisi pour son équilibre
entre fiabilité et coût. Le thread principal inspecte lui-même le playblast et plusieurs images
représentatives avant de déclarer le résultat valide.

**Plan de tournage détaillé produit le 2026-09-14** : `plan-tournage-hero.md` (racine du dossier
projet) — shot list complète des 10 segments, budget de timing, rig caméra Blender, 10 leviers
anti-effet-jeu-vidéo, livrables attendus du blocking. Décisions prises depuis sa 1ère version :
- **Durée totale : 24,4 s** (pas 21,4 s) — Julien a choisi de garder les phrases complètes
  lisibles sur chaque portique plutôt que juste le titre, ce qui pousse les portiques à 14 s.
- **Pas besoin de raccords masqués entre plusieurs clips** — les générateurs vidéo actuels tiennent
  jusqu'à 30-35 s en une seule génération, largement au-dessus des 24,4 s visés. Le plan-séquence
  peut viser une génération continue, pas un assemblage de clips. Le rig caméra/blocking Blender ne
  change pas pour autant.
- **Support physique des 4 sections au beat 6 : en quinconce** (décidé le 2026-09-14, Julien a
  laissé le choix final ouvert entre 3 options présentées avec croquis — alignés / quinconce /
  drapeau à damier animé en 2 temps — la disposition en quinconce a été retenue : casse la symétrie
  parfaite d'une grille tout en restant stable/cliquable). Portique unique, 4 panneaux en quinconce
  (alternant plus haut/plus bas, même profondeur), ligne à damier au sol.
- **Construction Blender lancée le 2026-09-14** — agent de réalisation dédié, scope : blocking
  schématique uniquement (géométrie proxy, rig caméra, timing, exports de mesure), voir
  `plan-tournage-hero.md` section 5 pour la liste exacte des livrables. Toujours **pas d'appel
  Higgsfield/génération IA** à ce stade.

### Blocking Blender livré le 2026-09-14

Tous les livrables de la section 5 du plan sont produits. Fichiers :

- **`.blend`** : `projects/drivingsens-site/assets/blender/drivingsens_hero_blocking.blend`
  (0,16 Mo — géométrie proxy uniquement, pas de matériaux/textures). Hiérarchie
  `TRACK_PATH → CAR_ROOT → CAM_BASE → CAM_SHAKE → CAM_HERO` + collections `00_CAM / 10_CAR /
  20_COCKPIT / 30_TRACK / 40_GANTRY / 50_LIGHTS` conformes au plan §3. Scène : 586 images,
  24 fps, 2560×1440, unités mètres. Deux caméras : `CAM_EXT` (sur sa propre courbe
  `CAM_PATH_02`, active images 1-79, plans grille/approche/entrée) et `CAM_HERO` (rig cockpit,
  active images 80-586), bascule via marqueurs caméra sur la timeline (pas de coupe visible,
  la traversée floutée masque le changement).
- **Playblast** : `projects/drivingsens-site/assets/blender/render/hero_blocking_playblast.mp4`
  — 586 images, 24 fps, 24,42 s, 1280×720 (downscale d'un rendu viewport 2560×1440), 612 Ko.
  Choisi en vidéo plutôt qu'en séquence PNG (le plan autorisait les deux) pour ne pas laisser
  1,7 Go de PNG dans le repo — la séquence complète a été rendue puis supprimée après
  encodage, regénérable en ~2 min si besoin (voir note technique plus bas).
- **4 images de lecture des portiques** (`assets/blender/exports/portiqueN_lecture_fXXX.png`,
  2560×1440) + hauteur angulaire du titre mesurée via `world_to_camera_view` (pas à l'œil) :

  | Portique | Image | Frame | Hauteur titre | Fenêtre ≥6% tenue |
  |---|---|---|---|---|
  | 1 — Performance & Passion | `portique1_lecture_f192.png` | 192 | 7,22 % (~104 px) | 1,10 s (frames ~185-211) |
  | 2 — Sérénité & Confiance | `portique2_lecture_f275.png` | 275 | 7,18 % (~103 px) | 1,07 s (frames ~268-293) |
  | 3 — Entreprise & Collectif | `portique3_lecture_f346.png` | 346 | 7,03 % (~101 px) | 1,38 s (frames ~339-372) |
  | 4 — Industrie & Marques | `portique4_lecture_f431.png` | 431 | 7,19 % (~104 px) | 1,38 s (frames ~424-457) |

  Toutes au-dessus du minimum 6-7 % et de la tenue 0,8 s exigés par le plan.
- **Beat 6 (arrivée, quinconce)** : `assets/blender/exports/beat10_finish_f586.png` (image
  1440, dernière du fichier). Coordonnées d'écran normalisées (0-1, origine haut-gauche façon
  CSS — `top`/`left`/largeur/hauteur, calculées par `world_to_camera_view` puis converties) des
  4 panneaux, à réutiliser telles quelles pour les zones cliquables HTML :

  | Panneau | left | top | width | height |
  |---|---|---|---|---|
  | 1 — Performance & Passion (haut) | 0,199 | 0,067 | 0,144 | 0,144 |
  | 2 — Sérénité & Confiance (bas) | 0,367 | 0,195 | 0,144 | 0,144 |
  | 3 — Entreprise & Collectif (haut) | 0,535 | 0,067 | 0,144 | 0,144 |
  | 4 — Industrie & Marques (bas) | 0,703 | 0,195 | 0,144 | 0,144 |

  Chaque panneau occupe 14,4 % de la largeur d'image (≥14 % requis) et reste hors des 12 %
  latéraux (le plus à gauche commence à 19,9 %, le plus à droite finit à 84,7 %). Alternance
  haut/bas confirmée (1 et 3 hauts, 2 et 4 bas) — quinconce, pas grille 2×2.
- **Marqueurs de jonction** (recalculés contre le nouveau total de 586 images, pas les valeurs
  obsolètes du plan calculées sur 514) :

  | Marqueur | Image avant | Image après | Élément masquant |
  |---|---|---|---|
  | JOIN_A | 79 (`CAM_EXT`) | 98 (`CAM_HERO`) | Flou directionnel extrême + torsion de roulis (bascule de caméra cachée dedans, images 80-97) |
  | JOIN_B | 137 | 138 | Aucun (portique 1 entre en champ au loin, raccord naturel dans le plan-séquence) |
  | JOIN_C | 226 | 227 | Traversée du portique 1 (montants qui balaient l'objectif + ombre portée) |
  | JOIN_D | 309 | 310 | Traversée du portique 2 |
  | JOIN_E | 388 | 389 | Traversée du portique 3 |

  Images avant/après de chaque jonction exportées dans `assets/blender/exports/JOIN_X_{before,after}_fNNN.png`.

**Écarts et limites vs. le plan écrit (honnêteté requise) :**
- **Texte des portiques en 2 objets, pas 1** (`{GATE}_TXT_TITLE` + `{GATE}_TXT_PHRASE`) —
  nécessaire pour mesurer la hauteur angulaire du titre isolément. Voir `decisions/log.md`
  2026-09-14 pour le détail.
- **Portiques agrandis et repositionnés** pour tenir l'exigence "6-7 % de hauteur, ≥0,8 s" :
  texte à l'échelle 3.0 (au lieu de ~1.15 initialement), panneau élargi à 27 m (au lieu de
  10 m), et le portique est planté pour que la voiture le franchisse en **fin** de sa phase
  "traversée" plutôt qu'au milieu. Sans ça, la fenêtre de lisibilité tombait sous 0,2 s (la
  croissance angulaire d'un objet fixe qu'on approche est hyperbolique — trop rapide en fin de
  course si le point de passage est trop proche du milieu de la fenêtre de mesure).
- **Portique d'arrivée planté à 16 m devant le point d'arrêt réel de la voiture**, pas
  centré dessus — sinon les 4 panneaux tombaient quasiment sous la caméra, hors cadre.
- **Ondulation de route approximative** : un modificateur Displace (texture Clouds, ~7 cm
  d'amplitude) plutôt que les 5-8 ondulations sinusoïdales décrites au plan §2 — donne le bon
  effet de roulis basse fréquence mais pas la géométrie exacte prescrite. Dévers (cambrure
  1,5-2 %) non implémenté.
- **Matériaux/éclairage restent au strict minimum** (un Principled BSDF par défaut, un seul
  Sun à 20°) — hors scope du blocking par consigne explicite, à ne pas prendre pour un rendu
  d'ambiance.
- **9 des 10 leviers anti-"jeu vidéo" du plan §4 sont en place** au niveau blocking : 24 fps +
  flou obturateur 180° (shutter 1.0 pendant la traversée, keyframé), tremblement caméra 3
  couches (`CAM_SHAKE`, modificateurs Noise), roulis de caisse en courbe avec léger dépassement,
  focales/diaphragmes qui changent par segment, rack focus à chaque portique, portiques
  désalignés (±8 cm / ±0,4°), sol qui ondule. **Non fait** (matériaux/traitement optique, hors
  scope blocking par consigne) : aberration chromatique, vignetage, grain, étalonnage.
- **Aucun appel Higgsfield ni outil de génération IA** utilisé à aucun moment de cette étape.

**Note technique — régénérer le playblast PNG complet :** le script Python (boucle
`bpy.ops.render.opengl` par image avec bascule caméra manuelle selon la frame, contexte forcé
en vue caméra à chaque appel) tourne à ~0,18s/image, soit ~105s pour les 586 images. Le rendu
plein (`bpy.ops.render.render`, utilisé pour les stills fiables ci-dessus) est plus lent
(~2,3s/image, ~22 min) mais évite un bug de synchronisation du viewport observé une fois sur un
rendu isolé (`render_viewport_to_path` peut retourner une vue non rafraîchie si l'appel
précédent n'a pas explicitement forcé `region_3d.view_perspective='CAMERA'` avec un contexte
`temp_override` frais) — utiliser `bpy.ops.render.render(write_still=True)` pour tout export
ponctuel fiable, l'opengl loop pour l'animation complète seulement.

### Correction majeure le 2026-09-14 (v2) — le premier playblast était cassé à l'écran

Julien a regardé le playblast v1 frame par frame (extraits du mp4) et signalé que le rendu était
**illisible/cassé**, pas juste perfectible : voiture méconnaissable, un immense pan gris
permanent qui masque la route en cockpit, plusieurs textes de portiques superposés en même
temps, route sans aucun marquage donc virage imperceptible. Diagnostic + correction faits en
**regardant réellement chaque rendu avec l'outil Read** (pas seulement des mesures
`world_to_camera_view`), sur demande explicite de Julien après le premier rapport trop optimiste.
Causes racines trouvées et corrigées :

1. **Bug d'échelle systémique** : pour un `primitive_cube_add(size=1)`/`primitive_plane_add(size=1)`,
   `object.scale` égale directement la dimension finale (pas une demi-étendue). `CAR_BODY_PROXY`
   avait été construit avec `scale = cotes/2`, pensant fixer une demi-étendue — résultat : la
   carrosserie faisait la **moitié** de sa taille prévue (0,65 m de haut au lieu de 1,29 m) et
   flottait à 32 cm du sol. Corrigé : `scale = (1.90, 4.57, 1.29)` directement.
2. **Carrosserie posée au sol, roues avalées** : même après la correction de taille, la boîte
   touchait le sol et engloutissait visuellement les 4 roues (aucun passage de roue visible).
   Corrigé : la boîte commence maintenant à 0,50 m (hauteur de bas de caisse) et monte à 1,29 m
   (toit) — les roues sont visibles en dessous, la silhouette se lit enfin comme une voiture.
3. **Coque extérieure jamais masquée depuis l'intérieur** : la caméra cockpit est positionnée
   *à l'intérieur* de la boîte `CAR_BODY_PROXY`, qui restait visible en permanence — c'est elle
   qui produisait l'immense pan gris signalé par Julien (la caméra filmait la paroi intérieure de
   sa propre carrosserie). Symétriquement, les objets d'habitacle (volant, tableau de bord,
   montants A, pare-brise cockpit) restaient visibles depuis la caméra extérieure aux plans 1-2,
   ce qui donnait les "tiges/triangles" incongrus signalés sur les plans grille/approche. Corrigé :
   visibilité (`hide_render`/`hide_viewport`) keyframée en réciproque — coque + 4 roues + pare-brise
   extérieur masqués images 98-586, habillage cockpit masqué images 1-97.
4. **Ombrage viewport `SOLID` ignore la transparence des matériaux** : le pare-brise cockpit
   (censé être quasi invisible, alpha 0,15) sortait totalement opaque en rendu viewport `SOLID`,
   aggravant l'effet de mur. Corrigé : rendu en ombrage `MATERIAL` (aperçu EEVEE, respecte
   l'alpha) pour le playblast, `bpy.ops.render.render()` pour les images fixes livrées.
5. **Flou de profondeur de champ démesuré sur les objets très proches** : volant/tableau de bord
   à 0,6-1,3 m de la caméra avec une distance de mise au point calée à 30-45 m (route/portiques)
   produisait un flou géant qui remplissait tout le cadre dans EEVEE — particulièrement visible
   au virage. Corrigé : profondeur de champ **désactivée** pour tout le blocking (c'est un réglage
   esthétique de rendu final, hors scope du blocking de toute façon).
6. **Volant et tableau de bord surdimensionnés/mal placés** par rapport à la cible du plan
   (volant 18-24 % de la hauteur d'image, tableau de bord en fine bande de bas de cadre) — recalés
   par itération empirique mesurée (`world_to_camera_view`) puis vérifiée à l'écran : volant à
   ~23 % de hauteur, tableau de bord réduit à une fine bande.
7. **Aucun marquage de route** — ajouté 3 lignes (axe + 2 rives) qui suivent littéralement la
   géométrie de `TRACK_PATH` (copies avec `bevel_depth` + matériau clair légèrement émissif). C'est
   ce qui rend le virage du segment 9 réellement perceptible à l'écran (le lacet de caméra seul,
   sans repère visuel qui courbe avec lui, ne se lit pas comme un virage en vue subjective).
8. **Les 4 portiques étaient visibles en permanence dès l'image 1** — combiné à l'agrandissement
   du texte fait en v1 pour tenir la fenêtre de lisibilité 6-7 %/0,8 s, ça faisait apparaître 2-3
   titres de portiques simultanément lisibles dès qu'on regarde la ligne droite (exactement le bug
   "Perform...", "Vous êtes...", "Sérén..." tous visibles en même temps signalé par Julien).
   Corrigé : chaque portique (2, 3, 4) n'apparaît désormais (`hide_viewport`/`hide_render`) qu'au
   moment même où le plan de tournage le prévoit déjà ("le portique suivant entre en champ au
   lointain", soit pendant la traversée du portique précédent) — plus toute la durée qui précède.

**Vérification faite avant de re-livrer** (demande explicite de Julien, pas de nouveau rapport
"tout est bon" sans regarder) : régénération complète du playblast, puis relecture personnelle
via `Read` de 9 frames extraites directement du mp4 final (pas des rendus de contrôle à part) —
grille (image 10), approche (60), cockpit sans portique (110), les 4 images de lecture (192, 275,
346, 431), plein virage (510), image finale du beat 6 (586). Constat sur chacune : la voiture se
lit comme une voiture avec ses 4 roues visibles ; le pan gris a disparu, on voit la route ; un seul
titre de portique lisible à la fois, jamais deux superposés ; la route trace deux bandes de rive +
un axe qui courbent visiblement en image 510 ; les 4 panneaux du beat 6 sont nettement séparés en
quinconce. Les coordonnées normalisées du beat 6 (table plus haut) sont **inchangées** — seule la
visibilité/l'ombrage/la DOF ont changé, pas la géométrie des panneaux.

**Fichiers livrés v2** (mêmes chemins qu'en v1, contenu regénéré) : `.blend` mis à jour,
`hero_blocking_playblast.mp4` régénéré, les 4 images de lecture + l'image du beat 6 + les 10
images de jonction dans `exports/` régénérées avec le rig corrigé.

### Correction v3 le 2026-09-14 — la v2 était encore cassée, corrigée et validée (Codex + relecture Sonnet)

Après la migration AIOS vers Codex (voir `decisions/log.md`), un audit direct du mp4 v2 a retrouvé
4 défauts bloquants malgré le rapport de validation précédent : rectangle gris devant chaque texte
de portique, tracé avec les 4 portiques sur une portion droite puis le virage seulement avant
l'arrivée (inverse de la consigne de Julien), transition ciel→cockpit illisible (une face de la
voiture remplit brutalement l'image), 4 panneaux d'arrivée sans libellé visible. Détail complet du
diagnostic dans `REPRISE-BLENDER.md` (conservé pour mémoire) et dans `decisions/log.md`.

Corrections faites par un agent Codex de réalisation, dans l'ordre prescrit (portique 1 isolé et
revalidé à l'écran avant propagation, puis `TRACK_PATH` refait en S léger pendant les 4 portiques
avec sortie tangentielle droite pour l'arrivée, trajectoire `CAM_EXT`→`CAM_HERO` refaite en vue
plongeante avec flou directionnel pour masquer la bascule, titres ajoutés sur les 4 panneaux du
beat 6, verrouillage de la position finale de la voiture dès l'image 567 pour arrêter toute
translation résiduelle sur les 20 dernières images).

**Vérification faite par le thread principal (Sonnet), pas seulement reprise du rapport Codex** :
lecture directe des exports `exports/` régénérés à 15h00 — `portique1_lecture_f192.png` (texte
"Performance & Passion" / "Vous êtes en quête de sensations fortes." entièrement lisible, aucun
rectangle devant), `beat10_finish_f586.png` (4 panneaux en quinconce, chacun avec son titre exact
— Performance & Passion, Sérénité & Confiance, Entreprise & Collectif, Industrie & Marques),
`JOIN_A_before_f79.png`/`JOIN_A_after_f98.png` (bascule ciel→cockpit passant par un flou
directionnel fort puis ressortant en vue cockpit cohérente, volant + route visibles), et les
frames `v3_control_f510`/`f550`/`f098` + `portique4_lecture_f431.png` (courbe en S nette pendant
les portiques, ligne droite stable à l'approche de l'arrivée — sens inverse de la v2, conforme à
la consigne). Les 4 défauts bloquants de `REPRISE-BLENDER.md` sont résolus.

**Fichiers canoniques v3** (mêmes chemins, contenu regénéré) : `.blend`,
`hero_blocking_playblast.mp4` (586 images, 24 fps, 24,42 s, 1280×720), les 4 images de lecture +
l'image du beat 6 + les 10 images de jonction dans `exports/`. Fichiers de travail intermédiaires
laissés dans `assets/blender/` (`drivingsens_hero_blocking_pre-v3.blend`,
`drivingsens_hero_blocking_working.blend[1]`, `hero_blocking_playblast_v3_review.mp4`,
`hero_blocking_playblast_v3_final_review.mp4`) — non nettoyés, à supprimer si Julien confirme ne
plus en avoir besoin.

**Prochaine étape** : revalider explicitement l'autorisation Higgsfield avec Julien avant toute
génération vidéo IA à partir de ce blocking — aucun appel Higgsfield fait à aucune étape.

### Correction v4 le 2026-09-14 — retour caméra de Julien après visionnage réel du mp4, pas juste des stills

Julien a regardé `hero_blocking_playblast_v3_final_review.mp4` en entier (pas des images fixes) et
signalé 3 problèmes de mise en scène que les vérifications par stills n'avaient pas révélés :
plan d'ouverture en vue de côté figée longtemps au lieu d'une vue d'en haut, première barrière de
départ totalement vide qu'on traverse sans rien ressentir, et une fin qui accélère brutalement puis
ralentit d'un coup sans qu'on comprenne la composition finale. Diagnostic fait par le thread
principal (Sonnet) en extrayant des dizaines de frames directement du mp4 via `ffmpeg` (pas
seulement les stills déjà exportés) et en lisant les courbes d'animation réelles dans Blender
(fcurves caméra, `eval_time` de `TRACK_PATH`, positions monde du véhicule par frame) plutôt que de
se fier aux descriptions du plan de tournage :

1. **Plan d'ouverture (`CAM_EXT`, images 1-79)** : la caméra était figée à l'identique 42 images
   (1,75 s) en vue basse 3/4 (rotation X≈70° depuis la verticale, quasi horizontale) avant un swoop
   de 36 images vers le cockpit. Corrigé : nouvelle pose de départ nettement plus haute et plus
   verticale (hauteur 20 m, rotation X≈24° depuis la verticale — vraie vue de grue/drone), tenue
   raccourcie à 21 images (~0,9 s), swoop étalé sur davantage d'images (22→79) pour une descente
   plus progressive. Le lens de `CAM_EXT` a aussi été repassé à 24 mm (grand angle) pour mieux
   révéler la grille.
2. **`GATE_START`** (la vraie première barrière, à 25 m du départ — objet distinct des 4 portiques
   `GATE_1..4`) n'avait ni texte ni géométrie marquante (piliers 0,3×0,3×2 m, panneau quasi
   invisible) : elle ne "existait" pas visuellement au passage. Corrigé : piliers et poutre
   agrandis, ajout d'un objet texte `GATE_START_TXT` ("DRIVING SENS", dupliqué du matériau/police de
   `GATE_1_TXT_TITLE` puis redimensionné pour son panneau plus petit — attention broyée une fois par
   erreur en copiant l'échelle du portique 1 telle quelle, corrigée à `size=0.45`). Le passage sous
   la barrière (vers l'image 104, vérifié par la position monde réelle du véhicule) se lit
   maintenant comme un vrai événement : le texte grandit puis sort par le haut du cadre.
3. **Fin de parcours** : la courbe `eval_time` de `TRACK_PATH` (vitesse du véhicule sur le tracé)
   faisait un saut instantané de vitesse ×2 à l'image 533→534 (1,98→4,24 unités/image sans transition),
   puis une décélération linéaire jusqu'à un arrêt complet et figé dès l'image 567 — c'est ce saut,
   pas un ralenti volontaire, qui donnait la sensation d'à-coup. Corrigé : suppression du saut,
   vitesse de croisière prolongée sans changement jusqu'à l'image 560 (continuité totale, aucune
   discontinuité de vitesse), puis décélération progressive sur 20 images (560→580) jusqu'à l'arrêt,
   verrouillage image 580-586. Les 4 panneaux finaux grandissent maintenant en continu sur toute
   l'approche au lieu de rester minuscules puis de foncer dessus dans le dernier tiers de seconde.

**Vérification** : nouveau playblast complet régénéré (586 images, méthode `render.opengl` identique
aux versions précédentes) et recontrôlé par extraction `ffmpeg` de frames directement depuis le mp4
final (pas les stills isolés) aux moments clés des 3 corrections — plan d'ouverture (images 0, 10,
21, 34), passage de la barrière de départ (78, 89, 94, 99, 104, 108), et fin de parcours (533, 545,
558, 565, 572, 580, 585). Les 3 problèmes sont résolus dans le mp4 canonique actuel. Défaut mineur
connu et non bloquant : le texte "DRIVING SENS" affiche un léger dédoublement/fantôme à certains
angles (artefact du mode de transparence `HASHED` du matériau `TEXT_PROXY_V3` sur un texte à courte
distance, cosmétique, pas structurel).

**Fichiers canoniques v4** (mêmes chemins, contenu regénéré) : `.blend`,
`hero_blocking_playblast.mp4`. Fichier de travail intermédiaire supplémentaire laissé dans
`assets/blender/` : `drivingsens_hero_blocking_pre-v4.blend` (checkpoint avant sauvegarde finale,
non nettoyé).

### Correction v5 le 2026-09-14 — écarts au plan de tournage repérés par Julien après référence externe

Julien a envoyé une référence externe (workflow Blender→Seedance 2.5 autour d'une voiture) et a
pointé que notre scène paraissait vide et "brouillon" comparée à un vrai blocking construit selon
son plan. Vérification faite directement contre `plan-tournage-hero.md` (pas juste contre le
ressenti) — 4 écarts réels trouvés :

1. **Aucune rambarde/rail** le long de la piste alors que le plan §Plan 9 le demande explicitement
   ("ajouter les rangées de bordure/rail via un modificateur Array le long de la courbe"). Ajouté :
   deux courbes `GUARDRAIL_L`/`GUARDRAIL_R` (offset latéral ±10,8 m depuis `TRACK_PATH`, biseau
   0,18 m) + poteaux tous les 6 m via Array+Curve modifier (`GUARDRAIL_L_POSTS`/`_R_POSTS`, 83
   poteaux de chaque côté).
2. **Grille de départ à moitié de la taille du plan** : `GRID_PLATE_PROXY` était à 15×7 m au lieu
   des 30×14 m spécifiés. Corrigé.
3. **Les 4 panneaux d'arrivée flottaient sans aucun support.** Ajouté un poteau fin par panneau
   (`GATE_FINISH_POST_1..4`, du sol jusqu'à la base de chaque panneau).
4. **Profondeur de champ désactivée** depuis la correction v2 (contournement d'un bug d'explosion
   de flou), alors que c'est le levier anti-"jeu vidéo" n°5 du plan. Réactivée avec des valeurs
   sûres testées avant généralisation (`CAM_HERO` : focus 35 m, f/2.5 ; `CAM_EXT` : focus 20 m,
   f/4) — plus de flou géant, avant-plan (volant/montants) discrètement flou comme prévu.

**Ajout hors plan écrit, jugé nécessaire à l'usage** : un horizon de reliefs bas (`HORIZON_HILL_*`,
52 cônes low-poly de part et d'autre de la piste, hauteur 4-11 m, à 90-170 m de distance) — le plan
ne le demandait pas explicitement mais la référence externe de Julien montrait qu'un environnement
totalement vide (juste route + ciel noir) ne se lit pas comme un lieu réel. Cohérent avec le
contexte circuit (pas urbain). Reste un placeholder grossier, à remplacer par un décor plus
"circuit" (gravier, tribunes, grillage) si Julien le préfère aux reliefs.

**Changement de méthode de rendu — important.** Les playblasts v1 à v4 utilisaient
`bpy.ops.render.opengl()` (aperçu viewport rapide, ~0,18 s/image) qui n'applique pas correctement
la profondeur de champ ni le flou de mouvement en mode d'ombrage `MATERIAL`. Pour que ces effets
soient réellement visibles dans la vidéo livrée, le playblast v5 a été régénéré avec
`bpy.ops.render.render()` (vrai rendu EEVEE, ~3-4 s/image, 586 images). **Note technique pour la
suite** : un rendu complet de cette durée dans un seul appel MCP fait expirer la connexion socket
Blender (le thread principal étant bloqué pendant tout le rendu) — l'appel est parti en tâche de
fond côté outil et a fini par échouer côté notification, mais **le rendu Blender a continué et
s'est terminé normalement côté serveur** (vérifié par comptage de fichiers). Pour un prochain rendu
long, prévoir un découpage en plusieurs appels plus courts plutôt qu'une seule boucle de 586
images.

**Fichiers canoniques v5** (mêmes chemins, contenu regénéré) : `.blend`,
`hero_blocking_playblast.mp4` (vrai rendu cette fois, 2560×1440 à 50 %, 24 fps, 24,42 s).

### Reconstruction dynamique v7 le 2026-09-14 — nouvelle référence vidéo et retours directs de Julien

Julien a demandé de ne plus traiter le fichier comme un simple blocking linéaire en cockpit : la
nouvelle référence montre un montage automobile beaucoup plus vivant, alternant drone, roue,
suivi arrière, profil, capot et cockpit. La V7 est une copie séparée
`assets/blender/drivingsens_hero_dynamic_v7.blend` afin de préserver le blocking v5 canonique.

- durée ramenée de 586 à **408 images / 17 s**, avec **10 plans caméra** ;
- quatre portiques conservés, mais rapprochés et placés sur un **S continu** plutôt que séparés
  par de longues portions vides ;
- plans dédiés roue avant, suivi arrière, profil et capot ajoutés entre les vues cockpit ;
- ancien empilement nettoyé : suppression des anciens bacs à gravier, dalle de départ, rambardes,
  reliefs et proxies de pare-brise qui recouvraient la nouvelle géométrie ;
- circuit reconstruit en couches : piste, vibreurs, bacs à gravier continus, double rail, mur béton
  et murs de pneus sur l'extérieur des quatre virages ;
- roues refaites par ensembles hiérarchisés : un moyeu animé par roue porte pneu/disque/jante,
  tandis que l'étrier, l'amortisseur et le ressort restent fixés au châssis. Cela corrige la
  rotation circulaire incohérente signalée par Julien ;
- caméra cockpit reparentée directement au véhicule, sans chaîne de shake, cadre relevé et
  anciens proxies supprimés pour rendre la route prioritaire ; roues et suspensions sont masquées
  uniquement dans les plans cockpit pour éviter leur apparition dans l'habitacle.

Contrôle visuel effectué sur 11 vrais rendus EEVEE, frames 1, 50, 96, 126, 166, 216, 256, 296,
336, 390 et 408, dans `assets/blender/exports/v7_review/`. La géométrie et les cadrages sont une
base de travail détaillée, pas encore un rendu final photoréaliste ni un playblast complet.

## Ouvert (2026-09-14)

- **V7 dynamique ouverte dans Blender** : valider avec Julien le nouveau montage et le cadrage des
  4 titres avant de rendre les 408 images. Les plans roue/suspension et les abords du circuit sont
  maintenant propres ; la prochaine passe doit surtout affiner la silhouette de la voiture, la
  composition finale des 4 choix et la lisibilité exacte des textes en mouvement.

- **v5 Blender corrigée le 2026-09-14** (voir section "Correction v5" ci-dessus) — rambardes,
  grille à la bonne échelle, pieds des panneaux, profondeur de champ réactivée, horizon de reliefs,
  et rendu régénéré en vrai rendu (pas l'aperçu viewport) pour que ces effets soient visibles.
  Validation de Julien sur ce nouveau playblast en attente.
- **v4 Blender corrigée et validée le 2026-09-14** (voir section "Correction v4" ci-dessus) — après
  visionnage réel du mp4 par Julien (pas juste des stills), 3 problèmes de mise en scène ont été
  corrigés : plan d'ouverture (vraie vue d'en haut, tenue raccourcie), première barrière de départ
  habillée (texte + géométrie, était vide), à-coup de vitesse en fin de parcours supprimé
  (décélération continue sans saut). `REPRISE-BLENDER.md` reste comme historique du diagnostic v3
  mais ne décrit plus l'état courant. Prochaine étape : validation de Julien sur ce nouveau
  playblast, puis autorisation Higgsfield à revalider avant toute génération vidéo IA.

- **Nouvelle photo hero en cours de recherche par Julien** — obsolète si le nouveau concept hero
  ci-dessus remplace la photo statique (ce qui est le cas) ; à confirmer que cette piste est
  définitivement abandonnée avant de continuer à la chercher.
- **Contenu des 4 sections de nav** (Performance & Passion / Sérénité & Confiance / Entreprise &
  Collectif / Industrie & Marques) — les phrases d'accroche sont figées (voir ci-dessus), mais le
  contenu détaillé de chaque section (au-delà du hero) reste à construire. Sous-catégories
  confirmées le 2026-09-14 :
  - Performance & Passion : Stage circuit, Coaching, VIP, Voyage auto
  - Sérénité & Confiance : Conduite de sécurité, Réhabilitation, Senior, Aide à l'achat
  - Entreprise & Collectif : Team building, Éco-conduite
  - Industrie & Marques : Location véhicule, Événement auto, Conciergerie, Convoi
  Reste à trancher : après un clic sur un portique du hero, le visiteur va-t-il direct vers une
  section "nos univers" détaillée (4 blocs avec preview des sous-catégories, discuté le
  2026-09-14) ou vers un contenu plus direct par catégorie ? Pas encore tranché avec Julien.
- **Section Prestations** — toujours un bloc noir vide (`#prestations` dans `index.html`). Attend
  le contenu ci-dessus + la construction du hero.
- **Prochaine étape immédiate** : corriger intégralement le blocking selon
  `REPRISE-BLENDER.md`, régénérer le playblast et le contrôler visuellement avant de le soumettre à
  Julien. Revalider ensuite explicitement l'autorisation Higgsfield avant toute génération vidéo.

### Carrosserie GT3 RS sculptée v11 et passage en éclairage de jour le 2026-09-15

Julien a explicitement demandé une vraie GT3 RS (référence Porsche 992 GT3 RS, premiere officielle
août 2022) plutôt qu'un bloc générique, un vrai circuit de jour (plus de mode nuit ni de
lampadaires), et des panneaux dont on lit vraiment le texte. Travail fait dans le `.blend` v10
ouvert, toujours dans le même fichier (`drivingsens_hero_story_v10.blend`), collection ajoutée
`14_GT3RS_V11` (191 objets : carrosserie sculptée par sections, ailes ouvertes autour des roues,
custode/pare-brise vitrés, becquet à deux ailerons sur pylônes swan-neck, jantes à écrou central
avec pneus/étriers/disques rapportés). Ancienne géométrie V6/V7/V10 masquée par préfixe (pas
supprimée) pour préserver l'historique.

Nettoyage après contrôle visuel réel (rendus caméra, pas juste des captures d'écran) :
- portière bleue fantôme (`V10_DOOR_SCULPT_-1/1`, non couverte par le préfixe de masquage initial)
  et ancien étai d'aileron (`V10_WING_STAY_-1/1`) masqués définitivement ;
- garniture de tableau de bord (`V10_COCKPIT_DASH_LIP`) qui traversait le pare-brise en vue
  extérieure : bascule ajoutée pour ne s'afficher que pendant les plans cockpit (mêmes images
  clés que `EXTERIOR_KEYS`, inversées) ;
- panneau de porte intérieur V6 (`V6_DOOR_CARD_-1/1`) visible à travers la carrosserie neuve en
  vue extérieure : même bascule cockpit-only appliquée.

Éclairage : le monde était un ciel nocturne très sombre (`Background` strength 0.48, couleur quasi
noire) avec soleil faible (energy 4.2) — c'est ce qui produisait la fausse bande sombre horizontale
vue sur le pare-brise en rendu (reflet du ciel nocturne sur le verre glossy, pas un bug de
géométrie ; disparaît avec le ciel de jour). Corrigé : `Background` couleur bleu ciel clair
(0.58, 0.74, 0.93), strength 1.6 ; `SUN_MAIN` energy 4.2 → 7.5, angle resserré à 0.018 rad pour des
ombres nettes. Les 90 objets de lampadaires (`V6_LAMP_ARM_*`, `V6_LAMP_HEAD_*` dans
`51_SET_DRESSING_V6`) masqués ; tribunes et bâtiment des stands du même set conservés.

**Vérifié par rendu caméra réel** (pas viewport OpenGL) aux images 89 (portique 1, plan
`V6_CAM_CHASE`), 145 (plan avant `V10_CAM_FRONT_CLOSE`), 311 (profil `V6_CAM_SIDE`) et 15 (plongée
`V10_CAM_ROOF_TO_COCKPIT`). Le texte du portique 1 ("VOUS ÊTES EN QUÊTE DE SENSATIONS FORTES.") est
maintenant parfaitement lisible en plein jour.

**Ouvert / pas encore traité** : grille de départ (une seule ligne blanche visible en plongée,
pas de vraie boîte de grille) ; bacs à gravier et pneus "partout" façon vrai circuit GT3/F1 pas
encore schématisés selon la dernière demande de Julien ; portiques encore de proportions
approximatives par rapport aux vraies bornes F1 (référence image envoyée par Julien) ; validation
de Julien sur la nouvelle carrosserie et le rythme des ralentis pas encore obtenue. Fichier
`.blend` sauvegardé, Blender resté ouvert dessus.

### Mouvements de caméra réels et retiming des 11 plans le 2026-09-15

Julien a explicitement demandé de mettre l'environnement de côté (il compte le régler plus tard
via images de référence + prompt IA) et de se concentrer uniquement sur la fluidité des
mouvements de caméra et le timing. Diagnostic fait en inspectant les vraies fcurves (pas les
descriptions du plan de tournage) : sur les 11 caméras du montage, **9 étaient parentées à
`CAR_ROOT` sans la moindre keyframe propre** (`num_fcurves: 0`) — elles étaient rigidement
boulonnées sur la voiture et tout le mouvement perçu venait uniquement du déplacement de la
voiture le long de `TRACK_PATH`. Seule `V10_CAM_ROOF_TO_COCKPIT` (plan 1) avait une vraie
animation. C'est la cause directe du reproche de Julien sur l'absence de fluidité caméra.

Corrigé : animation locale ajoutée (position + rotation, interpolation `BEZIER` avec poignées
`AUTO_CLAMPED` pour un ease in/out propre, pas de linéaire brutal) sur les 9 caméras statiques,
en plus de leur offset de rig existant — donc toujours parentées et suivant la voiture, mais avec
un vrai langage de caméra par-dessus : poussée + bascule basse sur le plan arrière serré, léger
drift/arc sur les deux plans "phrase" à l'arrière 3/4, swing rapide sur les plans avant/côté très
courts, vrai balayage latéral+altitude sur les deux plans drone (au lieu d'un simple offset figé),
bob de suspension + bascule verticale progressive sur le plan capot (révèle le portique 3 en
levant le nez de caméra), et un léger settle + micro-balancement sur le plan cockpit final.

Retiming : les plans de transition/action étaient beaucoup trop courts pour que le mouvement se
lise (15 images / 0,625 s pour le plan côté, 21 images / 0,88 s pour l'avant serré, 23 images pour
le premier drone), pendant que les 4 plans "phrase" variaient de façon incohérente (56 à 69
images). Durée totale du montage inchangée (480 images / 20 s à 24 fps, donc `TRACK_PATH` et la
vitesse de la voiture n'ont pas eu besoin d'être retouchés), mais redistribuée : plans de
transition remontés à 24-30 images (1,0-1,25 s, assez pour que le mouvement s'inscrive), les 4
plans "phrase" resserrés à une fourchette homogène de 54-58 images (2,25-2,4 s) au lieu d'un écart
de 56 à 69. Les marqueurs de la timeline ont été recréés aux nouvelles frontières ; les bascules
de visibilité `EXTERIOR_KEYS`/`INTERIOR_KEYS` (1/29/30/60/61/420/421/480) restent valides sans
changement car les plans 1 et 11 gardent exactement leurs mêmes bornes.

**Vérifié par rendu caméra réel** aux limites et milieux de plusieurs plans (116 et 144 pour le
plan "phrase" 1, 234 pour le premier drone, 322 pour le plan côté rallongé, 450 pour le cockpit
final) : mouvement fluide et lisible, texte du portique 1 toujours parfaitement cadré et lisible
pendant le travelling avant. Pas de régénération du playblast complet dans cette passe (rendu réel
~3-4 s/image × 480 images est trop long pour un aller-retour de vérification ponctuelle) — à
relancer avant validation finale de Julien.

### Refonte narrative complète (feux de départ, plans variés, portique d'arrivée) le 2026-09-15

Julien a redonné un scénario précis : vue du ciel → entrée cockpit → premier feu rouge tenu →
passage au vert → lancement → plan extérieur sur l'aileron (preuve du lancement) → retour cockpit
pour lire le portique 1 → effet roue qui tourne → variation des plans pour les portiques 2-4 → fin
repensée. Montage passé de 11 à **14 plans**, durée totale 1-624 images (26 s à 24 fps, contre 20 s
avant — plus de plans signifie plus de temps nécessaire, la lisibilité des phrases reste la
priorité n°1 explicitement redite par Julien).

**Feux de départ** : le rig `V8_START_LIGHT_BAR`/`HOUSING_1..4`/`LENS_1..4` existait déjà dans le
fichier (construit lors du passage V8) mais n'était utilisé nulle part dans le montage V9/V10.
Réactivé avec une vraie séquence rouge tenu (images 18-88) puis vert (dès l'image 92, interpolation
`CONSTANT` pour un vrai flip de feu, pas un fondu). Problème trouvé et corrigé : à la distance de
tenue (~10 m), une caméra cockpit à l'horizontale ne voit pas un feu monté à 5 m de haut — il fallait
lever le regard d'environ 22° (calculé par produit vectoriel, pas au jugé) pendant le plan, puis
redescendre au moment du vert pour re-cadrer la route au lancement.

**Timing du lancement refait entièrement.** La courbe `eval_time` de `TRACK_PATH` héritée des
anciennes versions faisait tenir la voiture immobile jusqu'à l'image ~49 puis sautait à une
accélération instantanée totalement irréaliste (plus de 200 km/h atteints en une quinzaine
d'images). Remplacée par une nouvelle courbe à 10 keyframes calculée pour que la voiture soit
exactement sous chaque portique à la bonne image (vérifié par échantillonnage réel de la position
monde, pas par confiance dans la courbe) : arrêt total jusqu'à l'image 100 (pendant tout le feu
rouge), lancement progressif, vitesse de croisière cohérente (~105-115 km/h) entre les 4 portiques,
décélération étalée en fin de parcours jusqu'à quasi l'arrêt au portique d'arrivée.

**Nouveaux plans insérés** : `V6_CAM_WHEEL_FL` (caméra roue déjà présente mais jamais utilisée dans
le montage V9/V10) réactivée pour deux plans dédiés — lancement (juste après le feu vert) et
transition (entre portiques 1 et 2) — avec vibration/balayage animé pour vendre la puissance. Le
portique 1 est maintenant vu **en cockpit** (`CAM_HERO`, avant vu en poursuite extérieure) pour
respecter la demande explicite de Julien ; les portiques 2-4 restent en extérieur varié (3/4 arrière,
capot, chasse basse), déjà jugés suffisamment variés lors de la passe précédente.

**Portique d'arrivée entièrement reconstruit.** L'ancien `GATE_FINISH_*` était totalement caché
(`hide_render=True` sur tous les objets) et structurellement cassé (le tablier flottait à 1,5 m
au-dessus du sommet des piliers, sans connexion) — c'est très probablement pourquoi Julien ne
"l'imaginait pas". Supprimé et reconstruit à l'identique du style des portiques 1-4 (mêmes
matériaux `V8_PANEL_BLACK`/`V8_DARK_METAL`/`V8_ACCENT_RED`/`V10_LEGIBLE_TEXT`, deux piliers + un
seul tablier posé dessus, pas de plots flottants en quinconce) avec les 4 noms de catégories en une
seule rangée lisible sur le même tablier, plus une simple ligne blanche au sol (pas de damier).
Position calculée avec la même fonction `road_pose()` que celle qui place déjà les portiques 1-4
(portée dans ce fichier), vérifiée pixel par pixel par rendu réel — coïncide exactement avec la
position réelle de la voiture en fin de parcours.

**Gros plan final ajouté** (demande explicite de Julien après avoir vu le portique en direct dans
Blender) : nouvelle caméra dédiée `CAM_FINISH_CLOSEUP`, non parentée à la voiture, plan 14
(images 577-624), cadrée serré uniquement sur le tablier — les 4 catégories remplissent l'image,
sans cockpit ni route visible, pensé comme un écran de choix cliquable pour le site. Distance et
focale ajustées après un premier essai bien trop proche (une seule catégorie visible, artefact de
lumière sur le panneau) — validé par Julien en direct dans Blender.

**Non vérifié dans cette passe** : pas de nouveau playblast complet régénéré (626 images en rendu
réel serait trop long pour un aller-retour) — Julien regarde directement dans Blender (son souci
de Local View bloqué a été corrigé en cours de session) et valide plan par plan avant la suite.

### Corrections après retour direct de Julien (captures Blender) le 2026-09-15

Julien a envoyé 11 captures d'écran prises directement dans Blender et repéré 4 vrais problèmes
(le reste des captures montrait surtout les overlays d'édition de Blender — frustums de caméra,
poignées de courbes — qui n'apparaissent jamais au rendu final, précisé pour qu'il ne s'inquiète
pas de ça à l'avenir) :

1. **Double volant / habitacle jamais demandé visible.** Julien veut une vue cockpit totalement
   immersive : uniquement la route et l'environnement, aucun tableau de bord, montant, volant ou
   siège. `V6_STEERING_RIM/HUB/SPOKE_0-2` étaient visibles en permanence (`hide_render=False`, sans
   animation) pendant que `V10_COCKPIT_WHEEL_START`/`_FINISH` avaient leur propre animation de
   visibilité d'une ancienne version — les deux se chevauchaient par endroits, d'où le double
   volant. Corrigé en masquant **définitivement** (plus de bascule cockpit/extérieur, juste caché
   tout le temps) l'intégralité de `20_COCKPIT`, `21_COCKPIT_DETAIL_V6`, les deux volants V10 et
   `V10_COCKPIT_DASH_LIP`/`V6_DOOR_CARD_-1/1`.

2. **Texte illisible/pixelisé uniquement pendant la lecture, pas à l'arrêt sur image.** Cause
   trouvée : 56 matériaux du fichier (quasiment tous, y compris tout le texte des portiques et les
   liserés d'accent) étaient en `blend_method = 'HASHED'` alors qu'aucun n'a de vraie transparence
   (alpha toujours à 1). Le tramage stochastique du mode HASHED change de motif à chaque image et
   ne se voit quasiment pas sur un arrêt sur image isolé, mais scintille fortement en lecture.
   Basculé en `OPAQUE` sur les 56 matériaux concernés.

3. **Feux de départ jamais vus depuis le cockpit + bug rouge/vert désynchronisé.** La caméra
   cockpit était quasiment à l'horizontale ; à 10 m des feux (montés à ~5 m de haut) il fallait
   lever le regard d'environ 22° pour les voir, sinon ils sortent du cadre par le haut — déjà
   corrigé lors de la passe précédente mais **perdu par erreur** en retimant ensuite la fin
   (un `animation_data_clear()` trop large a effacé les 3 apparitions de `CAM_HERO` au lieu d'une
   seule) : les 3 segments cockpit (feux, portique 1, arrivée) ont dû être reconstruits ensemble.
   Bug séparé trouvé en vérifiant : les 4 matériaux de lentille de feu avaient des fcurves
   dupliquées sur `inputs[28]`/`inputs[29]` (accès par index RNA réel plutôt que par le nom
   `"Emission Color"` utilisé pour la suppression, donc les anciennes courbes n'étaient jamais
   effacées) — les feux affichaient un vert d'une ancienne animation par-dessus le rouge de la
   nouvelle. Nettoyé en vidant complètement l'animation des 4 matériaux avant de réinsérer les
   images clés rouge (18-88) puis vert (dès 92), interpolation `CONSTANT`.

4. **Enchaînement final pas logique.** Julien : on doit voir la voiture franchir la ligne
   d'arrivée depuis l'extérieur (pas rester en cockpit jusqu'au bout puis sauter direct au gros
   plan sur la banderole). Plan 13 raccourci à 500-550 (approche cockpit, n'atteint pas encore la
   ligne). Nouveau plan **13B_FINISH_CROSS_EXT** ajouté (551-576, troisième réutilisation de
   `V10_CAM_REAR_CLOSE`, vue arrière serrée) : la voiture franchit visiblement la ligne blanche,
   confirmé par rendu réel (aileron + ligne au sol sous la voiture à l'image 565). Le plan 14
   (gros plan sur les 4 catégories, 577-624) reste inchangé ensuite.

**Vérifié par rendu caméra réel** après coup : feux rouges corrects (image 80), portique 1 en
cockpit totalement épuré sans habitacle (image 185), franchissement de ligne à l'extérieur
(image 565). Fichier sauvegardé.

### Micro-séquence de départ v19 — levier, pédales, raccord extérieur (2026-09-15)

Fichier courant : `assets/blender/drivingsens_hero_micro_v19.blend`. La caméra haute/arrière du
plan levier reste celle validée par Julien, mais le geste a été fortement resserré : neutre aux
images 61-63, mouvement à gauche 63-67, engagement vers l'avant 68-72, tenue jusqu'à 76. Coupe
franche sur les pédales à l'image 77 ; accélérateur enfoncé entre 80 et 89, tenu jusqu'à 96.

Le premier essai de dézoom traversait physiquement le plancher, les sièges et la coque. Rejeté :
ce type de trajectoire donne une référence spatiale incohérente à une future génération vidéo.
Version retenue : whip-pan vers le plancher aux images 90-96, coupe masquée à l'image 97 vers
`CAM_REAR_PULLBACK_SAFE`, déjà placée hors de la voiture derrière le pare-chocs, puis recul
extérieur jusqu'au raccord exact avec `V10_CAM_REAR_CLOSE`. Aucun segment de caméra ne traverse
la géométrie. Le pédalier est isolé des anciens proxies et des marquages de piste pendant son
gros plan.

Contrôle visuel effectué sur cinq rendus caméra réels dans
`assets/blender/exports/v19_transition_checks/` : image 72 (première engagée), 89 (pédale
enfoncée), 96 (cadre de masque), 97 (reprise sur carrosserie complète) et 130 (vue arrière
élargie). Aucun playblast complet n'a été régénéré, conformément à la demande de Julien.

### Départ brutal et référence GT3 RS v20 (2026-09-15)

Fichier courant : `assets/blender/drivingsens_hero_micro_v20.blend`. La voiture reste immobile
jusqu'à l'image 97, puis parcourt environ 11 m à l'image 108 et 44 m à l'image 130. Cette courbe
remplace le départ trop lent de v19 tout en conservant les positions des portiques pour la future
refonte du rythme de lecture.

Les références de génération fournies par Julien montrent une Porsche 911 GT3 RS blanche. Elles
servent uniquement à choisir les cadrages, pas à remodeler la voiture de blocking. Le premier plan
extérieur a donc été abaissé et recentré sur les signatures arrière : aileron, largeur de caisse,
zone lumineuse et diffuseur. Un premier essai trop proche mettait surtout les sièges en avant ; il
a été rejeté puis corrigé. Contrôle effectué sur quatre rendus fixes aux images 97, 106, 124 et 145
dans `assets/blender/exports/v20_launch_checks/`. Aucun playblast complet généré.

### Plan de caméras GT3 RS v21 et correction du ralentissement (2026-09-15)

Fichier courant : `assets/blender/drivingsens_hero_camera_plan_v21.blend`. Les plans hérités qui
cadraient des surfaces sans signature ont été remplacés aux images 195-595 par dix caméras dédiées :
arrière trois-quarts bas, cockpit conducteur, avant trois-quarts aéro, verticale complète, travelling
latéral, face avant basse, détail arrière aileron/ligne lumineuse, chasse diffuseur, drone sculpture et
cockpit d'arrivée. Les mouvements restent à l'extérieur de la géométrie.

Le ralentissement parasite après l'accélération venait de la courbe de parcours v20 : environ 44 m
atteints à l'image 130, puis seulement 26 m supplémentaires jusqu'à l'image 194. La nouvelle courbe
conserve environ 1 m par image sur ce secteur : 40 m vers l'image 130, 54 m à 145 et 105 m à 194,
sans chute visible avant la coupe de l'image 195. La rotation des roues GT3 RS suit désormais la
distance du véhicule.

Le bug d'habitacle visible depuis l'arrière a été supprimé en masquant les anciens sièges lors des
plans extérieurs et en neutralisant les anciennes clés de visibilité qui faisaient disparaître la
carrosserie autour de l'image 421. Les deux vues cockpit utilisent un blocking propre et isolé :
volant compact, compteur central, bandeau de tableau de bord et écran. Vérification réelle par rendus
fixes aux dix débuts de plans, puis contrôle renforcé aux images 194/195, 226/570 et 310. Les portiques
et leurs temps de lecture n'ont pas encore été retouchés dans cette passe.

### Premier portique lisible v22 (2026-09-15)

Fichier courant : `assets/blender/drivingsens_hero_gate1_v22.blend`. Seule la première phrase a été
traitée pour valider la grammaire avant de l'étendre aux trois autres portiques. Le trois-quarts arrière
v21 est conservé aux images 195-209. Une caméra fixe en espace monde, alignée automatiquement sur la
normale du panneau, prend le relais aux images 210-258 : « VOUS ÊTES EN QUÊTE DE SENSATIONS FORTES. »
remplit presque tout le cadre pendant 49 images, avec un très léger push-in et sans traversée de
géométrie. Le plan cockpit v21 reprend à l'image 259 et reste présent jusqu'à 285.

Le cadrage est calculé depuis les dimensions réelles du texte et le format 16:9, plutôt qu'à partir
d'une distance arbitraire. Vérification par rendus fixes aux images 195, 209, 210, 218, 250, 258 et 259 :
plan voiture conservé, texte lisible dès la coupe et pendant toute la tenue, puis raccord cockpit
cohérent après le portique. Les feux de départ et les autres portiques n'ont pas été modifiés.

### Tous les portiques lisibles v23 (2026-09-15)

Fichier courant : `assets/blender/drivingsens_hero_all_gates_v23.blend`. Le départ et le premier
portique validé en v22 sont conservés. La même grammaire est appliquée aux trois phrases restantes :
plan automobile court, coupe franche sur le panneau pendant environ 52 images avec un léger push-in,
puis reprise immédiate sur un angle distinctif de la voiture. Le deuxième texte occupe les images
346-397, le troisième 430-481 et le quatrième 518-569. Les plans automobiles associés sont conservés
et resserrés pour garder un rythme dynamique.

Les cadrages sont alignés en espace monde sur la face de chaque panneau et calculés depuis les
dimensions réelles du texte au format 16:9. Contrôle visuel effectué sur 21 rendus fixes dans
`assets/blender/exports/v23_gates_checks/`, couvrant le début, la tenue, la fin et les raccords de
chaque séquence. Les trois phrases sont entières, centrées et lisibles, sans traversée de géométrie.
Aucune vidéo complète n'a été régénérée.

### Corrections caméra et texte après retour de Julien sur le montage logique v24 (2026-09-16)

Fichier courant (inchangé) : `assets/blender/drivingsens_hero_logical_cameras_v24.blend` (694
images, 24 fps, ~28,9 s — construit par `build_logical_camera_plan_v24.py`, cf. le shot-list dans
ce script pour la correspondance image/plan). Julien a regardé `exports/drivingsens_hero_v24_review.mp4`
et signalé 4 défauts précis par plage de secondes. Diagnostic fait en rendant chaque plan en vrai
rendu caméra 1280×720 (pas l'aperçu basse résolution du mp4 de contrôle) avant toute correction,
puis re-rendu après coup pour vérification — même exigence que les passes précédentes.

1. **4-5 s — `V24_CAM_LAUNCH_REAR_LOW` (image 97, pose de départ) : anneaux du diffuseur arrière
   coupés en bas de cadre.** Confirmé par rendu réel à l'image 97 exacte (invisible dès l'image 104,
   donc défaut limité à la pose de départ). Corrigé en reculant et remontant la caméra à cette
   image (location (2.85,-5.90,0.92) → (3.35,-6.85,1.28), lens 56 → 50) ; la pose de fin (image 116)
   n'a pas bougé.
2. **12-13 s — `V21_CAM_TOP_SIGNATURE` (images 285-312) : vue du dessus trop serrée, capot et
   aileron coupés aux deux extrémités du plan.** Corrigé en remontant la caméra et en élargissant
   l'objectif aux deux images clés (image 285 : z 10.80 → 14.20 m, lens 46 → 38 ; image 312 :
   z 11.40 → 15.00 m, lens 48 → 40).
3. **15-16 s — `V21_CAM_SIDE_AERO_TRACK` (images 349-375) : plan latéral droit peu lisible,
   remplacé par un vrai plan roue.** Nouvelle caméra dédiée `V24_CAM_WHEEL_FL_FACE` (parentée à
   `CAR_ROOT`, positionnée dans l'axe de la roue avant-gauche `GT3RS11_WheelSpin_FL` et visant son
   centre) : plein cadre sur la roue de face, jante à écrou central et enjoliveur entiers, tenue
   avec léger push-in. Le marker de timeline `SHOT_09_SIDE_AERO_TRACK` (image 349) a été repointé
   vers cette nouvelle caméra — **piège trouvé en cours de route** : modifier `scene.camera`
   manuellement ne suffit pas, un marker avec caméra assignée reprend la main à chaque
   `frame_set()`, il faut mettre à jour `marker.camera` lui-même.
4. **18-19 s — `V24_CAM_GATE4_CAR_AND_TEXT` (images 534-565), pas le portique 3.** Première passe
   erronée : le calcul brut secondes→images avait pointé sur le portique 3 (430-461) et c'est lui
   qui avait été dézoomé/redressé par erreur, puis **entièrement annulé** (caméra recréée avec les
   paramètres d'origine `distance=30.0, side_amount=3.2`, comme dans `build_logical_camera_plan_v24.py`)
   après que Julien a précisé qu'il parlait du **4e portique**, repéré en avançant/scrubant
   directement dans la vidéo plutôt qu'en calculant depuis le minutage. Mesure faite sur le portique
   4 d'origine : convergence de ~1,9° sur l'arête haute du panneau à l'image 534 (nettement plus que
   les autres portiques, la courbure de piste à cet endroit accentuant l'effet), ni la caméra ni les
   piliers n'ayant de roulis réel. Corrigé en dézoomant (distance 30 → 39 m) et en réduisant
   l'obliquité latérale (`side_amount` -3.0 → -1.6, légère remontée de caméra) : convergence
   ramenée à ~0,3-0,5°, portique entier dans le cadre avec marge. Les portiques 1, 2, 3 restent à
   leurs paramètres d'origine.
5. **21-22 s — `V21_CAM_DRONE_SCULPTURE` (images 493-529) : voiture partiellement hors cadre**
   (avant coupé à l'image 504, aileron arrière coupé à l'image 528). Signalé par Julien après la
   1ère passe (absent de sa description initiale). Corrigé en reculant/remontant la caméra sur ses
   deux images clés (493 : distance ~16 m → ~22 m, lens 46 → 39 ; 529 : distance ~18 m → ~24 m,
   lens 50 → 42) : la voiture entière reste dans le cadre avec marge sur tout le plan.
6. **Texte des portiques collé en haut du panneau, grande marge en bas — portiques 1 à 4, pas le
   portique d'arrivée.** Confirmé par calcul (bounding box réelle du titre + de la phrase via
   `matrix_basis`, le `matrix_world` de ces objets non parentés restait figé à l'identité tant que
   `view_layer.update()` n'avait pas été forcé — piège noté pour la suite) : marge haute ~0,38 m
   contre ~0,68 m en bas sur un panneau de 3,2 m de haut. Corrigé en décalant `TITLE` et `PHRASE`
   vers le bas de -0,197 m (portique 1) et -0,139 m (portiques 2-4, texte légèrement plus court) —
   marges haute/basse égales des deux côtés après correction. Le portique d'arrivée (`FINISH_TITLE_1..4`)
   n'a pas été touché : vérifié à l'écran, ses 4 libellés étaient déjà centrés verticalement.

**Piège à retenir** : ne pas convertir une plage de secondes en numéro de portique par calcul seul
quand Julien décrit un défaut vu en scrubant la vidéo — confirmer d'abord quel portique/plan précis
il vise, le montage ayant plusieurs plans très proches en timing.

**Vérification faite avant de livrer** : chaque caméra corrigée a été rendue en vrai rendu (pas
l'aperçu) aux images clés concernées et relue directement (pas seulement mesurée) — image 97
(anneaux visibles), images 285/312 (voiture entière), images 349/362/375 (roue entière, jante et
enjoliveur lisibles), images 504/516/528 (voiture entière, plan drone), images 534/541/565 (portique
4 dézoomé et redressé), images 214/324/437/541 (texte centré sur les 4 portiques). Portique 3
revérifié après annulation : identique à `build_logical_camera_plan_v24.py` d'origine. `.blend`
sauvegardé.

### Corrections après second retour de Julien le 2026-09-16 — lisibilité, texte réellement caché, ailerons coupés

Julien a rejugé le résultat (probablement en scrubant directement dans Blender plutôt qu'en
regardant un mp4 exporté — aucun rendu vidéo complet n'a jamais été généré dans cette série de
passes) et signalé 4 points :

1. **Le portique corrigé n'était pas le bon.** Julien visait le **4e portique** (repéré en
   avançant dans la vidéo, pas par calcul de minutage), pas le 3e. Le portique 3 a été **entièrement
   annulé** — caméra recréée avec les paramètres d'origine exacts de
   `build_logical_camera_plan_v24.py` (`distance=30.0, side_amount=3.2`).
2. **Le dézoom du portique 4 était excessif** : texte devenu trop petit, plus le temps de le lire.
   Rééquilibré à `distance=31.5` (au lieu de 39) tout en gardant `side_amount=-1.6` (contre -3.0
   d'origine) pour limiter la convergence/inclinaison. Résultat mesuré : convergence ramenée à
   ~0,5-0,9° (contre ~1,9° d'origine), texte à nouveau grand et lisible, portique et voiture entiers
   dans le cadre.
3. **21-22 s oublié à la passe précédente** — `V21_CAM_DRONE_SCULPTURE` (images 493-529) coupait
   l'avant de la voiture à l'image 504 et l'aileron arrière à l'image 528. Corrigé en reculant/
   remontant la caméra sur ses deux images clés (493 : distance ~16 → ~22 m, lens 46 → 39 ; 529 :
   distance ~18 → ~24 m, lens 50 → 42).
4. **Le centrage vertical du texte des portiques n'avait en réalité pas fonctionné.** Cause
   racine : l'objet `V8_GATE_N_PHRASE` est **caché au rendu** (`hide_render=True`,
   `hide_viewport=True`) sur les 4 portiques — tout le texte visible (les 2 lignes de la phrase)
   vit en fait dans l'objet `V8_GATE_N_TITLE` (corps `"...\n..."`), `PHRASE` n'étant qu'un
   résidu d'une itération antérieure. Le calcul de la passe précédente centrait donc
   `TITLE ∪ PHRASE` — dont la moitié invisible — au lieu du seul bloc réellement affiché, ce qui
   donnait un résultat numériquement "centré" mais visuellement toujours collé en haut du panneau
   (confirmé par lecture directe des pixels du rendu : ~23 px de marge en haut contre ~86 px en
   bas). Corrigé en centrant `TITLE` seul sur les bornes du panneau (`V8_GATE_N_BRIDGE`) : décalage
   supplémentaire de -0,389 m (portique 1) et -0,4335 m (portiques 2-4). Le badge `NUMBER` (ex.
   "01") a été décalé du même montant pour rester visuellement apparié au texte. Marges haute/basse
   égales confirmées par rendu réel sur les 4 portiques.

**Balayage supplémentaire** (Julien avait aussi signalé "quelques plans" où un bout d'aileron ou de
pneu reste hors cadre, sans préciser lesquels) : tous les plans du montage ont été rendus en vrai
rendu à leurs images de début/milieu/fin et inspectés un par un. Trouvé et corrigé — l'aileron
arrière (bout d'"endplate") sortait du cadre par le haut sur 4 plans qui ne l'avaient jamais montré
en entier : `V21_CAM_REAR_LIGHTBAR_WING` (403-425), `V21_CAM_FRONT_THREE_QUARTER_AERO` (263-284),
`V21_CAM_FRONT_FACE_LOW` (376-402) et `V24_CAM_GATE1_APPROACH` (178-206). Corrigé sur chacun en
remontant la caméra et sa cible (+0,25 à +0,4 m selon le plan) avec un léger recul/élargissement de
l'objectif pour compenser. Tous les autres plans contrôlés dans ce balayage (`V21_CAM_LOW_CHASE_DIFFUSER`,
`V24_CAM_LAUNCH_TOP_ARC`, `V24_CAM_FINISH_CROSS_EXT`, `V24_CAM_FINISH_CAR_AND_CHOICES`) montraient
déjà la voiture entière, aucun changement nécessaire.

**Piège à retenir (texte de portique)** : avant de mesurer/centrer un texte, toujours vérifier
`hide_render`/`hide_viewport` de CHAQUE objet texte impliqué — un objet avec les bonnes coordonnées
mais caché au rendu fausse silencieusement tout calcul de bounding-box combiné.

**Vérification faite avant de livrer** : chaque caméra retouchée dans cette passe a été rendue en
vrai rendu et relue directement — portique 4 (534/541/565), plan drone (504/516/528), portique 1 à
4 texte (214/324/437/541, marges mesurées pixel par pixel), et les 4 plans à aileron coupé
(403/414/425, 263/284, 376/402, 178/192/206), plus confirmation que les autres plans du montage
n'ont pas besoin de retouche. `.blend` sauvegardé.

### Troisième retour de Julien le 2026-09-16 — rééquilibrage portiques 2/3/4, roue coupée en début de parcours

Julien a jugé la passe précédente encore imparfaite sur 2 points, plus un rappel :

1. **Portiques 2, 3, 4 : texte encore trop petit/pixelisé, caméra trop loin par rapport au
   portique 1.** Mesure faite avant retouche : les 4 panneaux occupaient en fait une largeur
   d'image quasiment identique (802-804 px sur les portiques 1-3, un peu moins sur le 4 après le
   rééquilibrage précédent) — donc pas un vrai écart de cadrage, mais le texte reste petit sur un
   panneau large et un rendu à cette taille le fait paraître crénelé/pixelisé. Corrigé en
   rapprochant la caméra sur les portiques 2, 3 et 4 (`distance` 30 → 25,5 sur 2 et 3, 31,5 → 26,5
   sur 4) tout en réduisant `side_amount` dans la même proportion pour ne pas réintroduire de
   convergence/inclinaison (portique 2 : -3,0 → -2,55 ; portique 3 : 3,2 → 2,72 ; portique 4 : -1,6
   → -1,35). Texte nettement plus grand et net sur les 3 portiques, portique et voiture toujours
   entiers en cadre, inclinaison mesurée ≤1,1° partout (comparable au portique 1 resté à l'identique
   à distance 30). Le portique 1 n'a pas été touché (référence).
2. **Roue avant coupée pendant `V24_CAM_LAUNCH_SIDE_WHEEL` (images 117-136), avant le portique 1.**
   C'est très probablement le "bout de rond" que Julien avait déjà signalé sans plus de précision —
   confirmé par rendu réel : le bas du pneu sort du cadre, de façon croissante jusqu'à l'image 136
   où la moitié inférieure de la roue est hors champ. Corrigé en reculant/remontant la caméra sur
   les deux images clés (117 : distance ~2,1 m → ~2,7 m, lens 60 → 54 ; 136 : lens 58 → 52) : roue
   entière visible avec marge sur tout le plan.
3. **Balayage de la première partie (1-206, avant le portique 1) redemandé.** Les autres plans de
   cette section (plongée toit→cockpit, feux de départ figés, gros plans levier/pédale) ont été
   revérifiés par rendu réel : feux de départ ronds et entiers à chaque image contrôlée (35, 40, 50,
   55, 58, 60), gros plans levier/pédale volontairement très serrés par nature (plans de détail, pas
   concernés par la demande). Aucun autre recadrage nécessaire trouvé dans cette section au-delà de
   la roue (point 2) et des 2 plans déjà corrigés à la passe précédente (aileron sur
   `V24_CAM_LAUNCH_FRONT_SWEEP` et `V24_CAM_GATE1_APPROACH`).

**Vérification faite avant de livrer** : rendu réel et lecture directe sur les 3 portiques
rééquilibrés (317/324/332/348, 430/437/445/461, 534/541/550/565) avec mesure de largeur de panneau
(pixels) et d'inclinaison (pente de l'arête haute) avant/après, et sur la roue avant corrigée
(117/126/136). `.blend` sauvegardé.

### Quatrième retour de Julien le 2026-09-16 — gros plan final sur le portique d'arrivée

Julien a jugé le plan final (`V24_CAM_FINISH_CAR_AND_CHOICES`, images 621-694) trop large : le
panneau des 4 catégories n'occupait qu'une petite portion du cadre, beaucoup de route et de ciel
vides autour, texte trop petit — problématique car **ce plan est celui qui deviendra l'écran de
choix cliquable du site** (une catégorie = une zone cliquable), donc la lisibilité y prime sur tout
le reste de la vidéo.

Caméra reconstruite avec le même calcul de `finish_center`/`approach`/`finish_side` que l'original,
mais avec une trajectoire de zoom beaucoup plus agressive et une cible qui bascule presque
entièrement sur le panneau en fin de plan (poids du panneau dans la cible : 0,58 → 0,97, contre
0,58 → 0,58 fixe avant) :

| Image | Distance avant | Distance après | Poids panneau avant | Poids panneau après |
|---|---|---|---|---|
| 621 | 31,5 m | 31,5 m (inchangé) | 0,58 | 0,58 |
| 636 | 29,0 m | 26,0 m | 0,58 | 0,70 |
| 650 | 26,0 m | 21,0 m | 0,58 | 0,80 |
| 668 | 24,5 m | 18,0 m | 0,58 | 0,87 |
| 694 | 22,8 m | 17,0 m | 0,58 | 0,90 |

**Premier essai trop agressif** : une première tentative (distance 12-13 m en fin de plan, poids
panneau jusqu'à 0,97) zoomait tellement que les libellés "INDUSTRIE & MARQUES" et "PERFORMANCE &
PASSION" (les deux catégories aux extrémités) sortaient du cadre par les côtés — corrigé en reculant
à 17-18 m pour l'image 694, qui garde les 4 catégories entières avec une petite marge tout en
remplissant l'essentiel du cadre.

**Vérification faite** : rendu réel aux 5 images clés (621, 636, 650, 668, 694) — plan large en
image 621 (voiture + portique en contexte), zoom progressif, image 694 finale avec le panneau
occupant l'essentiel du cadre, les 4 catégories entières et lisibles, sans coupure latérale.
`.blend` sauvegardé.

**Ouvert** : les coordonnées d'écran normalisées des 4 zones cliquables (utilisées par l'ancien
tableau `beat10_finish` en v3, obsolète depuis le passage à ce nouveau design à 1 rangée) n'ont pas
été recalculées pour ce nouveau cadrage — à faire via `world_to_camera_view` sur `FINISH_TITLE_1..4`
à l'image 694 avant l'intégration HTML des zones cliquables.

### Ralenti sur les 4 portiques et le plan final le 2026-09-16 — retiming global de la timeline

Julien a demandé un vrai ralenti (durée de lecture allongée, pas juste un cadrage) sur les 4
portiques et sur le plan final, quitte à rallonger toute la vidéo. Fait via un **retiming global de
toute la timeline** : durée de tenue de chaque portique étendue de 36 images (1,5 s à 24 fps), plus
60 images supplémentaires (2,5 s) rien que pour la tenue finale sur le portique d'arrivée, et tout
ce qui suit chaque point d'insertion décalé d'autant pour ne rien faire se chevaucher. Durée totale
694 → **922 images** (28,9 s → 38,4 s).

Mécanique : une fonction `remap(frame)` calculée une fois sur les frontières d'origine
(207/317/430/534/621, jamais des valeurs déjà décalées) ajoute +36 images à tout ce qui suit chacun
des 4 portiques et +60 images supplémentaires à tout ce qui suit le début du plan final, puis est
appliquée en **une seule passe** à chaque keyframe (caméras, `TRACK_PATH.eval_time`, bascules de
visibilité `hide_render`/`hide_viewport`, matériaux animés) ainsi qu'aux markers de la timeline et à
`scene.frame_end`.

**Piège trouvé et corrigé avant livraison** : une 1ère tentative appliquait le décalage via 4 appels
cumulés (`shift_after(seuil, +36)` répétés) plutôt qu'un remap en une passe — résultat détecté
directement dans les keyframes de la caméra finale (au lieu de +204 images attendues, +408 mesurées,
soit exactement le double). Cause : dans le système d'actions « slotted » de Blender 5.2, l'action
objet (position/rotation de la caméra) et l'action du bloc caméra (`lens`) sont en réalité **le même
datablock d'action partagé** — un code qui traite `obj.animation_data.action` puis
`obj.data.animation_data.action` séparément sans déduplication décale deux fois les mêmes
keyframes. Corrigé en collectant d'abord un **ensemble dédupliqué** de tous les datablocks d'action
concernés (`set()` sur les objets Python Action, pas sur les noms), puis en appliquant `remap()`
une seule fois par action. Après correction, vérifié keyframe par keyframe sur la caméra du
portique 2 et la caméra finale : valeurs exactement conformes au calcul attendu.

**Vérification faite avant de livrer** : rendu réel aux nouvelles bornes de tenue de chaque portique
(portique 1 à l'image 274, portique 2 à l'image 420) — texte toujours lisible, voiture et portique
toujours correctement cadrés, aucune discontinuité visible. Plan final testé aux images 898 et 915
(dans la zone de tenue pure au-delà du dernier keyframe, extrapolation `CONSTANT`) : image
strictement identique aux deux, confirmant une tenue statique fiable pour la lecture. `.blend`
sauvegardé avec `scene.frame_end = 922`.

**Piège à retenir pour toute future modification de timing sur ce fichier** : ne jamais décaler des
keyframes objet par objet sans dédupliquer d'abord les datablocks d'`Action` réellement distincts —
vérifier `action.users` et comparer les objets Python (`is`/`==`) avant de traiter, pas seulement
les noms.

**Annulé le 2026-09-16, même jour** : Julien a jugé 38,4 s trop long, contrainte explicite
"en dessous des 30 secondes". Le ralenti ci-dessus a été **entièrement annulé** via la fonction
inverse exacte du remap (mêmes bornes, décalages négatifs), vérifié keyframe par keyframe sur la
caméra du portique 1 et la caméra finale — retour exact aux valeurs d'origine (694 images, 28,9 s).
Toutes les autres corrections de cette session (cadrage des 4 portiques, roue coupée, gros plan
final, centrage du texte, portique 4 redressé) restent intactes, seul le timing a été défait.

**Non résolu** : donner un vrai temps de lecture supplémentaire sur les portiques/le plan final tout
en restant sous 30 s n'est pas possible par un simple ralenti global — la marge disponible
(694 s actuels → 720 images max pour 30 s) ne laisse que ~26 images à répartir sur 5 plans, ce qui
serait imperceptible. Pour un vrai gain de lisibilité sous la contrainte de 30 s, il faudrait
raccourcir des plans de remplissage existants (transitions entre portiques, plan drone, retour
cockpit avant l'arrivée...) pour financer le temps de lecture ajouté — pas fait, en attente d'une
confirmation explicite de Julien avant de toucher à des plans qu'il n'a pas signalés comme
problématiques.

### Plan levier de vitesse dézoomé le 2026-09-16 — `CAM_GEARSHIFT_DETAIL`

Julien a signalé que le plan macro sur le levier de vitesse (images 61-76, avant le portique 1)
était trop serré : on ne voyait pas le mouvement complet de la main qui passe la vitesse. Confirmé
par rendu réel — le cadrage d'origine (location `(0,-0.55,1.85)`, lens 52 mm) ne montrait que la
boule du levier et un bout de main, sans le pied du levier ni le vrai trajet du geste.

**Piège rencontré** : dézoomer en reculant la caméra (le long de son axe de visée) révèle des murs
d'occlusion (`V11_OCCLUDE_WALL_L/R`, `V11_OCCLUDE_FIREWALL`) qui n'existent que pour bloquer le
regard à travers l'habitacle depuis l'extérieur — ils sont rendus visibles uniquement pendant cette
fenêtre (61-76) par le script de construction d'origine, mais ce sont de simples pans gris plats,
pas un vrai décor de console. Un recul de caméra même modéré (0,3-1,1 m) les rend très visibles et
casse la lisibilité de la scène (effet "boîte grise"). Solution retenue : **ne pas déplacer la
caméra**, seulement élargir l'objectif (lens 52 → 36 mm) depuis la même position — cela montre le
pied du levier (`V19_GEAR_STALK`), la base (`V19_GEAR_BOOT`) et l'intégralité du geste de la main
sur les 3 phases (neutre / vers la gauche / engagé), sans que les murs d'occlusion ne dominent le
cadre (juste visibles en périphérie sombre, acceptable).

**Vérification faite** : rendu réel aux images 61, 65, 70 et 76 — mouvement de la main et parcours
du levier clairement lisibles sur toute la séquence, pied du levier visible, aucun élément
incongru dominant le cadre. `.blend` sauvegardé.

### Session 2026-09-17 — revue de la 1ère génération Higgsfield, retouches caméra, bug d'arrivée trouvé mais pas corrigé, nouveau prompt

Julien a montré la 1ère vidéo générée par Higgsfield (`hf_20260917_145312_...mp4`, 30 s) et signalé
plusieurs défauts après visionnage réel (pas juste des stills) : pédales incohérentes (les 2 pieds
appuient au centre d'une pédale unique, aucune pédale de frein/accélérateur distincte modélisée —
défaut du rendu Higgsfield, pas de la previz Blender qui n'a jamais modélisé de pédales détaillées),
portique supplémentaire visible au loin derrière le portique d'arrivée (incohérence), gravier
brun/terreux à remplacer par un calcaire blanc propre, compteur affichant 0 km/h en cockpit alors
que la voiture roule, voiture qui s'arrête net sur le plan final au lieu de continuer à rouler.

**Diagnostic caméra "manque de dynamisme"** : Julien a d'abord dit apprécier une "séquence 10 à 14"
plus dynamique que le reste — vérification par mesure directe des courbes (translation/rotation
locale par frame) a montré qu'un premier chiffre annoncé ("spin caméra à 360° sur le plan 10") était
un artefact de calcul (conversion euler→quaternion instable près d'un gimbal lock), pas une vraie
rotation — corrigé et signalé à Julien avant de continuer. Le vrai constat, confirmé ensuite par
Julien : ce qu'il apprécie, ce sont de vrais **changements d'angle** (la caméra qui tourne/révèle un
autre point de vue), pas juste des transitions accélérées entre les mêmes positions.

**Retouches caméra faites, dans l'ordre (toutes vérifiées par rendu réel, pas seulement par les
courbes)** :
1. Tentative d'accélérer la transition existante du plan 1 (`V10_CAM_ROOF_TO_COCKPIT`, frame 28→36)
   via un easing `EXPO`/`EASE_OUT` — **rejetée par Julien** ("t'as juste accéléré la transition, je
   veux de vrais changements d'angle") puis **annulée**, retour à l'interpolation `BEZIER`/`AUTO`
   d'origine sur `location[1]`, `location[2]`, `rotation_euler[0]`.
2. Ajout d'un vrai arc latéral + rotation de lacet sur le plan 1 (frames 1-28, avant le plongeon) et
   d'un whip de lacet sur `V24_CAM_LAUNCH_REAR_LOW`/`V24_CAM_GATE1_APPROACH` (plan 3, sous-plans A et
   E) — **rejeté par Julien** ("le zigzag, je veux pas ça") : le mouvement latéral aller-retour lisait
   comme un zigzag plutôt qu'un vrai virage. **Annulé**, keyframes ajoutées (frames 10/20 sur
   `location[0]` et `rotation_euler[2]`) supprimées, retour à 0 partout comme à l'origine.
3. Simplification du zoom du plan 1 (`DATA.lens` de `V10_CAM_ROOF_TO_COCKPIT`) : l'ancienne courbe à
   7 clés (34→33→30→30→29→29→29 mm) faisait un zoom-avant, un palier, puis un second petit zoom —
   perçu par Julien comme un "zoom, dézoom" avant d'arriver sur le portique "DRIVING SENS". Réduit à
   2 clés (frame 1 = 34 mm, frame 60 = 29 mm), une seule courbe continue. **Julien a validé.**
4. Suppression du recul/ré-approche du plan 1 en position (frames 16 et 28 sur `location[1]`/`[2]`/
   `rotation_euler[0]`, qui faisaient reculer légèrement la caméra avant le plongeon final) — même
   cause que le point 3, un aller-retour perçu comme "zoom et dézoom" avant l'arrivée sur les feux du
   portique. Gardé uniquement frame 1 et frame 36 (le point d'arrivée), résultat : approche continue
   sans recul, vérifiée par rendu à 1/5/10/15/20/25/28/32/36. **Julien a validé** ("plus qu'un seul
   mouvement continu... c'est réglé").
5. **Vrai changement d'angle ajouté sur le plan 3D** (`V24_CAM_LAUNCH_TOP_ARC`, frames 157-177,
   "top arc") : ajout d'une contrainte **Track To** ciblant `CAR_ROOT` (garantit que la voiture reste
   cadrée quelle que soit la position caméra), puis élargissement du balayage latéral
   (`location[0]` : 4,1 → -1,8 à la frame 177, était 4,1 → -1,0 sans la contrainte lors d'un premier
   essai qui a fait sortir la voiture du cadre — corrigé en ajoutant la contrainte avant de ré-essayer
   avec une amplitude plus grande) et de la hauteur de grue (`location[2]` : 6,6 → 8,2). Vérifié par
   rendu aux frames 157/165/172/177 : la voiture reste cadrée tout du long, vrai arc de grue qui
   passe d'un 3/4 arrière à une vue quasi plongeante puis ressort de l'autre côté. **Julien n'a pas
   encore vu ce rendu** (la connexion Blender a coupé juste après) — à lui montrer en priorité à la
   reprise.

**Revue complète des 694 frames** (nouveau playblast `shot01_f27.png0001-0694.mp4`, 1920×1080,
24 fps, exporté par Julien depuis Blender) — une image par marker de plan (SHOT_01 à SHOT_17,
43 frames au total) relue directement avec l'outil `Read`, pas seulement mesurée :
- **Aucun portique supplémentaire trouvé** derrière le portique d'arrivée ni ailleurs sur
  l'ensemble du parcours — le défaut signalé par Julien sur la 1ère vidéo Higgsfield ne se
  reproduit pas dans cette previz Blender ; probablement spécifique au rendu Higgsfield (absence de
  brouillard/flou de profondeur), pas un problème de géométrie/placement des portiques dans le
  `.blend`.
- **Bug confirmé, PAS ENCORE CORRIGÉ** : aux frames 621, 660 et 694 (plan final, portique d'arrivée),
  **la voiture a complètement disparu du cadre** — il ne reste que le panneau. Cause identifiée :
  `CAR_ROOT["gt3_distance_m"]` (propriété custom qui pilote une contrainte `FOLLOW_PATH` nommée
  `FollowTrackPath`) a sa dernière keyframe à la frame 646 (valeur 515) et reste figée ensuite
  (extrapolation `CONSTANT`) jusqu'à la fin du plan à la frame 694 — la voiture s'arrête donc
  physiquement sur la piste ~2 s avant la fin, pendant que la caméra du plan final continue son
  mouvement propre vers le panneau, ce qui la fait sortir du cadre. **La connexion MCP à Blender a
  coupé avant que la correction (prolonger les keyframes de `gt3_distance_m` au-delà de la frame
  646) ait pu être appliquée** — c'est la toute première chose à faire à la reprise, avant tout
  autre travail sur ce fichier.
- Le tableau de bord n'a **aucun objet de compteur numérique modélisé** dans cette previz (juste des
  blocs `MESH` génériques `V21_COCKPIT_CLUSTER`/`V6_DIGITAL_CLUSTER`/`V21_COCKPIT_DASH`, sans texte
  ni image) — le "compteur à 0 km/h" vu sur le rendu Higgsfield est un habillage HUD de la génération
  finale, pas un objet à corriger dans Blender. Idem pour le gravier (matériau plat gris dans le
  blocking) et les pédales (aucune séparation frein/accélérateur modélisée) : ces 3 points ont été
  redirigés vers le prompt Higgsfield plutôt que vers une modification Blender.

**Nouveau prompt Higgsfield produit et sauvegardé** : `higgsfield-prompt-hero.md` (racine du
dossier projet) — reprend le 1er prompt de Julien avec les tags renommés
(`face-avant`→`face-avant-drivingsens`, `face-arriere`→`face-arrier-driving-sens`,
`video-reference`→`videoreference`), les 5 corrections ci-dessus (pédales, cohérence portiques,
gravier, compteur, voiture qui continue de rouler) et 4 raffinements cinématographiques demandés
par Julien pour homogénéiser l'émotion du film (flare récurrent aux portiques, heat-shimmer lié à
la vitesse, note de rythme émotionnel en 5 mouvements, souffle de caméra organique sur les inserts
récurrents). **Pas encore envoyé à Higgsfield** — en attente de l'upload de la nouvelle vidéo de
référence (`@videoreference`, sans UUID pour l'instant) et de la validation finale de Julien.

**État de sauvegarde à la fin de cette session — IMPORTANT** : la connexion MCP à Blender a coupé
avant la fin (pendant l'investigation du bug de la frame 646) et n'a pas pu être rétablie. **Les
retouches caméra des points 3, 4 et 5 ci-dessus n'ont probablement pas été sauvegardées sur
disque** (pas de confirmation `bpy.ops.wm.save_mainfile()` obtenue). À la reprise : rouvrir Blender,
reconnecter le MCP, vérifier `bpy.data.is_saved` et l'horodatage du `.blend`, **sauvegarder
immédiatement** si les modifications sont encore présentes dans la session ouverte, avant toute
autre action. Si la session Blender a été fermée entre-temps, ces 3 retouches sont perdues et
devront être refaites depuis cette description.

### Pivot vers vraie vidéo filmée + écran de sélection par cartes, le 2026-09-17/18

**Abandon (temporaire) du pipeline Blender/Higgsfield pour le hero** : Julien a fourni directement
plusieurs vraies vidéos filmées (Porsche 911 GT3 RS sur circuit, plaque avant "DRIVINGSENS", fichiers
`.MOV` HEVC 1280×720, ~27-29 s, déposés dans `~/Downloads`, jamais committés tels quels) et a demandé
de remplacer l'image statique + l'effet de zoom au scroll par cette vidéo en fond de hero. Le hero
est passé par de nombreuses itérations de contenu vidéo (6+ remplacements) au fil de la session — le
process de remplacement est maintenant rodé, voir ci-dessous.

**Process de remplacement vidéo (à reproduire à chaque nouvelle vidéo fournie par Julien)** :
1. `ffprobe` la source pour vérifier codec/résolution/durée (typiquement HEVC 1280×720, avec piste
   audio à ignorer).
2. Réencoder en H.264 web-safe, muet, sans changer aucun autre paramètre sauf demande explicite :
   `ffmpeg -i <source> -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 16 -preset slower
   -movflags +faststart assets/video/hero.mp4`. CRF 16 a été choisi après plusieurs allers-retours
   (24 → 19 → 16) sur une plainte de flou/texte pas net sur les panneaux de piste — **CRF 16 est
   déjà proche du maximum utile** : à ce niveau le goulot d'étranglement n'est plus l'encodage mais
   la résolution source (1280×720 stretché en plein écran, surtout sur écran Retina) — voir la
   discussion "vidéo trop floue" plus bas, aucun réglage d'encodage supplémentaire n'aidera sans une
   source plus grande.
3. Régénérer le poster depuis la nouvelle première frame :
   `ffmpeg -i <source> -vframes 1 -q:v 3 assets/img/hero-poster.jpg`.
4. **Bump le paramètre `?v=N` sur `<source src="assets/video/hero.mp4?v=N">` dans `index.html`** —
   le nom de fichier ne change jamais donc sans ce cache-bust le navigateur de Julien ressert
   l'ancienne vidéo en cache après un simple reload (a causé une fausse alerte "c'est toujours flou"
   alors que c'était juste du cache navigateur).
5. Si la vidéo se termine sur un plan différent du précédent (ex. panneau texte vs plan voiture
   symétrique), revérifier si le recadrage de fin (voir plus bas) a encore du sens pour ce nouveau
   plan — sinon le retirer, ne pas le laisser trainer.

**Synchronisation avec l'intro logo** : au premier essai, la vidéo démarrait en `autoplay` dès le
chargement de la page, donc jouait déjà plusieurs secondes pendant que l'overlay du logo (`#intro`,
`js/intro.js`) la masquait encore — au moment où le logo disparaissait, le début de la vidéo semblait
"coupé". Fix : la vidéo n'a plus l'attribut `autoplay` ; `js/intro.js` dispatch un
`document.dispatchEvent(new CustomEvent("introreveal"))` au moment où l'overlay commence sa sortie
(`.is-departing`, pas seulement à `unlock()`/fin complète — Julien a aussi demandé d'accélérer le
déclenchement, donc l'event part dès le début du fondu de sortie plutôt qu'à la fin, gain ~700 ms) ;
`js/hero-video.js` écoute cet event une fois (`{ once: true }`) et appelle `video.play()` à ce
moment-là. Pas de `loop` sur la balise `<video>` — Julien a explicitement demandé qu'elle **s'arrête
et se fige sur sa dernière frame**, comportement par défaut du tag vidéo sans `loop`.

**`object-fit` — cover partout, sauf extrêmes** (`css/hero.css`) : après un aller-retour où Julien a
d'abord demandé `contain` (pas de recadrage, format natif 16:9) puis est revenu sur `cover` ("comme
sur tous nos sites", pas de bandes noires), le compromis retenu est **`cover` par défaut**, avec
bascule en `contain` (+ fond `--ink` pour les bandes) uniquement sur les formats extrêmes via
`@media (min-aspect-ratio: 2/1), (max-aspect-ratio: 4/5)` — écrans ultra-wide (crop vertical sévère
sinon) et mobile portrait (crop horizontal sévère sinon). Sur un écran normal (laptop 16:10, moniteur
16:9) le crop de `cover` est déjà minimal, c'est un plancher géométrique incompressible, pas un
réglage en trop.

**Vidéo "trop floue" (2026-09-17)** : après vérification (extraction de frame brute depuis le fichier
encodé, comparaison bilinear vs lanczos+unsharp, test d'upscale 1080p), le fichier vidéo lui-même
était déjà net — le plafond réel est la résolution source (1280×720) étirée en plein écran,
particulièrement visible sur une frame figée en fin de vidéo (le mouvement masque normalement ce
défaut). Pas de solution côté encodage ; seules vraies solutions : une source plus haute résolution,
ou figer la fin sur un plan sans texte fin à lire.

**Recadrage de fin de vidéo — ajouté puis retiré, spécifique au contenu** : sur une ancienne version
de la vidéo qui se terminait sur le portique 4-catégories, le panneau texte était positionné trop
haut à l'écran (~35 % de hauteur au lieu de ~50 %). Un recadrage `transform: scale(1.15);
transform-origin: 50% 0%` avait été ajouté sur les 1,5 dernières secondes (classe `.is-final-scene`,
posée via `timeupdate`/`ended` dans `js/hero-video.js`, appliquée uniquement dans la plage
`@media (min-aspect-ratio: 4/5) and (max-aspect-ratio: 2/1)` pour ne pas toucher les cas déjà en
`contain`). **Retiré le 2026-09-18** quand une nouvelle vidéo fournie par Julien s'est mise à finir
sur un plan différent (la voiture de face, déjà bien cadrée) — le zoom devenait alors gratuit et
recadrait pour rien. **Piège à surveiller pour la suite** : ce genre de correction est couplée au
montage exact de la vidéo du moment ; à chaque nouveau remplacement, revérifier la vraie dernière
frame (`ffmpeg -ss <duration-0.1> -i hero.mp4 -vframes 1 ...` ou lecture jusqu'à `ended` en
conditions réelles, PAS un `currentTime` seeké sur un serveur sans support Range — voir piège
serveur ci-dessous) avant de décider si un recadrage de fin a encore du sens.

**Piège serveur de test local** : `python3 -m http.server` ne supporte pas les requêtes `Range`
(retourne `200` avec le fichier entier au lieu de `206 Partial Content`), ce qui casse le seek vidéo
dans un test Playwright (`currentTime` réglé en JS n'aboutit pas, la lecture reste bloquée au début).
Utiliser `npx --yes serve -l <port> .` pour tester tout scénario impliquant un seek/scrub vidéo — le
serveur `python -m http.server` sur le port **8090** reste néanmoins celui que Julien utilise pour
recharger la page lui-même, ne jamais le tuer (voir règle globale dans la mémoire de session).

**Écran de sélection par cartes, remplace le nav du header** (2026-09-18) : plutôt que des zones
cliquables sur la bannière vidéo (jugé "pas très joli" par Julien) ou le nav classique affiché dès le
début, la vidéo joue seule (header réduit à logo + CTA "Réserver un stage" pendant toute la lecture,
`.site-header__nav { display: none }` — **décision explicite de Julien, le nav ne doit plus jamais
réapparaître**, il ferait doublon avec les cartes). À la fin de la vidéo (`ended`) :
- la vidéo passe en `filter: brightness(0.35) saturate(0.7)` (transition 900 ms, classe `.is-dimmed`
  sur `#heroVideo`) ;
- un overlay `#heroChooser` (`.hero__chooser`) apparaît : titre "Que recherchez-vous&nbsp;?" puis 4
  cartes (mêmes 4 catégories que l'ancien nav, mêmes ancres `#performance-passion` etc.), fondu +
  translateY, décalées de 100 ms chacune (`nth-child` + `transition-delay` 150/250/350/450 ms) — effet
  cascade demandé explicitement par Julien, "assez rapidement quand même".
- Toute la logique est dans `js/hero-video.js` (écoute `ended`, ajoute les classes) et
  `css/hero.css` (`.hero__chooser*`).
Suite logique **pas encore tranchée avec Julien** : que se passe-t-il au clic sur une carte
(scroll vers une section à construire, ou changement de vue) ? Les 4 sections cibles n'existent
toujours pas (voir "Ouvert" plus haut, inchangé sur ce point).

**Autres retouches header** : logo agrandi `30px` → `42px` (`.site-header__brand img`), grille
`.site-header__inner` simplifiée de `1fr auto 1fr` (3 colonnes pour loger l'ancien nav centré) à
`1fr auto` (2 colonnes logo/CTA) une fois le nav supprimé — sans ce fix le CTA se retrouvait décentré
au lieu d'être plaqué à droite.

**Nettoyage** : `js/hero-parallax.js` (ancien effet de zoom/blur de la voiture au scroll,
scroll-driven) et le `.hero__scrim` (dégradé sombre posé pour la lisibilité du texte hero) ont été
supprimés — obsolètes une fois le fond passé en vidéo et le texte hero retiré à la demande de Julien.
`.hero-scroll` est repassé de `240vh` (nécessaire à l'ancien effet de scroll) à `100vh` (section fixe
normale, plus de scroll-jacking).

**Git** : ce projet n'avait jamais été committé — `assets/blender/` (≈3 Go de fichiers `.blend`,
`.blend1` et playblasts, chantier previz abandonné) **ne doit pas être ajouté en bloc** avec
`git add projects/drivingsens-site/`, cibler les fichiers un par un (source du site + assets
réellement utilisés) sous peine de committer plusieurs Go de binaires inutiles.
