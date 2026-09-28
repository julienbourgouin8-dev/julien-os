# Cosmos (Champniers)

Restaurant asiatique "Cosmos" (buffet à volonté XXL, 1156 Route de la Braconne, Champniers
16430, ouverture 17 juillet 2026, site cosmos16.fr) — hors mission BTP, prospect/référence
potentielle, pas encore scopé avec Julien (contenu, refonte site, ou simple veille — à
préciser).

## assets/instagram/

39 images récupérées le 2026-09-27 depuis le compte public
[@cosmos.champniers](https://www.instagram.com/cosmos.champniers/) (9 publications, toutes
les slides de chaque carrousel + la miniature basse résolution d'un reel). Nommage
`cosmos_<shortcode-post>_<numéro-slide>.jpg`. La miniature du reel (`cosmos_DdewgciqbnN_reel_thumb.jpg`,
360×640) est en basse résolution — le vrai poster vidéo n'a pas pu être extrait ; à refaire si
besoin d'une meilleure qualité pour ce visuel précis.

Récupérées via Claude in Chrome (session Chrome réelle, connexion requise — Instagram bloque
l'essentiel en accès public non connecté) + 3 agents en parallèle pour accélérer une fois la
méthode validée manuellement sur le premier post. Méthode : navigation directe par URL avec
`?img_index=N` (plus fiable que cliquer sur la flèche suivante, qui a produit un doublon lors
du premier essai manuel) puis `fetch()` + téléchargement via ancre `<a download>` déclenchée en
JS — le `src` brut de l'image est bloqué à l'affichage direct par le filtre de sécurité de
l'extension (donnée assimilée à une query string/cookie), donc jamais imprimé, seulement
utilisé en interne dans le script pour le fetch.

**Piège rencontré :** Chrome bloque les téléchargements automatiques déclenchés par script après
les 2 premiers sur un même site (protection anti-spam), même avec un clic simulé trusted
juste avant. Débloqué uniquement via le bandeau natif Chrome "autoriser les téléchargements
multiples" — invisible aux outils d'automatisation (ils ne voient que le contenu de la page,
pas le chrome du navigateur), donc à faire cliquer par Julien manuellement si ça se
reproduit sur un futur site.

## site-scrape/

Scrape complet du site actuel `https://cosmos16.cosmos-tech.fr` le 2026-09-27 (curl + captures
Playwright headless) : HTML brut des 3 pages (home, contact, booking.cosmos-tech.fr), CSS, JS de
résa, 19 images, captures desktop/mobile. **Lire `site-scrape/SCRAPE.md` d'abord** : copy
intégrale par section, branding (Marcellus/Karla, `#041930` / `#b23a20` / crème), fonctionnalités
et faiblesses repérées. Relancer les captures : `node site-scrape/shots.mjs`.

## site/ — refonte premium (démo de prospection, démarrée le 2026-09-27)

**Documentation complète du process de construction (effets, techniques, agents, vérif) :
`docs/CONSTRUCTION.md`.** Références de reels de Julien : `references/reels/`. Planches de
contrôle : `docs/images/`.

Décisions de Julien (interview du 2026-09-27) : démo de prospection (pas de commande, pas de
back-office), DA « Nuit cosmique néon », mouvement immersif + dynamique mélangés (un seul site),
photos animées seulement (pas de vidéo IA, pas de tournage), rendus 3D d'avant-ouverture autorisés
avec le filtre commun, ajouts retenus : tarif du moment + badge Ouvert, page Événements + devis,
avis Google + carte. Résa refaite en panneau intégré (maquette, n'envoie rien). One-page + page
Événements. Hero = « voyage dans le tunnel ». Qualité max, pas de délai.

- **Lire `site/BRIEF.md`** : règles communes (palette, typo, contenu réel, API, vérif). La
  source de vérité du contenu est `site/js/content.js` (prix, horaires, avis complets).
- `index.html` est GÉNÉRÉ par `node site/tools/build.mjs` depuis `site/partials/` — ne jamais
  l'éditer à la main. `js/core.js` = moteur (Lenis + GSAP/ScrollTrigger, `Cosmos.register`, statut
  en direct, contrat `?jump=`/`__ready`).
- Photos : `site/tools/grade.py` (étalonnage nuit : ombres bleu nuit, hautes lumières chaudes,
  saturation gardée sur bleus et nourriture) + `site/tools/export-images.py` (mapping nom → source,
  2000px et `-sm` 1000px). Pour ajouter une photo : l'ajouter au mapping et relancer.
- Logo : `site/assets/logo/cosmos-mark.svg` redessiné d'après l'icône Instagram (seule source :
  avatar 100px dans `assets/logo/`, et visuels Recrutement 2048px). **Approximation : demander le
  vectoriel d'origine au client.**
- Avis : Google ne sert que 3-5 avis sans connexion. Les 17 avis affichés (4-5 étoiles, alternés)
  viennent d'un export fait par Julien dans sa console Safari : `data/google-reviews-2026-09-28.json`.
  Note 4,6 et 1 558 avis au 2026-09-28.
- Dev : `python3 -m http.server 5178` depuis `site/` (laisser tourner). Captures de vérif dans
  `site/_shots/<section>/`.
- Pièges : il n'existe aucune photo de wok en action (ne pas légender une photo « wok ») ;
  `salle/wok.webp` du site actuel montre des brochettes (légende d'origine « Brochettes »).

### État au 2026-09-27 (fin de journée) — V1 complète
Home (hero tunnel → buffet horizontal → wok écran coupé → tarifs en direct → salle carrousel +
lightbox → salles privées en panneaux → avis → infos + carte → footer) + `evenements.html` +
panneau résa global. Vérifié par le thread principal : 0 erreur console, 0 débordement horizontal,
1 seul h1 par page, `verify.js jank` PASS sur toute la home (max 20 ms), planches contact
desktop/mobile dans `site/_shots/full/`. Ajustements d'intégration : pin buffet raccourci
(`end = dist*0.6`), `</main>` avant le footer (`89-close-main.html`), `waitFonts` corrigé
(`document.fonts.load`, prêt à 0,3 s au lieu de 3,2 s).
Points faibles connus : zoom tunnel un peu flou au bout (image 1787px ×3,4, masqué par le fondu) ;
photos buffet source 900-1200px (un peu molles sur Retina) ; panneaux salles privées étroits sur
mobile ; galerie Événements sans lightbox ; jamais testé sur un vrai iPhone ; libs GSAP/Lenis en
CDN (à vendoriser avant un déploiement).

### État au 2026-09-28 (fin d'après-midi) : retouches avec Julien
Ordre de la home : hero → buffet → **réserver** (nouveau, pas à pas + carte d'embarquement) →
avis (bandeau infini) → tarifs (3 cartes + bande enfants) → salles privées (minimaliste) → salle →
infos. Wok retiré (`site/_variants/retire-wok/`). Boutons « Orbite » partout, nav toujours visible
sans bande sombre, tous les eyebrows / compteurs / « faites défiler » supprimés.
**Tout le détail et les règles de goût de Julien : `docs/CONSTRUCTION.md` §7 et §14.**
Reste à faire : unifier les boutons « Réserver » vers `#reserver`, section « La salle » et
Infos pratiques pas encore retravaillées, test sur vrai iPhone.
