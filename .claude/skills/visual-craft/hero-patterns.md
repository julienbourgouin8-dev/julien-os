# Archétypes de hero et de sections — catalogue de compositions

À la différence de `image-compositing.md` (une technique de retouche
précise, VANTA) et `layout-composition.md` (théorie abstraite de grille),
ce fichier catalogue des **archétypes de composition complets** observés sur
des sites réels — la façon dont plusieurs éléments (photo, typo, cartes
flottantes) s'assemblent ensemble pour faire une section. Chaque entrée est
un patron réutilisable, pas un site à copier.

## Carte flottante glassmorphism par-dessus une photo plein cadre (réf. AKINA Hotel)

Un panneau semi-transparent aux coins très arrondis, bordure fine claire,
fond flouté (`backdrop-filter: blur()`), posé au centre d'une photo plein
cadre (montagne enneigée). Le panneau contient le nav, le titre et le CTA —
la photo reste lisible en transparence à travers le panneau plutôt que d'être
assombrie par un overlay opaque.

```css
.glass-hero-panel {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 32px;
}
```

**Point clé de grading** : la photo sous le panneau est virée vers une
teinte froide inhabituelle (violet/lavande) plutôt que la balance naturelle
— c'est ce virage de teinte qui vend l'ambiance "premium alpine" plus que
l'effet verre lui-même. Le glassmorphism seul, sur une photo neutre, est
beaucoup plus fade.

**Variantes à explorer** : teinte chaude (coucher de soleil désertique) au
lieu de froide pour une identité différente ; panneau positionné en bas ou
sur un côté plutôt que centré, pour laisser plus de photo visible en haut.

## Typographie géante qui déborde du cadre photo (réf. Hotle)

Le wordmark de la marque est affiché à une taille bien plus grande que la
photo qui l'accompagne — les jambages des lettres (haut du "H", bas du "e")
dépassent visuellement le rectangle de la photo, qui devient une sorte
d'inset/fenêtre posée par-dessus le texte plutôt que l'inverse. Effet :
la typographie structure la page, la photo devient un détail qu'on découvre
dedans.

Principe généralisable : **choisir UN élément (texte OU photo) comme
maître de l'échelle de la section, jamais les deux à parts égales** — dès
qu'un élément est nettement plus grand, l'autre se lit comme un accent
plutôt que comme une compétition visuelle.

```css
.giant-wordmark {
  font-size: clamp(6rem, 18vw, 14rem);
  line-height: 0.85;
  position: relative;
  z-index: 1;
}
.hero-photo-inset {
  position: relative;
  z-index: 2; /* la photo passe devant le texte, mais reste petite */
  margin-top: -1em; /* chevauchement contrôlé avec le wordmark au-dessus */
}
```

## Cadre photographique organique qui mord sur le contenu (réf. GreenSpace)

Au lieu d'une vignette CSS (dégradé radial classique qui assombrit les
coins), ce sont des éléments photographiques réels (ici : du feuillage)
qui débordent depuis les bords de l'écran et empiètent sur le contenu —
en haut et en bas de page. Le fond reste sombre et uni entre les deux,
donnant une sensation d'immersion "on est dans la scène" plutôt qu'"on
regarde une photo dans un cadre".

Principe généralisable : une vignette n'a pas besoin d'être un dégradé —
un élément du sujet lui-même (branches, tissu, fumée, structure
architecturale) qui déborde du cadre en haut/bas ou sur un côté crée le
même effet de focalisation, mais avec beaucoup plus de caractère et de lien
avec le sujet de la marque. À coupler avec `mask-image` en dégradé pour que
la transition vers le fond uni reste douce, pas une découpe nette.

**Variantes à explorer pour BTP** : poutres/charpente en bois qui débordent
du cadre pour une section "menuiserie", éclats de matériau (brique, ardoise)
en bordure pour une section "façade/couverture".

## Collage flottant façon mood board (réf. app "Get paid same day")

Plusieurs petits éléments (cartes UI miniatures, post-its, trombones,
pastilles de couleur) dispersés sur un fond uni, à des angles de rotation
légers et variés, comme posés à la main sur un bureau plutôt qu'alignés sur
une grille. Aucun élément n'est parfaitement horizontal — chacun a une
rotation de quelques degrés, différente des autres.

```css
.collage-item {
  position: absolute;
  transform: rotate(var(--tilt, -3deg));
  /* --tilt varie légèrement par élément : -6deg à +6deg, jamais 0 */
}
```

Principe généralisable : le désordre contrôlé (rotations légères et
inégales, chevauchements partiels) lit comme "humain/artisanal" à
l'inverse d'une grille parfaite qui lit comme "corporate/logiciel". Utile
pour une marque qui veut se démarquer du ton froid B2B typique — mais
risqué pour du BTP où la précision/le sérieux sont souvent le message
voulu (à réserver à une section spécifique, pas au hero principal d'un
artisan).

## Chiffres géants en filigrane comme repères de section (réf. MNTN)

Une numérotation ("01", "02", "03") affichée en très grande taille, faible
contraste/opacité, derrière ou à côté du titre de chaque bloc éditorial en
alternance image/texte. Le chiffre n'est pas décoratif au sens gratuit : il
sert de repère de progression dans une séquence (étapes, chapitres) tout en
créant une échelle typographique contrastée avec le titre plus petit à côté.

```css
.step-number {
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: 700;
  opacity: 0.12;
  line-height: 1;
}
```

Principe généralisable : utile pour toute séquence numérotée (étapes d'un
process, avant/après, phases d'un chantier BTP) — le chiffre géant en fond
donne une structure de lecture claire sans avoir besoin d'une timeline ou
de flèches explicites.

## Grading duotone appliqué à une photo entière (réf. Fluxora)

Toute la photo hero (portrait) est virée vers une seule teinte saturée
(orange/rouge ici) plutôt que de garder une balance des couleurs naturelle
— proche d'un duotone complet, pas juste une teinte discrète en ombre. Les
badges statistiques flottants (chiffres clés) reprennent la même teinte
pour rester cohérents avec la photo plutôt que de trancher en blanc/gris
neutre.

Principe généralisable : un grading fort et assumé sur toute l'image (au
lieu du split-toning plus subtil documenté dans `image-compositing.md` pour
VANTA) fonctionne comme signature de marque forte — mais demande que TOUS
les éléments UI de la section (badges, boutons, icônes) soient recolorés
pour matcher cette même teinte, sinon la photo virée looks comme un filtre
Instagram plaqué plutôt qu'une direction artistique délibérée.

## Panneau flottant avec hotspots cliquables sur un produit/bâtiment (réf. RANTY)

Une carte blanche aux coins arrondis, flottante par-dessus la photo hero,
contient un mini-visuel du produit (ici : rendu 3D de maison) avec des
points cliquables (petits cercles) positionnés à des endroits précis de
l'image. Un des points ouvre un second panneau plus petit (aperçu vidéo/
détail) relié au point par une fine ligne diagonale.

Principe généralisable : pour un métier où le détail/le savoir-faire
compte (BTP, architecture, artisanat), des hotspots sur une photo réelle
d'un chantier terminé ("cliquez pour voir : isolation, finition, matériau
utilisé ici") racontent la compétence technique de façon interactive au
lieu d'un simple paragraphe descriptif. Techniquement : positionnement en
`position: absolute` avec des coordonnées en `%` (pas en `px`) pour rester
calé sur les bons détails de la photo à toutes les tailles d'écran.

## Ce qui ne mérite pas d'être retenu (WANDER.ph)

Référence volontairement écartée : hero photo + titre + deux boutons, cartes
de destination en grille — un gabarit SaaS/tourisme générique sans geste de
composition distinctif par rapport aux autres captures. Utile comme
contre-exemple : montre la différence entre "correct" et "mémorable" — rien
de cassé, mais rien qui justifierait de le documenter comme technique ici.

## Le piège à ne pas refaire : hero contenu dans une carte au lieu de plein cadre (réf. R.E.P 24)

Erreur réelle commise sur un premier jet (2026-07-22) : la photo hero était
posée dans une carte aux coins arrondis, cantonnée à la largeur du
`.container` (ou à une moitié de grille dans une mise en page 2 colonnes
texte/image) — jamais bord à bord avec le viewport. Julien a dû corriger
explicitement : *"met l'image en full écran qui prend tout le site"*.

`INDEX.md` des références (`references/design-references/`) le disait déjà
noir sur blanc — 7 des 8 références reposent sur une vraie photo **plein
cadre** en fond de hero, pas sur la couleur/typo seules — mais cette leçon
n'avait pas été traduite en réflexe de construction : par défaut, un hero a
été construit comme "texte + carte photo à côté/en dessous" au lieu de
"photo en fond absolu du viewport + texte superposé dessus".

**Règle par défaut à appliquer désormais, sans attendre qu'on le demande** :
sauf direction artistique qui l'exclut explicitement, le hero d'un
site-revamp démarre plein cadre :
- la photo est en `position: absolute; inset: 0` (ou équivalent) sur toute
  la section hero (`height: 100svh` ou proche), jamais dans un conteneur à
  largeur limitée ni dans une moitié de grille ;
- le texte (wordmark, nav, stats, CTA) est superposé PAR-DESSUS la photo via
  un scrim (dégradé sombre, directionnel selon où le texte doit rester
  lisible), jamais empilé au-dessus ou à côté dans le flux normal ;
- une carte/panneau photo contenue (façon AKINA plus haut) reste une
  variante valable, mais un choix arbitré consciemment pour cette raison
  précise — pas le point de départ par défaut.

Voir aussi le principe complémentaire, réutilisé le même jour pour donner du
mouvement à ce hero plein cadre sans complexité ajoutée : partir la photo
zoomée sur le sujet qui doit se voir en premier (ex. l'équipement produit
mis en avant), `transform-origin` calé sur ce même point, puis dézoomer
jusqu'à l'échelle normale au chargement (`scale(1.5) → scale(~1.05)` sur
1.5-2.5s, `ease: power2.out`) — un seul tween GSAP, aucune complexité de
mise en page, mais l'effet "respiration cinématique" attendu d'un hero
premium. Toujours prévoir le fallback `prefers-reduced-motion` qui réinitialise
le `transform` à `none` directement (sinon l'image reste figée zoomée).

## Garde-fous (mêmes que le reste de `visual-craft`)

- Ces archétypes sont des mécaniques de composition, pas des styles figés —
  chacun se rejoue avec d'autres couleurs/photos/proportions selon la
  direction artistique arbitrée par `frontend-design`.
- Le glassmorphism et les grading forts (duotone, virage froid) doivent
  rester lisibles en accessibilité (contraste texte suffisant) — vérifier
  au cas par cas, l'esthétique ne dispense pas du contraste WCAG sur le
  texte réellement lu (pas le wordmark décoratif en image).
