---
name: lead-gen
description: >-
  Trouve des entreprises BTP, tous corps de métier (nom, note Google, tel,
  site, email, secteur NAF confirmé, effectif) en scrapant Google Maps
  directement via le navigateur (gratuit, pas d'API payante) sur une ville
  + ses communes limitrophes, complète tel/email manquants en scrapant le
  site web de chaque entreprise (script d'enrichissement en masse), puis
  écrit le tout dans un onglet dédié au métier d'un même Google Sheet
  ("BTP Leads - Périgueux" — un onglet par métier, ex. "Plombiers
  Chauffagistes", "Electricien"). Trigger sur "trouve-moi des leads
  plombier Périgueux", "cherche des prospects BTP", "génère des leads pour
  [métier] à [ville]", "trouve tous les [métier] de [ville] et alentours",
  "fais la même chose pour les électriciens/couvreurs/maçons...". Zone de
  référence : Périgueux + communes limitrophes (Boulazac, Trélissac,
  Chancelade, Coulounieix-Chamiers), cohérent avec l'ICP documenté dans
  `context/about-business.md` — réutilisable pour n'importe quel corps de
  métier BTP, pas figé sur la plomberie. Alimente le pipeline
  `site-revamp` (trouver un prospect → lui proposer une refonte gratuite
  de site) plutôt que de le remplacer.
---

# Lead Gen — trouver des prospects BTP

Automatise ce que Julien faisait à la main pour trouver ETS Lévesque :
chercher des entreprises BTP dans une zone donnée sur Google Maps,
récupérer leurs coordonnées, compléter via leur site web, et déposer le
tout trié dans un onglet dédié au métier d'un Google Sheet prêt à
travailler. **100% gratuit** : pas d'API payante, pas de carte bancaire —

## Mode d'exécution — un métier vs plusieurs (agents en parallèle)

**Un seul métier demandé** ("trouve-moi des leads plombier Périgueux") :
exécuter les étapes ci-dessous directement dans la conversation
principale, comme avant. Pas de changement.

**Plusieurs métiers demandés en une fois** ("fais pareil pour couvreurs,
maçons, peintres" — le cas du balayage du 2026-07-23 sur 10 corps de
métier, qui a pris tout le temps de la session car fait en séquence) :
**spawn un Agent par métier, en parallèle, dans le même message** (un seul
tour d'appels d'outils avec N invocations `Agent`, pas N tours
successifs). Chaque agent :

- Prend `subagent_type: lead-gen-scraper` (agent formalisé dans
  `.claude/agents/lead-gen-scraper.md`, pinné sur Sonnet — pas besoin d'Opus
  pour du scraping mécanique), `run_in_background: true` (défaut).
- Est responsable de **toute l'Étape 1** (ci-dessous) pour son métier
  seul : toutes les communes de la zone, scroll complet, filtrage
  catégorie, dédoublonnage interne, récupération des URLs de site. Le
  prompt doit être autonome — l'agent démarre à froid, sans mémoire de
  cette conversation : lui donner le métier, la ville + communes
  limitrophes, et rappeler explicitement les pièges déjà documentés plus
  bas (scroll insuffisant, "maçon" mal interprété par Maps, réattribution
  par catégorie réelle plutôt que terme de recherche).
- **Doit créer son propre onglet dédié** (`tabs_create_mcp`) avant toute
  navigation, et toujours cibler ce `tabId` précis dans ses appels
  suivants — ne jamais réutiliser l'onglet 0 (l'onglet actif de Julien) ni
  celui d'un autre agent. C'est la seule garantie d'isolation quand
  plusieurs agents pilotent le même navigateur Chrome en même temps.
- Écrit son résultat brut dans
  `projects/leads-btp-perigueux/<métier>-<date>-raw.json` (liste d'objets
  `name, rating, reviews, phone, address, website`) plutôt que de le
  retourner en texte — évite de saturer le contexte de l'orchestrateur
  avec des dizaines de fiches par métier.

**Attendre que tous les agents se terminent** (notification de complétion
de chaque tâche) avant de continuer — ne jamais avancer sur l'Étape 2 avec
des résultats partiels, et ne jamais inventer un résultat d'agent pas
encore revenu. Une fois tous les fichiers `*-raw.json` écrits, la
conversation principale reprend la main pour l'Étape 2 (enrichissement)
et la suite — ces étapes-là restent scriptées et séquentielles (aucun
navigateur impliqué, donc aucun besoin de parallélisme), jusqu'à la
validation humaine avant écriture au Sheet (Étape 3).

---
Google Maps est scrapé directement via le navigateur
(`mcp__claude-in-chrome__*`, ou **Playwright MCP** — installé le 2026-07-21,
voir `connections.md` — préférable pour l'extraction pure de données : il
lit le DOM/JSON directement au lieu de raisonner sur des captures d'écran,
moins cher en tokens et plus rapide sur du scraping répétitif comme une
liste de résultats Maps. Garder `claude-in-chrome` pour tout ce qui demande
un vrai jugement visuel — repérer le bon bouton, distinguer un panneau
d'un autre), le reste via de simples requêtes HTTP
(`.venv/bin/python3`, `requests` de la stdlib `urllib`). Validé de bout en
bout sur deux métiers réels (plombiers/chauffagistes : 24 leads, 17
emails ; électriciens : 23 leads, 6 emails) — le pipeline entier (recherche
Maps → enrichissement → SIRENE → écriture sheet) est agnostique au métier,
seul le terme de recherche ("plombier"/"électricien"/...) et le nom de
l'onglet changent d'un run à l'autre.

## Étape 0 — Vérifier le prérequis Sheets (une fois, pas à chaque run)

```
gws auth status
```

Doit lister `https://www.googleapis.com/auth/spreadsheets` dans `scopes`.
Si absent : `gws auth login -s gmail,calendar,drive,sheets` (inclure les
services déjà utilisés, `-s` remplace la liste). Si les commandes `gws
sheets` échouent quand même avec une erreur 403 "API has not been used" :
l'API Google Sheets doit être activée manuellement par Julien sur
`https://console.cloud.google.com/apis/api/sheets.googleapis.com/overview?project=<PROJECT_ID>`
(pas quelque chose que Claude Code peut faire à sa place). Ne pas
continuer sans ce prérequis réglé.

Vérifier aussi la connexion navigateur avant de commencer :
```
ToolSearch: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__find,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__browser_batch"
```
puis `tabs_context_mcp{createIfEmpty:true}`. Si "Browser extension is not
connected" : demander à Julien de vérifier que c'est bien **Google Chrome**
(pas Brave/un autre navigateur Chromium — l'extension s'installe dessus
mais le pont d'automatisation ne s'y connecte pas), extension installée
via claude.ai/chrome, connecté avec le même compte, Chrome redémarré
depuis l'install. Ne pas boucler sur des re-essais aveugles au-delà de 2-3
tentatives — s'arrêter et demander un diagnostic concret (capture de
`chrome://extensions/`) si ça persiste.

## Étape 1 — Scraper Google Maps, ville + communes limitrophes

Une seule recherche "plombier <ville>" plafonne souvent à ~8 résultats
même quand le marché en compte plus — **toujours interroger la ville
cible ET ses 3-5 communes limitrophes séparément**, pas une seule requête.
Pour "Périgueux et alentours", ça a donné : Périgueux, Boulazac,
Trélissac, Chancelade, Coulounieix-Chamiers → 23 entreprises uniques au
lieu de 8.

Pour chaque commune :
```
browser_batch: navigate → "https://www.google.com/maps/search/<métier>+<commune>"
              → computer wait 2s
```
puis `get_page_text` sur l'onglet : la liste de résultats donne déjà, par
fiche, **sans avoir besoin de cliquer dedans** : nom, catégorie, note,
nombre d'avis, adresse, horaires, téléphone. Un clic individuel par fiche
n'est ni nécessaire ni fiable (l'URL Maps ne se met pas toujours à jour de
façon exploitable au clic — abandonné comme clé de dédoublonnage).

**Erreur réelle commise une fois (à ne jamais reproduire) : un seul
`get_page_text` sans scroller ne capture que les 7-8 premières fiches
visibles à l'écran.** Sur un run "électriciens", ça a fait rater plus de
50 entreprises sur 77 réellement présentes (dont les deux plus gros avis
du lot, 116 et 77 avis) — Julien a dû les retrouver lui-même à la main et
me les recoller. **Toujours scroller le panneau de résultats
(`computer` scroll, plusieurs fois) jusqu'à ce que deux scrolls
consécutifs ne fassent plus apparaître aucun nom nouveau**, avant de
passer à la commune suivante — ne jamais se contenter du premier
`get_page_text`, même si les premiers résultats ont l'air complets.

**Constat plus large (2026-07-23) : ce défaut de scroll insuffisant a
touché la quasi-totalité des runs précédents, pas juste électriciens.**
Un rescan profond a fait passer "plombier Périgueux" seul de 24 fiches
connues à 53. **Avec Playwright MCP, préférer un scroll JS programmatique
au scroll souris `computer`** — bien plus fiable pour aller jusqu'au bout
de la liste :
```js
async () => {
  const feed = document.querySelector('div[role="feed"]');
  let lastCount = 0, stableRounds = 0;
  for (let iter = 0; iter < 40 && stableRounds < 2; iter++) {
    feed.scrollTop = feed.scrollHeight;
    await new Promise(r => setTimeout(r, 700));
    const count = feed.querySelectorAll('a[href*="/maps/place/"]').length;
    if (count === lastCount) stableRounds++; else stableRounds = 0;
    lastCount = count;
  }
  const cards = Array.from(feed.children).filter(c => c.querySelector('a[href*="/maps/place/"]'));
  return { totalCards: cards.length, texts: cards.map(c => c.innerText) };
}
```
Passé en `browser_evaluate` (avec `filename` pour écrire le résultat dans
un fichier plutôt que de saturer le contexte). Chaque `texts[i]` est le
`innerText` brut d'une fiche (nom, note(avis), catégorie · adresse,
horaires/tel) — à parser ensuite côté script, pas dans le navigateur.
Si `div[role="feed"]` est absent, Maps a redirigé directement vers la
fiche d'un établissement unique (résultat sans ambiguïté) : lire
`document.querySelector('div[role="main"]').innerText` à la place.

**Piège de requête : un terme de métier seul peut se faire interpréter
comme un nom de ville par Maps et basculer en mode itinéraire au lieu
d'une recherche.** Repéré sur "maçon Boulazac" → Maps a compris "Mâcon"
(la ville de Saône-et-Loire) et a affiché un itinéraire Mâcon→Boulazac au
lieu des résultats de recherche. Utiliser "maçonnerie" à la place de
"maçon" évite le problème.

**En réattribuant les fiches à un métier, se fier à la catégorie Maps de
la fiche elle-même, pas au terme de recherche utilisé pour la trouver** —
une recherche "maçonnerie" remonte aussi des plombiers, électriciens,
etc. Sans cette réattribution, les compteurs par métier sont gonflés de
contamination croisée et certains prospects sont classés au mauvais
endroit.

**Filtrer manuellement les catégories hors-cible** en lisant le libellé
sous le nom : magasins de fournitures ("Magasin d'articles de salle de
bains", "Fournisseur d'équipements de chauffage") et autres corps de
métier (ramoneur) ne sont pas des leads de prospection, à exclure même
s'ils remontent dans les résultats "plombier".

**Dédoublonner par nom d'entreprise** entre les communes (une même boîte
ressort souvent sur 2-3 recherches limitrophes) — c'est la clé de
dédoublonnage retenue, plus simple et fiable que l'URL Maps par fiche.

**Note sur la stabilité des résultats** : Google Maps peut renvoyer une
composition légèrement différente entre deux chargements de la même
requête (une fiche présente à un instant peut manquer au suivant, une
nouvelle peut apparaître). Si une fiche vue une fois manque ensuite,
inutile de s'acharner à la retrouver — garder les données déjà captées et
continuer, quitte à laisser le champ site web vide pour celle-là.

**Récupérer les URLs de site web** séparément via `find` (le texte de
liste seul ne donne pas les hrefs) :
```
find: "website href link for <nom exact de l'entreprise>"
```
Certaines entreprises n'ont pas de "Site Web" du tout dans Maps (laisser
vide, pas bloquant) ; d'autres ont un lien Facebook en guise de site — le
signaler comme tel (`source_email: "réseau social (non scrapé)"`), ne pas
tenter de le scraper comme un site classique.

**Trier par nombre d'avis décroissant** avant de continuer — correspond au
tri ICP documenté dans `context/about-business.md`.

## Étape 2 — Enrichir en masse via les sites web

Construire un fichier JSON (liste d'objets `name, rating, reviews, phone,
address, website, email`) à partir des données de l'étape 1, puis :

```
.venv/bin/python3 .claude/skills/lead-gen/scripts/enrich_leads.py leads.json > leads_enrichis.json
```

Le script ne remplit que les champs `phone`/`email` encore vides, saute
les URLs de réseaux sociaux, gère proprement les sites cassés (DNS mort,
certificat SSL invalide, 404) sans planter le lot entier — juste ce lead
reste sans email, le script continue sur les suivants. Sur le run réel :
~25% des sites ont donné un email exploitable, quelques erreurs réseau
normales (sites de petits artisans souvent mal maintenus).

**Repli "recherche web générale"** (pour les leads sans site web ni page
sociale trouvée par recherche directe du nom) : chercher
`"<nom entreprise>" <commune>` sur Google plutôt que de se limiter à une
seule source — Pages Jaunes, Société.com, Kompass, un annuaire local,
LinkedIn, ou un simple article de presse locale peuvent tous contenir un
lien vers la page Facebook, le vrai site, ou directement un email/tel.
**Toujours vérifier l'adresse/commune avant d'utiliser un résultat** — le
risque d'homonyme existe sur chaque source, pas seulement Facebook (déjà
rencontré : un "JBS Plomberie" à Lyon sans rapport avec celui de
Périgueux). Pages Jaunes reste souvent le résultat le plus fiable en
premier (fiche déjà rattachée à la bonne ville, résultat quasi garanti
pour toute entreprise française déclarée) mais ce n'est plus la seule
source à essayer — parcourir les 3-5 premiers résultats avant de conclure
qu'il n'y a rien. Si un résultat pointe vers une page Facebook, appliquer
l'étape "Coordonnées" ci-dessous.

**Repli "annuaire économique de la mairie"** — beaucoup de petites communes
françaises publient un annuaire des "acteurs économiques" locaux sur leur
propre site officiel (`<commune>.fr › Acteurs`), avec tel **et email**
directement listés — repéré deux fois sur Coulounieix-Chamiers, systématiquement
un des meilleurs résultats quand il existe. Vérifier ce résultat en
priorité s'il apparaît dans la recherche Google générale.

**Repli "Mentions légales"** (déjà dans `scrape_website.py`, automatique) :
quand un site n'a qu'un formulaire de contact (l'email de destination
reste côté serveur, jamais envoyé au client — inspecter la page ne peut
rien y faire, ni même soumettre le formulaire pour "voir où ça part"), la
page "Mentions légales" (obligatoire légalement en France) liste souvent
un email du responsable de publication, différent du formulaire
commercial. Repéré sur un cas réel : formulaire seul en apparence, email
personnel trouvé sur `/mentions-legales/`.

## Étape 2bis — Repli navigateur (deux causes différentes, deux répliques)

`scrape_website.py` fait un simple fetch HTTP (`urllib.request`) — il ne
voit que le HTML brut renvoyé par le serveur, **jamais ce qui est ajouté
par du JavaScript après coup, ni du texte dessiné dans une image.** Deux
cas réels rencontrés qui donnent le même symptôme ("aucun email trouvé")
pour deux raisons différentes :

**Cas A — contact rendu en JavaScript (repéré sur un vrai site "epages")** :
le HTML brut ne contient réellement rien (vérifié : pas de faux `mailto:`,
pas d'`@` réel, juste des faux positifs CSS) mais la page une fois rendue
dans un vrai navigateur affiche l'email en clair. Repli : ouvrir le site
via `mcp__claude-in-chrome__navigate` + `get_page_text` (qui lit le DOM
après rendu JS, pas le HTML source) — pas besoin de lecture visuelle ici,
`get_page_text` suffit puisque c'est du vrai texte, juste injecté après
coup.

**Cas B — contact dessiné dans une image** (bannière Facebook, logo avec
tel/email intégrés graphiquement) : `get_page_text` ne le verra pas non
plus, puisque ce n'est pas du texte DOM du tout. Seule la lecture visuelle
d'un `computer` screenshot fonctionne ici.

**Réflexe pratique : essayer `get_page_text` en premier (moins cher, plus
rapide), passer au screenshot + lecture visuelle seulement si le texte
rendu ne donne toujours rien** — ça couvre le cas A sans mobiliser une
lecture d'image, et le cas B reste couvert en repli.

Un email peut aussi exister **sans être dans le texte de la page** — un
artisan met souvent son email dans la bannière/photo de couverture
Facebook (image graphique avec logo + tel + email dessinés dessus),
invisible à `scrape_website.py` qui ne lit que du texte/HTML. Repéré sur
un cas réel : email présent en toutes lettres sur la bannière Facebook,
absent du texte de la page.

Pour les leads où `website` est une page Facebook, ou dont le site rendu
en JS ne donne rien en scraping texte : naviguer dessus via
`mcp__claude-in-chrome__navigate`, prendre un `computer` screenshot, et
**lire directement l'image** — pas d'OCR à coder, la lecture visuelle native
suffit.

**Ne pas s'arrêter à l'onglet "Coordonnées" sur une page Facebook** —
certaines entreprises écrivent leurs coordonnées complètes (adresse,
email, tel) directement dans le texte d'un post plutôt que dans les champs
structurés du profil. Repéré sur un cas réel : rien dans "À propos", tout
dans un post. Toujours lire (`get_page_text`) les premiers posts visibles
en plus de l'onglet Coordonnées avant de conclure qu'il n'y a rien.

Si un bandeau de cookies/consentement apparaît (Facebook ou Pages Jaunes),
cliquer "Refuser les cookies optionnels" / "Continuer sans accepter"
(jamais "Accepter tout" par défaut). Si Facebook
affiche un mur de connexion après ça (souvent après avoir fermé la
première pop-up), **s'arrêter là** — ne jamais se connecter à un compte,
jamais entrer d'identifiants. La photo de couverture/profil reste
généralement visible sans connexion ; le reste de la page ("À propos",
publications) non.

Cette étape est manuelle par nature (nécessite de *voir* l'image), pas
scriptable — à faire lead par lead pour ceux qui restent sans email après
les étapes 1-2, pas en boucle systématique sur toute la liste.

**Session déjà connectée (Facebook/Instagram) — toujours à l'initiative de
Julien.** Si Julien est déjà connecté dans le Chrome piloté par
l'extension, on peut aller plus loin : chercher la page de l'entreprise
via `facebook.com/search/pages/?q=<nom>+<commune>`, et surtout ouvrir
l'onglet **"Coordonnées"** sous "À propos" (`<url-page>/directory_contact_info`)
— c'est là qu'un email est parfois renseigné alors qu'il n'apparaît nulle
part ailleurs sur la page (bannière, posts, description). Repéré sur un
cas réel : rien sur la bannière ni le texte de la page, mais l'email était
là, seul, dans cet onglet dédié.

**Jamais toucher à la connexion elle-même** — pas de mot de passe entré,
pas de clic sur un bouton "Se connecter" même pré-rempli par l'autofill du
navigateur. Si Julien n'est pas connecté, lui indiquer l'URL de connexion
standard (`facebook.com/login`, `instagram.com/accounts/login`) et
attendre qu'il se connecte lui-même avant de continuer.

**Toujours vérifier l'adresse avant d'utiliser une info trouvée par nom.**
Un nom d'entreprise très générique ("JBS Plomberie", "SLM Plombier
Chauffagiste") peut remonter des pages homonymes dans une tout autre
région (repéré : une "JBS Plomberie" à Mions près de Lyon, sans rapport
avec celle de Périgueux/Boulazac cherchée). Ne jamais attribuer une info
trouvée sur une page sans avoir confirmé que l'adresse/commune correspond
à celle déjà connue du lead.

## Étape 2ter — Vérifier secteur + effectif via le registre officiel (SIRENE)

```
.venv/bin/python3 .claude/skills/lead-gen/scripts/check_sirene.py leads.json > leads_sirene.json
```

Utilise `recherche-entreprises.api.gouv.fr` (API officielle gratuite,
aucune clé) pour croiser chaque lead avec le registre SIRENE : ajoute
`secteur_naf` (code + libellé de l'activité réellement déclarée — sert à
vérifier que le lead est bien plombier/chauffagiste, pas un magasin de
fournitures ou un tout autre corps de métier mal classé sur Maps),
`tranche_effectif` (fourchette de salariés, échelle INSEE standard), et
`dirigeant` (nom du responsable si personne physique).

**Leçon retenue sur le matching** (deux faux départs avant d'arriver à une
version fiable) :
- Filtrer par code postal stocké localement est fragile — une commune
  fusionnée comme Boulazac Isle Manoire a plusieurs codes postaux
  réels (24330 et 24750 tous les deux vus), et une adresse mal
  supposée de notre côté fait rater un match qui existe pourtant.
- La bonne méthode : **inclure la commune directement dans la requête
  texte** (`q=<nom> <commune>`) plutôt que de filtrer après coup sur les
  résultats — la recherche plein texte de l'API désambiguïse mieux que le
  code postal. Si un seul résultat revient, le garder directement (les
  noms d'entreprise sont assez spécifiques) ; si plusieurs, garder celui
  dont la commune correspond, sinon le premier (meilleure pertinence de
  l'API) plutôt que d'abandonner.
- Toujours se méfier d'un secteur NAF qui ne colle pas du tout
  ("création artistique", "location de logements" trouvés en test avant
  correction) — signe quasi certain d'un homonyme, pas une vraie
  correspondance.

**Repli "recherche SIRENE par code NAF"** — les avis Google ne reflètent
**pas** la taille réelle d'une entreprise : une boîte qui fait du
tertiaire/industriel (gros chantiers, marchés publics) a souvent très peu
d'avis grand public, alors qu'un artisan solo avec beaucoup de clients
particuliers peut en cumuler des dizaines. Repéré sur un cas réel
(électriciens) : la recherche Maps classique n'a fait remonter aucune
boîte de plus de 20-49 salariés, alors qu'une recherche directe sur le
registre officiel par code NAF + code postal a immédiatement révélé un
groupe national (SPIE, filiale locale 20-49 salariés) et une filiale
régionale d'un groupe encore plus gros (Eiffage Énergie Systèmes, 500-999
salariés au niveau groupe), invisibles sur Maps.

```
recherche-entreprises.api.gouv.fr/search?activite_principale=<code NAF>&code_postal=<CP>&per_page=25
```

À lancer sur chaque code postal de la zone (pas un seul — un
établissement peut être enregistré sous n'importe lequel des CP de la
zone), trier les résultats par `tranche_effectif_salarie` décroissant
plutôt que de se fier uniquement au tri par avis Google. **Toujours
vérifier que l'adresse de l'établissement correspond bien à la zone
recherchée** (`matching_etablissements` dans la réponse) avant d'ajouter
une grosse structure au lead — un SIREN national peut remonter avec un
siège social ailleurs en France tout en ayant (ou pas) un vrai
établissement local.

## Étape 3 — Écrire dans le Google Sheet

**Premier run** (pas de sheet encore référencé dans `connections.md`) :
```
gws sheets spreadsheets create --json '{"properties":{"title":"BTP Leads - Périgueux"}}'
```
Renommer l'onglet par défaut avec le vrai corps de métier ciblé (pas un
nom générique "Leads") — ex. "Plombiers Chauffagistes" une fois le secteur
confirmé via l'étape 2ter (SIRENE) :
```
gws sheets spreadsheets batchUpdate --params '{"spreadsheetId":"<ID>"}' \
  --json '{"requests":[{"updateSheetProperties":{"properties":{"sheetId":0,"title":"<Corps de métier>"},"fields":"title"}}]}'
```
Un nom de feuille avec espace doit être entre guillemets simples dans les
ranges qui le référencent ensuite (`'Plombiers Chauffagistes'!A2:M25`).
Écrire l'en-tête (une seule fois) :
```
gws sheets +append --spreadsheet <ID> --json-values '[["Nom entreprise","Note Google","Nombre avis","Telephone","Adresse","Site web","Email","Source email","Date ajout","Statut"]]'
```
Noter le `spreadsheetId`/URL renvoyé dans `connections.md` (ligne
"Customer interactions").

**Ajout de nouveaux leads** (sheet déjà existant, ces leads n'y sont pas
encore) :
```
gws sheets +read --spreadsheet <ID> --range "Plombiers Chauffagistes!A:A" # noms déjà présents
gws sheets spreadsheets values append \
  --params '{"spreadsheetId":"<ID>","range":"'"'"'<Onglet>'"'"'!A:M","valueInputOption":"USER_ENTERED"}' \
  --json '{"values":[[...nouvelles lignes...]]}'
```
Écarter tout lead dont le nom est déjà en colonne A avant d'appender.
**Le helper court `gws sheets +append` ne cible pas un onglet précis
(pas de paramètre range) — inutilisable tel quel sur un classeur multi-
onglets, échoue avec un message d'usage.** Toujours passer par la commande
brute `spreadsheets values append` ci-dessus, avec le nom d'onglet dans le
`range`.

**Mise à jour de leads déjà présents** (ex. after enrich_leads.py a
rempli des emails pour des lignes déjà écrites) : utiliser une écrasure de
plage complète plutôt qu'un append, tant que l'ordre du JSON enrichi
correspond exactement à l'ordre des lignes déjà dans le sheet :
```
gws sheets spreadsheets values update \
  --params '{"spreadsheetId":"<ID>","range":"Plombiers Chauffagistes!A2:J<N+1>","valueInputOption":"USER_ENTERED"}' \
  --json '{"range":"Plombiers Chauffagistes!A2:J<N+1>","majorDimension":"ROWS","values":[[...]]}'
```

Colonnes, dans l'ordre : Nom entreprise, Note Google, Nombre d'avis,
Téléphone, Adresse, Site web, Email, Source email (`site web`/`réseau
social (non scrapé)`/`aucun`/vide), Date d'ajout, Statut (`À contacter`
par défaut).

## Garde-fous

- **Zéro coût, zéro carte bancaire** — c'est la contrainte fondatrice de ce
  skill. Si une évolution future nécessite une API payante, s'arrêter et en
  parler à Julien avant d'ajouter quoi que ce soit qui demande une
  facturation.
- **Ne stocker que des identifiants professionnels liés à la fonction**
  (nom d'entreprise, tel/email pro affichés publiquement) — cohérent avec
  la doctrine CNIL sur la prospection B2B (intérêt légitime, coordonnées
  pro publiques, mention d'opt-out au premier contact réel envoyé par
  Julien).
- **Toujours dédupliquer par nom d'entreprise** avant d'écrire — ne jamais
  ajouter une ligne sans avoir lu l'existant d'abord.
- **Toujours exclure les catégories hors-cible** (magasins de fournitures,
  autres corps de métier) qui remontent dans une recherche Maps par métier
  — vérifier le libellé de catégorie sous chaque nom, pas juste la
  présence dans les résultats.
- Le scraping du panneau Google Maps reste un usage personnel à faible
  volume (quelques dizaines de fiches par run, plusieurs communes max) —
  ne pas transformer ça en boucle automatisée à grande échelle sans en
  reparler avec Julien.
- Ce skill trouve des prospects, il n'écrit ni n'envoie aucun email —
  l'étape de contact reste manuelle (ou un futur skill séparé), pas mélangée
  ici.
- **Mode agents parallèles (ajouté 2026-07-26) : pas encore validé sur un
  vrai run.** L'isolation par onglet dédié (`tabs_create_mcp` par agent)
  est la garantie théorique contre les collisions entre agents sur le même
  navigateur Chrome, mais n'a pas encore été observée en conditions
  réelles avec plusieurs métiers en simultané. Au premier run multi-métier
  après ce changement, vérifier que les onglets restent bien isolés
  (pas de résultats mélangés entre métiers) avant de faire confiance au
  mode par défaut.

## Fichiers de référence

- `scripts/scrape_website.py` — scrape page d'accueil + page contact d'un
  site, extraction téléphone (normalisé format français) + email ; module
  importé par `enrich_leads.py`, utilisable seul pour un lead unique
- `scripts/enrich_leads.py` — enrichit en masse une liste de leads (JSON)
  en scrapant leur site, ne remplit que les champs vides, tolère les
  erreurs réseau par lead sans interrompre le lot
- `references/gws-cli-api.md` (racine du repo) — commandes `gws` pour
  Sheets
- `context/about-business.md` (racine du repo) — ICP et critère de tri
- `projects/leads-btp-perigueux/` — exports JSON/CSV de chaque run, en
  plus du Google Sheet (utile si le sheet est temporairement indisponible)
