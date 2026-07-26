# UI chrome — boutons, badges, rayons de courbure, iconographie

Le "petit mobilier" d'une page : boutons, pastilles, cartes, icônes — les
éléments répétés partout sur une page plutôt qu'une composition de section
entière (`hero-patterns.md`) ou l'enchaînement des blocs (`page-anatomy.md`).
Recoupé sur les 9 captures apportées par Julien : un système de rayons de
courbure à 3 niveaux et un vocabulaire de bouton très cohérent reviennent
sur la quasi-totalité des références.

## Hiérarchie de rayons de courbure à 3 niveaux (quasi-universelle sur les 9 refs)

Un même site n'utilise (presque) jamais un seul rayon de courbure partout —
il y a systématiquement 3 échelles différentes selon le rôle de l'élément :

1. **Boutons/CTA → pilule complète** (`border-radius: 999px`, rayon = moitié
   de la hauteur). Vu sur RANTY, Enblox, WANDER, GreenSpace, AKINA, invoice
   app, Fluxora — 7 sites sur 9.
2. **Cartes/panneaux flottants → grand rayon doux** (24-40px, jamais un
   simple 8px). Vu sur le panneau blanc de RANTY, le panneau glass d'AKINA,
   les cartes de section GreenSpace.
3. **Photos/chips/petites UI → rayon moyen** (12-16px). Les cartes
   destination de WANDER, les mockups de l'app invoice, les tags de Hotle.

**Principe généralisable** : ne jamais choisir un seul rayon de courbure
pour tout un design system. Réserver le rayon "pilule" aux éléments
cliquables/interactifs (ça communique inconsciemment "ceci est un bouton"),
le grand rayon doux aux surfaces de contenu qui flottent, le rayon moyen
aux éléments plus petits/utilitaires. Cette hiérarchie à elle seule aide à
distinguer ce qui est cliquable de ce qui ne l'est pas, sans texte
explicite.

```css
:root {
  --radius-pill: 999px;   /* boutons, CTA, tags actifs */
  --radius-panel: 32px;   /* cartes flottantes, panneaux hero */
  --radius-chip: 14px;    /* photos, mockups, petites cartes */
}
```

## Paire bouton primaire (rempli) + bouton secondaire (contour) côte à côte (réf. WANDER.ph, AKINA)

Dans le hero, deux CTA sont posés côte à côte : un bouton plein (couleur de
marque ou noir/blanc selon le fond) pour l'action principale, un bouton en
contour fin (même forme pilule, fond transparent) juste à côté pour
l'action secondaire. Jamais deux boutons pleins côte à côte — ça brouille
la hiérarchie de priorité entre les deux actions.

```css
.btn-primary { background: var(--accent); color: #fff; border-radius: var(--radius-pill); }
.btn-secondary { background: transparent; border: 1px solid currentColor; border-radius: var(--radius-pill); }
```

## État actif de nav en pilule pleine, reste en texte simple (réf. Hotle)

Dans la barre de navigation, l'item actif/courant ("Home") est affiché dans
une pilule pleine (fond noir, texte blanc) tandis que les autres items
("Backyard", "Works", "Contact") restent en texte simple sans fond. Le
contraste de traitement fait immédiatement comprendre où on se trouve dans
le site, sans soulignement ni changement de couleur de texte seul.

**Variante à considérer pour site-revamp/showcase-reel** : réutilisable
pour une nav de site vitrine BTP avec plusieurs pages (Accueil/Services/
Réalisations/Contact) — plus lisible qu'un simple soulignement au survol.

## Cadrage circulaire pour UNE photo produit accent, rectangulaire pour le reste (réf. GreenSpace)

Presque toutes les photos d'un site donné restent en rayon "chip" ou
"panel" (rectangle arrondi). Une seule exception observée : une photo
produit unique (un pot de plante) recadrée en cercle parfait, posée en
flottement au-dessus du hero. Le contraste de forme (cercle isolé au milieu
de rectangles partout ailleurs) attire l'œil sur cet élément précis sans
avoir besoin d'un cadre de couleur ou d'une ombre appuyée.

**Principe généralisable** : réserver la forme circulaire à UN SEUL élément
photo par page maximum, celui qu'on veut vraiment isoler comme accent —
l'utiliser sur plusieurs photos annule l'effet de rareté qui le rend
efficace.

## Icône-cercle accrochée à la fin d'un bouton pilule (réf. Fluxora, RANTY)

Sur Fluxora, le bouton "Get started" (pilule pleine) est suivi d'un petit
cercle séparé contenant une flèche, accroché juste après le texte plutôt
que l'icône fondue à l'intérieur du même bouton. Sur RANTY, un cercle
similaire (icône lecture) sert de déclencheur vidéo distinct, relié par une
ligne à un panneau d'aperçu.

```html
<button class="btn-primary">Voir nos réalisations</button>
<span class="icon-chip"><svg><!-- flèche --></svg></span>
```

**Principe généralisable** : détacher visuellement l'icône du texte du
bouton (un chip circulaire séparé, pas une icône inline dans le padding)
donne plus de poids et de "cliquabilité" perçue qu'une icône collée dans le
même rectangle que le texte.

## Pastilles décoratives en aplat de couleur, sans dégradé ni texture (réf. app invoice)

Les petits éléments décoratifs dispersés (pastilles rondes, icônes) sont en
couleur plate unique (bleu plein, rouge plein, vert plein), jamais en
dégradé ou avec ombre portée marquée — contraste volontaire avec les
mockups UI eux-mêmes qui, eux, ont de vraies ombres douces pour paraître
"posés". Le contraste plat/texturé aide à distinguer ce qui est pure
décoration de ce qui représente un vrai élément d'interface.

## Récapitulatif — check-list rapide pour une nouvelle section

- 3 rayons de courbure distincts définis en variables, jamais un seul
  rayon réutilisé partout.
- CTA principal = pilule pleine ; CTA secondaire à côté = pilule en
  contour, jamais deux pleins côte à côte.
- Nav : état actif marqué par une forme (pilule pleine), pas seulement une
  couleur de texte différente.
- Cadrage circulaire réservé à un seul élément accent par page.
- Décorations pures en aplat de couleur ; éléments UI réels avec ombre
  douce — les deux ne se confondent jamais visuellement.
