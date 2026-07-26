# Typographie — mélange de styles, contraste d'échelle

Distinct de `section-copy.md` (le choix des mots) : ce fichier couvre le
**traitement typographique** du texte — quelle police, quelle graisse,
quelle taille, sur quel mot précisément — indépendamment de ce que dit la
phrase. Recoupé sur les 9 captures apportées par Julien : un même geste
typographique revient sur 4 sites sur 9 (Enblox, Hotle, MNTN, Fluxora),
assez systématique pour être documenté comme technique à part entière, pas
une coïncidence de style.

## Mot d'emphase en italique serif au sein d'un titre sans-serif (réf. Enblox, Hotle, MNTN, Fluxora)

Le titre est composé en sans-serif gras/lourd, sauf **un ou deux mots
précis** — jamais toute la phrase — qui basculent en italique serif, plus
fin, souvent dans la même couleur (pas une couleur d'accent séparée : c'est
le changement de police lui-même qui porte l'emphase, pas la couleur).

Observé précisément :
- Enblox : "Designed to Help You Do More" en sans gras, puis "With Less
  Stress" en italique serif — la fin de la phrase seulement.
- Hotle : sur une seule phrase, plusieurs mots isolés non consécutifs
  ("architecture", puis plus loin "live, work," et "chill") basculent en
  italique serif au milieu d'un texte sans-serif upright — pas un bloc
  continu, des mots choisis un par un dans la phrase.
- MNTN : le mot "hiker" seul en italique serif au milieu d'un titre par
  ailleurs déjà en serif upright — donc la bascule peut aussi se faire
  serif-upright → serif-italique, pas seulement sans → serif.
- Fluxora : le dernier mot de la phrase ("Machines") en italique serif,
  le reste du titre en sans gras.

**Principe généralisable — lequel mot choisir** : le mot qui bascule en
italique est toujours celui qui porte le sens le plus concret/sensoriel de
la phrase (un métier, un geste, une matière), jamais un mot de liaison
(articles, verbes auxiliaires). C'est la même logique que "chaque titre est
une image concrète" documentée dans `section-copy.md` — ici appliquée au
niveau du mot plutôt que de la phrase entière.

```css
.headline { font-family: var(--font-sans); font-weight: 700; }
.headline em {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 400; /* volontairement plus léger que le sans qui l'entoure */
}
```

**Pourquoi ça marche** : le contraste de graisse (gras → léger) ET de style
(droit → italique) ET de famille (sans → serif) se cumulent sur un mot
isolé — c'est ce cumul de trois signaux à la fois, sur un seul mot, qui crée
une pause de lecture nette sans avoir besoin d'une couleur d'accent
séparée. Une seule des trois variations (juste l'italique, ou juste une
autre police) serait plus faible.

**Erreur à éviter** : appliquer ce traitement à plus de 2 mots dans un même
titre — au-delà, l'effet de pause disparaît et ça lit comme deux polices
mal assorties plutôt qu'une emphase délibérée.

## Contraste d'échelle chiffre/label pour les blocs de stats (réf. RANTY, GreenSpace, Hotle, Fluxora — 4 sites sur 9)

Le chiffre (souvent avec un "+" ou "%") est composé nettement plus grand et
plus gras que son label descriptif juste en dessous, qui lui reste petit et
en graisse régulière. Le rapport de taille observé tourne autour de
2.5x-3.5x entre le chiffre et le label (jamais un simple 1.2x-1.5x qui
resterait timide).

```css
.stat-number {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 700;
  line-height: 1;
}
.stat-label {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-muted);
  margin-top: 0.25em;
}
```

**Principe généralisable** : ce rapport d'échelle fonctionne parce que le
chiffre est l'information qu'on veut mémoriser en un coup d'œil (12m+
clients, 98% satisfaction), le label n'est là que pour lever l'ambiguïté —
sa taille doit rester secondaire pour ne pas concurrencer le chiffre.
Directement réutilisable pour ETS Lévesque : "15 ans d'expérience", "200+
chantiers", etc., en reprenant ce même rapport d'échelle plutôt qu'un
simple texte à taille uniforme.

## Petit label en majuscules espacées au-dessus d'un titre (réf. RANTY, MNTN, GreenSpace)

Un "eyebrow" — texte court, tout en majuscules, letter-spacing large,
petite taille (souvent 11-13px), couleur atténuée ou couleur d'accent de
marque — placé juste au-dessus du titre principal. Sur RANTY c'est la
tagline entre deux slashes ("/ We craft custom homes /"), sur MNTN c'est
"A HIKING GUIDE", sur les cartes de section GreenSpace c'est le préfixe de
catégorie.

```css
.eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

**Principe généralisable** : l'eyebrow fait le même travail que le niveau
2 documenté dans `layout-composition.md` (hiérarchie de taille qui crée une
pause intermédiaire) mais au niveau typographique pur — il donne un point
d'entrée à l'œil avant le vrai titre, sans avoir besoin d'un visuel
additionnel.

## Récapitulatif — les trois signaux à combiner, jamais isolément

1. **Famille** (serif ↔ sans)
2. **Style** (droit ↔ italique)
3. **Graisse** (gras ↔ régulier/léger)

Sur les captures les plus réussies, l'emphase typographique combine
toujours au moins 2 de ces 3 signaux en même temps sur le même mot/bloc —
jamais un seul signal isolé (juste plus gros, ou juste une couleur
différente), qui reste un traitement plus faible et plus générique.
