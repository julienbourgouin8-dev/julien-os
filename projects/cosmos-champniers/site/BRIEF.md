# BRIEF — Refonte premium Cosmos (démo de prospection)

Lu en entier par chaque agent AVANT d'écrire une ligne. La direction artistique est FIGÉE :
tu l'exécutes, tu ne la renégocies pas.

## Contexte
Cosmos : buffet à volonté asiatique géant (650 couverts) à Champniers (Angoulême), déco
"espace" : tunnels en arches bleues, plafonds planètes, néons, logo Saturne. Site actuel plat
(voir `../site-scrape/SCRAPE.md` + `../site-scrape/screens/`). On construit une démo premium très
dynamique pour décrocher le client. Julien veut du MOUVEMENT : scroll effects, carrousels, on
"rentre" dans les images, glissements gauche/droite. Qualité max, pas pressé.

## Direction artistique : « Nuit cosmique néon »
- Fond espace profond, photos étalonnées nuit bleue (déjà fait, ne pas re-filtrer en CSS
  lourd ; un léger `vignette`/dégradé pour lisibilité du texte est OK).
- Palette = variables de `css/base.css` UNIQUEMENT (`--night --navy --navy-2 --navy-3 --blue
  --neon --warm --warm-2 --text --text-2 --text-3 --line --glass`). Aucune couleur hors palette.
  `--blue` = accent principal (CTA, glow). `--warm` = prix et touches "nourriture".
- Typo : Marcellus (`--font-display`) pour titres/wordmark/prix, Karla (`--font-body`) pour le reste.
  Classes utilitaires : `.display .h1 .h2 .h3 .lead .eyebrow .eyebrow--warm .btn .btn--primary
  .btn--ghost .pill .price .container .section .media .sr-only`.
- Un seul geste fort par écran. Pas d'empilement d'effets gadget. Texte sur image = directement
  sur l'image (dégradé de lisibilité), pas dans une boîte.
- Références de Julien (captures de reels, structure pas peau) : ERA Residence (titre serif
  géant sur photo plein écran, image qui se scinde en panneaux), jakeuiux (écran coupé liste à
  gauche / photo à droite, gros plans plein écran).

## Règles de contenu (non négociables)
- TOUT le contenu factuel vient de `js/content.js` (`window.COSMOS_DATA`) : prix, horaires,
  textes, avis, coordonnées. Jamais inventé, raccourci ou paraphrasé. Avis : texte complet
  (un "Lire la suite" qui déplie le texte entier est OK).
- Tu peux écrire des titres/accroches courtes de section NOUVELLES (ex. "Bienvenue à bord",
  "Choisissez votre planète") tant qu'elles n'affirment aucun fait nouveau (pas de chiffre,
  pas de "chef étoilé", pas de "depuis 1998", pas de plat qui n'est pas listé).
- Le texte injecté par JS depuis content.js doit AUSSI être présent en HTML statique (SEO) :
  écris le texte en dur dans ton partial en le copiant exactement de content.js. Le JS n'injecte
  que ce qui est dynamique (statut en direct, prix du moment).

## Images
`assets/img/<nom>.webp` (2000px) et `<nom>-sm.webp` (1000px), déjà étalonnées. Toujours
`srcset="assets/img/x-sm.webp 1000w, assets/img/x.webp 2000w" sizes="..."`, `width`/`height`
renseignés, `loading="lazy"` + `decoding="async"` sauf images du premier écran. `alt` descriptif en
français. Liste : allee-sushi-render(-wide) buffet-allee buffet-comptoir buffet-lanternes
buffet-long(-b) desserts espace-bg facade fromages fruits fruits-de-mer grill logo-constellation
logo-mur logo-neon pizzas prive-ecran prive-reel prive-table-ronde salle-allee salle-arcade salle-bar
salle-bar-b salle-bar-wide salle-bleue salle-bleue-b salle-bois salle-cerisier salle-lanternes
salle-lounge salle-neons salle-orbites salle-planetes salle-planetes-b salle-planetes-reel
salle-portail salle-tables salle-tables-wide salle-vitrage sashimis sushi-makis sushi-saumon
sushi-sashimis tunnel-arches tunnel-reel tunnel-reel-2 tunnel-render tunnel-render-b
tunnel-render-wide viandes-griller wok. Planche contact : ouvre les fichiers pour choisir.
Logo : `assets/logo/cosmos-mark.svg` (inline-le si tu l'animes ; renomme ses id internes pour
éviter les collisions : `cm-behind`, `cm-planet` sont déjà pris par la nav → préfixe les tiens).

## Architecture (lis `js/core.js` en entier, son en-tête documente l'API)
- `index.html` est GÉNÉRÉ : `node tools/build.mjs` assemble `partials/*.html` (ordre alpha) et
  injecte `css/sections/*.css` + `js/sections/*.js`. Ne jamais éditer `index.html` à la main.
  Relance le build après chaque modif (sans risque en parallèle).
- Tu ne touches QU'À tes fichiers : `partials/<NN>-<id>.html`, `css/sections/<id>.css`,
  `js/sections/<id>.js` (+ `evenements.html` pour l'agent Événements). LECTURE SEULE sur
  `css/base.css`, `js/core.js`, `js/content.js`, `partials/_*.html`, `partials/00-nav.html`,
  `tools/`, `assets/`. Besoin d'un changement partagé ? Écris-le dans ton rapport final, ne le
  fais pas.
- Chaque section : `<section id="<id>" data-section="<id>" class="...">`. Tout ton CSS préfixé
  `#<id>` (ou un préfixe de classe unique à toi). Ton JS :
  `Cosmos.register("<id>", ({ el, gsap, ScrollTrigger, reduced, mobile, data, jump }) => {...})`.
- Animations : GSAP + ScrollTrigger (déjà chargés, Lenis branché). Pas d'IntersectionObserver
  maison pour les reveals. Pins : `pin: true` + `anticipatePin: 1`, jamais de pin imbriqué dans
  un autre pin. Utilise `invalidateOnRefresh: true` sur tout ce qui dépend de la taille d'écran.
- `reduced` : aucune animation, état final visible, aucun pin (contenu lisible en scroll normal).
- `jump` : pas d'intro jouée, état cohérent avec la position de scroll.
- Réservation : tout bouton de réservation = `<a href="https://booking.cosmos-tech.fr" data-resa>`
  (optionnel `data-resa="midi"`/`"soir"`). Statut en direct : `<span data-live-status></span>` et
  `<span data-live-price></span>` sont remplis par core.js. `data.status()` renvoie l'objet complet.
- Mobile (390px) traité comme un vrai design, pas un repli : pas de scroll horizontal parasite
  (`overflow-x: clip` sur ta section si besoin), cibles tactiles ≥ 44px, `100svh`/`100lvh`
  plutôt que `100vh` pour les plein-écran.
- Perf : animer seulement `transform`/`opacity`/`clip-path` ; `will-change` posé seulement pendant
  l'animation ; pas de filter/blur animé sur de grandes surfaces.

## Vérification (obligatoire avant de rendre)
- Scripts temporaires : dans TON sous-dossier (`site/_shots/<id>/` ou un dossier temporaire
  nommé à ton id), jamais à la racine d'un dossier partagé (un script a été écrasé le 2026-09-27).
- Serveur local déjà lancé : `http://localhost:5178/` (NE JAMAIS le tuer, NE JAMAIS lancer un autre
  serveur sur 5178).
- Captures : `node /Users/julien/julien-os/.agents/skills/site-revamp/scripts/verify.js shot
  "http://localhost:5178/?jump=<y>" <out.png> 1440 900` puis même chose en `390 844`. Et
  `verify.js jank "http://localhost:5178/"` si ta section a du scroll animé. Sauve tes captures
  dans `site/_shots/<id>/`.
- OUVRE et REGARDE tes captures (outil Read) : début, milieu et fin de chaque animation, desktop
  ET mobile. Un script qui passe n'est pas une preuve. Corrige ce qui est moche avant de rendre.
- Vérifie la console : zéro erreur JS venant de ta section.
- Interdits : navigateur visible (`headless: false`), chrome-devtools-mcp, Higgsfield ou toute
  génération IA payante, `pkill`, git commit.

## Rapport final (court, en français)
Fichiers créés, scénario d'animation réel (ce qui se passe au scroll), chemins des captures
vérifiées, points faibles restants, et changements partagés demandés (s'il y en a).
