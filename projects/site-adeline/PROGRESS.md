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

## Intégration Sendcloud & Expédition (session 2026-09-21)

Intégration complète de la chaîne d'expédition et d'affranchissement automatique avec l'API Sendcloud v2 pour la boutique CréA'deline.

- **Base de données (Neon Postgres)** :
  - Colonnes d'expédition ajoutées à la table `orders` : `shipping_carrier`, `shipping_label_url`, `shipping_tracking_number`, `shipping_tracking_url`, `shipping_parcel_id`.
  - Migrations idempotentes dans `app/lib/db/client.ts` et `admin/lib/db/client.ts`.
- **Client Sendcloud v2** (`app/lib/sendcloud/client.ts` et `admin/lib/sendcloud/client.ts`) :
  - Authentification HTTP Basic via `SENDCLOUD_PUBLIC_KEY` et `SENDCLOUD_SECRET_KEY`.
  - Création de colis + réservation d'affranchissement avec `request_label: true` (retourne le numéro de tracking et l'URL du PDF d'étiquette).
  - Gestion sécurisée d'absence de clés (warning sans plantage de commande).
- **Webhook Stripe** (`app/app/api/webhooks/stripe/route.ts`) :
  - Dès réception de `checkout.session.completed`, génération automatique de l'expédition et mise à jour de la commande.
- **Admin Commandes** (`admin/app/(protected)/orders/`) :
  - Colonne « Expédition » dans la liste des commandes avec affichage du numéro de tracking.
  - Fiche détail (`[id]/page.tsx`) : bloc « Expédition & Suivi », lien direct vers le portail de suivi, bouton de téléchargement du PDF de l'étiquette et bouton de génération manuelle de secours.

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
- **Stockage uploads (Images produits)** : toujours local-filesystem (`data/uploads/`), non persistant sur
  Vercel serverless — à migrer vers Vercel Blob ou S3/R2 pour les futurs ajouts depuis l'admin.
  **Obsolète depuis le 2026-09-22 : remplacé par la migration VPS ci-dessous (MinIO/S3 sur Coolify),
  ne plus regarder Vercel Blob.**
- **Mobile** : scope de "revoir toutes les tailles" à finaliser (voir section refonte mobile).
- **Emails transactionnels (Brevo)** : confirmation de commande et notification d'expédition par email.

## Migration hébergement — Vercel/Neon → VPS Hostinger + Coolify (session 2026-09-22, EN COURS)

**À lire en premier au prochain reprise de session.** Cette migration est déclenchée par trois
signaux distincts remontés par Julien le même jour : (1) le stockage uploads local ne survit pas au
serverless Vercel (déjà connu, voir juste au-dessus) ; (2) la base Neon tourne en `us-east-1` (USA),
alors que le site est 100% francophone avec tout un dossier RGPD déjà construit (`legal/`,
`confidentialite/page.tsx`) qui part du principe "données en UE" — incohérence à corriger ; (3) le
plan gratuit Vercel ("Hobby") **interdit contractuellement l'usage commercial**, or le site encaisse
de vrais paiements Stripe — zone grise qu'on veut arrêter d'accepter passivement. Julien a aussi
exprimé une frustration légitime : payer une brique gérée séparément par service (Vercel + Neon +
Cellar/Blob) revient cher rapporté à la RAM réelle utilisée, et il voulait "un seul serveur pour
tout regrouper" plutôt que continuer à empiler des services tiers facturés à la pièce.

### Recherche comparative menée (pour ne pas la refaire)

Comparatif VPS approfondi fait ce jour avec prix réels vérifiés (API publiques quand possible,
jamais les prix d'appel marketing) :

- **Clever Cloud** (PaaS français) : prix réels tirés de leur API publique
  (`api.clever-cloud.com/v2/products/instances` et `.../addonproviders`, accessible sans clé) —
  runtime Node nano ~6,08 €/mois + Postgres XXS ~5,25 €/mois + Cellar (S3) quasi gratuit à notre
  volume ≈ **11-12 €/mois** au total. Écarté : plus cher et plus fragmenté qu'un VPS unique pour ce
  qu'on veut faire.
- **Hetzner** : gamme bon marché (CX) indisponible en 2026, fortes hausses de prix cette année —
  plus le bon plan (~20 €/mois pour 2vCPU/4Go, non compétitif). Écarté.
- **IONOS** : vérifié en détail (specs+prix réels sur ionos.fr) — un plan 4vCPU/8Go équivalent à
  l'offre OVH revient à **~26,40 €/mois réels** (après une promo de 3 mois trompeuse) + 10 € de
  frais de mise en service. ~3x plus cher qu'OVH à specs égales. Écarté.
- **OVHcloud VPS-2** (4 vCPU/8 Go/75 Go, sauvegardes incluses) : ~8,65 €/mois TTC réel — très bon
  prix, mais **disponible uniquement au Royaume-Uni (Erith)** au moment de la commande, pas en
  France/Allemagne (stock). RU = hors UE (Brexit), couvert par une décision d'adéquation RGPD donc
  légalement OK, mais moins "propre" que rester strictement en UE.
- **Hostinger "Web App Hosting"** (le produit façon Vercel, déploiement Git en 1 clic) : écarté —
  prix réel après engagement 48 mois ~17-26 $/mois (pas le "3,99 $/mois" affiché), et surtout **base
  de données MySQL native** (Postgres seulement via une intégration Supabase greffée à part) —
  aurait cassé tout le code déjà écrit pour Postgres et réintroduit l'éparpillement qu'on voulait
  éviter.
- **Hostinger VPS (gamme KVM)** — **retenu**. KVM 1 : 5,99 €/mois sur engagement 12 mois (passe à
  12,99 €/mois au renouvellement, vérifié directement sur la page de commande, pas une estimation),
  + option "Sauvegarde automatique quotidienne" activée (+2,99 €/mois) car ce serveur héberge
  maintenant les vraies données clients/commandes. Total ~8,98 €/mois. **Datacenter choisi :
  Allemagne (Frankfurt)** — reste strictement en UE, contrairement à l'unique option OVH disponible
  ce jour-là (RU). Moins de puissance brute qu'OVH VPS-2 (1 vCPU/4 Go vs 4 vCPU/8 Go) mais jugé
  suffisant à notre échelle et le compromis UE-sans-ambiguïté l'a emporté.

**Domaine** : `.fr` acheté séparément (pas de domaine gratuit Hostinger utilisable — leur offre
gratuite est limitée aux extensions `.tech`/`.cloud`, inadaptées à une marque de couture française).
Comparatif fait : **Infomaniak le moins cher dans la durée** (4,50 €/an, prix fixe à vie, jamais
d'augmentation) ; **Gandi surprenamment cher au renouvellement** (25,90-28,78 €/an malgré sa
réputation "premium/éthique" — à éviter) ; **OVHcloud raisonnable et stable** (~4,99 € HT an 1 →
7,79 € HT/an ensuite, soit ~9,35 €/an TTC en continu). **Domaine finalement acheté chez OVHcloud**
(15,34 € TTC pour 2 ans, DNSSEC + email Zimbra Starter inclus gratuitement).

✅ **RÉSOLU (session 2026-09-22, reprise) : domaine acheté = `creadeline16.fr`**, sans accent.
`creadeline.fr` sans accent était déjà pris, d'où le suffixe `16`. Toute référence à `creadeline.fr`
plus bas dans ce plan doit être lue comme `creadeline16.fr`.

### État de l'infrastructure au 2026-09-22 (où on s'est arrêtés)

- **VPS Hostinger acheté et actif** : IP `179.198.209.59`, hostname `srv2000362.hstgr.cloud`,
  Ubuntu 24.04, datacenter Frankfurt (Allemagne).
- **Accès SSH configuré proprement** : clé ed25519 générée ce jour (`~/.ssh/creadeline_vps`, jamais
  affichée dans une conversation), clé publique installée dans
  `/root/.ssh/authorized_keys` sur le VPS. Alias prêt à l'emploi dans `~/.ssh/config` :
  **`ssh creadeline-vps`** se connecte directement, sans mot de passe. Le mot de passe root
  généré par Hostinger a servi une seule fois à installer la clé puis a été supprimé du disque
  local (jamais collé dans le chat, conformément à la règle du projet sur les secrets — toujours
  via un fichier local ouvert en TextEdit, jamais dans la conversation).
- **Coolify v4.3.23 installé** via l'app 1-clic Hostinger, tous les conteneurs `healthy`
  (`coolify`, `coolify-proxy`, `coolify-db`, `coolify-redis`, `coolify-realtime`,
  `coolify-sentinel`). Dashboard sur `http://179.198.209.59:8000` (compte admin créé par Julien,
  identifiants connus de lui seul).
- **Assistant de configuration Coolify terminé** : serveur "localhost" (cette même machine,
  `host.docker.internal`), projet "My first project" / environnement "production" créés, Docker
  Engine confirmé actif.
- **On s'est arrêtés sur l'écran "New Resource"** de Coolify (Root Team / My first project /
  production), juste avant de créer la ressource PostgreSQL — **rien n'est encore créé côté
  base de données ou stockage sur ce VPS**.
- **Le site actuel (`creadeline.vercel.app` + Neon Postgres `us-east-1` + uploads locaux) tourne
  toujours normalement et n'a pas été touché** — c'est toujours lui la version en ligne tant que la
  migration n'est pas terminée et vérifiée.
- **DNS pas encore pointé** : le domaine acheté (voir point non résolu ci-dessus) ne pointe pas
  encore vers `179.198.209.59`.

### Mise à jour — session 2026-09-22 (reprise), avancement

- **Domaine résolu** : `creadeline16.fr` (sans accent, `creadeline.fr` sans accent était déjà pris,
  d'où le `16`).
- **PostgreSQL déployé dans Coolify** : ressource "creadeline-db", conteneur `weragxl251e5gltuems22q76`,
  healthy. Base `creadeline`, accès **Public** activé (port auto-assigné par Coolify) + **SSL require**,
  car l'admin (resté sur Vercel) doit pouvoir l'atteindre depuis l'extérieur. Identifiants
  auto-générés par Coolify, jamais vus dans le chat.
- **Stockage objet : changement de plan MinIO → Garage.** MinIO (serveur + client `mc`) a été trouvé
  **officiellement archivé/abandonné par son éditeur** (page `dl.min.io` renvoie HTTP 410, "no longer
  maintained, no security updates") au moment de le configurer — en plus la console web "Community
  Edition" a perdu toutes les fonctions d'admin (plus de gestion de clés IAM ni de règles de bucket en
  UI). Décision prise avec Julien : remplacer par **Garage** (Deuxfleurs, projet français,
  S3-compatible, activement maintenu), cohérent avec la démarche RGPD/UE de cette migration. Le
  conteneur MinIO a été arrêté/supprimé.
  - Déployé **directement en SSH sur le VPS** (pas via l'UI Coolify — Garage nécessite plusieurs
    commandes CLI post-démarrage que l'UI ne gère pas) : fichiers dans `/opt/garage/` sur le VPS
    (`garage.toml`, `garage.env` chmod 600 avec `GARAGE_RPC_SECRET`/`GARAGE_ADMIN_TOKEN` générés
    aléatoirement, `docker-compose.yml` avec `restart: unless-stopped`). Image `dxflrs/garage:v2.4.1`
    (pinnée, pas `:latest` — recommandation officielle Garage). Conteneur `garage`, ports `3900` (API
    S3) et `3903` (admin) exposés sur le VPS.
  - Layout single-node appliqué (`garage layout assign -z dc1 -c 1G <node_id>` + `apply`).
  - Bucket **privé** `creadeline-uploads` créé (pas de policy publique — voir choix d'architecture
    ci-dessous). Clé d'accès dédiée `creadeline-app` (droits read/write/owner sur ce bucket
    uniquement) créée avec `garage key create` en redirigeant la sortie directement dans un fichier
    local, jamais affichée dans la conversation :
    **`projects/site-adeline/.secrets/garage-app-key.txt`** (chmod 600, dossier `.secrets/` ajouté au
    `.gitignore` racine). Contient l'Access Key ID et la Secret Key à utiliser dans le SDK S3 côté app.
    ⚠️ Incident mineur pendant la manip : une première clé a été accidentellement affichée dans la
    sortie d'une commande (donc visible dans l'historique de conversation) — elle a été **révoquée
    immédiatement** (`garage key delete`) et regénérée proprement avant tout usage. Ne pas réutiliser
    l'ancien Key ID `GK78cacaa49258264a98cdc770` s'il traîne quelque part, il est mort.
  - **Choix d'architecture : bucket privé, pas d'exposition publique.** Contrairement au plan initial
    ("stocker l'URL publique résultante dans la colonne images"), on garde le bucket privé et l'app
    continue de servir les images via ses routes existantes
    (`app/app/uploads/[...path]/route.ts` et équivalent admin), juste en lisant depuis Garage (S3
    `GetObjectCommand`, authentifié avec la clé `creadeline-app`) au lieu du disque local, puis en
    streamant la réponse. Ça évite la fonctionnalité "bucket website" de Garage (qui demanderait un
    sous-domaine dédié + DNS wildcard, complexité inutile ici) et garde le contrôle d'accès côté
    serveur. **Donc à l'étape 5 du plan ci-dessous, ne PAS retirer les routes `/uploads/...` — les
    adapter pour lire du S3 au lieu du filesystem, pas les supprimer.**
  - ⚠️ **Ménage à faire dans Coolify** : il reste une ressource fantôme "Minio"
    (`service-b3tej1rcbeq3gdxjd7nof2o1`) dans l'UI Coolify, créée avant le changement de plan, dont le
    conteneur a été arrêté/supprimé manuellement en SSH. Coolify ne le sait pas — supprimer cette
    ressource depuis l'UI Coolify (Projects → My first project → production) pour que le dashboard
    reflète l'état réel.

### Mise à jour — session 2026-09-22 (suite), migration DB + code

- **⚠️ Nom de la base Postgres Coolify = `postgres`, pas `creadeline`.** Le champ "Initial database"
  rempli à `creadeline` dans l'UI Coolify n'a pas été pris en compte (bug ou mauvaise manip côté
  Coolify, pas creusé) — la base réellement créée s'appelle `postgres` (le nom par défaut de l'image
  officielle). Toutes les chaînes de connexion utilisent `postgres` comme nom de base. Pas grave en
  soi, juste à savoir pour ne pas chercher une base `creadeline` qui n'existe pas.
- **SSL activé manuellement sur le Postgres Coolify.** Le toggle "SSL" de l'UI Coolify n'avait
  visiblement pas été appliqué (SSL toujours `off` en interrogeant le serveur malgré un restart).
  Corrigé directement en SSH : certificat auto-signé généré sur l'hôte VPS (`openssl`, absent de
  l'image Postgres elle-même), copié dans `$PGDATA` du conteneur (`docker cp` + `chown postgres`),
  `ssl = on` + `ssl_cert_file`/`ssl_key_file` ajoutés à `postgresql.conf`, conteneur redémarré.
  Confirmé : `SHOW ssl;` → `on`. La chaîne de connexion utilise `sslmode=require` (chiffré, pas de
  vérification CA puisque certificat auto-signé — suffisant pour ce besoin, pas d'échange de données
  bancaires brutes sur ce canal, Stripe reste hors DB).
- **Migration des données Neon → Coolify Postgres faite et vérifiée.** `pg_dump` du Neon existant
  (schémas `public.*` uniquement, `neon_auth` exclu — infrastructure propre à Neon, pas nos données)
  → restauré dans le nouveau Postgres via un conteneur `postgres:18` temporaire sur le VPS. Piège
  rencontré : un premier essai de restauration a silencieusement importé zéro ligne (`docker run`
  sans le flag `-i`, donc le fichier passé par `< fichier.sql` n'atteignait jamais le conteneur) —
  corrigé en montant le fichier en volume au lieu de le piper par stdin. Vérifié après coup :
  `products` (1 ligne), `orders` (0), `audit_log` (1), `login_attempts` (0) — cohérent avec l'état
  réel du site à ce stade.
  - Le `DATABASE_URL` Neon a été transféré du Mac vers le VPS par `scp` direct (jamais affiché), et
    supprimé du VPS une fois la migration terminée. Le dump SQL temporaire (`/opt/migration/`) a
    aussi été supprimé après vérification.
- **Code applicatif migré du driver Neon vers `postgres` (porsager/postgres), pas `pg` brut.** Choisi
  car son API "tagged template" (`sql\`...\``) est compatible telle quelle avec tout le code déjà
  écrit (`app/lib/db/products.ts`, `orders.ts`, `admin/lib/db/products.ts`, `orders.ts`,
  `admin/lib/audit.ts`, `admin/lib/auth/rate-limit.ts`) — **zéro changement nécessaire dans ces
  fichiers**, seuls les deux `client.ts` (app et admin) ont été réécrits. Package
  `@neondatabase/serverless` désinstallé des deux `package.json`, `postgres` et `@aws-sdk/client-s3`
  installés à la place (les deux apps en ont besoin : DB pour les deux, S3 aussi pour les deux car
  chacune sert `/uploads/[...path]` depuis son propre déploiement).
- **`admin/lib/uploads.ts` migré vers S3 (Garage)** : `saveUploadedFile`/`deleteUploadedFile` gardent
  exactement la même signature (seul appelant : `admin/lib/db/products.ts`, pas touché) mais
  écrivent/suppriment maintenant via `@aws-sdk/client-s3` (`PutObjectCommand`/`DeleteObjectCommand`)
  au lieu du filesystem local. `forcePathStyle: true` requis par Garage.
- **Les deux routes `app/app/uploads/[...path]/route.ts` et `admin/app/uploads/[...path]/route.ts`**
  (fichiers identiques) adaptées pour lire l'objet via `GetObjectCommand` sur Garage et le streamer,
  au lieu de lire le fichier local — **conservées** (pas supprimées, contrairement à ce que
  suggérait le plan initial pensé pour MinIO public, voir choix d'architecture plus haut : bucket
  resté privé).
- **`.env.local` de `app/` et `admin/` mis à jour** (en local sur ce Mac, jamais affichés dans la
  conversation, valeurs transférées uniquement via variables shell) : `DATABASE_URL` pointe
  maintenant sur `179.198.209.59:5432` (Postgres Coolify, `sslmode=require`), et 5 nouvelles
  variables ajoutées : `S3_ENDPOINT=http://179.198.209.59:3900`, `S3_REGION=garage`,
  `S3_BUCKET=creadeline-uploads`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (valeurs lues depuis
  `projects/site-adeline/.secrets/garage-app-key.txt`, généré plus haut dans ce fichier).
  **Ces mêmes variables devront être ajoutées manuellement dans Coolify (pour le déploiement de
  `app/`) et dans Vercel (pour `admin/`, qui y reste) à l'étape "Déployer le site" ci-dessous — ne
  pas oublier `S3_*` en plus de `DATABASE_URL`, l'étape 6/8 du plan initial ne les mentionnait pas
  encore.**
- **Vérifié end-to-end avec un script Node jetable** (créé et supprimé dans la même session, jamais
  commité) : connexion DB réelle (`SELECT count(*) FROM products` → 1) + aller-retour S3 complet
  (put/get/delete sur le bucket réel) — les deux passent.
- `npm run build` relancé avec succès sur `app/` et `admin/` après tous ces changements (TypeScript
  strict OK, build Next.js OK).
- ⚠️ **Ménage Coolify toujours pas fait** : la ressource fantôme "Minio" (renommée automatiquement
  "creadeline" dans l'UI, statut "Unknown") est toujours présente — le bouton Delete n'a pas été
  trouvé dans le menu déroulant du haut (Deploy/Force Deploy/Force Cleanup Containers, pas de
  Delete). Il faut chercher plus bas sur la page ("Danger Zone" habituelle chez Coolify) ou dans les
  Settings de la ressource.

### Mise à jour — session 2026-09-22 (suite 2), repo dédié + déploiement + DNS

- **Code extrait vers un repo GitHub dédié `julienbourgouin8-dev/creadeline-site`** (privé), séparé du
  monorepo perso `julien-os`. Historique de `projects/site-adeline` préservé via `git subtree split`.
  Deux commits faits dans `julien-os` avant l'extraction : un pour les changements de migration
  (driver Postgres, S3, `.gitignore`), un pour intégrer le travail en cours qui traînait non commité
  (Sendcloud, formulaire de contact, ajustements boutique — à la demande explicite de Julien, "récupère
  tout ce qui est essentiel et qui n'a pas été comité et mets-le"). Le fichier
  `app/components/VitrineArc.tsx.backup` (backup manuel, pas du code) a été explicitement exclu du
  commit.
- **Authentification Coolify → GitHub** : clé de déploiement SSH dédiée (lecture seule, pas de token
  GitHub), générée en local (`projects/site-adeline/.secrets/creadeline_deploy_key*`), clé publique
  ajoutée au repo via l'API GitHub, clé privée collée par Julien dans Coolify (Keys & Tokens).
  ⚠️ **Incident sécurité pendant cette étape** : une commande de diagnostic
  (`git credential-osxkeychain get`) a affiché un token GitHub personnel de Julien en clair dans la
  conversation — token révoqué et régénéré par Julien immédiatement. Nouvelle règle mémorisée
  ([[feedback_never_run_secret_revealing_commands_bare]]) pour ne plus jamais exécuter ce genre de
  commande sans capture silencieuse.
- **Application déployée dans Coolify** (ressource "creadeline-app", Railpack, base directory `/app`).
  Piège rencontré : premier déploiement avec un build vide (`Cmd=[/bin/bash]`, conteneur en
  crash-loop) — le champ **Base directory** n'avait pas été sauvegardé (vide) lors de la création de
  la ressource. Corrigé en le renseignant explicitement (`/app`) puis redéployant — Railpack a alors
  correctement détecté Next.js (`npm run build` + `next start`).
  Les 12 variables d'env nécessaires (`DATABASE_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`,
  `NEXT_PUBLIC_POSTHOG_HOST`, `RESEND_API_KEY`) collées via le mode "Developer View" de Coolify
  (paste en bloc), valeurs jamais affichées dans la conversation.
- **Domaine `creadeline16.fr` pointé et en ligne, HTTPS fonctionnel.** DNS OVH : enregistrement A `@`
  modifié de l'IP de parking OVH (`213.186.33.5`) vers `179.198.209.59` — propagation quasi
  instantanée (vérifié direct sur `dns111.ovh.net`, le NS faisant autorité). Domaine ajouté dans
  Coolify (Traefik généré + certificat Let's Encrypt automatique), redéploiement nécessaire après
  ajout du domaine pour que les labels Traefik du conteneur se mettent à jour. **`https://creadeline16.fr`
  répond 200, titre correct, HTTP/2, DB + images (via Garage) fonctionnels — vérifié en conditions
  réelles.**
  - ⚠️ **`www.creadeline16.fr` en "DNS mismatch"** dans Coolify — pas encore résolu. OVH a une entrée
    TXT `"1|www.creadeline16.fr"` qui suggère une redirection déjà configurée côté OVH (pas un simple
    A/CNAME) pour ce sous-domaine — à investiguer avant de considérer `www` comme fonctionnel.
- Les images produits actuellement affichées (`/uploads/*.jpg` référencées en base) sont en fait des
  fichiers statiques déjà présents dans `app/public/uploads/` (commités dans le repo), servis
  directement par Next.js — **pas encore via Garage** pour ces images historiques spécifiques. Le
  chemin S3/Garage (route `/uploads/[...path]`) ne sera exercé que pour les **nouvelles** images
  uploadées depuis l'admin à partir de maintenant. Testé indépendamment avec succès (round-trip S3
  complet via script jetable, voir plus haut).

### Mise à jour — session 2026-09-22 (suite 3), admin déployée sur le VPS (pas Vercel)

- **⚠️ Correction importante du plan** : contrairement à ce qui était noté plus haut ("Admin : reste
  sur Vercel, décision déjà prise"), vérification faite ce jour sur le compte Vercel de Julien
  (`vercel project ls` + API) → **il n'existe qu'un seul projet Vercel pour ce site** ("creadeline",
  qui sert `app/`). **L'admin n'a jamais été déployée nulle part, elle n'a tourné qu'en localhost.**
  La décision "admin reste sur Vercel" prise en session précédente supposait à tort qu'un déploiement
  existait déjà. Comme il n'y avait donc aucun coût de bascule, redécidé avec Julien : **l'admin part
  aussi sur le VPS/Coolify**, pas sur Vercel — cohérent avec l'objectif initial de tout regrouper sur
  un seul serveur.
- **Admin déployée dans Coolify** (ressource "creadeline-admin", même repo `creadeline-site`, même
  clé de déploiement, base directory `/admin`, Railpack, port 3000). A démarré correctement du
  premier coup (leçon du déploiement de `app/` déjà appliquée : bien vérifier que Base directory est
  sauvegardé avant de déployer). 12 variables d'env ajoutées : `DATABASE_URL`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`,
  `POSTHOG_HOST`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`. Vérifié : `/login` répond 200 avec le bon titre, pas d'erreur serveur.
- **Pas encore de domaine public dessus, volontairement** — c'est un back-office avec de vraies
  données clients/commandes, son exposition (sous-domaine dédié type `admin.creadeline16.fr` +
  restrictions d'accès) reste à décider avec Julien avant de l'ouvrir sur internet. Pour l'instant
  accessible uniquement via l'URL de test `*.sslip.io` générée par Coolify.
- Base Postgres et bucket Garage restent accédés via l'**IP publique du VPS** (pas le réseau Docker
  interne) pour app ET admin — simplification volontaire : Garage tourne hors du réseau Coolify
  (déployé en dehors de son orchestration, voir plus haut), donc pas de mise en réseau interne facile
  sans retravailler cette partie. Fonctionne, testé bout en bout, optimisation réseau interne notée
  comme amélioration possible mais non bloquante.

### Mise à jour — session 2026-09-22 (fin de session), admin exposée publiquement

- **`admin.creadeline16.fr` en ligne, HTTPS fonctionnel** (DNS OVH A → `179.198.209.59`, domaine
  ajouté dans Coolify, certificat Let's Encrypt généré). `/login` répond 200. L'admin est maintenant
  accessible de partout, plus seulement en localhost.
- **État global à ce point** : site public (`creadeline16.fr`) et admin (`admin.creadeline16.fr`)
  tous deux en ligne sur le VPS Hostinger via Coolify, DB Postgres + stockage Garage partagés entre
  les deux, tout sur un seul serveur comme voulu au départ. Vercel/Neon (`creadeline.vercel.app`)
  toujours en ligne en parallèle, pas encore coupé — sert de filet de sécurité tant que l'admin n'a
  pas été testée en conditions réelles (login, ajout produit + photo, commande test Stripe/Sendcloud).

## Audit performance page d'accueil — résultat final (tour 4)

**Score PageSpeed Insights mobile : 58 → 91/100. Desktop : 99/100.** LCP mobile 7,8s → 3,0s, TBT
1080ms → 150ms, poids total de page 27 Mo → 8 Mo (essentiellement les 5 vidéos produit
recompressées, ~8 Mo restants — difficile de descendre plus bas sans réduire la résolution/durée des
clips, jugé pas nécessaire).

Le tour 4 a corrigé la cause du score qui avait *baissé* après le tour 3 (recompression vidéo) :
`next/dynamic` seul ne suffisait pas à différer MapLibre — son `import()` se déclenchait dès
l'hydratation (juste après le premier rendu), pas à la visibilité réelle. Une fois le réseau
allégé (moins de vidéos à télécharger en concurrence), ce coût CPU (init WebGL, parsing du style)
tombait plus tôt dans la fenêtre de mesure du TBT, le rendant plus visible qu'avant. Corrigé dans
`MarchesLazy.tsx` avec un vrai `IntersectionObserver` (`rootMargin: 400px`) : la carte n'est
importée/montée qu'en approchant réellement de la section — pas à un scroll simulé de fin de trace.

`browserslist` ajouté à `app/package.json` (Chrome/Edge/Firefox 100+, Safari 15.4+) : investigation
a montré que le "JS obsolète" que PSI signale en boucle (13,5 Kio, `Array.prototype.at`,
`Object.hasOwn`, etc.) **fait partie du runtime interne de Next.js lui-même** (chunk contenant
`next-route-announcer`, code de routing/hydratation du framework), pas de notre code ni de
`posthog-js` — présent dans la quasi-totalité des apps Next.js, non éliminable depuis le code
applicatif. Gardé quand même comme config correcte (cible réellement les navigateurs qu'on veut
supporter), mais **ce point restera signalé par PSI indéfiniment, ce n'est pas un bug à chasser
davantage.**

Bonus accessibilité (signalé par la catégorie "Navigation agentique" de PSI) : les toggles du
bandeau cookies (`CookieConsent.tsx`) n'avaient pas de nom accessible (`aria-label` ajouté).

**Leçon méthodologique de cette session** : les scores/résumés seuls ne suffisent pas à diagnostiquer
correctement — c'est le rapport PSI **détaillé** (tableaux "Évitez d'énormes charges utiles de
réseau" avec le détail par URL, "Réduisez les ressources JS inutilisées" avec les noms de chunks)
qui a permis de trouver la vraie cause (vidéos) après deux tours de corrections qui semblaient
correctes mais n'attaquaient pas le bon problème. **Toujours demander/fournir le rapport détaillé,
pas juste le score, pour ce genre d'audit.**

Piège méthodologique rencontré en cours de route : un ancien process `next dev` tournait déjà sur le
port 3000 depuis plusieurs jours (session de travail habituelle de Julien) — une partie des
vérifications locales "de confiance" tapait dessus au lieu du build de prod fraîchement compilé,
sans erreur visible (juste des noms de chunks différents, faciles à rater). Toujours vérifier
`lsof -i :PORT` avant de faire confiance à un serveur local pour une vérif perf, ou utiliser un port
dédié (ex. `PORT=3099 npm run start`) pour ne jamais risquer de perturber le serveur de dev de
Julien (voir [[feedback_keep_dev_server_running]]).

## Audit performance page d'accueil — tours 2 et 3

Après le premier tour (ci-dessous), le score n'avait presque pas bougé (58→59→60) malgré des
correctifs corrects — signe qu'aucun n'attaquait la vraie cause dominante. Julien a fourni le
rapport PSI **détaillé** (avec le tableau "Évitez d'énormes charges utiles de réseau" listant
chaque URL) plutôt qu'un simple score, ce qui a permis de trouver la vraie cause :

**Cause réelle du poids de page (~26 Mo sur 27 Mo total) : les 5 vidéos produit du présentoir
(VitrineArc) étaient massivement surdimensionnées** — jusqu'à 1920×1080 à 5-12 Mbps pour de
simples clips muets en boucle affichés au maximum à 640px de large. `preload="none"` (tour 1)
empêchait bien le chargement au montage, mais le test PSI scrolle toute la page et déclenche donc
quand même la lecture (et le téléchargement complet) des 5 vidéos via l'`IntersectionObserver` —
un comportement qui reflète un vrai visage d'utilisateur qui parcourt toute la page, pas un artefact
du test. **Ré-encodées** (`ffmpeg`, H.264, largeur max 1280px, CRF 26, piste audio retirée — les
vidéos sont toujours `muted`) : qualité vérifiée image par image (frames extraites avant/après,
comparées visuellement) avant remplacement des fichiers, aucune différence perceptible même sur les
textures détaillées (cuir façon python, motif tissu). **Total : ~26 Mo → ~7,5 Mo (-70%).**

Deuxième découverte du tour 2 : **les deux `<Image priority>` du hero (mobile ET desktop) se
téléchargent TOUJOURS toutes les deux**, même celle masquée en CSS (`hidden`/`sm:hidden`) —
`priority` force un preload qui ignore la visibilité CSS, contrairement à `loading="lazy"` (qui,
lui, respecte bien `display:none` via l'IntersectionObserver de Next). Identifié mais **pas
corrigé** : la seule vraie solution propre (un `<picture>` natif avec sources par media-query, pour
que le navigateur ne télécharge jamais la mauvaise variante) demanderait de réécrire la structure du
hero, très lourdement calée au pixel près (des dizaines de commentaires documentant l'historique des
ajustements) — risque de casser le positionnement jugé trop élevé pour le gain, laissé de côté
volontairement. **À reprendre si Julien veut aller plus loin sur ce point précis.**

Autres correctifs du tour 2-3 (moindre impact, mais chaque point du rapport PSI traité) :
- `next.config.ts` : `images.formats = ["image/avif", "image/webp"]` — le hero PNG était identifié
  comme ressource LCP par PSI, AVIF compresse encore ~20-30% de mieux que WebP sur les photos.
- Police Fraunces : axes variables `opsz`/`SOFT`/`WONK` retirés (aucun `font-variation-settings` ne
  les utilise dans le CSS) — fichier de police nettement plus léger.
- Préconnexion ajoutée vers `basemaps.cartocdn.com`/`tiles.basemaps.cartocdn.com` (tuiles MapLibre).
- Image popup carte (`stand-marche.webp`) recompressée un cran plus loin (q60 au lieu de q75),
  **depuis le JPEG original récupéré via `git show` sur l'historique** — jamais recompresser un
  WebP déjà lossy à partir de lui-même (cascade de pertes), toujours repartir de la source.
- **Volontairement pas touché** : les animations `write-on` (`clip-path` + `filter: blur`) que PSI
  liste comme "non composited" — effet de "texte qui s'écrit à l'encre" documenté et validé avec
  Julien sur plusieurs sessions passées, le CLS mesuré est déjà à 0.000 (le risque théorique ne
  s'est jamais matérialisé), et l'instruction explicite de Julien était de préserver le design
  existant. Idem pour le bundle MapLibre (JS/CSS inutilisé, DOM, "forced reflow") : c'est une vraie
  librairie de carte interactive avec un vrai coût, déjà sortie du chemin critique (chargement
  différé), la réduire davantage demanderait de la remplacer — hors scope d'un audit de perf qui
  doit préserver les fonctionnalités.

**Prochaine étape** : Julien redéploie `creadeline-app` sur Coolify et relance PageSpeed Insights
(mobile + desktop) pour mesurer l'impact réel de ce tour. Si le score ne bouge pas comme attendu,
recoller le rapport PSI **détaillé** (avec les tableaux, pas juste les scores) comme cette fois —
c'est ce qui a permis de trouver la vraie cause après deux tours dans le vide.

## Audit performance page d'accueil (session 2026-09-22, PageSpeed Insights mobile) — tour 1

Demandé par Julien juste après la mise en ligne sur le VPS, sur la base d'un rapport PSI réel
(mobile, Moto G Power, 4G lente) : **score Performance 58/100**, LCP 7,8 s, TBT 520 ms, poids total
de page ~54 Mo(!). Trois causes identifiées dans le code, corrigées :

1. **`AutoplayVideo` (VitrineArc.tsx, version mobile empilée) avait `preload="auto"`** sur ses 5
   `<video>` — le navigateur téléchargeait les 5 fichiers vidéo en entier dès le montage, quelle que
   soit leur visibilité réelle (un `IntersectionObserver` gère déjà play/pause, mais ne contrôlait pas
   le préchargement). Passé à `preload="none"` — vérifié en local (devtools) après coup : seule la
   vidéo visible atteint `readyState 4`, les 4 autres restent à `0` (aucun fetch) tant qu'elles ne
   sont pas scrollées en vue. Quasi certainement la plus grosse partie des 54 Mo.
2. **`Marches` (carte MapLibre GL) importée statiquement dans `page.tsx`** — son JS (~200 Ko, rendu
   WebGL) et son CSS étaient inclus dans le bundle critique de la page d'accueil alors que la carte
   est toujours tout en bas, jamais visible au chargement. Extrait dans un nouveau composant
   `MarchesLazy.tsx` (`"use client"` + `next/dynamic(..., { ssr: false })`, `page.tsx` reste un Server
   Component) avec un placeholder de même hauteur (`aspect-ratio: 4/3`) pour ne pas provoquer de CLS.
3. **`PostHogProvider.tsx` importait `posthog-js`/`posthog-js/react` statiquement** — chargés pour
   TOUT visiteur dès le premier rendu, consentement RGPD ou non (l'init réelle était bien gardée par
   le consentement, mais pas l'import du module). `posthog-js` dépend de `core-js`, d'où les ~22 Ko de
   polyfills obsolètes (`Array.prototype.at/flat/flatMap`, `Object.fromEntries/hasOwn`,
   `String.prototype.trimStart/End`, `Math.trunc`) signalés par PSI ("Ancien JavaScript"). Réécrit en
   `import()` dynamique déclenché uniquement après consentement accepté — avant ça, zéro octet de la
   librairie n'est chargé.
4. **Image `stand-marche.jpg` (popup carte) : 48 Ko → converti en WebP + redimensionné** (`cwebp -q 75
   -resize 320 320`, 414×414 → 320×320) → **22,5 Ko** (-53 %), affichage identique (`object-fit:
   cover` dans une carte 240×104 CSS). Ancien `.jpg` supprimé du repo.

**Non touché, volontairement** (hors scope de l'audit mesuré, ou risque/bénéfice pas clair) : les
requêtes CSS render-blocking restantes (probablement le CSS Tailwind + MapLibre déjà réduit par le
point 2), le JS "legacy" restant s'il en subsiste, les autres pages (`TrackEvent`/`posthog-js/react`
sur les pages boutique n'a pas été touché, même limitation, mais pas mesuré par ce rapport PSI qui ne
portait que sur `/`). À reprendre si un futur rapport PSI les signale encore comme impactants.

**Vérification faite avant déploiement** : `npx tsc --noEmit` propre sur `app/`, `npm run build`
réussi, revue visuelle en local via Chrome DevTools MCP (mobile 390×844) — hero identique, vidéo
VitrineArc lit bien en scrollant dessus, carte + popup (nouvelle image WebP) s'affichent
correctement, zéro erreur console. **Re-mesure PageSpeed Insights après déploiement en prod : voir
plus bas / à compléter par Julien.**

### Reste à faire (non bloquant, prochaine session)

1. **Vérification bout en bout réelle** : se connecter à `admin.creadeline16.fr`, ajouter un produit
   avec photo (confirmer qu'elle atterrit bien sur Garage cette fois, pas `public/uploads/`),
   confirmer l'affichage sur le site public, passer une commande test (Stripe + décrément de stock),
   confirmer Sendcloud (étiquette d'expédition) et PostHog (événements reçus).
2. **`www.creadeline16.fr` en "DNS mismatch"** dans Coolify — OVH a une entrée TXT de redirection
   préexistante pour `www`, pas un simple A/CNAME. À investiguer/corriger.
3. **Ménage Coolify** : ressource fantôme "creadeline" (ex-Minio) toujours présente, bouton Delete
   toujours pas localisé dans l'UI (voir note plus haut).
4. **SEO** (identifié pendant la migration, voir plan original plus bas) : `app/sitemap.ts`,
   `app/robots.ts`, bug "Charente-Maritime" dans la meta description, `generateMetadata` par page,
   Open Graph/JSON-LD produits, soumission Google Search Console.
5. **Une fois tout confirmé stable** : décommissionner Vercel/Neon pour ce projet (garder
   `creadeline.vercel.app` comme filet de sécurité encore un moment avant).
6. Points en attente depuis avant la migration, toujours vrais : lien nav "À propos" sans destination,
   email de contact réel d'Adeline à confirmer (bloque aussi les mentions légales), version mobile.

### Plan détaillé d'origine (obsolète par endroits, gardé pour référence historique — voir mises à jour ci-dessus pour l'état réel)

1. **Résoudre le point non résolu ci-dessus** (orthographe du domaine) avant toute action DNS.
2. Dans Coolify (New Resource → section **Databases**, au-dessus de la section Applications visible
   à l'écran) : déployer une ressource **PostgreSQL**. Noter la chaîne de connexion interne générée.
3. Créer le stockage objet : vérifier dans Coolify si la section **"S3 Storage"** (visible dans la
   barre latérale, sous Infrastructure) suffit telle quelle, ou s'il faut déployer **MinIO** en plus
   via un service Docker Compose dédié — à trancher une fois sur l'écran correspondant.
4. **Migration des données** : `pg_dump` de la base Neon actuelle (`DATABASE_URL` pointant vers
   `ep-round-dream-avtullc2-pooler.c-11.us-east-1.aws.neon.tech`) → import dans le nouveau Postgres
   Coolify.
5. **Changements de code nécessaires** (dans `projects/site-adeline/`) :
   - `app/lib/db/client.ts` et `admin/lib/db/client.ts` : remplacer le driver HTTP
     `@neondatabase/serverless` (`neon()` tagged template) par un driver Postgres standard (`pg` ou
     `postgres.js`) avec un vrai pool de connexions — Coolify Postgres est un Postgres classique en
     TCP, pas le proxy HTTP de Neon. Conserver le pattern de singleton paresseux (connexion créée au
     premier appel, jamais au chargement du module) pour ne pas reproduire le crash de build Vercel
     déjà rencontré et documenté plus haut dans ce fichier.
   - `admin/lib/uploads.ts` : remplacer l'écriture locale (`fs.writeFile` vers `data/uploads/`) par
     un upload S3 (`@aws-sdk/client-s3`, `PutObjectCommand`) vers le stockage retenu à l'étape 3.
     Stocker l'URL publique résultante dans la colonne `images` au lieu d'un chemin local.
   - Retirer `app/uploads/[...path]/route.ts` (et son équivalent admin) une fois les images servies
     directement depuis l'URL S3.
   - Réuploader manuellement la/les photo(s) produit actuellement en ligne vers le nouveau stockage,
     mettre à jour la ligne en base correspondante.
6. **Déployer le site** (`app/`) comme ressource Application dans Coolify (source Git), avec toutes
   les variables d'env : nouveau `DATABASE_URL`, clés Stripe, clés Sendcloud, clés PostHog,
   identifiants S3/MinIO.
7. **Pointer le DNS** : enregistrement A du domaine (une fois l'orthographe confirmée) vers
   `179.198.209.59`, depuis le compte client OVH.
8. **Admin** : reste sur Vercel (plan gratuit, décision déjà prise et assumée) — juste mettre à jour
   ses variables d'env (`DATABASE_URL`, identifiants S3) pour pointer vers la nouvelle base/le
   nouveau stockage sur le VPS, accessible depuis l'extérieur.
9. **Vérification bout en bout avant toute coupure** : connexion admin → ajout d'un produit test
   avec photo → confirmer le stockage S3/MinIO → confirmer l'affichage sur le site public une fois
   déployé → passer une commande test → confirmer que Stripe/Sendcloud/décrément de stock
   fonctionnent toujours avec la nouvelle base → confirmer que PostHog reçoit toujours les
   événements.
10. **Seulement une fois tout vérifié** : bascule finale (le DNS du point 7 fait déjà l'essentiel),
    garder `creadeline.vercel.app` comme filet de sécurité tant que la confiance dans la nouvelle
    stack n'est pas totale, avant de considérer Neon/Vercel comme obsolètes pour ce projet.
11. **Chantier SEO identifié en parallèle, à faire pendant cette migration** (voir aussi `TODO.md`
    §6/8) : créer `app/sitemap.ts` et `app/robots.ts` (absents, confirmé par `curl` → 404 sur les
    deux), corriger le bug "Charente-Maritime" resté dans la meta description de
    `app/app/layout.tsx` (doit être "Charente", déjà corrigé ailleurs sur le site), ajouter des
    `generateMetadata` par page sur les routes boutique/produit (actuellement toutes les pages
    partagent le même title/description que l'accueil), ajouter Open Graph/Twitter Card et un
    JSON-LD `schema.org/Product` sur les fiches produit, puis soumettre le sitemap via Google
    Search Console une fois le nouveau domaine en ligne (vérifié ce jour : le site n'est pas encore
    indexé par Google, `site:creadeline.vercel.app` ne remonte rien, faute de sitemap/Search
    Console configurés).

### Rappel sécurité pour la suite

Ne jamais faire passer un secret (mot de passe, clé privée, token) dans la conversation — toujours
via un fichier local (`touch` + `chmod 600` + `open -e` dans TextEdit) que Julien remplit lui-même.
La clé SSH de ce VPS vit dans `~/.ssh/creadeline_vps`, jamais ailleurs.
