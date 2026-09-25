# Driving Sens — Plan de tournage hero
## Séquence "De la grille à la ligne" — découpage technique v1

Produit le 2026-09-14 à partir de la séquence verrouillée dans `AGENTS.md`
(section "Nouveau concept hero"). Sert de référence à la construction Blender déléguée à un agent
de réalisation distinct.

**Statut :** durée et mécanisme de raccord validés par Julien le 2026-09-14 (voir corrections
ci-dessous) ; support physique du beat 6 en cours de validation (croquis envoyé).
**Périmètre :** conception caméra / timing / proportions uniquement. Aucune construction, aucun rendu, aucun appel générateur.
**Base figée (non rediscutée ici) :** Porsche 911 GT3 RS sans toit ouvrant, 6 beats dans l'ordre, portiques à 14 s (durée totale 24,4 s), photoréalisme façon film, texte 3D en dur sur les portiques, zones cliquables HTML au beat 6.

---

## Corrections post-validation (2026-09-14)

- **Durée totale : 24,4 s**, pas 21,4 s. Julien a choisi de garder les phrases complètes lisibles
  sur chaque portique plutôt que de hiérarchiser titre/phrase — ça pousse mécaniquement vers la
  variante "portiques à 14 s" (~1,8 s de lecture utile par portique). **Table de timing
  définitive** (remplace le tableau de la section 1 — les beats 1-4, 9, 10 gardent leurs durées
  d'origine, seuls les 4 portiques sont réétalés proportionnellement pour totaliser 14,00 s au lieu
  de 11,00 s, en gardant le rythme volontairement inégal entre eux) :

  | # | Segment | Début | Fin | Durée | Images (24 fps) |
  |---|---|---|---|---|---|
  | 1 | GRILLE | 00:00.00 | 00:01.80 | 1,80 s | 43 |
  | 2 | APPROCHE | 00:01.80 | 00:03.30 | 1,50 s | 36 |
  | 3 | TRAVERSÉE | 00:03.30 | 00:04.05 | 0,75 s | 18 |
  | 4 | COCKPIT | 00:04.05 | 00:05.70 | 1,65 s | 40 |
  | 5 | PORTIQUE 1 — Performance & Passion | 00:05.70 | 00:09.40 | 3,70 s | 89 |
  | 6 | PORTIQUE 2 — Sérénité & Confiance | 00:09.40 | 00:12.85 | 3,45 s | 83 |
  | 7 | PORTIQUE 3 — Entreprise & Collectif | 00:12.85 | 00:16.15 | 3,30 s | 79 |
  | 8 | PORTIQUE 4 — Industrie & Marques | 00:16.15 | 00:19.70 | 3,55 s | 85 |
  | 9 | COURBE | 00:19.70 | 00:22.20 | 2,50 s | 60 |
  | 10 | ARRIVÉE | 00:22.20 | 00:24.40 | 2,20 s | 53 |
  | | **TOTAL** | | | **24,40 s** | **586** |

  **Toute référence à un numéro d'image absolu ailleurs dans ce document (marqueurs `JOIN_C` à
  `JOIN_E`, "image 461" en fin de plan 9, "les 20 dernières images" du plan 10) a été calculée sur
  l'ancien total de 514 images — à recalculer contre ce nouveau total de 586 en construisant, pas à
  prendre au pied de la lettre.** Les images de jonction `JOIN_A` (79/97) restent valables : elles
  tombent dans les beats 1-4, qui n'ont pas changé.

- **Support physique du beat 6 : en quinconce.** Julien a laissé le choix final ouvert entre les 3
  options proposées (alignés / quinconce / drapeau à damier animé en 2 temps) — retenu :
  **la disposition en quinconce**, recommandation initiale, pour casser la symétrie parfaite d'une
  grille (cohérent avec le levier anti-"jeu vidéo" n°8 du plan) tout en restant stable/cliquable.
  Le drapeau à damier reste une piste pour une itération future, pas pour cette v1.
- **Pas de raccords masqués nécessaires.** L'hypothèse "les générateurs vidéo plafonnent à 5-10 s
  par clip" (§0.1 ci-dessous) est fausse à ce jour — Julien confirme que les générateurs actuels
  tiennent jusqu'à 30-35 s en une seule génération, largement au-dessus des 24,4 s visés. **Le
  découpage en 10 segments avec points de jonction masqués (flou, ombre de portique) n'est donc
  plus une nécessité technique.** Il reste utilisable comme choix de mise en scène (le flou fort au
  passage du pare-brise, les ombres portées des portiques restent de bons effets en soi), mais
  l'étape 2 peut viser une génération continue unique plutôt qu'un assemblage de clips raccordés.
  Le rig caméra et le blocking Blender restent valables tels quels (le travail de caméra ne change
  pas, seule la contrainte de découpage en clips séparés tombe).

---

## 0. Parti pris de mise en scène (à lire à la lumière des corrections ci-dessus)

### 0.1 Un plan-séquence unique, découpé en 10 segments

Le journal de décisions acte le refus explicite de la coupe pour l'entrée ciel→cockpit. Ce plan conserve **zéro coupe franche sur toute la séquence**. Les 10 "plans" numérotés ci-dessous ne sont donc **pas des plans au sens montage**, mais des **segments d'un même plan-séquence**.

**Note (2026-09-14) : la justification technique ci-dessous ne tient plus** (voir "Corrections post-validation" au-dessus) — les générateurs actuels tiennent la séquence en une seule génération. Le découpage en segments reste utile pour structurer le blocking et le timing, mais les "raccords masqués" décrits ci-dessous sont désormais optionnels/stylistiques, pas une contrainte de production.

~~Ce découpage n'est pas cosmétique, il répond à une contrainte de production réelle : tous les générateurs vidéo IA actuels plafonnent autour de 5-10 s par clip. Un plan-séquence de 21 s ne sortira jamais d'une seule génération.~~ Règle conservée comme option de style, pas comme obligation :

> Un segment peut se terminer sur un élément masquant (pic de flou, montant de portique qui balaye l'objectif, bande d'ombre) quand ça sert la mise en scène — plus une obligation de montage.

### 0.2 Format image et cadence

- **Master : 16:9, 2560×1440, 24 images/s.** Les 24 fps sont un choix dur et non négociable pour la direction artistique : **24 fps + vrai flou de bougé = cinéma ; 50/60 fps net = jeu vidéo.** C'est le levier n°1 contre l'effet que Julien redoute, avant même les matériaux et la lumière.
- Cadrage pensé pour supporter un recadrage 21:9 (zone utile centrale), avec les informations critiques du beat 6 **hors des 12 % latéraux**.
- Obturateur 180° (shutter 0.5) constant, sauf au segment 3 (voir plus bas).

### 0.3 Physique de référence (valeurs de départ, à affiner au feeling)

| Paramètre | Valeur |
|---|---|
| Vitesse de croisière cockpit | 130 km/h = **36 m/s** |
| Vitesse en creux de speed-ramp | **26-28 m/s** (72-78 %) |
| Entraxe entre portiques | **90-100 m** |
| Longueur de la ligne droite des portiques | **~360 m** |
| Rayon du virage final | **170 m sur 30° balayés** (~90 m d'arc) |
| Accélération latérale en courbe | **0,78 g** — rapide mais crédible pour une GT3 RS, et surtout assez pour produire un vrai dévers de caisse |
| Hauteur d'œil cockpit | **1,12 m** sol, décalée **38 cm à gauche de l'axe** (place conducteur) |

L'accélération latérale n'est pas un détail décoratif : c'est elle qui justifie le roulis de caisse du segment 9. Une courbe prise "sans physique" est exactement ce qui produit la sensation flottante.

---

## 1. Budget de timing complet

**⚠ Ce tableau est l'ancienne version (21,4 s / 514 images).** La table à jour (24,4 s / 586
images, portiques à 14 s pour garder les phrases complètes lisibles) est dans "Corrections
post-validation" en tête de document — c'est elle qui fait foi pour la construction. Gardé ici tel
quel pour comprendre le raisonnement de proportion ci-dessous.

| # | Segment | Début | Fin | Durée | Images (24 fps) |
|---|---|---|---|---|---|
| 1 | GRILLE — établissement extérieur | 00:00.00 | 00:01.80 | 1,80 s | 43 |
| 2 | APPROCHE — envol et plongée vers le pare-brise | 00:01.80 | 00:03.30 | 1,50 s | 36 |
| 3 | TRAVERSÉE — raccord flou (+ ellipse temporelle) | 00:03.30 | 00:04.05 | 0,75 s | 18 |
| 4 | COCKPIT — installation, déjà en mouvement | 00:04.05 | 00:05.70 | 1,65 s | 40 |
| 5 | PORTIQUE 1 — Performance & Passion | 00:05.70 | 00:08.60 | 2,90 s | 70 |
| 6 | PORTIQUE 2 — Sérénité & Confiance | 00:08.60 | 00:11.30 | 2,70 s | 65 |
| 7 | PORTIQUE 3 — Entreprise & Collectif | 00:11.30 | 00:13.90 | 2,60 s | 62 |
| 8 | PORTIQUE 4 — Industrie & Marques | 00:13.90 | 00:16.70 | 2,80 s | 67 |
| 9 | COURBE — long droit qui redresse | 00:16.70 | 00:19.20 | 2,50 s | 60 |
| 10 | ARRIVÉE — stabilisation et verrouillage cadre | 00:19.20 | 00:21.40 | 2,20 s | 53 |
| | **TOTAL (ancien)** | | | **21,40 s** | **514** |

**Passage des portiques = 05.70 → 16.70 = 11,00 s** dans cette ancienne version — étendu à 14,00 s dans la version retenue (table à jour en tête de document).

### Pourquoi ~24 s et pas plus court

Un hero web classique tient en 6-15 s. Ici la contrainte client des portiques consomme à elle seule 14 s, et les beats 1, 2, 3, 5 et 6 sont tous obligatoires. L'arithmétique minimale (14 s de portiques + une entrée lisible + une courbe + une arrivée stabilisée) ne peut pas descendre sous ~20 s sans sacrifier un beat verrouillé.

Le vrai arbitrage n'est donc pas "raccourcir la vidéo" mais **ne jamais faire attendre le visiteur** :

- **Une seule lecture par session** (`sessionStorage`) : au retour, on affiche directement l'image finale figée du beat 6 avec ses 4 zones cliquables. Un visiteur récurrent ne revoit jamais les 21 s.
- **La nav du header est déjà présente et fonctionnelle dès la première image** — les 4 sections sont accessibles immédiatement, la séquence ne bloque personne.
- **Un "Passer" discret** en bas de cadre à partir de 1,5 s, qui saute directement à l'image de fin.
- L'intro logo consomme déjà ~2,4 s avant le hero (`js/intro.js`). Cumul intro + hero ≈ 24 s de spectacle : c'est beaucoup, et c'est précisément pourquoi les trois points ci-dessus ne sont pas optionnels. Piste à envisager avec Julien : **supprimer ou raccourcir l'intro logo** une fois le nouveau hero en place, puisque le hero assure désormais le rôle d'ouverture.

### Deux variantes chiffrées, prêtes si Julien tranche autrement

- **Variante courte — 19,0 s** : S1 1,4 / S2 1,3 / S3 0,70 / S4 1,4 / portiques **10,0** (2,6 / 2,5 / 2,4 / 2,5) / S9 2,2 / S10 2,0. Reste dans la contrainte 10-14 s. Le prix payé : l'établissement de la grille devient une simple vignette, et la marge de lisibilité des titres de portiques se réduit à ~0,7 s.
- **Variante "phrases vraiment lisibles" — 24,4 s** : portiques à **14,0 s** (3,5 s chacun), soit ~1,8 s de lecture utile par portique. Seule option si Julien veut que la phrase complète soit lue et pas seulement le titre (voir risque 4).

---

## 2. Shot list détaillée

### PLAN 1 — GRILLE DE DÉPART
`00:00.00 → 00:01.80 · 1,80 s · 43 images`

**Action.** La 911 GT3 RS est arrêtée sur sa case de grille, moteur en charge. Chaleur d'échappement qui déforme l'air derrière l'aileron. Au loin, hors netteté, le portique des feux de départ — écho visuel volontaire des 4 portiques à venir. Dans les dernières 6 images, les feux s'éteignent.

**Type de plan.** Plan large extérieur, **trois-quarts avant côté conducteur**, en légère contre-plongée — caméra à **45 cm du sol**. La contre-plongée basse est ce qui donne la masse et la menace ; une caméra à hauteur d'homme aplatit la voiture et fait "photo de configurateur".

**Mouvement.** Statique au sens appareil (pas de déplacement), **mais jamais un lock-off numérique parfait** : un *lock-off* rigoureusement immobile est la signature immédiate d'une image de synthèse. Prescrire un **flottement organique** de ±2 à 3 px équivalent 1440p sur un bruit très lent (0,2-0,4 Hz), plus un imperceptible *gate weave*. C'est ce que donne un vrai trépied lourd sous un moteur qui vibre.

**Focale / diaphragme.** **35 mm**, capteur 36 mm plein format, **f/4**. Netteté posée sur le passage de roue avant droit ; les stands et les voitures en amorce arrière complètement dissous.

**Vitesse.** 100 % — aucune altération.

**Note anti-synthèse.** Le seul élément à soigner ici est le **reflet** : un reflet large et unique du ciel qui glisse sur le capot pendant le flottement caméra. Un reflet mobile sur une carrosserie est le signal de réalisme le plus fort disponible, et il est gratuit puisque la caméra bouge déjà un peu.

**À bloquer dans Blender.**
- Proxy voiture : **une boîte 4,57 × 1,90 × 1,29 m** (cotes GT3 RS), empattement 2,45 m, + **4 cylindres de roue r = 0,35 m**, + **un plan incliné de pare-brise à 30° de la verticale**. Ce plan incliné définit l'axe d'attaque de la plongée du plan 2.
- Empty `CAR_ROOT` à l'aplomb du centre de l'empattement, au sol. Tout est parenté à lui.
- Caméra `CAM_HERO` posée en dur (pas de courbe sur ce segment), avec **deux modificateurs Noise de faible amplitude** sur `CAM_BODY` (voir rig §4).
- Proxy grille : un plan 30 × 14 m + 3-4 boîtes pour les voitures voisines en amorce + une boîte-portique pour les feux. Pas plus.
- **Livrable de validation :** vérifier que la voiture occupe **55-65 % de la largeur d'image** et que la ligne d'horizon tombe **au-dessus du toit** (conséquence de la contre-plongée).

### PLAN 2 — L'APPROCHE
`00:01.80 → 00:03.30 · 1,50 s · 36 images`

**Action.** Départ. La voiture s'arrache ; la caméra, déjà lancée, est aspirée dans son sillage, s'élève, franchit le capot et bascule vers le pare-brise. Les reflets du ciel balayent la carrosserie à mesure que l'angle change.

**Type de plan.** Passage du plan large au **très gros plan sur le pare-brise**, en une seule course.

**Mouvement.** **Travelling avant montant + arc, avec tilt down** — techniquement une grue (*crane up*) combinée à un *push-in* et un panoramique vertical descendant. Trajectoire : de (x −9 ; y −4 ; z 0,45) vers le pare-brise en (x 0 ; y 0 ; z 1,15), la voiture restant cadrée en permanence. **Vélocité en accélération constante (ease-in franc, pas de sortie symétrique)** — la caméra prend de la vitesse et ne la rend jamais. Un travelling à vitesse constante est l'autre grande signature du rendu 3D.

**Focale.** **24 mm** — passage discret du 35 au 24 pendant le mouvement (léger *dolly zoom* inversé, quelques millimètres seulement), pour exagérer la sensation d'engouffrement sans jamais donner un champ de vision caricatural.

**Vitesse.** 100 %. **Aucun ralenti ici** : ce plan doit paraître plus rapide qu'il ne l'est.

**Raccord de sortie.** Le pare-brise remplit le cadre → enchaîne directement sur le pic de flou du plan 3. **C'est le point de jonction principal du montage.**

**À bloquer dans Blender.**
- Courbe Bézier `CAM_PATH_02` (4-5 points de contrôle suffisent), caméra en *Follow Path* avec **Follow Curve** désactivé et une contrainte *Track To* sur `CAR_ROOT` (permet de garder la voiture cadrée sans piloter la rotation à la main).
- La courbe d'*Eval Time* doit être **une Bézier asymétrique** : poignée de sortie longue, poignée d'entrée courte. C'est là que vit l'accélération.
- Animer le départ de `CAR_ROOT` sur les **10 dernières images** du segment uniquement.
- **Livrable de validation :** contrôler que le pare-brise atteint **100 % de la hauteur d'image à l'image 36** exactement, et que l'axe optique est **perpendiculaire au plan de pare-brise à ±10°** — sinon le flou de traversée du plan 3 ne se lira pas comme une pénétration.

### PLAN 3 — LA TRAVERSÉE (raccord masqué)
`00:03.30 → 00:04.05 · 0,75 s · 18 images`

**Action.** La caméra pénètre. **18 images de flou directionnel extrême**, avec une montée d'exposition (le reflet du ciel se cabre en surbrillance) suivie d'une retombée brutale vers l'exposition intérieure. À la sortie du flou, la caméra est installée derrière le volant.

**Type de plan.** Plan de transition pur. Aucune information lisible, par conception.

**Mouvement.** Poursuite de la plongée, plus **une torsion de roulis de 4-6°** qui se résorbe à la sortie — c'est cette torsion, et non le flou seul, qui fait croire à un passage à travers.

**Traitement de vitesse.** C'est le seul segment où l'obturateur change : **shutter 1.0 (360°)** sur les images 4 à 14, retour progressif à 0.5. Le flou doit être **directionnel et radial**, pas un flou gaussien uniforme.

**Deux fonctions, pas une.** Ce flou masque la traversée de la carrosserie **et** une **ellipse temporelle** : passer de 0 à 130 km/h en 0,75 s est physiquement impossible, donc l'ellipse est de toute façon nécessaire. La cacher ici, dans le seul endroit où l'œil ne peut rien vérifier, est exactement le bon usage de ce plan. À signaler à Julien comme un acquis, pas comme un compromis.

**Durée.** Ne pas dépasser 0,9 s. Au-delà, l'effet devient un gadget et le spectateur sent la fabrication. En dessous de 0,55 s, le raccord de génération IA risque de se voir.

**À bloquer dans Blender.**
- Ce segment se bloque à la trajectoire, pas au rendu : le flou final viendra de l'étape 2 et/ou du compositing. En blocking, **activer shutter 1.0 sur la plage d'images** pour valider que la quantité de flou suffit à masquer.
- Marquer un **marqueur de timeline nommé `JOIN_A`** à l'image 79 — c'est la frontière de clip la plus importante de tout le projet, elle doit être documentée dans le fichier.
- **Livrable de validation :** exporter les images 79 (dernière avant) et 97 (première après) ; ces deux images deviennent des références d'entrée pour l'étape 2.

### PLAN 4 — COCKPIT, DÉJÀ EN MOUVEMENT
`00:04.05 → 00:05.70 · 1,65 s · 40 images`

**Action.** Vue subjective depuis la place conducteur. **Dès la première image, le décor défile** : rails, bordures, marquages au sol. Pas une image d'arrêt à l'intérieur. L'exposition se rétablit sur les 8 premières images (l'iris s'adapte à l'ombre de l'habitacle) — mécanisme photographique, très efficace pour vendre le passage extérieur/intérieur.

**Type de plan.** **Plan subjectif / POV cockpit**, mais **décentré de 38 cm à gauche de l'axe**. Un POV pile au centre de l'habitacle est la signature n°1 du jeu vidéo — aucun être humain n'est assis là.

**Cadre.** Le volant en amorce basse, la casquette du tableau de bord, et **les deux montants A en amorce latérale**. Ces amorces sont le **cadre dans le cadre** qui ancre la caméra dans un objet physique. Sans elles, la caméra lévite.

**Mouvement.** Pas de déplacement propre : la caméra est solidaire du châssis, **avec un retard amorti** (voir §4). Trois couches de vibration superposées.

**Focale / diaphragme.** **30 mm, f/2,2.** Netteté sur la route à 30-40 m. **Volant et tableau de bord volontairement flous en amorce** — la profondeur de champ courte sur l'avant-plan est ce qui distingue instantanément une prise de vue d'un rendu temps réel.

**Vitesse.** 100 %.

**Raccord de sortie.** Le portique 1 entre en champ au lointain → enchaînement naturel, jonction secondaire `JOIN_B`.

**À bloquer dans Blender.**
- **Ne pas modéliser l'habitacle.** Quatre objets suffisent et sont indispensables :
  1. un **tore** r_ext 0,185 m pour le volant, axe incliné 23° ;
  2. un **plan de tableau de bord** (masque le bas du cadre) ;
  3. **deux boîtes fines** pour les montants A (section ~0,09 m, inclinaison ~55°) ;
  4. un **plan de pare-brise** avec un shader transparent.
  C'est exactement ce qui détermine le cadrage et l'occlusion en bord d'image. Tout le reste est du temps perdu à ce stade.
- Caméra parentée à `CAM_SHAKE` → `CAM_BASE` → `CAR_ROOT` (voir §3).
- **Livrable de validation :** le volant doit occuper **18-24 % de la hauteur d'image** en bas de cadre et les montants A **mordre 6-9 %** de chaque bord.

### PLANS 5 à 8 — LE PASSAGE DES 4 PORTIQUES
`00:05.70 → 00:19.70 · 14,00 s · 336 images` — **variante longue retenue (phrases complètes lisibles)**

#### Structure commune d'un cycle de portique

| Phase | Part de la durée | Ce qui se passe |
|---|---|---|
| **Approche** | ~35 % | Le portique entre en champ au lointain, grossit vite. Texte encore illisible. Vitesse 100 %. |
| **Lecture (speed-ramp)** | ~35 % | Décélération jusqu'à 72-78 %, **le flou de bougé se réduit tout seul** puisque l'obturateur reste à 180°. Le titre atteint sa taille lisible. |
| **Traversée / reprise** | ~30 % | Reprise franche de la vitesse, le portique balaye l'objectif, **son ombre portée traverse le tableau de bord**. |

**Rythme volontairement inégal.** Quatre cycles de durée identique produisent une cadence mécanique — encore une signature de synthèse.

| Plan | Portique | Durée | Creux de ramp | Note de rythme |
|---|---|---|---|---|
| 5 | **Performance & Passion** — *"Vous êtes en quête de sensations fortes."* | 2,90 s | 72 % | Le plus ample : il installe la grammaire de l'effet |
| 6 | **Sérénité & Confiance** — *"Retrouvez de la sérénité derrière un volant."* | 2,70 s | 75 % | |
| 7 | **Entreprise & Collectif** — *"Une expérience automobile pensée pour rassembler."* | 2,60 s | 78 % | Le plus serré : accélération du rythme |
| 8 | **Industrie & Marques** — *"Un service automobile taillé pour les professionnels."* | 2,80 s | 74 % | Repris légèrement plus long car il **amorce déjà la courbe** |

**Type de plan.** POV cockpit maintenu, **30 mm, f/2,5** (légère fermeture par rapport au plan 4 : le texte du portique doit être net alors qu'il est plus loin que le point de netteté précédent). **Micro-bascule de point** (*focus pull* de 2-3 m) à chaque approche de portique — un point de netteté figé sur toute une séquence est un aveu de rendu 3D.

**Mouvement.** Aucun mouvement d'appareil ajouté : la caméra reste solidaire du châssis. Un panoramique ou un *whip pan* ici détruirait la lisibilité du texte et contredirait le POV. **Seule exception recommandée : sur le plan 7, un très léger regard de 3-4° vers le montant A droit puis retour** — un micro-mouvement de tête. C'est le geste qui humanise la séquence entière.

**La ligne droite ne doit pas être droite.** Julien a écarté la "ligne droite plate" pour le beat 5, mais le principe vaut davantage encore ici : une chaussée parfaitement plane et rectiligne sur 360 m est le décor typique d'une piste d'essai en synthèse. À prescrire :
- **5 à 8 ondulations longitudinales réelles** dans la géométrie de la route (amplitude 4-9 cm sur 25-45 m de longueur d'onde) ;
- une **dérive directionnelle imperceptible** (un très long S de ±1,5°) ;
- un **dévers** de 1,5-2 %.
Le point clé : le roulis basse fréquence du plan 4 doit **être produit par cette géométrie**, pas par un bruit aléatoire.

**Traitement des portiques comme objets, pas comme pancartes.** À chaque traversée, le portique doit :
1. **occulter** une partie du cadre (les montants balayent les bords) ;
2. **projeter une bande d'ombre** qui traverse le tableau de bord et le volant ;
3. **occasionner un changement de lumière** de 0,3-0,5 EV pendant 4-6 images.

**À bloquer dans Blender (commun aux 4).**
- Proxy portique, **4 objets** : 2 piliers (boîte 0,6 × 0,6 × 6,5 m), 1 poutre (12 × 0,8 × 1,2 m), 1 panneau (10 × 0,05 × 1,6 m). Instanciés 4 fois via *Linked Duplicate*, puis **désalignés volontairement** de ±8 cm en x et ±0,4° en rotation. Aucun alignement au millimètre.
- Un objet **Text Blender** par portique (titre + phrase), **extrusion 0,02 m**, police **Space Grotesk** (déjà la police display du site, `tokens.css`). Le texte n'est pas là pour être beau au blocking, il est là pour **mesurer sa hauteur angulaire**.
- **Le seul vrai livrable du blocking des portiques est une mesure :** à l'image de lecture de chaque portique, **le titre doit atteindre au moins 6-7 % de la hauteur d'image** (≈ 95-100 px sur un master 1440p) **et s'y maintenir 0,8 s minimum**. Si ce n'est pas le cas, c'est la géométrie qu'il faut corriger, pas le rendu.
- **Speed-ramp : jamais en post-production.** Le ralenti doit venir de **l'espacement des clés sur l'*Eval Time* de `TRACK_PATH`**, jamais d'un *retiming* de clip. Un ralenti en post avec interpolation d'images produit l'inverse (flou figé, artefacts) et se lit instantanément comme un effet de jeu vidéo.
- Marqueurs `JOIN_C`, `JOIN_D`, `JOIN_E` aux trois traversées de portique.
- **Livrable de validation :** exporter **les 4 images de lecture** (une par portique). Ce sont les plus importantes de toute la séquence : celles que Julien valide, et celles qui serviront de références de cadrage à l'étape 2.

### PLAN 9 — LA COURBE
`00:19.70 → 00:22.20 · 2,50 s · 60 images`

**Action.** La route s'incurve à droite en un long droit. La voiture prend le virage sur 30° balayés, rayon 170 m, à 0,78 g. Le soleil, jusque-là latéral, vient traverser le pare-brise en contre-jour partiel. À la sortie, la voiture **se redresse pile à l'approche de la ligne**.

**Type de plan.** POV cockpit maintenu.

**Mouvement.** Pas de mouvement d'appareil, mais quatre comportements physiques à animer, dans cet ordre d'importance :
1. **Roulis de caisse vers l'extérieur** de 1,6 à 2,0°, qui **monte en 0,5 s et se résorbe en 0,4 s** à la sortie — avec un léger dépassement (*overshoot*) au rappel de suspension.
2. Un **contre-braquage** visible sur le volant en amorce (±12°), avec un retour non symétrique.
3. **Parallaxe différentielle** : le décor du bord intérieur défile nettement plus vite que celui du bord extérieur.
4. Un **flare** discret qui traverse le cadre pendant 10-14 images au moment où l'axe optique passe près du soleil.

**Focale.** **30 mm** maintenu, **f/2,8**.

**Vitesse.** 100 %, avec un **très léger ralentissement dans les 15 dernières images** — décélération, pas un speed-ramp.

**À bloquer dans Blender.**
- Prolonger `TRACK_PATH` d'un arc de **R = 170 m sur 30°**, tangent à la ligne droite.
- Animer le roulis **sur `CAM_BASE`, pas sur la caméra**.
- Ajouter les **rangées de bordure/rail via un modificateur Array le long de la courbe** — c'est le défilement périphérique qui produit la sensation de vitesse.
- Placer le **soleil à 20-22° au-dessus de l'horizon**, orienté pour que l'axe optique passe à 15-25° de lui en milieu de courbe.
- **Livrable de validation :** vérifier à l'image 461 que la voiture est **strictement dans l'axe de la ligne d'arrivée** (tolérance ±1,5°). Si elle est encore en biais, tout le beat 6 et l'ancrage des zones cliquables sont compromis.

### PLAN 10 — LIGNE D'ARRIVÉE ET VERROUILLAGE
`00:22.20 → 00:24.40 · 2,20 s · 53 images`

**Action.** La voiture, redressée, franchit la ligne — le damier passe sous le capot. Devant, **les 4 sections réapparaissent groupées et en grand**. La caméra se stabilise, la vitesse tombe, le cadre se verrouille. **Image finale strictement fixe.**

**Type de plan.** POV cockpit qui se **fige en plan fixe frontal**. Ce verrouillage n'est pas un choix esthétique : **c'est la condition technique du mécanisme de clic** (zones HTML positionnées en pourcentage, donc la caméra doit être immobile).

**Mouvement — la partie la plus délicate du plan.** L'apaisement doit être **progressif et jamais total** :
- couche basse fréquence (corps/opérateur) s'éteint en 0,8 s ;
- couche moyenne (suspension) s'éteint en 1,2 s ;
- **la couche haute fréquence ne s'éteint jamais complètement** — garder un résidu de 0,1-0,2 mm. **Un arrêt total du mouvement sur la dernière image est le piège absolu** : c'est l'image que le visiteur regarde le plus longtemps de toute la séquence.

**Focale.** **35 mm, f/4** — léger recul de focale et fermeture de diaphragme pour que **les 4 panneaux soient tous nets simultanément**.

**Vitesse.** Décélération douce de 36 à ~22 m/s, **sans freinage appuyé**. Puis arrêt de la translation.

**Support physique des 4 sections — à trancher (voir point 3 en fin de document).** Proposition : **un portique d'arrivée unique portant 4 panneaux en 2×2**, plus large et plus haut que les 4 précédents, avec la ligne damier au sol en dessous. Cohérence de langage visuel, une seule géométrie à construire, disposition robuste au recadrage mobile.

**À bloquer dans Blender.**
- **Les 20 dernières images doivent avoir une transformation caméra rigoureusement identique** (hors résidu haute fréquence). À vérifier numériquement, pas à l'œil.
- Sur l'image finale, **relever et consigner les coordonnées d'écran normalisées (0-1) des 4 panneaux** — ce sont littéralement les valeurs en pourcentage que l'agent HTML utilisera.
- **Exporter l'image finale séparément en PNG haute qualité** — le figeage côté web ne doit pas reposer sur la précision d'un `video.pause()` (décalage possible sur iOS) mais sur une image superposée identique à la dernière image du fichier.
- Chaque panneau doit occuper **au moins 14 % de la largeur d'image** et rester **hors des 12 % latéraux** du cadre, pour survivre à un recadrage 21:9.

---

## 3. Rig caméra et hiérarchie — à mettre en place avant tout le reste

```
TRACK_PATH (Bézier : grille → droite ondulée → arc R170 → arrivée)
└─ CAR_ROOT           (Follow Path — porte la VITESSE et le speed-ramp)
   └─ CAM_BASE        (porte le ROULIS, le tangage, le piqué — comportement véhicule)
      └─ CAM_SHAKE    (porte UNIQUEMENT le bruit — 3 couches, cf. §4)
         └─ CAM_HERO  (porte la FOCALE et le DIAPHRAGME — rien d'autre)
```

Règle : **un étage = une responsabilité.** Les segments extérieurs (plans 1-3) utilisent une seconde caméra `CAM_PATH_02` indépendante, avec une transition de propriétaire sur `JOIN_A`.

**Scène :** unités mètres, Z vers le haut, 24 fps, 586 images, sol à Z = 0, capteur 36 mm, flou de bougé activé dès le blocking à shutter 0.5.

**Collections :** `00_CAM`, `10_CAR`, `20_COCKPIT`, `30_TRACK`, `40_GANTRY`, `50_LIGHTS`.

---

## 4. Éviter l'effet "jeu vidéo" / flottant — les 10 leviers concrets

1. **24 images/s avec un vrai flou de bougé obturateur 180°.** Le levier n°1, avant tout le reste. Ne jamais générer ni interpoler vers du 60 fps à l'étape 2.
2. **Tremblement en trois couches superposées, jamais une seule** : 15-25 Hz/0,2-0,6 mm (moteur/bitume), 1,5-4 Hz/2-8 mm + 0,2-0,5° (suspension/châssis), 0,2-0,6 Hz/10-25 mm (corps de l'opérateur).
3. **Un rig caméra "mou", pas rigide** — retard amorti de 2 à 4 images sur la rotation. Le détail unique qui sépare le plus nettement une caméra montée en dur d'une caméra réellement embarquée.
4. **Le mouvement basse fréquence doit venir de la route, pas d'un bruit** — les ondulations réelles de la chaussée, subies par le rig.
5. **Profondeur de champ réelle, avec un avant-plan flou permanent** et un point qui respire (micro-bascule à chaque portique).
6. **Une seule source dominante, et une vraie plage dynamique** — soleil bas (18-25°), jamais au zénith, hautes lumières qui crament, ombres qui bouchent.
7. **Les objets doivent interagir avec la caméra** — occlusion, ombre portée, variation d'exposition à chaque portique.
8. **Rompre toutes les symétries** — caméra décalée, portiques désalignés, rien de parfaitement centré.
9. **Traitement optique appliqué avec parcimonie** — aberration chromatique légère, vignetage, halation, grain fin, étalonnage unique.
10. **Aucune vitesse constante** — chaque mouvement a une entrée et une sortie progressives et asymétriques.

---

## 5. Livrables attendus de l'étape Blender

Le blocking n'a pas à être beau. Il a à produire six choses exactement :

1. **Un fichier `.blend`** avec la hiérarchie du §3 respectée et la nomenclature de collections.
2. **Un playblast 2560×1440 à 24 fps, 586 images** — le seul livrable qui permette de juger le timing.
3. **Les 4 images de lecture des portiques**, exportées en PNG, avec la mesure de hauteur angulaire du titre consignée pour chacune.
4. **Les images de part et d'autre de `JOIN_A`** (78 et 97) et des autres jonctions.
5. **L'image finale du plan 10** en PNG, plus **les coordonnées d'écran normalisées des 4 panneaux**.
6. **Un tableau des marqueurs de jonction** (`JOIN_A` à `JOIN_E`) avec le numéro d'image et l'élément masquant utilisé.

Ce qui n'a **pas** à être fait au blocking : détail de carrosserie, intérieur d'habitacle au-delà des 4 objets d'amorce, matériaux, texte propre, environnement, éclairage final.

---

## 6. Points à valider avec Julien avant construction

### Résolus par Julien le 2026-09-14

1. ~~**Durée totale**~~ → **24,4 s**, variante longue retenue (portiques à 14 s pour garder les phrases complètes lisibles, pas juste le titre).
2. ~~**Raccords invisibles acceptés ou non ?**~~ → **Question devenue sans objet** : les générateurs vidéo actuels tiennent jusqu'à 30-35 s en une seule génération, largement au-dessus des 24,4 s visés. Pas besoin d'assembler plusieurs clips raccordés — voir "Corrections post-validation" en tête de document.
3. ~~**Lisibilité : titre seul ou phrase complète ?**~~ → **Phrase complète**, via la durée longue ci-dessus (~1,8 s de lecture utile par portique).

### Encore ouvert

4. **Support physique des 4 sections au beat 6** — proposition envoyée à Julien avec un croquis (portique unique à 4 panneaux en grille 2×2, ligne à damier au sol). En attente de sa validation.

### Importants — n'empêchent pas de démarrer, mais à régler tôt

5. Aucune image de référence de voiture/cockpit confirmée à ce jour (`assets/img/hero-car.jpg` en 768×432 est inutilisable comme référence).
6. Cohérence visuelle d'un bout à l'autre si l'étape 2 finit quand même par être générée en plusieurs morceaux (à surveiller même si l'objectif est une génération continue unique).
7. Mobile — recadrage 16:9 → portrait à concevoir, notamment pour le beat 6.
8. Sens du virage — proposé à droite (conduite à gauche, référence France), à confirmer.

### Secondaires

9. Son — jamais évoqué, lecture auto impose le muet par défaut, bouton son à prévoir ?
10. Devenir de l'intro logo — ~2,4 s en plus des 24,4 s du hero, à raccourcir/supprimer ?
11. Poids du fichier — viser ≤ 8 Mo, image d'affiche = image finale du beat 6.
12. Photo hero en cours de recherche par Julien — obsolète, à confirmer comme abandonnée.
