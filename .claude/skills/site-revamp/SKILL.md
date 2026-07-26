---
name: site-revamp
description: >-
  Use when someone asks to rebuild, modernize, or refonte an existing business
  website (especially BTP/trades) into a premium scroll-driven animated site
  while preserving its real content — reviews, certifications, partner logos,
  business stats. Trigger on "refais ce site", "modernise ce site", "recrée le
  site de [entreprise]", "refonte premium", "rebuild this old website", or any
  request to turn a dated existing business site into a modern one. This is
  the client-facing offer skill — it always starts from a real existing
  business, never a from-scratch invented brand. For a from-scratch stylized
  demo site meant for Instagram content (no real client, no real content to
  preserve), use `showcase-reel` instead.
---

# Site Revamp — refonte premium d'un site existant

Tu prends un site business existant (typiquement BTP : plomberie, chauffage,
électricité) au rendu "thème générique daté", et tu le reconstruis en site
scroll-animé premium — **en gardant tout le contenu de confiance réel**. C'est
l'offre d'entrée gratuite pour décrocher un client (ETS Lévesque en est la
référence : `projects/ets-leveque-site/`, relis son `CLAUDE.md` avant de
démarrer un nouveau build, il documente des dizaines de bugs réels déjà
résolus).

Différence avec `showcase-reel` : ici il y a un vrai client, un vrai site
existant, du vrai contenu qui ne doit jamais être inventé ni raccourci. Si la
demande ne part pas d'un site/business réel, c'est le mauvais skill —
redirige vers `showcase-reel`.

---

## Étape -1 — Choisir le prospect (si Julien ne donne pas de nom)

Julien peut demander directement "le plombier suivant qu'on n'a pas fait,
celui avec le plus d'avis" plutôt que de nommer l'entreprise. Dans ce cas :

1. Ouvrir le Google Sheet "BTP Leads - Périgueux" (voir `connections.md`,
   alimenté par le skill `lead-gen`), l'onglet du bon métier.
2. Filtrer sur statut "À contacter" (jamais "Contacté"), trier par nombre
   d'avis décroissant, prendre le premier — c'est ce qui a été fait pour
   passer d'ETS Lévesque à R.E.P 24.
3. **Pas de site web trouvé ?** Ça arrive même en ciblant des entreprises
   plus grosses (l'ICP visé) — ce n'est pas garanti. Repli : la page
   Facebook de l'entreprise devient la source de contenu réel (avis, photos,
   coordonnées, description) à la place du site. Les mêmes règles
   s'appliquent (jamais de contenu inventé/raccourci) — Facebook remplace le
   site comme source, il ne change rien au reste du process.
4. Confirmer le choix avec Julien avant de lancer le scraping complet.

## Étape 0 — L'interview, ancrée dans le site réel

Contrairement à un brief "carte blanche", ici tu pars toujours de l'existant.
Demande (groupé, avec un chemin "tu décides" sur chaque question créative) :

1. **Le site actuel** — URL ou capture, pour voir la structure de conversion
   existante (hero → preuve → services → avis → contact) et ce qui doit
   rester dans le même ordre. Pour l'extraction du contenu réel (texte des
   pages, avis Google, images) préférer **Playwright MCP** (installé le
   2026-07-21, voir `connections.md`) à `claude-in-chrome` — lecture directe
   du DOM/JSON, moins cher en tokens, plus rapide sur du scraping répétitif
   (ex. faire défiler une fiche Google Maps pour en extraire tous les avis).
   Garder `claude-in-chrome` pour la vérification visuelle finale (captures
   d'écran, comportement interactif).
2. **Couleurs/logo/polices existants** — à réutiliser comme base, pas à
   remplacer par une palette générique. Un ajustement (ex. orange plat →
   cuivre, tiré du vrai métier) se justifie s'il raconte quelque chose de
   vrai sur l'entreprise, jamais juste pour faire "joli".
3. **Contenu de confiance à préserver mot pour mot** : avis clients, notes,
   certifications, logos partenaires, coordonnées, textes de service, stats
   métier réelles. **Règle non négociable** : jamais de logo tiers recoloré
   ou retouché, jamais de stat inventée, jamais un avis raccourci ou
   paraphrasé. Si l'entreprise a une vraie donnée chiffrée un peu insolite
   ("3990 mètres de cuivre déroulés en 2025"), c'est ça la signature — pas un
   chiffre générique.
4. **La question de conversion** : quand quelqu'un quitte la page, quelle est
   LA chose qu'il doit ressentir ou faire ? (devis, appel, confiance) — ça
   cadre tout le reste du build.
5. **Image, jamais vidéo** (recadré le 2026-07-21 — décision explicite de
   Julien, pas une préférence par défaut). Ce skill sert maintenant une
   stratégie de volume — plusieurs prospects, 2-3 versions chacun — ce qui
   rend la génération vidéo (coûteuse, lente à itérer) incompatible avec
   l'échelle visée. **Ne propose plus de lane vidéo.** Tout l'effet
   "premium" vient de l'image (réelle ou retouchée) + de l'animation
   CSS/JS + de la typo — jamais d'un clip généré. `#service-pac` dans
   `ets-leveque-site` (deux photos qui se fondent, pas de vidéo, personne ne
   fait la différence en scrollant) est le patron à suivre partout, pas
   l'exception.
6. **Inventaire des images** — obligatoire, pas optionnel. Scraper toutes
   les images du site actuel (voir méthode Playwright/`curl`+`grep` HTML
   brut ci-dessus — ne jamais juger "il n'y a pas d'image" sur la seule foi
   d'un screenshot, le lazy-loading ment). Pour chaque image trouvée : est-
   elle réutilisable telle quelle, ou doit-elle être retouchée (texte
   dessus, recadrage, grading couleur) ? **Charge `visual-craft` à cette
   étape, systématiquement** — ce n'est plus un skill optionnel chargé "si
   une section en a besoin", c'est l'outil de travail par défaut de ce
   skill pour tout ce qui touche à l'image. Si le site n'a aucune image
   réutilisable, la source de secours est Pinterest — méthode : la
   recherche publique marche sans compte (`pinterest.com/search/pins/?q=`),
   lire le DOM/JSON directement (Playwright MCP préféré) plutôt que
   cliquer/scroller, prendre l'URL `i.pinimg.com` et remplacer le segment
   de taille par `originals` pour la meilleure résolution disponible.
   **Mise en garde licence, à ne jamais sauter** : Pinterest n'est pas une
   banque d'images libres de droits — la quasi-totalité des pins sont des
   repins d'un tiers, Pinterest ne clarifie pas qui détient les droits.
   Usage sûr : mood-board/référence de style uniquement. Avant d'intégrer
   quoi que ce soit sur le site final d'un client payant, passer par l'un
   de ces trois chemins : (a) commander une vraie photo équivalente, (b)
   retrouver la même image sur une source stock sous licence (Unsplash,
   Adobe Stock), ou (c) générer une image IA qui reprend le style repéré
   sans copier le pixel d'une photo existante. Jamais l'URL Pinterest brute
   en prod. Voir aussi `references/design-references/` pour la
   bibliothèque de goût déjà validée par Julien — jamais une image générée
   par IA ou du stock générique non retouché par défaut.
7. **Où ça se déploie** — local seulement, ou sur le Vercel du client.

## Étape 1 — Pitcher 2-3 concepts nommés

Avant de construire quoi que ce soit, propose 2-3 directions nommées à partir
du contenu réel extrait à l'étape 0 (jamais d'un brief fantasmé) :

- Un concept marqué **"(Recommandé)"**.
- Pour chaque concept : un nom, et un walkthrough concret — ce que le
  visiteur voit en haut, ce qui se passe au scroll, comment ça atterrit sur
  le contenu de preuve (avis/certifs) puis le contact. Pas une punchline
  abstraite, une vraie narration scène par scène.
- Laisse l'utilisateur choisir, blendre, ou dire "vas-y avec le recommandé".

Seulement après ce choix, tu construis — sauf mode volume (Julien peut
dire "fais 2-3 versions réelles direct", comme pour R.E.P 24) : dans ce cas
cette étape saute et l'Étape 2 ci-dessous pilote directement la production
des versions.

**Méthode d'exécution par défaut pour produire plusieurs versions : agents
en parallèle, un par version** (confirmé le 2026-07-21, ça a marché une
fois le partage de modèle corrigé sur R.E.P 24 — voir Étape 2). Ne pas
construire les versions une par une, en série, soi-même — lancer un agent
par concept, en parallèle, chacun dans son propre dossier pour ne jamais se
marcher dessus sur les fichiers partagés (`data.js`/`engine.js` du contenu
réel commun : lecture seule pour tous les agents, jamais d'écriture
concurrente).

## Étape 2 — Répartition des modèles (Opus / Sonnet)

L'interview, les concepts et la direction artistique (palette, typo, layout,
scénario de scroll) sont les décisions qui comptent le plus — fais-les avec
le modèle le plus capable disponible dans la session (`/model opus` avant de
démarrer l'étape 0 si ce n'est pas déjà le cas).

Une fois les concepts validés et la direction artistique arrêtée, repasse sur
Sonnet 5 (`/model sonnet`) pour la phase construction : extraction de frames,
CSS, JS, câblage scroll, vérification. La construction mécanique n'a pas
besoin du modèle le plus cher — les décisions de goût, si.

**Contrainte dure, pas une suggestion** (corrigé le 2026-07-21 après un
dérapage réel où des agents Opus avaient écrit toute la construction au lieu
de s'arrêter au plan) :
si cette étape est déléguée à un ou plusieurs subagents Opus, le prompt doit
dire explicitement "tu écris SEULEMENT le plan/la direction artistique
(palette, typo, scénario de scroll, structure de section) — tu n'écris PAS le
CSS/JS final, ça sera une passe Sonnet séparée." Se contenter de dire "charge
le skill `site-revamp`" ne suffit pas : un agent qui charge le skill peut
très bien lire cette phrase et construire quand même si le prompt ne
l'interdit pas noir sur blanc. Un agent Opus qui dérive vers la construction
complète doit être stoppé (`TaskStop`) — il n'existe aucun moyen de changer
le modèle d'un agent déjà lancé via `SendMessage` (il reprend sur son modèle
d'origine), donc la seule sortie est stop + relancer un agent neuf sur
Sonnet qui repart de l'état sur disque.

## Étape 3 — Direction artistique (avant de coder)

Décide et fige : palette exacte (hexs), pairing typo display+corps (jamais
les polices système par défaut — voir `frontend-design`), logo en SVG inline
si besoin de le retravailler légèrement, scénario de scroll section par
section. Charge le skill `frontend-design` pour le jugement esthétique
général ; ce skill-ci ne couvre que la mécanique et les règles propres au
genre "site scroll-animé" (`scroll-design-guidelines.md`). **Charge aussi
`visual-craft` systématiquement à cette étape** (recadré le 2026-07-21 —
ce n'est plus conditionné à "si une section en a besoin" : l'Étape 0 point 6
impose déjà un inventaire d'images à traiter sur chaque build, donc
`visual-craft` sert à chaque fois, pas occasionnellement).

**Animation : utiliser une vraie bibliothèque, pas du JS ad hoc**
(recadré le 2026-07-21 — la version précédente traitait GSAP/Lenis comme
optionnels, ce qui a produit des sites avec une seule technique de reveal
répétitive au lieu d'un vrai système d'animation). Charger GSAP +
ScrollTrigger (+ Lenis pour le smooth scroll) depuis un CDN par défaut, les
vendoriser en local seulement pour la prod. `engine-recipes.md` reste la loi
pour la mécanique canvas/frames quand il y a des frames à scruber ; pour
tout le reste (reveals, compteurs, marquees, parallax), GSAP/ScrollTrigger
plutôt que réinventer un `IntersectionObserver` maison à chaque fois — plus
rapide à écrire correctement, ce qui compte pour une stratégie de volume.
Exception : un site tellement simple (peu de sections, pas d'ambition
scroll-cinématique) que le coût d'installation de GSAP dépasse son
bénéfice — dans ce cas seulement, vanilla JS reste acceptable, mais ce doit
être un choix explicite, pas un défaut par paresse.

**Calibrer l'ambition sur `ets-leveque-site`, pas sur son `CLAUDE.md` seul**
(corrigé le 2026-07-21) : lire le `CLAUDE.md` d'`ets-leveque-site` donne les
bugs déjà résolus, pas le niveau de sophistication visuelle attendu. Avant
d'écrire le premier CSS d'un nouveau site, ouvrir concrètement
`ets-leveque-site/js/*.js` (12 fichiers, une technique distincte chacun :
typewriter, marquee, parallax, chorégraphie de chapitres, verrouillage
vidéo au scroll) et `css/tokens.css` — ça calibre ce que "premium" veut
dire ici, même quand le nouveau brief n'a aucune vidéo/photo réelle à
disposition (dans ce cas : chercher 3-4 techniques de mise en page/texte
distinctes plutôt qu'une seule technique de reveal répétée sur toutes les
sections — `js/stats.js` d'ETS Lévesque prouve qu'un compteur animé + un
survol dégradé peuvent être riches sans aucune image).

**Ne pas sauter la boucle critique de `frontend-design`** (brainstorm →
explore → plan → **critique** → build → **critique again**) : un scaffold
qui sort direct en construction sans repasse critique tend à produire
plusieurs concepts qui partagent la même anatomie de page dans le même
ordre — exactement le "rendu template" que `frontend-design` demande
d'éviter. Avant de considérer un concept fini, se demander explicitement :
est-ce que ça a l'air générique à côté d'`ets-leveque-site` ?

## Étape 4 — Construction

Vanilla HTML/CSS, GSAP/ScrollTrigger/Lenis par défaut pour le JS (voir Étape
3), pas de bundler, CDN en dev, vendorisé en local pour la prod.
`engine-recipes.md` ne s'applique qu'aux rares cas où il y a encore des
frames à scruber sur un canvas (crossfade de photos type `#service-pac`,
pas de vidéo) ; `mobile-reliability.md` reste pertinent pour tout ce qui
touche à l'autoplay/l'affichage d'image sur mobile même sans vidéo.

Structure de référence (reprend l'ordre déjà validé sur ETS Lévesque, à
adapter au concept choisi, pas à copier mot pour mot) : hero → chiffres
clés/preuve → activités/services → avis clients → partenaires → contact.
Chaque section un peu spécifique (crossfade d'images, split-screen, marquee,
parallax) a son propre scope JS (fonction/module ScrollTrigger dédié), sur
le modèle d'`ets-leveque-site/js/*.js` — un script par responsabilité, qui
`return` tôt si son élément cible n'existe pas sur la page.

**Passe de retouche finale, une fois le site assemblé** (ajouté le
2026-07-21). Le premier passage sur une image (Étape 0 point 6) se fait
avant d'avoir vu le site complet — logique, mais ça veut dire qu'une
retouche évidente une fois tout en place (un titre en overlay qui
manquait, un texte qui gagnerait à être positionné différemment sur
l'image maintenant qu'on voit la section juste avant/après) n'apparaît
souvent qu'à la fin. Prévoir explicitement ce second passage plutôt que de
considérer les images "faites" dès l'Étape 0 — c'est le moment de repasser
par `visual-craft` une dernière fois avec le contexte complet du site sous
les yeux.

## Étape 5 — Vérification

Implémente le contrat de dev décrit dans `engine-recipes.md`
(`?jump=<scrollY>` / `window.__ready`), puis lance `scripts/verify.js` :

```
node scripts/verify.js shot <url> out.png [w] [h]   # capture à une position de scroll
node scripts/verify.js jank <url>                    # test de jank (p95/max, jamais la moyenne)
```

Ça remplace une bonne partie des allers-retours "je scroll et je regarde" —
mais ça ne remplace pas une vraie passe sur téléphone pour tout ce qui touche
à l'autoplay/au verrouillage de scroll mobile (voir `mobile-reliability.md`,
plusieurs bugs n'apparaissent que sur un vrai iPhone).

## Étape 6 — Déploiement (optionnel, sur le Vercel du client)

Copie légère : `index.html` + libs vendorisées (`cp -RL` pour déréférencer
les symlinks) + seulement les assets réellement utilisés par le build final
(jamais les rushs bruts/images sources). `vercel deploy --prod --yes` depuis
ce dossier léger. Les nouveaux projets Vercel sont souvent derrière un mur de
connexion par défaut (Project → Settings → Deployment Protection) — dis-le
au client, ne change pas ce réglage à sa place.

---

## Garde-fous

- **Jamais de logo partenaire recoloré ou retouché.** Jamais.
- **Jamais de contenu réel inventé, raccourci ou paraphrasé** (avis,
  certifications, coordonnées, stats métier).
- Respecter `prefers-reduced-motion` partout, sans exception.
- Ne jamais coder en dur des identifiants/clés API dans le site livré.
- Si un site a déjà une réponse fonctionnelle et validée ("presque parfait"
  d'après un `CLAUDE.md` de projet existant), ne pas la retoucher sans qu'on
  te le demande explicitement — plusieurs sections d'`ets-leveque-site` sont
  annotées ainsi après de nombreux rounds de test réel, ne pas les rouvrir.

## Références visuelles

`references/design-references/` (racine du repo, pas dans ce dossier skill)
contient des captures que Julien a partagées comme goût de référence —
lire `INDEX.md` là-bas avant l'Étape 3. Leçon principale qui en ressort :
la plupart reposent sur une vraie photo pleine largeur en hero avec une typo
surdimensionnée qui déborde dessus, pas sur la couleur/typo seules — et la
règle "jamais de carte/jamais de glassmorphism" de
`scroll-design-guidelines.md` n'est pas absolue (plusieurs références de
bon goût utilisent l'un ou l'autre avec succès) : elle vise les sections
scroll-cinématiques texte-sur-vidéo spécifiquement, pas toute mise en page.

Cette bibliothèque grandit au fil des sessions (Julien ajoute des exemples
d'animation/typo au fur et à mesure) — la relire à chaque nouveau build, pas
seulement la première fois qu'elle a été peuplée. **Ne pas se limiter à la
capture statique** : si la référence est un vrai site encore en ligne (pas
juste une capture), aller l'ouvrir (Playwright MCP ou `claude-in-chrome`)
pour étudier le vrai timing d'animation et la structure de scroll, pas
seulement l'image figée — une capture ne montre qu'une frame, pas le
rythme. Objectif : s'inspirer du principe (comment le texte interagit avec
l'image, le rythme des transitions), jamais reproduire à l'identique.

## Fichiers de référence

- `mobile-reliability.md` — bugs réels mobile (autoplay, WebKit, scroll-lock,
  viewport) et leurs fix, avec la source des lessons
- `scroll-design-guidelines.md` — règles de style propres au genre
  scroll-animé (pas de cartes, zones de couleur, variété de layout)
- `engine-recipes.md` — mécanique canvas/frames/scroll, contrat de vérif
- `scripts/verify.js` — harnais de capture + test de jank
- `visual-craft` (skill séparé, **chargé systématiquement**, voir Étape 0
  point 6 et Étape 3) — retouche/compositing d'image, animation de photo
  fixe, écriture de section. C'est l'outil principal du volet image
  maintenant que la vidéo est exclue de ce skill (voir Étape 0 point 5).
