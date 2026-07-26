# Compositing et retouche d'image fixe

## Wordmark incrusté à une profondeur précise dans la scène (réf. VANTA)

Analysée à partir d'une capture d'un site nommé "VANTA" : photo d'un chalet
moderne posé sur un ponton, lac, forêt de conifères, montagnes en fond, lumière
de fin de journée. Le wordmark "VANTA" en grand est posé **derrière la ligne
d'arbres** — les cimes des sapins mordent sur le bas des lettres, ce qui donne
l'impression que le texte existe *dans* la scène plutôt que collé dessus en
overlay. C'est ce détail de profondeur qui fait la différence avec un hero
générique "photo + titre en overlay plat".

### Le principe généralisable, confirmé par le process réel (Figma, capté à l'écran)

Une photo a toujours des plans qui se chevauchent (ciel/fond, une forme
médiane continue — ligne d'arbres, crête de montagne, arête de bâtiment —,
puis un premier plan). Le texte se glisse **entre le fond et la forme
médiane**. Deux traitements différents selon la texture de ce qui occulte :

**Sur un bord net (toit, cheminée, arête de bâtiment) — découpe vectorielle
exacte, pas un cache approximatif :**

1. Poser le wordmark en grand, 100% opaque, par-dessus toute la photo — pour
   voir où il faut travailler.
2. Retracer à la main (pen tool) la silhouette précise de l'élément qui doit
   passer devant le texte (ex. la ligne de toit + la cheminée), en forme
   fermée et remplie.
3. Sélectionner **les deux calques** (texte + silhouette tracée) et appliquer
   **Boolean "Subtract"** — pas un cache de couleur plaqué dessus, une vraie
   soustraction vectorielle qui perce un trou net dans le texte à l'endroit
   exact de la silhouette. La photo réapparaît dessous, bord parfaitement
   découpé.
4. Remettre l'opacité du résultat à 100% une fois la découpe faite, pour
   voir le rendu réel (astuce de workflow : baisser l'opacité pendant qu'on
   trace pour voir la photo en dessous, la remonter une fois fini).

**Sur une texture organique/dense (feuillage, cimes d'arbres) — dégradé de
transparence, pas de découpe précise nécessaire :**

1. Convertir le texte en tracé vectoriel.
2. Lui appliquer un **dégradé linéaire** (pas une opacité plate uniforme) :
   plus opaque en haut, qui s'évanouit vers le bas — la partie qui plonge
   dans la texture dense se fond naturellement, sans qu'il faille détourer
   chaque aiguille de sapin.
3. **Choisir un ton légèrement chaud pour le dégradé, jamais froid/neutre**
   — c'est le detail qui vend l'effet "le texte reflète la lumière naturelle
   de la scène" plutôt que "calque blanc plaqué dessus". Un blanc froid pur
   se lit immédiatement comme un artefact numérique.

**Vignette qui rassemble le regard (les deux traitements ci-dessus, plus la
photo entière) :**

1. Dessiner un grand rectangle (taille du cadre) + un cercle/ellipse au
   centre.
2. Sélectionner les deux formes, **Boolean Subtract vers le noir** — le
   rectangle devient un cadre noir avec un trou ovale au centre.
3. Appliquer un effet **Layer Blur, poussé loin** (bien au-delà d'un flou
   "propre") sur cette forme — ça donne une vignette organique qui assombrit
   les bords/coins tout en gardant le centre net, et qui rassemble l'œil sur
   le sujet principal sans qu'on remarque une vignette CSS radiale classique.

### Variantes à explorer pour d'autres styles

- Forme occultante = un mur/bâtiment (angle net) au lieu d'une ligne d'arbres
  (dentelée) → rendu plus architecture/minimal que nature.
- Texte au blend mode "difference" ou "exclusion" plutôt que soft-light →
  rendu plus graphique/contrasté, moins "atmosphérique".
- Grading plus saturé et chaud (au lieu du teal/vert désaturé de VANTA) pour
  une identité BTP énergique plutôt que premium/feutrée.

### Arbitrage confirmé par le créateur (transcription) : PNG découpé vs photo live

Une fois passé en code, un choix explicite a été fait et justifié à voix
haute : ne PAS découper le chalet en PNG séparé avec le texte animé
indépendamment derrière (ce qui permettrait un vrai parallax et un contrôle
total). Raison donnée : ça grossit sérieusement le poids du fichier (un PNG
détouré haute résolution) et ça complexifie le montage, pour un gain de
contrôle qui ne sert pas forcément le brief. Le choix retenu à la place :
garder une seule photo pleine largeur (max-width 1600px), avec un
**fade vers le noir sur les bords latéraux** (`mask-image` ou
`linear-gradient` en `mask`), positionnée toujours calée en haut du
conteneur. Compromis "meilleur des deux mondes" : looks premium, poids
raisonnable, complexité de montage minimale.

À arbitrer pareil pour site-adeline/showcase-reel : le découpage en PNG +
parallax n'est justifié que si l'effet de profondeur est vraiment le
signature element de la section — sinon une seule photo + fade de bord est
presque aussi bien pour une fraction de l'effort et du poids.

### Web : image statique, pas du texte HTML live

Ce compositing se fait **une fois, en export statique** (PNG/WebP), pas en
CSS live — aucun `text-shadow`/masque CSS ne reproduit une découpe aussi fine
que des cimes de sapins. Conséquence à ne pas oublier : le nom incrusté dans
l'image n'est ni sélectionnable ni lisible par un lecteur d'écran/SEO. Ajouter
un vrai `<h1>` visuellement caché (`sr-only` / `clip: rect(0,0,0,0)`) avec le
même texte, positionné au même endroit dans le DOM, pour l'accessibilité et le
SEO.

### Grading couleur du rendu "premium feutré" (réf. VANTA)

- Noirs écrasés (courbe qui plaque le point noir), pas de vrai noir à 0% sauf
  dans le dégradé du bas.
- Ombres poussées vers le teal/vert, hautes lumières gardées neutres à
  légèrement chaudes — split-toning classique du cinéma/architecture premium.
- Un seul point chaud saturé qui sert d'accroche pour l'œil (ici : les
  fenêtres éclairées du chalet) — tout le reste de l'image reste désaturé
  pour que cet accent ressorte sans effort.
- Cette recette se généralise : choisir UN point d'accent saturé par photo
  hero, désaturer le reste, plutôt que d'avoir une photo uniformément
  saturée où rien ne guide le regard.

## Générer l'image source à partir d'une vraie référence produit (réf. R.E.P 24, 2026-07-21)

Quand le client apporte une capture d'un produit réel qu'il veut voir sur le
site (ex. un modèle précis de climatiseur mural), ne jamais reformuler
vaguement ("une clim moderne") — décrire la capture dans le prompt de
génération comme une référence de style explicite (forme exacte, couleur,
détails visibles comme des diodes) pour que l'IA reproduise ce produit précis
dans une scène nouvelle, pas un produit générique différent. Processus qui a
fonctionné : capture produit fournie par le client → prompt Gemini décrivant
le produit dans le détail + une scène aspirationnelle cohérente (ici : villa
lumineuse, baies vitrées, piscine) → itération sur le cadrage (la première
version avait le produit décalé à gauche, pas assez visible/symétrique pour
accueillir un futur wordmark — demander explicitement une composition
centrée/symétrique si le produit doit rester lisible après un zoom/dézoom ou
un recadrage ultérieur).

## Bord net vs bord organique — l'erreur à ne pas refaire (réf. R.E.P 24)

Rappel concret suite à une vraie erreur commise sur ce projet : un wordmark
incrusté derrière une **poutre de pergola** (bord architectural net) avait
été masqué avec un **dégradé de transparence sur 40px** — la technique
réservée aux bords organiques (feuillage, cimes d'arbres) documentée plus
haut. Résultat : le bas des lettres se délayait en un flou sale, illisible,
qui ne se lisait pas comme "le texte passe derrière la poutre" mais comme
"le texte est mal détouré." Corrigé en remplaçant le dégradé par une
**coupe nette à la ligne de pixel exacte** (`arr[BEAM_Y:, :, 3] = 0`, pas de
transition). La règle des deux traitements (documentée plus haut pour
Figma) s'applique identiquement en code/Pillow : détecter si l'objet
occultant a un bord dur (toit, poutre, arête) ou une texture dense/organique
avant de choisir la méthode — ne jamais appliquer le dégradé par défaut
"pour que ça se fonde mieux", ça ne se fond pas mieux, ça se lit juste comme
cassé.

## Ne pas coller le texte au bord supérieur de l'image

Erreur constatée (réf. R.E.P 24) : un premier essai plaçait le wordmark
quasiment collé au bord supérieur de la photo. Corrigé en le redescendant
dans la bande de ciel disponible, mieux centré entre le bord et la ligne
de coupe (poutre/toit) — plus de marge des deux côtés, moins fragile si
l'image est vue à une taille ou un cadrage différent de celui utilisé
pendant la retouche. Simple règle de bon sens : garder une marge visible
au-dessus du texte, pas seulement en-dessous.
