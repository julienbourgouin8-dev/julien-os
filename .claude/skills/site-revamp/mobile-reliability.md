# Mobile Video Reliability — leçons de vrai téléphone

Patterns issus de la construction et du debug réel d'`ets-leveque-site` en
production. **Plusieurs de ces bugs ne sont PAS reproductibles en émulation
Chromium DevTools ni en Playwright** — ils n'apparaissent que sur du vrai
iOS Safari matériel. Budgéter une passe sur vrai téléphone pour toute section
vidéo-lourde avant de la considérer terminée — un test uniquement émulé peut
passer au vert pendant que le vrai rendu est cassé.

## Construire un debug overlay pour tester sans Mac

Le console Safari n'est pas accessible depuis un iPhone connecté sans Mac à
proximité. Le fix qui a permis de diagnostiquer tous les bugs ci-dessous : un
petit overlay texte fixe à l'écran, activé par un flag global, qui affiche
l'état en direct (`readyState`, `paused`, la dernière erreur) :

```js
window.__dbg = window.__dbg || function (msg) {
  let el = document.getElementById("__dbg-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "__dbg-overlay";
    el.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:99999;" +
      "background:rgba(0,0,0,.8);color:#0f0;font:10px monospace;padding:4px;" +
      "max-height:30vh;overflow:auto;white-space:pre-wrap;pointer-events:none";
    document.body.appendChild(el);
  }
  el.textContent += msg + "\n";
};
```

Appeler `window.__dbg("...")` à chaque étape sensible (tentative de play,
rejet, seek, chargement) pendant le debug, retirer ou masquer derrière un
paramètre d'URL avant livraison finale.

## Décider la stratégie mobile avant de construire

Le chemin canvas + frames images (voir `engine-recipes.md`) marche bien sur
desktop. Sur mobile il a un vrai coût bande passante/mémoire : N fichiers
image séparés peuvent peser plus au total qu'un flux vidéo H.264/VP9 bien
compressé couvrant le même contenu, et le téléphone doit garder chaque
`ImageBitmap` décodé en mémoire.

Deux stratégies valables — à choisir selon la longueur/richesse du clip, pas
par défaut :

- **Frames partout aussi sur mobile** : correct pour un clip court (<10s) ou
  peu de frames (<150, largeur plafonnée à 1280px). Un seul chemin de code
  pour tous les viewports.
- **Hybride : canvas+frames desktop, vraie `<video>` compressée sur mobile** :
  bascule sous `max-width: 768px` (ou `prefers-reduced-motion: reduce`),
  pilotée par `video.currentTime = progress * video.duration` sur la même
  valeur de progression que le chemin canvas desktop. Plus de code, mais
  beaucoup plus léger sur la donnée mobile pour tout ce qui dépasse quelques
  secondes.

Tout ce qui suit s'applique au chemin `<video>` mobile.

## Fiabilité de l'autoplay sur `<video>` mobile

Une `<video>` muted + `playsinline` est normalement exemptée des
restrictions d'autoplay, mais iOS peut quand même bloquer `.play()`
purement et simplement (mode Basse consommation, ou le réglage Safari
"Lecture automatique" par site) — **sans aucun événement d'erreur**. Le
symptôme observé en vrai (via l'overlay de debug ci-dessus) : `readyState`
coincé à 1 (metadata seulement), `paused: true`, pour toujours ; seule la
raison de rejet de la promesse `play()` révèle le problème.

Fix : ne jamais laisser un `.catch(() => {})` silencieux être la seule
gestion. Enregistrer un listener `touchstart`/`click` unique qui retente
`.play()` au prochain vrai geste utilisateur — iOS autorise toujours une
lecture déclenchée par un geste :

```js
video.play().catch(() => {
  const retry = () => { video.play().catch(() => {}); cleanup(); };
  const cleanup = () => {
    window.removeEventListener("touchstart", retry);
    window.removeEventListener("click", retry);
  };
  window.addEventListener("touchstart", retry, { once: true });
  window.addEventListener("click", retry, { once: true });
});
```

## Coupures réseau en cours de lecture

Sur un tunnel (Cloudflare quick tunnel, etc.) le flux traverse plus de sauts
réseau qu'en local et peut se couper en route — la `<video>` reste alors
bloquée en erreur ou en attente indéfiniment sans jamais se rattraper seule.
Surveiller `error`/`stalled`, et un timeout `waiting`-sans-progrès (`readyState
< 3` pendant 5s de lecture censée être active) :

```js
function scheduleStallCheck() {
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => {
    if (!video.paused && !video.ended && video.readyState < 3) recover();
  }, 5000);
}
function recover() {
  if (recovering || retries >= 4) return; // plafonner les tentatives
  recovering = true; retries++;
  const wasTime = video.currentTime;
  video.load(); // force un nouveau fetch de la source
  video.addEventListener("loadedmetadata", () => {
    video.currentTime = wasTime;
    video.play().then(() => (recovering = false)).catch(() => (recovering = false));
  }, { once: true });
}
```

## Le bug de compositor WebKit "frame figée"

Sur un vrai iPhone, une `<video>` avec `will-change: transform` ou
`transform: translateZ(0)` peut se retrouver forcée sur son propre calque
GPU qu'iOS ne repeint ensuite plus jamais après le démarrage de l'autoplay :
`currentTime` continue d'avancer, `readyState` atteint 4, le décodage se
fait réellement — mais l'écran reste visuellement figé sur la première
frame. Non reproductible en Chromium/Playwright.

Fix : ne jamais appliquer ces hints à une `<video>` sur mobile. Elles n'ont
d'intérêt que pour aider les `drawImage()` répétés d'un `<canvas>` desktop.
Scoper `will-change`/`translateZ` au desktop uniquement
(`@media (min-width: 769px)`).

## Le scrub arrière semble lent

Un seek `currentTime` en arrière doit redécoder depuis la dernière keyframe
— coûteux si les keyframes sont espacées. Réencoder avec des keyframes
denses :

```bash
ffmpeg -i input.mp4 -g 6 -keyint_min 6 -sc_threshold 0 -c:v libx264 output.mp4
```

(une keyframe toutes les 6 frames, détection de coupure de scène désactivée
pour que l'encodeur ne puisse pas les espacer davantage). Tout futur
réencodage du même fichier doit garder ces flags.

Aussi **coalescer les seeks déclenchés par le scroll** — un flick rapide peut
déclencher des dizaines d'événements de scroll par seconde, chacun voulant
écrire `currentTime`. Un seul seek en vol, on ne mémorise que la dernière
cible demandée, confirmé via l'événement `seeked` (avec un timeout de
sécurité ~1.5s si `seeked` ne se déclenche jamais) :

```js
let seekInFlight = false, pendingTarget = null;
function scrubTo(time) {
  pendingTarget = time;
  if (seekInFlight) return;
  seekInFlight = true;
  video.currentTime = pendingTarget;
  const done = () => {
    video.removeEventListener("seeked", done);
    seekInFlight = false;
    if (pendingTarget !== video.currentTime) scrubTo(pendingTarget);
  };
  video.addEventListener("seeked", done);
  setTimeout(() => { if (seekInFlight) done(); }, 1500);
}
```

Sans ça, un seul passage de scroll peut empiler 50-80+ seeks superposés et
la vidéo saccade visiblement en essayant de tous les servir.

## Amorcer la vidéo avant le premier seek

iOS Safari peut ignorer les seeks `currentTime` sur une `<video>` qui n'a
jamais joué, la laissant figée sur la frame 0 pendant que tout le reste
(texte de chapitre, progression) bouge. Amorcer silencieusement avant le
premier vrai scrub :

```js
video.play().then(() => video.pause()).catch(() => {});
```

## Éviter d'atterrir pile sur `duration`

Scruber exactement sur la valeur de fin peut déclencher un comportement de
boucle/redémarrage sur certains moteurs, "superposant" visiblement la frame 0
par-dessus la dernière. Garder un petit epsilon : `video.duration - 0.15`.

## Préchargement prioritaire des frames (chemin canvas/frames)

Voir `engine-recipes.md` — combiner un fetch prioritaire (`fetchPriority:
"high"`) pour les premières frames de la section au-dessus du pli, et un
chargement différé (`requestIdleCallback`) pour tout le reste.

## Hauteur de viewport sur mobile Safari (`100vh` n'est pas sûr)

Une section pleine-page `100vh` peut laisser une bande visible blanche/noire
car `100vh` ne tient pas compte de l'apparition/disparition de la barre
d'adresse. `100dvh` est plus proche mais peut rester en retard d'une frame
pile au moment où la vidéo démarre et où la barre se réduit. Triple fallback,
le dernier gagne :

```css
.full-bleed-section {
  height: 100vh;
  height: 100dvh;
  height: 100lvh; /* taille barre d'adresse totalement réduite */
}
```

## Verrouiller le scroll pour une section "doit être regardée"

Ne jamais utiliser un `IntersectionObserver` à seuil proche de 1.0 comme
déclencheur — un scroll rapide (flick molette/trackpad) peut sauter
directement par-dessus une intersection presque pleine sans jamais la
franchir. Utiliser une vérification géométrique directe, avec une bande de
tolérance généreuse (60-200px), comparée au rect de la section à chaque tick
de scroll. Ajouter un fallback idle-scroll (debounce ~250ms) qui force le
déclenchement si la section est encore substantiellement visible (≥60%) une
fois le scroll stabilisé, même si la bande de tolérance a aussi été sautée.

Verrouiller avec la technique `position: fixed` sur le body, pas
`overflow: hidden` seul :

```js
const scrollY = window.scrollY;
document.body.style.position = "fixed";
document.body.style.top = `-${scrollY}px`;
// au déverrouillage :
document.body.style.position = "";
window.scrollTo(0, scrollY);
```

`overflow: hidden` seul est insuffisant : le scroll par inertie
trackpad/tactile est parfois piloté par le compositeur du navigateur plutôt
que par des événements `wheel`/`touchmove` — il peut continuer à dériver la
position de scroll pendant quelques dizaines de pixels après l'engagement du
verrou. `position: fixed` retire complètement le viewport de tout contexte
scrollable, ce que l'inertie ne peut pas affecter.

Prévoir plusieurs chemins de déverrouillage (l'événement `ended`, un timeout
calculé sur `duration`, un rejet de `play()` avec grâce) pour qu'un
utilisateur ne reste jamais bloqué si la lecture échoue ou est bloquée par le
navigateur.

## Accessibilité des reveals de texte splitté

Tout effet qui split `textContent` en `<span>`s par mot/caractère pour un
reveal échelonné doit fixer `aria-label` sur le **conteneur** avec le texte
complet **avant** de le splitter — sinon un lecteur d'écran reçoit des
fragments au lieu de la phrase.

## `prefers-reduced-motion` — toujours l'échappatoire

Chaque effet scroll-animé (décodage frame par frame, entrées GSAP, marquee,
reveal circulaire, scroll-lock) a besoin d'une branche
`prefers-reduced-motion: reduce` qui saute directement à l'état final
statique — pas de décodage frame par frame, pas de scroll-lock (verrouiller
le scroll derrière une vidéo qui ne va pas s'autoplayer sous reduced-motion
piège l'utilisateur). Pour une section vidéo-scrubbée spécifiquement, bascule
vers une `<video>` autoplay+loop classique (ou une image poster statique)
sous cette media query.

## Précharger la vidéo au-dessus du pli tôt

Si le chemin mobile utilise une `<video>` native pour un hero/première
section, ajouter un hint de préchargement scopé mobile dans `<head>` pour que
le navigateur commence le fetch avant même l'exécution du JS :

```html
<link rel="preload" as="video" href="hero.mp4" media="(max-width: 768px)">
```
