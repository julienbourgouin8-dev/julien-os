# Site CréA'deline — journal de session (dernière mise à jour 2026-08-12)

Contexte à charger avant de reprendre : ce fichier + `TODO.md` (plan
e-commerce brique par brique, toujours valable pour les phases futures) + le
code dans `app/`. Le site tourne en local avec `npm run dev` depuis `app/` →
http://localhost:3000.

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

## Reste à faire / en attente

- **Email de contact** : toujours vide, en attente que Julien confirme
  l'adresse réelle d'Adeline.
- **Nom de domaine propre** (type creadeline.fr) : pas fait, le site tourne
  sur le sous-domaine gratuit `creadeline.vercel.app`. À faire si/quand
  Julien achète un domaine.
- Tout le plan e-commerce (Stripe/Supabase/pages produit individuelles) reste
  dans `TODO.md`, phases futures non commencées.
