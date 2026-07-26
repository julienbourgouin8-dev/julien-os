---
name: visual-craft
description: >-
  Bibliothèque de techniques pour construire des sections visuelles
  mémorables à partir d'une photo/image fixe — retouche/compositing
  (incruster un wordmark dans une scène, grading couleur), animation (zoom
  respirant façon Ken Burns, parallax, transitions), et écriture de section
  (wordmark, tagline, accroche). Se charge depuis `site-revamp` ou
  `showcase-reel` quand une section a besoin d'un traitement image/animation
  précis — pas un skill qu'on invoque seul. Grandit une technique à la fois :
  Julien apporte une référence trouvée ailleurs (capture d'écran, vidéo), on
  l'analyse, on en extrait le principe généralisable, on l'ajoute ici — jamais
  copiée comme template figé, toujours comme une technique réutilisable avec
  d'autres styles/couleurs/transitions.
---

# Visual Craft — retouche, animation et écriture de section

Ce skill n'est jamais déclenché seul : `site-revamp` et `showcase-reel` le
chargent au moment de construire une section qui a besoin d'un vrai
traitement (photo héro, transition entre scènes, wordmark incrusté). Le but
n'est pas d'accumuler des templates à copier-coller, mais de comprendre le
*principe* derrière un effet vu ailleurs pour pouvoir le rejouer avec
d'autres couleurs, d'autres formes, d'autres rythmes.

## Comment on ajoute une technique

1. Julien montre une référence (capture, vidéo, site).
2. On l'analyse ensemble : qu'est-ce qui fait que ça marche visuellement,
   quelle est la mécanique technique derrière (compositing ? animation
   CSS/JS ? typographie ?).
3. On documente le principe généralisé dans le fichier concerné (voir liste
   ci-dessous) — pas la référence elle-même, mais la recette qu'on peut
   réappliquer avec d'autres inputs. Une même batch de captures peut nourrir
   plusieurs fichiers à la fois (composition de section, enchaînement de
   page, typographie, boutons/badges sont des couches différentes du même
   site).
4. On l'implémente sur la section en cours (site-adeline, showcase-reel...).

## Fichiers de référence

- `image-compositing.md` — retouche et compositing d'image fixe : incruster
  du texte/un wordmark à une profondeur précise dans une photo, grading
  couleur pour un rendu premium.
- `motion-recipes.md` — animer une image fixe pour lui donner un rendu
  vivant sans vidéo : zoom respirant (Ken Burns), parallax, transitions
  entre sections.
- `section-copy.md` — écriture courte pour wordmark/tagline/accroche de
  section (à distinguer de `references/voice.md` à la racine, qui couvre la
  voix personnelle de Julien pour LinkedIn/email, pas la copy d'un site
  client).
- `figma-handoff.md` — le workflow design-first (Figma → Dev Mode MCP →
  Claude Code, section par section) et le pattern des prompts d'amélioration
  qui marchent, observé sur un cas réel complet.
- `hero-patterns.md` — archétypes de composition complets (pas une seule
  technique de retouche) : carte glassmorphism sur photo, typo géante qui
  déborde du cadre, cadre photo organique, collage mood board, chiffres
  géants en filigrane, grading duotone assumé, panneau à hotspots cliquables
  — catalogue issu d'une batch de captures de sites réels.
- `page-anatomy.md` — comment les blocs s'enchaînent sur toute la hauteur
  d'une page : tailles relatives, position (centré/asymétrique/coin), logique
  de séquencement d'une section à l'autre. Complète `hero-patterns.md` (une
  section) en couvrant la page entière — même batch de captures.
- `typography.md` — mélange de styles typographiques (mot d'emphase en
  italique serif au sein d'un titre sans-serif, contraste d'échelle
  chiffre/label pour les stats, eyebrow en majuscules espacées) — récurrent
  sur 4 des 9 captures de la même batch, assez systématique pour être une
  technique à part entière.
- `ui-chrome.md` — le petit mobilier répété sur une page : hiérarchie de
  rayons de courbure à 3 niveaux, paires bouton primaire/secondaire, état
  actif de nav, cadrage circulaire réservé à un accent, icône détachée du
  bouton — même batch de captures, vue composant par composant.
- `layout-composition.md` — principes de composition génériques (grilles,
  hiérarchie, mouvement de l'œil, friction/flux) non liés à une photo hero
  précise, contrairement au reste de ce skill — extraits d'une vidéo de
  théorie du design via une passe dense de `video-teardown`.

## Garde-fous

- Jamais un template figé — chaque technique documentée doit s'appliquer
  avec d'autres couleurs/polices/rythmes que l'exemple d'origine.
- Le style visuel final reste arbitré par `frontend-design` (palette, typo,
  direction générale) — ce skill fournit la mécanique, pas le goût.
- Respecter `prefers-reduced-motion` pour toute animation ajoutée ici, sans
  exception (même règle que `site-revamp`/`showcase-reel`).
