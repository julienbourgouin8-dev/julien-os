# Scroll-Driven Site Styling Rules

Règles de style propres à un site scroll-animé. S'appliquent **en plus** du
skill `frontend-design`, pas à sa place — `frontend-design` gère le jugement
esthétique général (pairing typo, retenue sur la couleur, éviter le rendu
générique IA, la boucle plan→critique) ; ce fichier gère les règles
structurelles propres à une mise en page scrub-au-scroll sur lesquelles
`frontend-design` n'a pas d'avis (genre-agnostique).

Charger les deux pour un build from-scratch scroll-animé. Charger seulement
`frontend-design` pour reconstruire/restyler un site existant qui n'est pas
scroll-animé.

## La typo comme design

- Titres hero : **6rem minimum**, line-height serré (0.9-1.0), graisse forte
  (700-800)
- Titres de section : **3rem minimum**, graisse affirmée (600-700)
- Texte de marquee horizontal : **10-15vw**, majuscules, letterspacing
- Labels de section : petit (0.7rem), majuscules, letterspacing (0.15em+),
  couleur atténuée — style "001 / Services"
- La hiérarchie typographique remplace les cartes-conteneurs. Taille,
  graisse et couleur SONT la structure

## Pas de cartes, pas de boîtes

- **JAMAIS** de glassmorphism, de verre dépoli, de conteneurs visibles
  autour du texte sur un site scroll-animé
- Le texte repose directement sur le fond — propre, confiant, éditorial
- La lisibilité vient de : la graisse (600+), un text-shadow si besoin, et
  des frames vidéo qui gardent un fond propre aux points de scroll où du
  texte apparaît
- Le seul "conteneur" acceptable est un padding généreux sur la section
  elle-même

## Zones de couleur

- Le fond doit changer entre sections (clair → sombre → accent → clair)
- Définir les zones en variables CSS : `--bg-light`, `--bg-dark`,
  `--bg-accent`
- La couleur du texte s'inverse automatiquement : `--text-on-light`,
  `--text-on-dark`
- Les transitions passent par GSAP ou une classe togglée, pas par des
  transitions CSS statiques

## Variété de layout

Au moins 3 patterns de layout différents par page :
1. **Centré** — hero, CTA
2. **Aligné à gauche** — description de service avec le produit à droite
3. **Aligné à droite** — services alternés
4. **Pleine largeur** — marquee horizontal, rangée de stats
5. **Split** — texte d'un côté, visuel de l'autre

Ne jamais répéter le même layout sur deux sections consécutives.

## Chorégraphie d'animation

- Chaque section doit avoir une entrée DIFFÉRENTE (fade-up, slide-left,
  slide-right, scale-up, clip-path reveal)
- Les éléments d'une section entrent avec un délai échelonné (0.08-0.12s
  entre éléments)
- Séquence : label d'abord → titre → corps de texte → CTA/bouton
- Au moins une section doit s'épingler (rester fixe) pendant que son contenu
  s'anime en interne
- Au moins un élément de texte surdimensionné doit bouger horizontalement au
  scroll

## Stats et chiffres

- Afficher les stats en **4rem+**
- Les chiffres DOIVENT monter par animation (jamais statiques d'emblée)
- Un élément suffixe pour l'unité (x, M, %, etc.) en plus petit
- Labels en dessous, petites majuscules ou texte atténué
