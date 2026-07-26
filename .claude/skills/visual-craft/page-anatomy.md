# Anatomie de page — enchaînement des blocs, tailles, positions

À la différence de `hero-patterns.md` (les effets visuels d'une section
précise) et `layout-composition.md` (théorie abstraite de grille), ce
fichier documente **comment les blocs s'enchaînent sur toute la hauteur
d'une page** : tailles relatives, position (centré/asymétrique/coin),
logique de séquencement d'un bloc au suivant. Extrait d'une batch de 9
captures de sites réels apportées par Julien — le but n'est pas l'effet
(couleur, animation) mais le squelette structurel qu'on peut réappliquer
avec n'importe quel contenu/style.

## Le principe transversal observé sur les 9 références

**Aucune des compositions fortes n'utilise une grille symétrique stricte du
haut en bas de page.** Le point commun : au moins un élément par section
casse l'alignement attendu — déborde d'un cadre, se positionne dans un
coin plutôt que centré, ou a une taille disproportionnée par rapport à ses
voisins. Les sites les plus "génériques" du lot (ex. WANDER.ph) sont
justement ceux où chaque bloc respecte une grille à colonnes égales sans
rupture.

## Hero : texte dominant + visuel flottant en surcharge (réf. RANTY)

Pas un vrai split 50/50. Le texte occupe la portion gauche de l'écran à
taille normale. Le visuel produit (rendu 3D) n'est pas contenu dans une
colonne propre : il déborde par-dessus le bord droit du texte et par-dessus
le bas de l'écran, avec un second panneau (mini) qui déborde lui-même du
premier panneau, relié par une ligne. Puis, indépendamment de ce
groupe hero, deux cartes ancrées **dans les coins** (bas-gauche, bas-droite)
flottent par-dessus la photo de fond, sans rapport de grille avec le hero
au-dessus.

**Principe réutilisable** : traiter le hero comme un empilement de 2-3
calques de profondeur (fond photo → groupe texte → groupe visuel qui
déborde par-dessus les deux) plutôt que comme deux colonnes figées. Ancrer
des cartes secondaires dans les coins de l'écran, indépendamment de la
grille du contenu principal — elles lisent comme des "notes" plutôt que
comme une troisième colonne.

## Hero : colonne centrale unique, empilement vertical strict (réf. Enblox)

À l'inverse de RANTY : tout est centré sur un seul axe vertical, largeur de
contenu volontairement étroite même sur un écran large (colonne ~40% de la
largeur totale, marges généreuses de chaque côté). Le visuel produit (photo
téléphone en main) est posé seul, sans texte à côté, entre le titre et la
section suivante — un bloc entier de la séquence n'est QUE du visuel,
aucun texte concurrent.

Juste après : rupture nette de rythme, passage à un split asymétrique
60/40 (gros titre à gauche, description courte à droite) — le contraste
entre "hero tout centré/étroit" et "section suivante large/asymétrique"
est ce qui rend l'enchaînement vivant plutôt que monotone.

**Principe réutilisable** : alterner délibérément la largeur de colonne
d'une section à l'autre (étroite-centrée puis large-asymétrique) plutôt que
garder le même conteneur de largeur fixe partout — le changement de rythme
horizontal fait autant travailler l'œil que le contenu lui-même.

## Split alterné en zigzag, taille d'image constante (réf. MNTN)

Trois blocs consécutifs "texte + photo", chacun avec la même proportion
image/texte (~45/55) et la même taille de photo — mais la position bascule
à chaque bloc : photo à droite, puis à gauche, puis à droite. Le nombre
d'étape (01/02/03) reste toujours du même côté que le texte, jamais du côté
photo.

**Principe réutilisable** : garder la taille et la proportion identiques
d'un bloc à l'autre dans une séquence répétée (ça, c'est ce qui unifie
visuellement une série), et faire varier uniquement la position
gauche/droite (ça, c'est ce qui évite la monotonie d'un défilé de blocs
identiques). Les deux à la fois : jamais changer la taille ET la position
en même temps sur une séquence répétitive, sinon plus aucun fil visuel ne
relie les blocs entre eux.

## Cartes de largeurs inégales côte à côte, jamais deux colonnes égales (réf. Fluxora)

Le hero lui-même est asymétrique (texte étroit à gauche, photo large à
droite — la photo domine, pas le texte, ce qui est l'inverse du réflexe
"texte dominant"). Plus bas, une paire de cartes stat côte à côte n'a
délibérément pas la même largeur : une carte plus large et sombre, une
carte plus étroite et colorée à côté. Aucune paire de blocs dans toute la
page ne fait 50/50.

**Principe réutilisable** : dans une paire de blocs côte à côte (cartes
stat, features, avant/après), résister au réflexe de largeur égale — une
proportion 60/40 ou 65/35 avec une couleur/contraste différent sur chaque
côté crée une hiérarchie immédiate (on sait laquelle regarder en premier)
sans avoir besoin d'un badge "principal" explicite.

## Empilement asymétrique de cartes de tailles différentes (réf. GreenSpace)

Une photo large format (bandeau ~16:9, toute la largeur moins une colonne
de stats à droite) suivie d'une grille de 4 cartes strictement égales
(carrées, numérotées). Contraste volontaire entre "un très grand bloc
asymétrique" suivi de "une grille parfaitement régulière" juste en dessous
— la régularité de la grille de 4 devient reposante précisément parce
qu'elle succède à un bloc irrégulier.

**Principe réutilisable** : faire suivre un bloc de composition asymétrique
et complexe par un bloc volontairement simple/régulier (grille égale)
plutôt que d'enchaîner deux blocs complexes — l'alternance
complexité/simplicité rythmée fonctionne comme l'alternance friction/flux
déjà documentée dans `layout-composition.md`, mais appliquée au niveau
"page entière" plutôt qu'"une seule section".

## Débordement de cadre contrôlé par la typo, pas par une colonne (réf. Hotle)

La photo hero n'occupe pas toute la largeur de l'écran (marges visibles à
gauche/droite) — c'est le wordmark géant qui, lui, ignore complètement ces
marges et déborde jusqu'aux bords. Un seul élément par section a la
permission de sortir du conteneur ; tous les autres (photo, stats,
navigation) restent proprement dans les marges.

**Principe réutilisable** : choisir à l'avance UN élément par section qui a
le droit de casser le conteneur/les marges (souvent la typo, parfois une
photo) — si plusieurs éléments débordent en même temps dans la même
section, l'effet de rupture disparaît et ça lit juste comme un bug de mise
en page.

## Positionnement hors-grille délibéré, petits éléments décentrés (réf. GreenSpace, invoice app)

Deux mécaniques différentes pour le même objectif : sur GreenSpace, l'image
produit (pot de plante) du hero est positionnée en haut à droite, en
dehors de l'alignement du texte et du CTA en dessous — elle "flotte" au-
dessus de la colonne de texte au lieu de s'y aligner. Sur l'app invoice, ce
sont plusieurs petits éléments (post-its, pastilles, cartes miniatures) qui
sont positionnés en absolu à des coordonnées presque aléatoires, avec
chevauchements partiels entre eux.

**Principe réutilisable** : un ou plusieurs petits éléments décoratifs qui
ignorent volontairement la grille du contenu principal (position absolue,
angle de rotation léger, chevauchement) donnent une impression de main/
d'artisanat, différent du reste de la page qui, lui, reste structuré. Ne
fonctionne que si le contenu principal (texte, CTA) reste parfaitement
aligné en dessous — le contraste entre "les décorations flottent" et "le
contenu est rigoureux" est ce qui vend l'effet, pas le désordre en soi.

## Panneau centré, généreusement margé, jamais plein cadre (réf. AKINA)

Le panneau glassmorphism du hero ne touche aucun bord de l'écran — marge
visible tout autour, y compris en haut (espace entre le panneau et le haut
de la fenêtre). Ça donne au panneau un statut d'objet posé sur la photo
plutôt que de barre de navigation classique collée en haut.

**Principe réutilisable** : pour qu'un élément de nav/hero lise comme un
"objet flottant" plutôt qu'une barre fonctionnelle classique, lui laisser
une marge visible sur tous ses côtés (y compris le haut) — un élément qui
touche un bord de l'écran perd immédiatement ce statut d'objet et redevient
une barre d'interface standard.

## Synthèse — les 4 leviers de séquencement à réutiliser

1. **Alterner la largeur de conteneur** d'une section à l'autre (étroite-
   centrée / large-asymétrique), pas un seul gabarit répété partout.
2. **Dans une séquence répétée** (3+ blocs similaires), garder taille et
   proportion fixes, ne faire varier que la position gauche/droite.
3. **Dans une paire de blocs côte à côte**, éviter le 50/50 — une
   proportion inégale (60/40, 65/35) crée une hiérarchie immédiate.
4. **Faire suivre un bloc complexe/asymétrique par un bloc simple/
   régulier**, jamais deux blocs complexes à la suite.

Et un garde-fou de discipline : **un seul élément par section a le droit de
casser la grille/le conteneur.** Plusieurs ruptures simultanées dans la
même section annulent l'effet et lisent comme une erreur plutôt qu'une
intention.
