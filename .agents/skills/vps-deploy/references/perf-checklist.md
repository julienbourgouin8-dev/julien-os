# Checklist audit performance (PageSpeed Insights) — pièges réels rencontrés

Distillé de l'audit CréA'deline (2026-09-22) : score mobile 58 → 91/100, desktop → 99/100, poids
de page 27 Mo → 8 Mo. Chaque point ci-dessous a été un vrai problème mesuré, pas une supposition.

## Méthode

1. **Toujours obtenir le rapport PSI détaillé** (tableaux "Évitez d'énormes charges utiles de
   réseau" avec chaque URL et sa taille, "Réduisez les ressources JS inutilisées" avec les noms de
   chunks) — pas juste le score ou les métriques agrégées (LCP/TBT/CLS). Sur CréA'deline, 3 tours
   de correctifs basés sur le score seul ont à peine bougé le chiffre (58→59→60, et le TBT a même
   empiré à un moment) ; c'est le rapport détaillé qui a révélé que 96% du poids de page venait de
   5 fichiers vidéo, invisible depuis le score.
2. Re-mesurer après chaque tour de correctifs. Un score qui stagne ou empire après un correctif
   "logiquement correct" est le signal qu'un autre poste domine et masque l'effet du correctif —
   ne pas s'arrêter là, creuser le rapport détaillé du nouveau run.
3. Vérifier visuellement (Chrome DevTools MCP ou équivalent) après chaque changement, sur mobile
   ET desktop, console sans erreur — ne jamais annoncer "corrigé" sans regarder.
4. ⚠️ Avant de lancer un serveur local de vérification (`npm run start`) sur un port standard
   (3000, 8080...), vérifier `lsof -i :PORT` — un vieux process de dev de l'utilisateur peut déjà
   l'occuper, et un `curl` "ça répond 200" peut silencieusement taper sur ce vieux process au lieu
   du nouveau build. Utiliser un port dédié (`PORT=3099 npm run start`) en cas de doute, jamais
   `pkill` le process de l'utilisateur.

## Pièges concrets, par ordre d'impact observé

### 1. Vidéos/médias lourds — vérifier en premier, presque toujours le plus gros poste
Des vidéos produit "360°" en 1920×1080 à 5-12 Mbps pour un simple clip muet en boucle affiché à
quelques centaines de pixels de large. `ffprobe` pour voir résolution/bitrate réels, comparer à la
taille d'affichage CSS réelle. Recompresser avec `ffmpeg` (H.264, largeur max = 2x la largeur
d'affichage CSS max, CRF ~26, `-an` si la vidéo est toujours muette, `-movflags +faststart`) —
vérifier la qualité en extrayant une frame avant/après (`ffmpeg -vf select=eq(n\,N)`) plutôt que de
supposer. Gains de 60-80% observés sans perte visible.

### 2. `<video preload="auto">` déclenché au montage, pas à la visibilité
Si plusieurs vidéos sont empilées (ex. version mobile "un par catégorie"), `preload="auto"` sur
toutes les télécharge en entier dès le rendu, même hors écran. Passer à `preload="none"` et
piloter play/pause par `IntersectionObserver` — le navigateur charge alors au moment du `.play()`,
peu importe la valeur de `preload`.

### 3. `next/dynamic({ ssr: false })` seul ne suffit PAS à différer le coût CPU
Sort bien le JS du bundle réseau critique, mais l'`import()` se déclenche dès que React atteint le
rendu du composant — juste après l'hydratation, quasi immédiatement, peu importe la position de
scroll. Pour une librairie lourde en initialisation (carte WebGL type MapLibre/Mapbox, éditeur
riche, etc.), ça peut même faire **empirer** le TBT une fois le réseau allégé par ailleurs (plus
rien pour masquer le coût CPU qui se concentre alors dans la fenêtre de mesure FCP→interactif).
Fix : gater le montage derrière un vrai `IntersectionObserver` (`rootMargin` ~400px) sur un
sentinel, ne monter le composant dynamique qu'au déclenchement.

### 4. Image cachée en CSS (`display:none`/`hidden`) mais téléchargée quand même
Le pré-parseur HTML du navigateur télécharge les `<img src>` AVANT que le CSS soit appliqué — un
`hidden sm:block` ne l'empêche pas. Deux cas rencontrés :
- Une image `<img>` brute (pas `next/image`) dans un bloc caché sur mobile : fix = `loading="lazy"`
  (respecte, lui, la visibilité CSS réelle via IntersectionObserver interne au navigateur).
- Deux variantes `next/image` (mobile + desktop, art direction responsive) **toutes les deux
  marquées `priority`** : chacune force son propre preload, donc les DEUX se téléchargent sur
  CHAQUE appareil, peu importe laquelle est visible. Pas de fix simple sans risquer de dégrader le
  LCP de la variante réellement affichée (retirer `priority` la fait passer en lazy-load, plus
  lente à démarrer) — la vraie solution propre est un `<picture>` natif avec `<source media=...>`
  par breakpoint (le navigateur ne fetch alors QUE la source qui matche), mais c'est un chantier à
  part si le markup est déjà très calé (positionnement pixel-perfect autour de l'image).

### 5. Format image legacy (PNG/JPEG) sur une image lourde
`next.config.ts` → `images.formats: ["image/avif", "image/webp"]` (AVIF avant WebP, ~20-30% plus
compact sur les photos, négociation automatique via header `Accept`, fallback WebP transparent).

### 6. Axes de police variable jamais utilisés
`next/font/google` avec `axes: [...]` (ex. `opsz`, `SOFT`, `WONK` sur Fraunces) gonfle le fichier
de police si le CSS ne fait jamais varier ces axes (`grep -rn "font-variation-settings"` pour
vérifier). Retirer les axes inutilisés, garder seulement `wght`/`style` si réellement utilisés.

### 7. SDK analytics/tracking importé statiquement même sans consentement
Un import top-level (`import posthog from "posthog-js"`) pull toute la lib dans le bundle initial
même si l'init réelle est gardée par un `if (consented)`. Remplacer par un `import()` dynamique
déclenché seulement quand le consentement est effectivement donné — élimine la lib entière (et ses
dépendances, ex. `core-js`) du bundle envoyé à tout visiteur qui n'a pas encore consenti.

### 8. "JS obsolète"/polyfills : vérifier si c'est vraiment notre code avant de chasser
`Array.prototype.at`, `Object.hasOwn`, etc. signalés comme polyfills inutiles — vérifier D'ABORD
d'où ça vient avant de changer le `browserslist` du projet : `grep -l "core-js" .next/static/chunks/*.js`
puis regarder le contenu du chunk trouvé. Sur CréA'deline, ce chunk particulier faisait partie du
**runtime interne de Next.js lui-même** (routing/hydratation du framework), pas de notre code —
non éliminable depuis l'app, présent dans la quasi-totalité des sites Next.js. Un `browserslist`
explicite reste une bonne pratique (cible réellement les navigateurs supportés), mais si la cible
choisie est trop ancienne (ex. `safari >= 12` ne couvre pas `Array.prototype.at`, qui demande
Safari 15.4+), elle peut au contraire FORCER la réintroduction de polyfills pour du code
applicatif qui n'en avait pas besoin — vérifier la version minimale réelle requise par chaque
feature ES ciblée avant de figer les seuils.

### 9. Cache-Control par défaut de Next.js sur les pages statiques : dangereux après un redéploiement fréquent
Les pages statiquement pré-rendues (`x-nextjs-prerender: 1`) partent par défaut avec
`Cache-Control: s-maxage=31536000` (un an) et **aucune directive `max-age`/`private` explicite pour
le navigateur lui-même**. Si le site est redéployé plusieurs fois d'affilée (courant en début de
projet), le HTML en cache côté navigateur peut continuer à référencer d'anciens fichiers JS/CSS
(hashés, donc supprimés au build suivant) — symptôme observé en vrai : rechargements de page
aléatoires ("ça charge, puis ça recharge tout seul", mécanisme de récupération intégré à Next.js
sur une erreur de chargement de chunk) et comportement incohérent d'une visite à l'autre selon
quelle version de HTML était servie depuis le cache. Fix dans `next.config.ts` (`headers()`) :
forcer `Cache-Control: no-cache, must-revalidate` sur toutes les pages HTML, **en excluant
explicitement `/_next/static/` et `/_next/image`** (ces fichiers sont content-hashés, sûrs à cacher
indéfiniment, Next.js le fait déjà correctement) :
```ts
{
  source: "/((?!_next/static|_next/image).*)",
  headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
}
```
⚠️ **Cette règle attrape aussi les fichiers du dossier `public/`** (vidéos, images — pas de hash
dans leur nom, le pattern d'exclusion ne vise que `_next/`). Conséquence réelle observée : forcer
`no-cache` sur des fichiers vidéo casse leur lecture sur Safari iOS après un rechargement de page
(bug WebKit documenté : la lecture échoue quand la réponse vient d'une revalidation conditionnelle/
304 au lieu d'un téléchargement complet — symptôme : vidéo qui marche au premier chargement, plus du
tout après un simple reload). Ajouter une règle plus spécifique, placée APRÈS (Next.js applique la
dernière correspondance pour une même clé d'en-tête), qui reprend la main sur `Cache-Control` pour
les dossiers publics connus :
```ts
{
  source: "/(brand|products|uploads)/:path*",  // adapter à la structure réelle du projet
  headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
}
```
À faire dès la mise en place initiale d'un nouveau site sur ce VPS, pas seulement après avoir
constaté le problème — le coût (une revalidation ETag par requête, ~quelques ms) est négligeable.

### 10. Trop de `<video>` montées simultanément sur mobile — limite de décodage concurrent
Si un composant a une version "desktop" (ex. panneau au survol) ET une version "mobile" (ex. liste
empilée) avec CHACUNE ses propres éléments `<video>`, et que les deux sont montées dans le DOM en
permanence (l'une juste cachée en CSS `hidden sm:block` plutôt que non rendue), le total de
`<video src>` actives peut dépasser ce que Safari iOS gère de façon fiable en simultané — symptôme
observé : vidéos qui échouent à charger de façon aléatoire (~1 fois sur 2), pas reproductible de
façon fiable en émulation Chrome DevTools desktop. Fix : monter conditionnellement la version non
pertinente via un état JS (`matchMedia` sur le breakpoint, pas juste une classe CSS `hidden`) plutôt
que de compter sur le CSS seul pour "désactiver" des éléments média.

### 11. Ne pas toucher aux animations "non composited" sans juger l'impact réel
Lighthouse liste `filter`/`clip-path` animés comme "non composited" (risque théorique de CLS/jank).
Si le CLS mesuré est déjà à 0.000 et que l'animation est un effet de design délibéré et documenté
(pas un oubli), ne pas la sacrifier pour un point de diagnostic sans conséquence mesurée — respecter
la consigne "préserver le design existant" plutôt que d'optimiser un score au prix du rendu voulu.
