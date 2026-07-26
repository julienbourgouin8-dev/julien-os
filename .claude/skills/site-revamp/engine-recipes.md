# Engine recipes — mécanique canvas/scroll/frames

Recettes techniques, pas un template — à écrire dans chaque build, adapté à
ce site. Ce fichier ne couvre que la mécanique ; le style vient de
`frontend-design` + `scroll-design-guidelines.md`.

## Pourquoi canvas et pas `<video currentTime>` pour un scrub désactif

Le seek d'une balise `<video>` classique génère du stutter (latence de seek).
Le chemin sans jank : frames pré-extraites dessinées sur un `<canvas>`,
pilotées par la position de scroll. Sur mobile, préférer une vraie
`<video>` scrubée par `currentTime` (voir `mobile-reliability.md`) plutôt que
des frames — le coût bande passante/mémoire de N images dépasse vite celui
d'un flux vidéo compressé pour un clip de plus de quelques secondes.

## Décodage hors thread — sans fenêtre d'éviction par défaut

`drawImage(HTMLImageElement)` force un décodage JPEG **synchrone** sur le
thread principal au premier affichage (et après éviction du cache navigateur)
— c'est ce pic de décodage qui donne la sensation saccadée. `createImageBitmap`
décode hors thread :

```js
const bitmaps = new Map();
let pendingDecodes = new Set();

function decodeFrame(i) {
  if (bitmaps.has(i) || pendingDecodes.has(i)) return;
  const img = rawImages[i];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  pendingDecodes.add(i);
  createImageBitmap(img)
    .then((bitmap) => {
      pendingDecodes.delete(i);
      bitmaps.set(i, bitmap);
      if (i === currentFrame) draw(i);
    })
    .catch(() => pendingDecodes.delete(i));
}
```

**Ne pas ajouter de fenêtre d'éviction (fermer/purger les bitmaps loin du
scroll actuel) par défaut.** C'est la première chose qu'un exemple externe
(ou une doc générique) va suggérer pour "économiser la mémoire" — mais sur
`ets-leveque-site/js/scroll-video.js`, cette exacte technique a été testée en
prod et **a réintroduit du saccadé sans rien résoudre**. La config qui marche
: garder tous les bitmaps décodés en mémoire pour la durée de la page. Ne
retester une fenêtre bornée que si le nombre de frames devient très élevé
(plusieurs centaines, cas d'une vidéo continue de plusieurs chapitres) — et
seulement en le mesurant, pas en le supposant.

Plafonner `devicePixelRatio` à 1 (pas la valeur retina réelle) : dessiner à
la résolution native double/quadruple le coût de chaque `drawImage`, ce qui
fait décrocher le scroll sur les machines modestes.

## Préchargement prioritaire autour du scroll

Ne pas se reposer uniquement sur un chargement progressif en arrière-plan.
Forcer le fetch+décodage d'une fenêtre symétrique (avant ET arrière) autour
de la frame courante à chaque tick de scroll, pour que le scroll rapide reste
fluide dans les deux sens même en avance sur le chargement de fond :

```js
const PRIORITY_RADIUS = 12;
for (let k = 1; k <= PRIORITY_RADIUS; k++) {
  const fwd = currentFrame + k, bwd = currentFrame - k;
  if (fwd <= frameCount - 1) { fetchFrame(fwd); decodeFrame(fwd); }
  if (bwd >= 0) { fetchFrame(bwd); decodeFrame(bwd); }
}
```

Charger la section prioritaire (hero, above the fold) en `fetchPriority:
"high"` sans attendre l'idle ; toute autre section en `fetchPriority: "low"`,
différée via `requestIdleCallback` par petits lots (3-5 par tick) pour ne
jamais saturer la bande passante et retarder une frame dont on a besoin
maintenant pendant un scroll actif.

## Garde de section hors champ

Chaque section vidéo/canvas a son propre listener de scroll indépendant.
Sans garde, deux sections tournent à plein régime en permanence même quand
une seule est visible :

```js
if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) {
  return; // section loin de l'écran, on saute tout le travail coûteux
}
```

## Le contrat de dev (nécessaire pour `scripts/verify.js`)

```js
const JUMP = new URLSearchParams(location.search).get('jump');
if (JUMP !== null) history.scrollRestoration = 'manual';
// après que tout est chargé et l'état de scroll figé :
if (JUMP !== null) { scrollTo(0, +JUMP || 0); /* recalcule la progression, dessine, tick une fois */ }
window.__ready = true;
```

`?jump=<y>` doit charger la page déjà scrollée avec tout l'état
scroll-dépendant figé. `__ready` ne doit passer à `true` qu'une fois la page
vraiment prête — c'est ce qui permet au harnais de capture de screenshoter
n'importe quelle position sans dépendre d'un délai arbitraire.

## Attendre les polices avant de créer le moindre ScrollTrigger

Si le build charge des polices web (Google Fonts ou autre `<link>` externe),
ne créer aucun ScrollTrigger avant qu'elles soient réellement chargées.
`document.fonts.ready` seul ne suffit pas (il ignore une feuille de style
externe pas encore parsée). Ce bug est **non-déterministe** — correct un
chargement sur deux selon la vitesse du CDN — donc facile à rater en test
manuel. Voir `showcase-reel/motion-vocabulary.md` → "Attendre les polices
avant de créer le moindre ScrollTrigger" pour le pattern complet (attendre le
`<link>`, puis `document.fonts.ready`, avec un plafond de secours pour ne
jamais bloquer `__ready` indéfiniment). Vérifiable en comparant
`offsetHeight` d'une section pinnée sur plusieurs chargements consécutifs —
s'il varie, c'est ce bug.

## Règle d'ordre GSAP ScrollTrigger (si le build utilise GSAP)

Les ScrollTrigger se rafraîchissent dans leur **ordre de création**. Toujours
créer les scènes épinglées (`pin: true`) en premier, les effets d'ambiance/
arrière-plan après — sinon les positions calculées avant l'existence des
espaceurs de pin sont fausses silencieusement, et les effets se déclenchent
des milliers de pixels trop tôt.

## Système de chapitres/texte synchronisé au scroll

Version par défaut (celle d'`ets-leveque-site`, prouvée) : le dernier
chapitre dont le seuil `data-from` est franchi reste actif jusqu'au suivant —
pas de borne haute qui le ferait disparaître en fin de scroll.

```js
function updateChapters(progress) {
  let match = null;
  for (const c of parsed) { if (progress >= c.from) match = c; else break; }
  // active match.el, désactive l'ancien actif
}
```

Sur un retour en arrière, le chapitre doit disparaître **vite** (transition
de sortie courte, non retardée) — sinon le texte reste affiché par-dessus
une image qui a déjà changé, puisque le scroll va plus vite que la durée
d'entrée normale du texte. Ne jamais partager la même transition pour
l'entrée et la sortie.

**Option plus riche** (si un futur brief a besoin de fondus plus fins entre
plus de "chapitres", scène par scène plutôt que section par section) : une
enveloppe de progression `data-in`/`data-peak`/`data-out` par élément, avec
un calcul d'alpha continu plutôt qu'un simple on/off. Plus de contrôle, plus
de code — ne l'utiliser que si le système simple ci-dessus ne suffit pas pour
le brief en cours.

## Raccord entre deux sections (pas de ligne visible)

Si une section se termine sur une couleur/image et que la suivante démarre
sur un fond différent, échantillonner la couleur du bord de la dernière
frame/image et démarrer le fond de la section suivante exactement sur ce
hex, avec un fondu sur les derniers ~8% de la section précédente plutôt
qu'une coupure nette.
