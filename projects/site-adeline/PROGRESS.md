# Site CréA'deline — journal de session (dernière mise à jour 2026-09-16)

Contexte à charger avant de reprendre : ce fichier + `TODO.md` (plan
e-commerce brique par brique, toujours valable pour les phases futures) +
le code. **Deux apps Next.js séparées depuis le 2026-08-13** (détail dans
la section "Backend produits" plus bas) : le site public dans `app/`
(`npm run dev` → http://localhost:3000) et l'admin dans `admin/`
(`npm run dev` → http://localhost:3001, port différent car process séparé).

## Où on en est

**Site en ligne, v1 livrée.** → **https://creadeline.vercel.app**

Site vitrine Next.js 16 (App Router, Tailwind v4, Turbopack) pour la marque de
couture faite main **CréA'deline** (Adeline, **Charente** — pas
Charente-Maritime, corrigé cette session, voir plus bas). Contenu et photos
viennent du scraping de sa page Facebook (`facebook.com/deline1001`) + de
photos retouchées qu'Adeline a générées elle-même.

La page (`app/page.tsx`) a été réduite à 4 sections, toutes terminées et
validées par Julien :

1. **Hero** (`id="hero"`) — wordmark écrit à la main, nav, CTA.
2. **Vitrine animée** (`id="vitrine"`, `components/VitrineArc.tsx`) — 5
   pièces posées sur l'image composite, survol → la pièce vole au centre de
   l'écran, joue une vraie vidéo de rotation 360°, affiche catégorie/nom/CTA.
3. **Marchés** (`id="marches"`, `components/Marches.tsx`) — vraie carte
   interactive (MapLibre GL) + liste des marchés/salons réels où Adeline a
   exposé.
4. **Contact** (`components/ContactSection.tsx`) — formulaire riche
   (type de pièce, tissu, nom/email/message) qui ouvre un `mailto:`, + liens
   tel/Facebook/Instagram réels.

Tout ce qui existait avant (Sélection/FeaturePiece, Fabrics, HowToOrder,
Atelier séparé, Reveal.tsx, StitchUnderline.tsx) a été **supprimé** sur
demande explicite de Julien — plus dans le code, ne pas chercher à le
réintégrer sans qu'il le redemande.

## Stack & structure actuelle

```
projects/site-adeline/
├── TODO.md                      # plan complet e-commerce (phases futures)
├── PROGRESS.md                   # ce fichier
├── assets/facebook/
│   ├── raw/, selected/, tri/     # photos scrapées, historique de tri
│   └── taxonomie-produits.md     # catégories réelles de produits (Sacs,
│                                  # Sacoches ordinateur, Pochettes, Trousses,
│                                  # Accessoires du quotidien, Pièces cadeaux)
│                                  # — construite en lisant ~90 légendes FB
└── app/
    ├── app/
    │   ├── page.tsx               # home : Hero + Vitrine + Marchés + Contact
    │   ├── layout.tsx
    │   ├── globals.css            # tokens couleur, animations, CSS carte/popup
    │   ├── icon.png                # favicon moderne (logo machine à coudre)
    │   └── favicon.ico             # favicon legacy multi-résolution
    ├── components/
    │   ├── VitrineArc.tsx          # section 2 — voir détail plus bas
    │   ├── Marches.tsx              # section 3 — carte + liste, voir détail
    │   ├── ContactSection.tsx       # section 4 — formulaire + liens
    │   └── WriteOnHeading.tsx       # effet "écriture" réutilisable au scroll
    │       (VitrineArcInPlace.tsx, MaskedVideo.tsx = essais abandonnés,
    │       encore dans le repo mais plus utilisés nulle part)
    └── public/
        ├── brand/                  # hero, logo, logo-mark.png (favicon source)
        ├── products/videos/        # 5 vidéos rotation 360° (voir fix faststart)
        └── maplibre-gl-worker.js, maplibre-gl-shared.mjs  # voir fix MapLibre
```

## Design system (inchangé, toujours valable)

**Typographie** : `font-script` = Caveat (wordmark), `font-display` =
Fraunces (titres/italique), `font-body` = Jost (corps de texte).

**Couleurs** (`globals.css`, tokens `@theme inline`) : `--color-paper`
`#f3f3ee` (mesuré sur un screenshot réel, pas le fichier source),
`--color-ink`, `--color-teal`, `--color-rust`, `--color-mustard`,
`--color-denim` (couleur de marque, échantillonnée sur le bleu du sac hero).

⚠️ Tailwind v4 : ne jamais utiliser `bg-[--color-x]` (génère du CSS
invalide) — utiliser les classes token (`bg-denim`) ou du style inline
`var(--color-x)`.

## Section 2 — Vitrine animée (`VitrineArc.tsx`)

Architecture : **un seul panneau flottant partagé** (pas un par pièce) —
sinon changer de pièce rejouait l'animation de sortie de l'ancienne EN MÊME
TEMPS que l'entrée de la nouvelle ("double fenêtre"). Les 5 `<video>` sont
**toujours montées** (jamais démontées/remontées) dès le premier rendu et
crossfadent par opacité — remonter via `key` provoquait un flash de
rechargement à chaque changement.

Bugs réels corrigés cette session (pas des trucs cosmétiques) :

- **Vidéo qui ne se lançait jamais au tout premier survol de la session** :
  les `<video>` n'étaient montées que sous `{active && (...)}`, donc au
  premier `open(i)` (avant que `activeIndex` soit défini) `videoRefs.current[i]`
  était encore `null` → `.play()` silencieusement no-op. Fix : les vidéos
  sont montées inconditionnellement.
- **Trou mort entre deux hotspots** (zone entre pochette et trousse ne
  déclenchait rien) : bug de calcul dans `hitboxStyle()` (utilisait
  `cur.left` au lieu de `cur.left + cur.width` pour le bord droit). Corrigé,
  et les hitbox de survol se touchent maintenant bord à bord sur toute la
  largeur, avec une bande verticale généreuse commune (plus sensible qu'avant).
- **Vidéos très lentes à démarrer / semblaient ne jamais charger** : les
  5 fichiers `.mp4` avaient le `moov` atom (index nécessaire au décodage) à
  la fin du fichier au lieu du début → le navigateur devait télécharger tout
  le fichier (10-15 Mo) avant de pouvoir afficher une seule frame. Remuxés
  avec `ffmpeg -movflags +faststart` (sans réencodage), fichiers renommés
  en `*-v2.mp4`/`*-v3.mp4` pour casser le cache navigateur.
- **Panneau qui restait ouvert trop longtemps au scroll** : le filet de
  sécurité attendait que la pièce d'origine sorte ENTIÈREMENT du viewport
  (marge 15%) — pour une section plus haute que l'écran ça pouvait demander
  une pleine hauteur de scroll. Remplacé par un seuil de **delta de scroll**
  (80px depuis l'ouverture, peu importe la position géométrique) — ferme
  presque immédiatement dès qu'on scrolle.

## Section 3 — Marchés (`Marches.tsx`)

**Vraie carte interactive**, pas une image statique : MapLibre GL JS (WebGL,
vecteur), style CARTO Positron (gratuit, sans clé API,
`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`). Pins
cliquables synchronisés avec la liste de gauche, popup stylé (image + nom +
lieu), `flyTo` au clic/survol d'un item de la liste.

⚠️ **Bug MapLibre + Turbopack, non-trivial, à retenir si ça revient** :
MapLibre charge son worker de parsing de tuiles via `import.meta.url` —
sous Turbopack, ce chemin résout vers le chunk bundlé (`/_next/static/...`)
au lieu du fichier réel du package, donc le Worker échoue silencieusement à
se charger (aucune erreur console visible) et **aucune tuile n'est jamais
demandée**, fond de carte vide. Fix : `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
et son import relatif `maplibre-gl-shared.mjs` copiés en assets statiques
dans `public/`, puis `setWorkerUrl("/maplibre-gl-worker.js")` appelé avant
toute création de `Map`. Si `npm update maplibre-gl` un jour, re-copier ces
deux fichiers depuis le nouveau `node_modules/maplibre-gl/dist/`.

**Données réelles**, pas inventées : les 4 marchés/salons affichés
(Chasseneuil-sur-Bonnieure, Balzac, Gond-Pontouvre, Soyaux — tous en
Charente/16, autour d'Angoulême) viennent de la recherche interne de la page
Facebook d'Adeline (bouton "Rechercher dans le profil", chercher
"marché"/"salon"/"expo" — beaucoup plus rapide que scroller manuellement).
Noms d'événements repris de ses propres légendes ("Présente aujourd'hui
au...", "Mon expo à..."). **Pas de date exacte affichée** : Facebook
obfusque les horodatages contre le scraping (texte mélangé avec des
caractères combinants unicode), donc plutôt que d'inventer un jour/mois, le
badge est une icône de lieu. Un post mentionnait "Lunesse" mais ça ne
géocode vers rien de plausible (résultat le plus proche : un village breton
à 400km) — écarté plutôt que risquer un pin mal placé.

**Correction factuelle en cascade** : le footer du site affichait "Charente-
Maritime" sans source identifiable nulle part dans le repo. Les 4 marchés
confirmés étant tous en Charente (16), corrigé en conséquence
(`ContactSection.tsx`, dernière ligne du footer).

Villes géocodées via `api-adresse.data.gouv.fr` (API officielle française,
gratuite, sans clé) — méthode réutilisable si d'autres lieux réels
s'ajoutent.

## Contact (`ContactSection.tsx`)

Formulaire riche : pills type de pièce (centrées, une seule ligne sur
desktop via `md:flex-nowrap`, wrap sur mobile — 6 pills ne rentrent pas sur
une ligne dans une colonne de 576px, la section fait donc `max-w-2xl` au
lieu de `max-w-xl`), select tissu, Nom/Email/Message. Soumission via
`mailto:` (pas de backend).

`CONTACT_EMAIL` est **vide volontairement** — l'adresse réelle d'Adeline
n'est pas confirmée (carte de visite coupée sur "deline1001@y..."). Ne pas
deviner. La renseigner dans `ContactSection.tsx` dès que Julien la donne.

## Favicon

Remplacé le favicon par défaut de Next.js (triangle) par le vrai logo
d'Adeline (petite machine à coudre silhouette + cœur découpé, visible sur sa
carte de visite `public/brand/logo.jpg`). Source : capture fournie par
Julien, fond blanc rendu transparent + ombre grise supprimée (script Python
one-off, pas conservé) → `public/brand/logo-mark.png`, puis généré
`app/icon.png` (512×512, convention Next.js App Router) et `app/favicon.ico`
(multi-résolution 16/32/48/64, compat navigateurs anciens).

## Déploiement

**Vercel, compte gratuit de Julien.** Authentifié via une session navigateur
déjà connectée (aucun mot de passe saisi). Projet renommé `app` → `creadeline`
pour une URL propre. **Deployment Protection désactivée** (`ssoProtection`,
activée par défaut sur les sous-domaines `.vercel.app` — sinon les visiteurs
tombent sur un mur de login Vercel au lieu du site, inutilisable pour un
site public). Détail complet dans `decisions/log.md`.

Pour redéployer après un changement : `cd app && npx vercel --prod --yes`.

## Bugs d'environnement récurrents cette session (pour gagner du temps la
prochaine fois)

- **État Turbopack/Fast Refresh corrompu** : après beaucoup d'éditions
  successives, le dev server s'est retrouvé plusieurs fois dans un état où
  il servait des erreurs sur du code qui n'existait même plus dans les
  fichiers actuels (`ReferenceError` sur des composants supprimés). Symptôme
  côté utilisateur : "l'image a disparu", "le site bug beaucoup". Fix
  systématique : `lsof -ti :3000 | xargs kill -9 && rm -rf .next && npm run dev`.
  Ne pas perdre de temps à débugger le code avant d'avoir éliminé cette
  cause avec un restart propre.
- **Cache navigateur agressif** : images, vidéos ET chunks JS peuvent rester
  servis depuis le cache HTTP du navigateur même après un vrai changement de
  fichier sur disque. Vérifier côté serveur d'abord (`curl` + hash MD5)
  avant de croire qu'un bug persiste. Pour forcer : renommer le fichier
  (cache-busting), ou tester en navigation privée.
- **Navigation par ancre seule (`#section`) ne recharge pas la page** dans
  Playwright si on est déjà sur le même domaine — juste un scroll interne,
  le JS ne se re-télécharge PAS. Pour tester un vrai changement de code,
  naviguer vers une URL différente (query param cache-bust type `?t=1`) puis
  scroller manuellement, pas juste changer le hash.
- **Onglets Playwright partagés entre sessions/agents** : un agent en
  arrière-plan utilisant le même navigateur peut voler le focus de l'onglet
  "current" en plein milieu d'une vérification. Si un `browser_evaluate`
  renvoie un résultat qui n'a aucun sens, vérifier `window.location.href`
  avant de chercher un bug côté site — ouvrir un nouvel onglet dédié
  (`browser_tabs action:new`) évite le conflit.

## Backend produits — Supabase + admin séparé + boutique (session 2026-08-13)

Chantier repris de `TODO.md` §4 ("Admin produit façon Shopify"). Décisions
prises avec Julien pendant la session :
- Shopify écarté (loyer mensuel, zéro apprentissage), Payload CMS (admin
  auto-généré) écarté aussi — admin codé nous-mêmes avec Supabase, cohérent
  avec l'objectif "apprendre chaque brique".
- Un seul dashboard visible pour Julien, mais chaque fonctionnalité peut
  utiliser l'outil le plus adapté en dessous (pas d'obligation de tout faire
  "avec Supabase" par principe) — retenu pour la future Phase E analytics
  (voir `TODO.md` §2).
- **Admin = application séparée**, pas des routes `/admin` dans le site
  vitrine. Premier essai (admin sous `/admin` du même projet Next.js) posé
  puis explicitement corrigé par Julien en cours de session ("je voulais
  une app à part") — voir `feedback_creadeline_admin_separate_app` dans la
  mémoire long terme pour ne pas refaire cette erreur.

### Architecture finale : deux apps Next.js, une base Supabase

```
projects/site-adeline/
├── app/     → site public (creadeline.vercel.app) : vitrine + /boutique
│             (lecture Supabase seule, aucune trace d'admin/login)
└── admin/   → app admin séparée (nouveau projet, son propre déploiement) :
              login, tableau de bord, CRUD produits — RACINE de cette app
              (pas de préfixe /admin, ex. /products pas /admin/products)
```

Les deux projets partagent le **même projet Supabase** (mêmes
`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` dans leurs `.env.local` respectifs,
dupliquées, pas de fichier partagé entre les deux repos). `admin/` a la
version complète de `lib/supabase/products.ts` (CRUD + upload) ; `app/` n'a
que les deux fonctions de lecture utilisées par `/boutique`
(`getActiveProductsByCategory`, `getProductBySlug`) — le reste retiré
plutôt que laissé en code mort. `lib/categories.ts` dupliqué à l'identique
dans les deux (source de vérité = `assets/facebook/taxonomie-produits.md`,
qui elle ne vit que dans `site-adeline/`, pas dans `admin/`).

`proxy.ts` de `admin/` protège **toute l'app sauf `/login`** (avant :
seulement `/admin/**` dans le site public). Design du dashboard (page
d'accueil avec stats réelles — produits publiés/brouillons/stock/alertes,
activité récente, liste "stock à surveiller" — signature visuelle "point de
suture" en bordures pointillées, cohérent avec l'identité "cousu main")
identique des deux côtés de la migration, juste déplacé.

**Setup Supabase de Julien** (fait ensemble en session) : projet créé, clés
récupérées, schéma appliqué (script `pg` temporaire le temps que `psql`
soit dispo, mot de passe DB jamais resté dans un fichier après usage),
compte admin créé et confirmé (lien de confirmation récupéré automatiquement
via `gws` sur `julienbourgouinai@gmail.com`, sans ouvrir l'email
manuellement). Identifiants de connexion : `julienbourgouinai@gmail.com` +
mot de passe généré (à noter dans un gestionnaire de mots de passe, pas
répété ici).

**Vérifié bout en bout en conditions réelles** (`tsc`/`lint` propres sur les
deux projets, test navigateur complet via `claude-in-chrome` avant ET après
la séparation) : connexion admin → ajout d'un produit avec upload photo
réel vers Supabase Storage → apparaît sur le tableau de bord et dans la
liste → visible sur `/boutique/sacs` du site public → fiche produit
correcte (prix, description, CTA mailto). Produit de test supprimé après
vérification.

**Pièges rencontrés et à retenir** :
- Le bouton "Supprimer" utilise `window.confirm()` — bloque complètement
  l'automatisation navigateur (CDP timeout). Sans conséquence en usage
  normal, mais à ne plus déclencher via `claude-in-chrome` dans une session
  future — préférer une suppression directe en base (API REST Supabase avec
  le token de session) pour tout nettoyage de données de test.
- **Poser explicitement la question "site séparé ou route dans le site
  existant ?" avant de coder un admin/dashboard**, même quand la demande
  initiale ("un truc comme Shopify") ne le précise pas — Julien avait déjà
  dit "app à part" dès le tout début de la conversation, raté au premier
  passage. Voir mémoire long terme.

**Local** : site public `npm run dev` dans `app/` → :3000. Admin
`npm run dev` dans `admin/` → :3001 (ports différents nécessaires en local
puisque ce sont deux process séparés). **Déploiement** : le site public
reste sur `creadeline.vercel.app` (inchangé). L'admin n'est **pas encore
déployé** — reste à faire : `cd admin && npx vercel --prod` (nouveau projet
Vercel, coller les mêmes variables d'env Supabase), sous-domaine gratuit
Vercel par défaut (ex. `creadeline-admin.vercel.app`) tant qu'aucun nom de
domaine propre n'est acheté.

## Phase E — Analytics PostHog (session 2026-08-13, même jour)

Construite et vérifiée bout en bout juste après la séparation admin/public
ci-dessus, sur demande explicite de Julien ("fait un vrai dashboard avec des
graphiques, connecte le site, ajoute le tracking").

- **Site public** (`app/`) : `posthog-js` + `posthog-js/react`.
  `components/PostHogProvider.tsx` (client) enveloppe tout `app/layout.tsx`,
  capture les `$pageview` manuellement à chaque changement de route (pattern
  officiel App Router — l'autocapture par défaut de PostHog suppose des
  rechargements complets, ce que le routing client-side de Next ne fait
  jamais). Autocapture des clics activée nativement. Deux événements custom
  en plus (`components/TrackEvent.tsx`, petit composant client isolé monté
  dans les Server Components boutique) : `category_viewed` sur
  `/boutique/[category]`, `product_viewed` sur `/boutique/[category]/[slug]`.
- **Admin** (`admin/`) : `lib/posthog.ts` interroge l'API Query de PostHog en
  HogQL avec la clé personnelle (jamais `NEXT_PUBLIC_`, server-only) —
  `getVisitsByDay`, `getTopPages`, `getRecentVisitorCount`,
  `getTotalProductViews`. Nouvelle section "Visiteurs" en bas du tableau de
  bord : 3 stat tiles + `components/LineChart.tsx` (visiteurs/14j, SVG à la
  main, crosshair + tooltip au survol) + `components/BarChart.tsx` (pages
  les plus vues/30j). Design suivant le skill `dataviz` du projet :
  - Palette validée avec `scripts/validate_palette.js` — **denim et teal
    (les deux couleurs "froides" de la marque) échouent le seuil de chroma
    en usage catégoriel** (trop désaturées, illisibles côte à côte). Rust +
    mustard passent tous les checks mais sont déjà réservés comme couleurs
    de statut ailleurs dans ce même dashboard (rupture de stock / stock
    faible) — les réutiliser pour des séries de graphique aurait créé une
    confusion sémantique. Solution : tous les graphiques de cette session
    sont **mono-série** (une ligne, un jeu de barres même teinte) — denim
    utilisé comme identité de marque plutôt que comme code catégoriel,
    aucun besoin de validation CVD pour une série unique. À revisiter si un
    futur graphique a besoin de 2+ séries distinctes.
  - Placeholder propre ("pas encore connecté") plutôt qu'un crash si les
    clés PostHog manquent — `isPostHogConfigured()` dans `lib/posthog.ts`.

**Setup PostHog de Julien** : compte créé (région **EU**), projet
`247625`. Deux clés différentes, à ne pas confondre : la **Project API
Key** (`phc_...`, publique, dans `app/.env.local`) sert à *envoyer* les
événements depuis le navigateur ; la **clé personnelle** (`phx_...`, scope
lecture seule "Query", dans `admin/.env.local`) sert à *lire* les données
pour dessiner les graphiques. Host différent selon l'usage : `eu.i.posthog.com`
(avec le `.i.`, endpoint d'ingestion) pour le site public,
`eu.posthog.com` (sans le `.i.`, API principale) pour l'admin qui
interroge — confondre les deux hosts fait échouer l'API Query.

**Vérifié bout en bout avec de vraies données** (`claude-in-chrome`) :
navigation sur le site public → événements confirmés reçus par PostHog
(requêtes réseau `POST .../e/` → 200) → visibles quelques secondes après
dans le dashboard admin (1 visiteur en direct, graphique ligne + barres
avec les bonnes pages). Un vrai bug attrapé et corrigé pendant cette
vérification : `LineChart.tsx` générait des clés React dupliquées sur les
graduations de l'axe Y quand le maximum de la série était petit (ex. 1
visiteur → graduations arrondies 0,0,0,0,1) — dédupliqué avec `Set`.

### Refonte visuelle du dashboard (même session, juste après)

Julien a montré une capture d'écran d'un dashboard SaaS générique (cartes
blanches élevées, chiffres en gras, badges de variation ▲▼, donut, barres
avec une colonne surlignée + étiquette flottante) en demandant "un vrai
dashboard stylé... avec tous les skills de design que t'as et cet exemple".
Reconstruit `app/(protected)/page.tsx` en suivant cette direction :

- **Cartes** : passage du liseré pointillé ("point de suture") à des cartes
  blanches élevées (`shadow` + `border-ink/[0.06]` + `rounded-2xl`) — le
  motif pointillé reste seulement comme séparateur discret entre sections,
  plus comme habillage de carte dominant.
- **Chiffres des stat tiles** : passage de Fraunces italique à **Jost gras**
  — conforme au skill `dataviz` ("stat tile value : Sans semibold, jamais
  une display/serif — lu comme décoration hors-marque"), et ça correspond
  aussi à la référence de Julien. Les titres de section gardent Fraunces
  italique (identité de marque préservée là où le skill ne s'y oppose pas).
- **Badges de variation (▲/▼ vs période précédente)** : uniquement là où une
  vraie comparaison existe (visiteurs 7j vs 7j précédents, vues produits 30j
  vs 30j précédents, via `getTotalProductViewsBetween` dans `lib/posthog.ts`)
  — **pas de delta inventé** sur les stats produits (publiés/stock), qui
  n'ont pas d'historique comparable dans Supabase.
- **`components/DonutChart.tsx`** (nouveau) : répartition des vues par
  catégorie boutique — cas légitime de donut selon le skill `dataviz`
  ("part-to-whole à l'œil, ≤6 segments" — jamais pour comparer des valeurs
  proches). Nécessitait une **vraie palette catégorielle à 6 teintes** :
  denim/teal bruts de la marque échouent le seuil de chroma du validateur
  (`scripts/validate_palette.js`) en usage catégoriel — rust/mustard
  passent mais sont déjà réservés comme couleurs de statut ailleurs dans ce
  dashboard (rupture/stock faible), les réutiliser en séries de graphique
  aurait créé une confusion. Palette finale validée (tous checks PASS) dans
  `lib/chart-colors.ts` : variantes plus saturées de denim/teal + rust/
  mustard réels + 2 teintes ajoutées (plum, framboise), ordre fixe mappé
  1:1 sur `lib/categories.ts`.
- **`components/TimeBarChart.tsx`** (nouveau, remplace `LineChart.tsx` sur
  le dashboard — `LineChart.tsx` supprimé, plus aucun import après le
  remplacement) : colonnes verticales par jour, la plus haute (ou celle survolée) en pleine
  couleur, les autres tramées, étiquette flottante façon référence, avec
  gridlines/axe Y ajoutés après coup (absents du premier jet, la référence
  en a). Bug de mise en page trouvé et corrigé à la vérification visuelle :
  l'étiquette flottante chevauchait le sous-titre de la carte quand la
  colonne surlignée était la dernière de la série — position recalée en
  `clamp(12%, 88%)` + sous-titre déplacé sous le titre plutôt qu'aligné à
  droite dessus.

Vérifié visuellement via `claude-in-chrome` après coup (connexion réelle,
scroll complet, zoom sur l'indicateur d'erreurs Next.js pour confirmer 0
issue) — pas juste "ça compile".

**Étendu ensuite à tout `admin/`** (pas juste le dashboard) sur la demande
"fais le plus moderne" : `AdminSidebar.tsx` refaite (icônes SVG dashboard/
produits/déconnexion, panneau blanc élevé avec ombre au lieu du liseré
pointillé, pastille active pleine couleur denim au lieu d'un fond teinté),
`app/login/page.tsx` (fond dégradé radial denim très léger, carte élevée,
inputs "remplis" avec anneau au focus plutôt que bordure), `products/page.tsx`
(tableau dans une carte blanche, pastilles de statut incluant désormais
"Archivé" en rust — oubliée dans la première version), `ProductForm.tsx`
(mêmes inputs "remplis", formulaire dans une carte élevée). Un vrai bug
signalé par Julien pendant cette passe ("le site est bloqué en vieux html")
était en fait le bug Turbopack/Fast Refresh déjà documenté plus haut dans ce
fichier (chunks JS servis depuis un cache cassé après beaucoup d'éditions) —
pas un défaut du nouveau design, résolu par le même correctif (kill process +
`rm -rf .next` + restart), rappelé ici car c'est la 2e fois que ça arrive sur
ce projet et que le symptôme ("vieux HTML") ne fait pas immédiatement penser
à un problème de cache de chunks.

### Correction : le "moderne" avait effacé l'identité de marque

Julien, juste après avoir vu le résultat : **"c'est trop moche... ça fait
super vieux, super nul"** — pas à la hauteur du reste du site. En clonant de
trop près sa référence (un dashboard logistique générique — bateaux,
passagers), l'habillage était devenu blanc/gris/bleu passe-partout, sans
aucun rapport avec l'identité CréA'deline (Fraunces, papier crème, palette
chaude) déjà établie sur le site public. Correction sur les 5 fichiers
(`(protected)/page.tsx`, `AdminSidebar.tsx`, `login/page.tsx`,
`products/page.tsx`, `ProductForm.tsx`) : cartes en blanc **chaud**
(`#fffdf8`, pas `#ffffff`) plutôt que blanc froid corporate, chiffres des
stat tiles repassés de Jost gras à **Fraunces italique** (l'identité
typographique du site plutôt que la règle générique du skill `dataviz` —
override assumé, expliqué dans le commentaire du composant `Stitch`), et un
petit repère "point de suture" en signature de carte (tiret de 3px en haut
à gauche, coloré selon le sens de la carte) plutôt que la bordure pointillée
lourde de la toute première version ou son absence totale dans la version
"générique". Structure/fonctionnel conservés intégralement (cartes, donut,
graphique à colonnes, deltas) — seul l'habillage a changé.

**Leçon retenue** (voir aussi la mémoire long terme) : une référence visuelle
apportée par Julien donne la *structure* à suivre (cartes élevées, deltas,
donut, callout flottant), jamais la *peau* — la peau doit toujours rester
celle du site/de la marque en question, jamais celle de l'exemple montré,
même si l'exemple est zéro rapport avec l'univers de la marque.

## Pivot : Supabase → backend 100% local (2026-08-28)

Le projet Supabase gratuit (setup du 13/08) s'est mis en pause pour
inactivité — confirmé au dashboard ("Project is paused"), et surtout
`Database Size 0 GB` : aucune vraie donnée à perdre, catalogue encore vide.
Conséquence concrète : `/boutique/[category]` plantait en 500 sur la vitrine
dès qu'on cliquait sur une création (Julien : "j'arrive pas à accéder à nos
créations").

Plutôt que de juste réactiver le projet, retiré Supabase entièrement (DB +
Auth + Storage) au profit d'un backend qui tourne en local dès maintenant et
qui pourra être hébergé tel quel sur un VPS avec le site plus tard — plus
aucune dépendance à un service externe qui peut se mettre en pause tout seul.

- **DB** : SQLite (`better-sqlite3`) dans un fichier partagé
  `data/creadeline.db`, sibling de `app/` et `admin/` — les deux apps y
  lisent/écrivent directement (WAL activé pour le concurrent read+write).
  Sur un VPS, ce sera juste un volume partagé entre les deux process.
- **Auth admin** : plus de Supabase Auth — un seul compte (env vars
  `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` dans `admin/.env.local`), mot de passe
  hashé au scrypt natif Node, session = cookie signé HMAC (natif aussi,
  zéro dépendance). Hash généré via `node admin/scripts/hash-password.js
  "<mdp>"`.
- **Images produits** : dossier partagé `data/uploads/`, servi par une
  route `/uploads/[...path]` dans chaque app (remplace Supabase Storage).
- `lib/db/products.ts` garde exactement les mêmes fonctions que l'ancien
  `lib/supabase/products.ts` — aucun changement de logique côté pages, juste
  l'implémentation en dessous.
- Vérifié bout en bout avec `scripts/playwright/verify-local-backend.js` :
  login admin → création produit + photo → apparaît sur la vitrine → survit
  à un restart du serveur (preuve que ce n'est pas juste en mémoire).
- `app/supabase/schema.sql` (obsolète) supprimé. Ancienne section "Backend
  produits — Supabase" plus haut dans ce fichier laissée telle quelle pour
  l'historique de la décision initiale.

**ADMIN_EMAIL est un placeholder** (`admin@creadeline.local`) — à changer
dans `admin/.env.local` pour la vraie adresse d'Adeline quand elle sera
confirmée (pas besoin de régénérer le hash, l'email n'est pas dans le hash).

## Pivot : SQLite local → Neon Postgres (2026-09-13)

Le backend "100% local" du 2026-08-28 (SQLite + `data/` partagé sur disque)
bloquait le passage en prod sur Vercel : le filesystem serverless Vercel
n'est pas persistant/partagé entre invocations, donc SQLite y était un
cul-de-sac dès que `/boutique` irait vraiment en ligne avec du trafic.
Migré vers **Neon Postgres** (choisi via Vercel Storage, cf. réponse Julien
"Vercel Postgres (Neon)") :

- `@neondatabase/serverless` (`neon()` tagged-template) remplace
  `better-sqlite3` dans `app/lib/db/` ET `admin/lib/db/` (products, orders,
  audit_log, login_attempts). Connexion en **singleton paresseux**
  (`getSql()` instancié au premier appel, jamais au chargement du module) —
  la version non-paresseuse faisait planter le build Vercel entier
  (`Failed to collect page data for /api/checkout`) parce que Next.js
  exécute le top-level de chaque route au build, y compris les routes qui
  n'ont pas besoin de DB.
- Toutes les requêtes DB sont passées async (`await`) partout où c'était
  synchrone avant — `decrementStock` utilise maintenant `RETURNING id` pour
  détecter une ligne affectée (neon en mode "simple query" n'expose pas
  `rowCount`).
- `DATABASE_URL` (Neon, pooler `us-east-1`) dans `.env.local` des deux apps
  et dans Vercel. `DB_PATH`/SQLite retirés.
- Le seul produit existant migré manuellement (une ligne), scripts
  `admin/scripts/purge-old-orders.js` et `seed-product.js` réécrits pour
  `@neondatabase/serverless` en usage standalone.
- **Toujours en attente** : le stockage des images uploadées reste
  local-filesystem (`data/uploads/`, servi par `/uploads/[...path]`) —
  fonctionne pour l'unique produit actuel (copié à la main dans
  `public/uploads/`), mais tout nouvel upload via l'admin en prod sur
  Vercel échouera au prochain redéploiement (disque non persistant). À
  migrer vers un store persistant (Vercel Blob ou équivalent) avant que
  Julien/Adeline utilise vraiment l'admin pour ajouter des produits.

## Sécurité + conformité RGPD (session 2026-09-13)

Audit de sécurité + conformité française/européenne demandé explicitement
par Julien ("teste tous les fails de sécurité + conformité aux lois
françaises et européennes"). Corrections faites :

- **Headers de sécurité** (`next.config.ts` de `app/` ET `admin/` —
  `admin/` ne les avait pas encore) : CSP (`frame-ancestors 'none'`),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`.
- **Validation réelle des uploads** (`admin/lib/uploads.ts`) : avant, seule
  l'extension du nom de fichier était vérifiée (contournable en renommant
  n'importe quel fichier). Maintenant `detectImageExt(buffer)` lit les
  magic bytes (JPEG/PNG/WEBP/GIF), l'extension est dérivée du contenu réel
  détecté, et l'upload est rejeté si le contenu ne correspond à aucun type
  d'image connu.
- **Dépendances** : `maplibre-gl` 6.3.0→6.9.0 (XSS connu), `sharp` mis à
  jour (`npm audit fix`) — a cassé le worker MapLibre copié à la main
  (`public/maplibre-gl-worker.js`), recopié depuis le nouveau
  `node_modules/maplibre-gl/dist/` (même piège que documenté plus haut dans
  ce fichier, cette fois causé par le audit fix plutôt qu'un update manuel).
- **RGPD/CNIL** :
  - `app/components/CookieConsent.tsx` + `app/lib/consent.ts` : bandeau
    consentement (clé `creadeline_cookie_consent` en localStorage, jamais
    un cookie de tracking directement), deux toggles ("Fonctionnement du
    site" toujours actif, "Mesure d'audience" opt-in réel par défaut
    désactivé), PostHog (`PostHogProvider.tsx`) ne s'initialise que si
    consentement donné. Lien "Gérer les cookies" en pied de page
    (`ContactSection.tsx`) rouvre le bandeau via `resetConsent()`.
  - Pages légales créées (`app/app/{mentions-legales,confidentialite,
    cookies,cgv}/page.tsx`, composant partagé `LegalPage.tsx`) — contiennent
    des **`[À COMPLÉTER]` volontaires** (nom/raison sociale d'Adeline,
    SIRET, statut, adresse, email) : à remplir dès que ces infos sont
    confirmées, jamais inventées.
  - `legal/registre-traitements.md` et `legal/procedure-violation-donnees.md`
    (nouveaux, internes, pas de route publique) — registre des traitements
    Art. 30 et procédure de notification de violation de données.
  - Droit à l'effacement / rétention : `anonymizeOrder` et
    `getOrdersWithPiiOlderThan` dans `lib/db/orders.ts` — email/adresse de
    livraison effacés automatiquement après 3 ans, montant/contenu de
    commande conservés 10 ans (obligation comptable) sans donnée
    identifiante. Documenté dans `confidentialite/page.tsx`.
  - Droit de rétractation (Code conso Art. L221-28) : exemption documentée
    pour les pièces sur mesure/personnalisées dans les CGV.
- **Skill GRC/RGPD évalué** : un repo GitHub externe de skills GRC passé en
  revue pour pertinence marché français — seul le skill RGPD a été retenu
  et installé (le reste, orienté SOC2/US, écarté comme hors-sujet pour ce
  projet).

## Déploiement — accès permanent + pipeline (session 2026-09-13)

- **Accès Vercel permanent** : Julien voulait que Claude n'ait plus besoin
  de login interactif à chaque session. Token API Vercel stocké dans
  `~/.vercel_token` (chmod 600, jamais collé dans la conversation — fichier
  ouvert directement en TextEdit pour que Julien colle lui-même). Toute
  commande Vercel utilise `--token "$(cat ~/.vercel_token)"`.
- **Piège découvert (3 tours de confusion avant diagnostic)** :
  `creadeline.vercel.app` est un **alias manuellement épinglé**
  (`/v4/aliases`), PAS mis à jour automatiquement par `vercel --prod` — un
  nouveau déploiement prod crée une nouvelle URL unique
  (`creadeline-xxxxx-....vercel.app`) mais ne touche pas l'alias existant.
  **Toujours enchaîner après un déploiement :**
  ```
  npx vercel --prod --token "$(cat ~/.vercel_token)" --yes
  npx vercel alias set <nouvelle-url> creadeline.vercel.app --token "$(cat ~/.vercel_token)"
  ```
- **GitHub push cassé** : le credential Keychain macOS pointait vers le
  mauvais compte GitHub (`juliengrrb`, sans accès au repo dont le
  propriétaire est `julienbourgouin8-dev`). Résolu via PAT + nettoyage
  Keychain Access. Gros push initial (1.3 Go, 9 commits jamais poussés,
  plusieurs semaines de travail) — nécessite un timeout généreux en
  arrière-plan si ça revient.
- **Cache in-memory du serveur `next dev`** : après correction d'une image
  hero mal recadrée, l'ancienne version optimisée restait servie même après
  correction du fichier source sur disque et purge de `.next/cache/images`
  — le cache vit aussi en mémoire dans le process `next dev` déjà lancé.
  Fix : renommer le fichier (nouveau nom = nouvelle clé de cache) plutôt que
  redémarrer le serveur de dev de Julien (règle absolue de ce projet : ne
  jamais `pkill` son serveur).

## Vitrine animée — refonte lecture vidéo (session 2026-09-13)

Problème récurrent signalé plusieurs fois par Julien ("j'arrive pas avec
cette section à avoir un truc dont je suis satisfait") : la vidéo au survol
redémarrait/mettait du temps à apparaître, et le panneau flottant restait
parfois coincé ouvert après un scroll loin de la section. `VitrineArc.tsx`
réécrit :
- Les `<video>` sont maintenant **toujours en lecture** (refs persistantes,
  `playVideo(i)`), affichées/masquées par crossfade d'opacité plutôt que
  montées/démontées — la vidéo est déjà en train de jouer avant même d'être
  montrée, plus de délai de redémarrage.
- `closePanel()` met en pause ET ferme — plus d'état "vidéo qui tourne dans
  le vide" hors écran.
- Filet de sécurité au scroll (seuil de delta 80px, déjà en place depuis la
  session précédente) conservé et re-vérifié comme fonctionnel avec la
  nouvelle logique.

## Fond de commerce — divers (session 2026-09-13)

- **Footer** : ligne de copyright "© 2026 CréA'deline. Pièces uniques
  faites main..." retirée sur demande explicite (`ContactSection.tsx`).
- **Vercel Speed Insights** : `@vercel/speed-insights` installé (package
  officiel, pas juste un trace ponctuel) — `<SpeedInsights />` dans
  `app/layout.tsx`, non gaté par le consentement cookies (aucune donnée
  personnelle/cookie selon la doc Vercel) mais listé en toute transparence
  dans `confidentialite/page.tsx`.

## Refonte mobile (session 2026-09-13, en cours)

Julien a envoyé un enregistrement d'écran de son téléphone sur le site en
ligne ("c'est pas du tout bien optimisé pour mobile"). Vidéo découpée en
frames (`ffmpeg -vf fps=2`), analysée catégorie par catégorie, corrections
faites une par une (vérifiées à chaque fois par capture Playwright
`devices['iPhone 13']`, jamais juste "ça devrait aller") :

- **Chevauchement wordmark logo / nav** en haut du hero — corrigé.
- **Titre de la section Vitrine qui chevauchait la photo produit** :
  déplacé du positionnement absolu (calé en % de la hauteur du conteneur
  image) vers le flux normal du document, **avant** le conteneur image —
  deux tentatives ratées (juste réduire la police, puis police + `max()`
  plancher) avant cette solution robuste.
- **CTA "Voir les créations" qui chevauchait les produits** sur mobile
  (positionné "à droite des produits" comme en desktop, mais sur mobile
  la photo remplit toute la largeur sans marge) — recentré en bas, sous les
  produits, sur mobile uniquement (`sm:` reprend le placement desktop).
- **Hero trop court** (dernier fix, 2026-09-13) : verrouiller la hauteur du
  hero sur le ratio de la photo (comme en desktop) donnait, sur un écran
  étroit, une bande si fine que hero + vitrine + marchés tenaient tous sur
  le premier écran. Changé en `h-[88vh] w-full` sur mobile (hauteur d'écran
  fixe et généreuse, l'image en `object-cover` rogne les côtés — jamais le
  produit, grâce à la marge de fond ajoutée de chaque côté lors du
  recentrage de l'image), `sm:` et plus revient au ratio naturel sans
  rognage. Vérifié à l'écran (mobile + desktop, capture Playwright) et
  déployé.
- **Décision explicite** : ce traitement (hauteur fixe + rognage sécurisé)
  n'a **pas** été appliqué à l'image de la section Vitrine — ses zones de
  clic (hotspots produits) sont calibrées en % de ce conteneur exact et se
  désalignerait si l'image était recadrée différemment sur mobile.
- **En attente / à clarifier avec Julien** : il a dit "il faut tout revoir
  toutes les tailles... il va falloir réduire les polices gérer tout ça" —
  périmètre pas encore confirmé (juste le premier écran mobile, ou aussi
  tablette/autres breakpoints ?). Prochaine étape probable : repasser
  chaque section mobile une par une comme ci-dessus, en repartant si besoin
  du reste des frames de la vidéo envoyée par Julien.

## Barre d'état iOS (encoche) — cause trouvée, correctif annulé (2026-09-16)

> **État du code : revenu à l'avant, sur demande explicite de Julien** —
> « remets l'image d'origine, enlève ton gris, remets tout comme c'était
> avant ». La barre est donc de nouveau en paper (le fond du `<body>`) et la
> photo mobile est `hero-mobile-v9.png`, la photo de studio d'origine que
> Julien a retouchée dans Canva. Le liseré crème/photo est de retour, assumé.
> Ce qui suit reste le diagnostic exact du problème : à relire avant toute
> nouvelle tentative, pour ne pas repartir sur les fausses pistes.
>
> Pourquoi le correctif a été retiré : il obligeait à peindre la barre avec
> la couleur du haut de la photo, soit **#DFDBDB**, un gris trop soutenu —
> une bande grise en haut de l'écran + un fond de section gris sous le titre
> et le CTA. Techniquement juste, visuellement mauvais. Le fond de studio de
> la photo étant en dégradé (haut sombre, bas quasi blanc), matcher le haut
> imposait mécaniquement cette teinte-là.
>
> Si on y revient un jour, la piste propre est d'agir sur la **photo** et non
> sur le CSS : éclaircir/uniformiser sa première bande de pixels pour que le
> haut tombe sur un blanc cassé clair, puis reprendre le correctif ci-dessous
> avec cette couleur-là.


Symptôme : sur l'iPhone de Julien, la bande du haut (heure / réseau /
batterie) sortait crème alors que le hero mobile est blanc — liseré net à
la jonction. Plusieurs tentatives avaient échoué avant, **toutes fondées sur
une mauvaise hypothèse** : padding-top + marge négative sur le hero, puis un
bloc "cale" en `h-[env(safe-area-inset-top)]`, puis remplacement de la photo
hero par une version à fond blanc pur (générée par IA, d'où la plaque de
logo mal reproduite qu'Adeline doit retoucher).

**La bande est hors viewport** dans un onglet Safari classique : c'est
pourquoi `env(safe-area-inset-top)` y vaut 0 (le "cale" faisait 0 px de
haut) et qu'aucun élément de la page ne peut l'atteindre. iOS y peint le
fond du **canvas** du document, c'est-à-dire le background propagé depuis
`<html>` ou, à défaut, celui de `<body>`. Seul `<body>` en avait un
(`--color-paper` #f3f3ee) → barre crème, page blanche. Tout s'explique.

Le correctif qui marchait (retiré depuis, cf. encadré ci-dessus — le
réécrire à l'identique si on y revient) tenait en deux endroits à garder
alignés :

- `app/globals.css` : `html { background: <couleur> }`, surchargé pour
  l'accueil par `@media (max-width: 639px) { html:has(#hero) { … } }`, avec
  la couleur du haut de la photo hero mobile. `:has()` demande iOS ≥ 16.4 ;
  en dessous on retombe sur le fond du body, soit l'état actuel.
- `themeColor` dans les exports `viewport` (racine + surcharge par page),
  avec la même valeur. Couvre Chrome iOS et la barre du bas de Safari.

Vérifié en local et sur un déploiement preview : `theme-color` et fond du
canvas bien distincts page par page, en-têtes de sécurité intacts en prod.
La méthode est donc validée — c'est la **couleur** qu'elle imposait qui a
été refusée, pas le mécanisme.

Points à retenir pour la prochaine fois :

- Mesurer la couleur sur le **rendu** (capture Playwright, bandeau cookies
  écarté via `localStorage.setItem('creadeline_cookie_consent','refused')`,
  sinon son voile assombrit tout et fausse la mesure — piège rencontré),
  jamais sur le fichier source.
- Un fond de studio **non uniforme** (celui de `hero-mobile-v9.png` va de
  #E4DFDF au centre à #D3D1D2 dans les coins) ne matchera jamais
  parfaitement une barre unie. C'est ce qui faisait échouer les essais
  précédents. Un fond uniforme, ou une première bande de photo uniformisée,
  reste la condition d'un raccord exact.

## Aperçu iPhone dans VS Code (2026-09-16)

`app/public/dev-iphone.html` — le site dans une iframe aux dimensions
exactes d'un iPhone, barre d'état et barre Safari dessinées autour, avec
sélecteur de modèle et champ d'URL. Le rechargement à chaud de Next
s'applique dans l'iframe : les modifications apparaissent en direct.

La barre d'état y est peinte avec la **vraie** couleur du canvas lue dans
l'iframe (même origine), pas une valeur en dur — donc le bug ci-dessus se
reproduit et se vérifie dans VS Code, sans avoir à déployer.

- Ouverture : Cmd+Shift+P → *Tasks: Run Task* → **Aperçu iPhone —
  CréA'deline** (défini dans `.vscode/tasks.json` à la racine de
  `julien-os`), ou l'URL http://localhost:3000/dev-iphone.html dans le
  *Simple Browser* de VS Code. Extension **Live Preview**
  (`ms-vscode.live-server`) installée en complément.
- `next.config.ts` : les en-têtes anti-clickjacking passent en
  `SAMEORIGIN` / `frame-ancestors 'self'` **uniquement** quand
  `NODE_ENV === "development"` — sans ça l'iframe est bloquée. La prod
  reste en `DENY` / `'none'`, aucun relâchement en ligne.
- Le fichier vit dans `public/` pour rester en même origine (condition pour
  lire la couleur du canvas), il est donc aussi servi en prod : sans
  intérêt pour une visiteuse, inoffensif, et en `noindex`.

## Hero desktop — recadrage final, nav 4 liens, titre section 2 (session 2026-09-16)

Session longue, beaucoup d'allers-retours sur l'image du hero desktop — le
résumé ci-dessous ne garde que l'état final et les leçons, pas chaque essai
intermédiaire (tous les fichiers `hero-v9`/`v10`/`v12`/`v13`/`v14` créés en
cours de route ont été supprimés, seuls `hero-v8.png` — image source
d'origine, conservée — et `hero-v16.png` — version finale active —
restent dans `public/brand/`).

**Pipeline image final (hero-v8 → v11 → v15 → v16), toutes des vraies
retouches pixel, pas du CSS :**

1. `hero-v11.png` : crop du **haut** de `hero-v8.png` (2752×2236 →
   2752×1883). Mesuré au pixel où le sac commence (ligne 393) pour ne
   garder que 40px de marge, sans jamais toucher le produit.
2. `hero-v15.png` : le groupe de sacs n'était pas centré horizontalement
   (marge 468px à gauche contre 232px à droite, mesuré). **Piège
   important** : rogner à gauche pour recentrer *zoome mécaniquement*
   l'image (moins de pixels sources affichés sur la même largeur 100vw =
   agrandissement, 13% de zoom dans la tentative annulée — retour Julien
   « tout a été décalé, l'image a grossi »). La bonne méthode : **étendre
   la toile à droite** de 236px en dupliquant la dernière colonne de
   pixels (fond quasi plat → raccord invisible). Résultat : marges
   parfaitement égales (468px/468px) sans aucun zoom ni déformation.
   2752×1883 → 2988×1883.
3. `hero-v16.png` : ~22% de la hauteur de la photo (411px sur 1883)
   n'était que du fond vide sous les sacs (dernier pixel de produit/ombre
   mesuré à la ligne 1472 — rien après). Rogné en gardant 70px de marge
   → 2988×1542. C'est cette bande-là que Julien pointait comme « une
   bande rectangulaire qui ressemble au fond », pas un artefact CSS.

**CSS/layout du hero (`app/page.tsx`) :**

- Conteneur image : `sm:aspect-[2988/1542] sm:h-auto`, **sans
  `max-h-screen`**. Une tentative de plafonner la hauteur (pour éviter le
  scroll sur petit écran) recoupait le produit à chaque fois — Julien a
  tranché : jamais de rognage du sac, un petit scroll sur écran court est
  acceptable.
- `sm:pb-10` ajouté puis **retiré** le même jour : rempli en `bg-paper`
  uni (#f3f3ee) contre un bas de photo légèrement plus sombre par
  endroits (~#eae9e5) → bande visible. Retiré, la section `#vitrine`
  reprend directement après la photo.
- Bloc texte/CTA (« Des créations qui vous correspondent ») :
  `sm:right-32 sm:top-[51%]`. Décalé du bord droit (`right-10` → `right-32`)
  pour rééquilibrer avec l'asymétrie de la photo, et de `58%` à `51%` de
  hauteur pour éviter la petite pochette (zone dégagée à hauteur de
  l'épaule du sac). Le `top-%` a été recalculé à chaque recadrage vertical
  de l'image (même ligne physique de la photo, juste réexprimée en % de
  la nouvelle hauteur totale).
- Nav : passée de 3 à **4 liens** (ajout « À propos », retrait du mot
  « Panier » — icône seule via nouveau prop `hideLabel` sur
  `CartBadge.tsx`) pour rééquilibrer la nav autour de la bandoulière
  plutôt que retoucher la photo. Positions `25% / 41% / 59% / 75%`
  (Créations/Marchés à gauche de la bandoulière, Contact/À propos à
  droite), recalculées après le crop v15. `CartBadge` a aussi reçu
  `top-[-8px]` : son icône (36px) est plus haute que le texte des autres
  liens, donc sans `top` explicite elle paraissait plus basse (retour
  Julien : « le bouton panier est un peu en bas »).
- **`WriteOnHeading.tsx`** : nouveau prop `blueWords` (même logique que
  `italicWords` déjà existant), applique `font-bold text-denim` mot par
  mot — pour mettre en avant un mot-clé dans le même bleu que
  « créations » du hero. Utilisé dans `VitrineArc.tsx`.
- **Titre section 2** (`VitrineArc.tsx`) changé : « Une pièce pour
  *chaque usage* » → « Des **pièces** qui vous accompagnent *au
  quotidien* » (« pièces » en bleu gras, « au quotidien » en italique).

**Non bloquant mais en attente** : le lien **« À propos »** pointe vers
`#apropos`, qui n'existe pas — aucune section/page « À propos » sur le
site. Julien n'a pas encore tranché le contenu/la destination.

**Déployé en prod** (`npx vercel@48 --prod --token "$(cat
~/.vercel_token)" --yes` puis `vercel alias set <nouvelle-url>
creadeline.vercel.app`) — plusieurs fois dans la session, dernière
version en ligne inclut tout ce qui précède. **Note d'environnement** :
`npx vercel@latest` (et `npx vercel` sans version) échoue actuellement en
local avec `npm error Invalid Version` (bug de résolution npm/arborist,
pas un problème Vercel) — épingler une version qui marche, ex.
`vercel@48`, contourne le problème. `vercel@37` s'installe mais l'API
Vercel refuse les CLI < 47.2.2.

**Prochaine étape demandée par Julien** : la version PC est validée,
« c'est parfait » — passer à la **version mobile**.

## Reste à faire / en attente

- **Lien "À propos"** (nav hero) : pointe vers `#apropos`, section/page
  inexistante — destination et contenu à définir avec Julien (voir
  section hero ci-dessus).
- **Email de contact** : toujours vide, en attente que Julien confirme
  l'adresse réelle d'Adeline. Impacte aussi `ADMIN_EMAIL` ci-dessus et les
  placeholders `[À COMPLÉTER]` des pages légales (email, SIRET, adresse,
  raison sociale).
- **Nom de domaine propre** (type creadeline.fr) : pas fait, le site tourne
  sur le sous-domaine gratuit `creadeline.vercel.app`.
- **Stockage uploads** : toujours local-filesystem, pas persistant sur
  Vercel — voir section "Pivot SQLite → Neon" ci-dessus.
- **Mobile** : scope de "revoir toutes les tailles" à clarifier avec Julien
  (voir section refonte mobile ci-dessus).
- Stripe/paiement, panier, Sendcloud/shipping, emails transactionnels :
  toujours dans `TODO.md`, phases futures non commencées.
