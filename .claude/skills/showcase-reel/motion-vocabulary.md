# Motion vocabulary — pur code, sans vidéo générée

Le "film" est une séquence de scènes pilotées par le scroll, composées avec
GSAP + ScrollTrigger + Lenis. Zéro coût, zéro compte, ne dépend d'aucune
vidéo générée — c'est ce qui rend ce skill soutenable chaque semaine.

## Câblage Lenis + GSAP

```js
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

## Vocabulaire de scènes — composer selon la narration choisie à l'étape 1

- **Reveal du titre lettre par lettre** — split le wordmark en spans,
  stagger `yPercent: 120 → 0` avec `power4.out`.
- **Scènes épinglées scrubbées** — `pin: true, scrub: true, end: '+=140%'`,
  une forme qui grandit/tourne, un "vortex" de blend, un mask qui s'ouvre en
  plein-bleed.
- **Défilement horizontal épinglé** — translate une piste
  `width: max-content` de `-(scrollWidth - innerWidth)` ; parallax des
  enfants via `containerAnimation`. `invalidateOnRefresh: true`.
- **Clip-path reveals** — `inset(0 0 100% 0) → inset(0)` pour des rangées
  éditoriales.
- **Velocity-skew** — skew d'un ticker/marquee proportionnel à
  `ScrollTrigger.getVelocity()`, clampé.
- **Compteurs** — trigger `once: true`, `snap: { textContent: 1 }`.
- **Marquee** — `xPercent: -50, repeat: -1` sur une rangée doublée.

## Règle d'ordre (le bug silencieux)

Les ScrollTrigger se rafraîchissent dans leur **ordre de création**. Créer
toutes les scènes épinglées **en premier**, les effets d'ambiance/arrière-plan
**après** — sinon des positions calculées avant l'existence des espaceurs de
pin sont fausses silencieusement, et les effets se déclenchent des milliers
de pixels trop tôt.

## Attendre les polices avant de créer le moindre ScrollTrigger

Bug réel rencontré en construisant le premier site avec ce skill (`ARTÈRE`,
`projects/showcase-artere`) : les polices web (chargées via un `<link>`
Google Fonts) ne sont pas garanties chargées au moment où `DOMContentLoaded`
se déclenche. Si des ScrollTrigger pinnés/horizontaux sont créés avant que la
police réelle ait remplacé la police de repli, leurs distances (`end`,
largeur de piste horizontale) sont calculées sur des métriques de texte
fausses. Rien ne les recalcule automatiquement après coup — le résultat est
un bug **non-déterministe** (correct un chargement sur deux selon la vitesse
du CDN de polices) : sections qui se chevauchent, jank sur les pins,
symptômes qui disparaissent quand on regarde "à l'œil" parce qu'ils dépendent
du timing réseau du jour.

`document.fonts.ready` seul ne suffit pas — il ne connaît que les polices
déjà enregistrées, et la feuille de style externe peut ne pas avoir fini de
se parser au moment du check. Attendre explicitement le chargement du
`<link>` lui-même, puis `document.fonts.ready`, **avant** de créer le moindre
ScrollTrigger :

```js
const fontLink = document.querySelector('link[href*="fonts.googleapis"]');
const linkSettled = new Promise((resolve) => {
  if (!fontLink || fontLink.sheet) return resolve();
  fontLink.addEventListener('load', resolve, { once: true });
  fontLink.addEventListener('error', resolve, { once: true }); // CDN hors ligne : ne jamais bloquer indéfiniment
});
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
// Toujours course contre un plafond dur — un cas limite de détection de
// police ne doit jamais bloquer __ready pour toujours.
Promise.race([linkSettled.then(() => document.fonts.ready), timeout(2500)])
  .then(() => { /* créer les ScrollTrigger ici, pas avant */ });
```

Vérifiable en confirmant que `offsetHeight` d'une section pinnée reste
identique sur plusieurs chargements de page consécutifs — s'il varie d'un
chargement à l'autre, c'est ce bug.

## Performance

Propriétés GPU uniquement (`transform`/`opacity`), `will-change` sur les
quelques nœuds réellement animés, aucune lecture qui force un reflow dans un
ticker.

## Le contrat de dev (nécessaire pour `scripts/capture-reel.js`)

```js
window.addEventListener('load', () => {
  // laisser le temps aux polices/images/entrées de page de s'installer
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__ready = true;
  }));
});
```

`window.__ready` doit passer à `true` seulement une fois que le premier écran
est visuellement stable — c'est ce qui permet au script de capture de savoir
quand démarrer le scroll scripté sans filmer un flash de contenu non chargé.
