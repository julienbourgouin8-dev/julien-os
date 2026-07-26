# Animer une image fixe sans vidéo

## Le hero qui sert de loader (réf. VANTA — la vraie mécanique)

Analysé à partir du prompt exact tapé dans Claude Code par le créateur du site
VANTA (transcription vidéo) : *"I want our hero image to appear full screen
height and width and then scale down into its position where it sits
currently. This triggers before all the other elements animate on screen."*

**Ce n'est pas une boucle infinie.** Correction par rapport à une première
hypothèse : ce n'est pas un zoom qui respire en continu façon Ken Burns.
C'est une séquence **une seule fois, au chargement de la page** :

1. Le hero apparaît en plein écran (100vw × 100vh), plus grand que sa taille
   normale dans la mise en page
2. Il se rétracte ("scale down") vers sa position/taille de repos réelle
   (contenue dans le wrapper max-width de la page)
3. Cette animation doit **finir avant** que le reste des sections commence à
   apparaître — le hero agit comme un loader : pendant qu'il "respire" vers
   sa taille finale, le plus gros asset de la page a le temps de charger/se
   décoder sans que ça ressemble à un temps mort

C'est ça qui donne l'effet "presque vidéo" que Julien avait repéré au départ
(zoom, puis dézoom) — pas une ambiance de fond qui boucle, mais une
entrée de page mise en scène, une seule fois.

### Recette de base

```css
.hero {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  transform: scale(1.4); /* état de départ : "trop grand" */
  transform-origin: center top;
}

.hero.settled {
  position: static; /* ou retour aux dimensions de repos via un second keyframe */
  transform: scale(1);
}
```

En pratique, plus fiable avec une lib de timeline (GSAP) qu'avec un simple
`@keyframes` CSS, parce qu'il faut **gater** le reste des animations sur la
fin de celle-ci :

```js
const heroTl = gsap.timeline({
  onComplete: () => document.body.classList.add('page-ready'),
});
heroTl.fromTo('.hero',
  { scale: 1.4 },
  { scale: 1, duration: 1.4, ease: 'power3.out' }
);
// Les animations d'entrée des autres sections écoutent .page-ready
// (ou sont elles-mêmes déclenchées dans un .then() après heroTl)
```

Points qui font la différence :

- **Le gate est la partie qui compte**, pas juste le scale. Sans le
  séquencement ("ça déclenche avant que tout le reste anime"), l'effet
  perd son rôle de loader et redevient une simple animation d'entrée parmi
  d'autres.
- **`ease` de sortie franche** (`power3.out`/`power4.out`) plutôt que
  linéaire — la rétraction doit ralentir en approchant sa taille finale,
  pas s'arrêter net.
- Fonctionne particulièrement bien si le hero est déjà le plus gros asset
  de la page (photo haute résolution) : l'animation masque le temps de
  décodage au lieu de montrer un flash de contenu qui saute.

### Variantes à explorer

- **Zoom respirant en boucle façon Ken Burns** (ambiance continue, pas un
  loader one-shot) — utile pour un fond qui doit vivre pendant que
  l'utilisateur lit une section, différent usage que le hero-loader
  ci-dessus :

  ```css
  .hero-media img {
    animation: breathe 20s ease-in-out infinite alternate;
    transform-origin: 55% 45%; /* le point focal du sujet, jamais center */
  }
  @keyframes breathe {
    from { transform: scale(1); }
    to   { transform: scale(1.08); }
  }
  ```
  Durée longue (18-24s), amplitude faible (1.05-1.10 max) — sinon ça se lit
  comme une animation plutôt qu'un mouvement de caméra discret.

- **Parallax multi-calques** : si la photo est déjà séparée en calques
  (fond montagne / ligne d'arbres / premier plan), faire bouger chaque
  calque à une vitesse différente au scroll (`ScrollTrigger` +
  `containerAnimation`, voir `showcase-reel/motion-vocabulary.md` pour le
  câblage Lenis+GSAP déjà documenté).
- **Cross-fade entre deux photos retouchées** (déjà utilisé sur
  `ets-leveque-site`, section `#service-pac`) — alternative pas chère à une
  vidéo quand deux états successifs suffisent à raconter le mouvement.

## Compartiments qui s'empilent au scroll (réf. vidéo "scroll websites")

Repéré par Julien dans une vidéo par ailleurs pas retenue pour `visual-craft`
(contenu centré sur l'outil Higgsfield, écarté) — mais cet effet précis
mérite d'être documenté à part : chaque section plein écran a des **coins
arrondis**, façon carte. En scrollant, la section suivante remonte
par-dessus la précédente et la recouvre progressivement — l'arrondi qui
dépasse en haut de la carte qui arrive (et qu'on aperçoit encore en bas de
celle qui part) est ce qui vend l'effet "compartiment qui s'empile", pas
juste un changement de couleur plein écran.

**Point important : ça se fait en CSS pur, sans JS ni GSAP.** Le
comportement d'empilement est un effet de bord naturel de `position:
sticky` combiné à l'ordre du DOM — pas besoin de ScrollTrigger pour cette
version simple.

```css
.stack-section {
  position: sticky;
  top: 0;
  height: 100vh;
  border-radius: 32px 32px 0 0; /* coins arrondis visibles quand la suivante recouvre */
  overflow: hidden;
}
```

Chaque section suit la précédente dans le DOM normalement (pas de wrapper
spécial). Comme elles partagent toutes le même `top: 0`, elles se
"collent" au même point du viewport l'une après l'autre au fil du scroll ;
l'ordre du DOM fait qu'une section plus bas dans le HTML se peint
naturellement par-dessus celle qui la précède pendant la transition — z-index
explicite rarement nécessaire tant que l'ordre DOM suit l'ordre visuel
voulu.

Ce qui fait la différence entre "ça marche" et "l'effet se voit bien" :

- **Couleur de fond pleine et contrastée par section** (pas de dégradé
  subtil) — chaque carte doit se lire comme un bloc distinct qui arrive,
  pas une continuité de fond.
- **`border-radius` sur le haut suffit** dans la plupart des cas — c'est le
  bord qui apparaît progressivement par-dessus la carte précédente pendant
  le scroll qui crée la lecture "empilement", le bas n'a pas besoin d'être
  arrondi puisqu'il ne se voit jamais découvert.
- **Contenu interne à la section pas sticky lui-même** — seul le wrapper de
  section l'est, sinon le contenu (nav, texte) reste figé indépendamment du
  reste et casse l'illusion de carte solidaire.
- Fonctionne aussi bien pour des sections "produit" (chacune une couleur de
  marque différente) que pour une timeline/process en plusieurs étapes.

## Galerie à deux images qui changent ensemble (réf. VANTA)

Prompt observé : *"For the gallery in this section, make the arrow icons
function to change the 2 images to new ones, use the images we currently
have in our assets folder and label them appropriately. Each arrow click
should change both images."*

Résultat construit par Claude : 4 "paires" de slides prédéfinies (ex.
Kitchen|Master Bedroom, Living Room|Wood Stove...), chaque paire préchargée.
Un clic sur la flèche fait : les deux images fade out ensemble (~250ms),
sources + légendes + positions changent pendant qu'elles sont invisibles,
puis les deux fade in ensemble. Jamais de frame à moitié mise à jour ou
blanche. Un verrou anti-double-clic empêche de relancer la transition avant
la fin ; l'index boucle dans les deux sens (dernier→premier, premier→dernier).

Principe généralisable : **quand plusieurs éléments doivent changer
ensemble suite à une seule action, les transitionner comme une seule unité**
(fade-out groupé → swap pendant l'invisibilité → fade-in groupé), jamais
chacun sur son propre timer indépendant — sinon un décalage de quelques ms
entre les deux crée un flash visible de contenu incohérent.

## Respecter `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .hero, .hero-media img { animation: none; transform: none; }
}
```
Non négociable, même règle que le reste des skills `site-revamp` /
`showcase-reel`. Pour le hero-loader en particulier : afficher directement
le hero à sa taille de repos et débloquer les animations des autres
sections immédiatement, sans attendre un timeline qui ne jouera pas.
