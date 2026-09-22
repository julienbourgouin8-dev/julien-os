# Decisions Log

Append-only record of meaningful decisions and why they were made. `/level-up` Phase 2 (Method interview) writes scoped automation specs here. You can also append manually whenever you decide something worth remembering.

**Format per entry:**

```
## YYYY-MM-DD — Short title

**Decision:** what was decided.

**Why:** the reasoning, constraints, and what would change your mind.

**Alternatives considered:** what else was on the table.

**Owner:** who's accountable.
```

Keep it terse. Future-you will thank present-you for capturing the *why*, not just the *what*.

---

## 2026-07-20 — Skill `lead-gen` : Places API + scrape site + LinkedIn assisté (jamais un scraper en masse)

**Decision:** construire la recherche de leads BTP comme un Claude Skill
(`lead-gen`) plutôt qu'un outil externe (Make.com/n8n). Sources : Google
Places API (New) pour trouver les entreprises, scraping du site web du
lead comme méthode principale pour l'email, recherche LinkedIn assistée
(pas un scraper automatisé) seulement pour les leads sans email trouvé,
plafonnée à 5/run avec validation humaine avant écriture. Stockage : Google
Sheet via la CLI `gws` déjà connectée.

**Why:** Places API est la voie documentée et conforme aux ToS de Google
(le volume — plombiers à Périgueux — reste dans le crédit gratuit
mensuel) ; scraper Google Maps directement aurait été fragile (rien
d'installé type Selenium/Playwright) et en zone grise ToS pour du répété.
Places API ne renvoie jamais d'email — le scraping du site du lead comble
ça pour la majorité des artisans qui affichent un contact sur leur propre
site. Un scraper LinkedIn en masse violerait le ToS LinkedIn et risquerait
un ban du compte de Julien pour un gain marginal vu le petit volume réel
(quelques leads/run, pas des milliers) — la recherche assistée via
`claude-in-chrome` reste au même niveau de risque que Julien qui
chercherait à la main, avec une étape de validation humaine obligatoire
avant tout ajout au sheet.

**Alternatives considered:** scraper Google Maps directement (écarté,
fragilité + ToS) ; LinkedIn Sales Navigator en scraping bulk façon les
outils vus dans les vidéos Nick Saraev (écarté, risque de ban trop élevé
pour le gain, incohérent avec une prospection encore artisanale à ce
stade) ; Airtable/CSV local au lieu de Google Sheets (écarté, Google Sheet
ne demande aucun nouvel outil vu que Drive/gws est déjà connecté).

**Owner:** Julien.

---

## 2026-07-20 — Correction skill `lead-gen` : Google Places API abandonnée, scraping Maps via navigateur à la place

**Decision:** revenir sur la décision Places API du même jour. Le skill
`lead-gen` scrape maintenant Google Maps directement via
`mcp__claude-in-chrome__*` (nom, note, avis, tel, site depuis le panneau de
résultats/détail), sans passer par une API payante. `scripts/fetch_leads.py`
(Places API) supprimé, remplacé par `scripts/scrape_website.py` (fusion de
l'ancien `find_email.py` + extraction téléphone) pour le repli site web.
Étape LinkedIn assistée retirée de cette version — scope volontairement
réduit à Maps + site.

**Why:** Julien voulait une solution gratuite dès le départ. Places API
reste "gratuite" en usage (crédit mensuel largement suffisant à ce volume)
mais exige une carte bancaire enregistrée sur le projet Cloud pour activer
la facturation — friction que Julien ne voulait pas. Le scraping du
panneau Google Maps via le navigateur déjà connecté élimine cette
friction : zéro clé, zéro carte, zéro nouveau compte.

**Alternatives considered:** API Recherche d'Entreprises (SIRENE) + OSM
Overpass évoquées en cours de discussion (gratuites aussi, aucune carte)
mais écartées car moins complètes que Google Maps sur la couverture locale
réelle, alors que Julien voulait spécifiquement Google Maps. Pappers.fr
(nom du dirigeant, gratuit) et Hunter.io (email pro deviné par domaine)
évoqués comme pistes pour une version future si le taux de complétion
site-web s'avère insuffisant — pas retenus pour cette v1, Julien a
explicitement demandé de rester simple (Maps + site uniquement).

**Owner:** Julien.

---

## 2026-09-15 — Driving Sens : raccord masqué plutôt que traversée de carrosserie

**Decision:** la micro-séquence de départ utilise désormais trois beats courts : passage de
première aux images 61-76, plan pédales 77-96, puis reprise extérieure dès l'image 97. Le dézoom
qui traversait le plancher, les sièges et la coque est abandonné. Un whip-pan de six images masque
la coupe vers `CAM_REAR_PULLBACK_SAFE`, caméra déjà située derrière le pare-chocs et restant hors
de la voiture pendant tout le recul.

**Why:** une caméra traversant plusieurs surfaces produit un blocking visuellement incohérent et
risque de faire échouer la future génération vidéo. Le raccord flouté conserve l'énergie du départ
tout en donnant au générateur deux espaces propres : intérieur avant la coupe, extérieur après.

**Owner:** Julien.

---


## 2026-07-21 — Pivot stratégique `site-revamp` : volume + image, jamais vidéo

**Decision:** `site-revamp` passe d'un mode "un site bespoke ultra-abouti
par client, moteur JS/vidéo sur mesure" (ETS Lévesque) à un mode volume :
plusieurs prospects, 2-3 versions rapides chacun, envoyées en prospection.
La vidéo (génération ou scroll-scrubbing vidéo) est **retirée du skill** —
trop coûteuse et trop lente à itérer pour cette échelle. Tout l'effet
premium vient maintenant de l'image (réelle scrapée, ou piochée sur
Pinterest si le prospect n'a rien d'utilisable) + de vraies bibliothèques
d'animation (GSAP/ScrollTrigger/Lenis, plus du JS vanilla ad hoc) + d'une
vraie typo. `visual-craft` (retouche/compositing d'image) devient une
étape obligatoire du process, pas un skill chargé occasionnellement.
Détail complet des changements : `.claude/skills/site-revamp/SKILL.md`
(Étape 0 points 5-6, Étape 3).

**Why:** Julien change de stratégie commerciale — sortir du mode "un site
parfait, un prospect à la fois" vers de la prospection à plus grande
échelle. La vidéo ne scale pas à ce rythme (coût + temps d'itération) ; les
bibliothèques d'animation existent précisément pour aller plus vite sans
sacrifier la qualité perçue — les recoder à la main à chaque site (ce qui
s'est passé sur R.E.P 24 cette session) est plus lent et produit un résultat
plus pauvre que d'utiliser GSAP/Lenis directement.

**Alternatives considered:** garder la vidéo en option cas par cas (écarté
— explicitement retiré, pas juste déprioritisé, pour que ça ne revienne pas
par défaut) ; créer un skill séparé pour le mode volume (écarté par
Julien — un seul skill `site-revamp`, pas une nouvelle démarche parallèle).

**Owner:** Julien.

---

## 2026-07-21 — Correction process `site-revamp` : Opus=plan seulement, mémoire skill > mémoire session

**Decision:** suite à un dérapage réel sur le build R.E.P 24 (3 agents Opus
ont écrit la construction complète au lieu de s'arrêter au plan/à la
direction artistique), la règle "Opus pour le plan, Sonnet pour la
construction" a été réécrite comme contrainte dure directement dans
`.claude/skills/site-revamp/SKILL.md` (Étape 2), avec une consigne explicite
pour les prompts de subagents. Ajout aussi dans le skill d'un pointeur vers
le niveau de sophistication réel d'`ets-leveque-site` (pas juste son
`CLAUDE.md`) et un rappel de la boucle critique de `frontend-design`. Un
dossier `references/design-references/` a été créé pour sauvegarder
immédiatement toute capture d'écran de référence design partagée en chat
(aucune n'existait sur disque malgré l'impression contraire).

**Why:** une correction sauvegardée seulement dans la mémoire auto
(session-locale, chargée par pertinence, jamais garantie) ne protège ni les
autres sessions ouvertes en parallèle ni les futures. Les fichiers skills et
les `CLAUDE.md` de projet sont la seule mémoire vraiment partagée et
déterministe entre sessions — toute correction de process doit finir là,
pas seulement en mémoire perso. (L'audit détaillé vivait dans
`projects/rep24-site/AUDIT-2026-07-21.md` — ce dossier de projet a été
supprimé le 2026-07-21 à la demande de Julien ; les règles qui en sont
sorties restent dans `site-revamp/SKILL.md`, la substance n'est pas
perdue, seul le compte-rendu détaillé l'est.)

**Alternatives considered:** garder la correction uniquement en mémoire auto
(écarté — c'est précisément ce qui a échoué à empêcher le dérapage) ;
documenter seulement dans le `CLAUDE.md` du projet REP24 (écarté — trop
localisé, la règle doit s'appliquer à tout futur build `site-revamp`, pas
seulement celui-ci).

**Owner:** Julien.

---

## 2026-07-21 — Processus manuel de génération/retouche d'image documenté dans `visual-craft`

**Decision:** après une session de génération d'images IA (Gemini via
`claude-in-chrome`) + retouche manuelle (compositing Pillow d'un wordmark
derrière un objet réel de la photo) pour le hero de `rep24-site`, le
processus a été documenté dans `.claude/skills/visual-craft/image-compositing.md`
plutôt que de rester une manip ad hoc à refaire à chaque fois. Deux leçons
concrètes retenues : (1) partir d'une vraie capture produit fournie par
Julien comme référence explicite dans le prompt de génération, pas d'une
description vague ; (2) bord net (poutre/toit) = coupe exacte au pixel, bord
organique (feuillage) = dégradé — erreur réelle commise ici en appliquant
le dégradé à une poutre, corrigée. Une troisième piste (sécurité de
recadrage à l'aspect-ratio de déploiement) a été rédigée puis retirée le
même jour : basée sur une mauvaise lecture d'un screenshot que Julien avait
pris à une taille arbitraire pour montrer un problème de position, pas sur
un vrai ratio de déploiement — leçon écartée pour ne pas polluer le skill
avec une règle non confirmée.

**Why:** Julien a explicitement demandé que le temps passé à itérer à la
main sur cette image serve à rendre le système de génération robuste et
reproductible, pas juste à produire une image de plus.

**Alternatives considered:** garder la leçon seulement dans cette session
(écarté — même raison que la correction précédente : la mémoire de session
n'est ni partagée ni garantie).

**Owner:** Julien.

---

## 2026-08-04 — Test parallèle "désinsectiseurs" pendant le creux BTP d'août

**Decision:** pendant qu'ETS Lévesque reste sans réponse et que le BTP est
mort en août (congés du secteur), lancer un test de prospection sur un
métier hors BTP identifié comme actif en ce moment : les désinsectiseurs
(guêpes/frelons), zone Périgueux + communes limitrophes. Détail du
raisonnement et des autres métiers explorés : `context/expansion-niches.md`.
Première étape : reconnaissance rapide sur Google Maps pour compter le
nombre réel de désinsectiseurs dans la zone avant de lancer tout le
pipeline d'enrichissement (`lead-gen`) — risque identifié que ce soit un
marché trop petit en volume comparé au BTP.

**Why:** le plan 90 jours (`context/priorities.md`) reste concentré sur
BTP/ETS Lévesque, mais août est structurellement mort pour ce secteur —
ce temps mort ne coûte rien à la mission principale s'il sert à tester un
nouveau front plutôt qu'à attendre. Les désinsectiseurs sont le seul métier
de la liste explorée avec une demande confirmée et forte pile en ce moment
(pic de population des nids en août-septembre), contrairement aux autres
pistes (pisciniers : pas avant fin septembre ; serruriers/déménageurs :
hypothèses non vérifiées).

**Alternatives considered:** attendre simplement la reprise BTP en
septembre sans rien tester (écarté par Julien — "on doit avancer et
essayer de nouvelles choses") ; démarrer directement sur pisciniers ou
serruriers (écarté, demande pas confirmée pour août) ; lancer tout de
suite le pipeline complet d'enrichissement sans vérifier la taille du
marché (écarté, risque de perdre du temps sur un métier trop rare
localement).

**Owner:** Julien.

---

## 2026-08-04 — Premier envoi réel désinsectiseurs : ton "honnête, sans pitch" + compte principal

**Decision:** envoi de 12 emails réels (sur les 22 leads "Zone 25km" de
`context/expansion-niches.md`) avec un email volontairement non-commercial
— pas d'offre annoncée dès le début, question ouverte sur les tâches
administratives, promesse de travail gratuit tant qu'on n'a pas trouvé de
solution ensemble, aucune mention du mot "IA". Construit itérativement en
chat (une dizaine d'allers-retours de correction de ton avec Julien) plutôt
que repris d'un template existant. Envoyé depuis le compte principal
`julienbourgouinai@gmail.com` (pas un compte secondaire de volume), à la
demande explicite de Julien malgré la règle habituelle qui réserve ce
compte aux réponses (voir `references/gws-cli-api.md` § Multi-compte).
Un lead (AB3D) exclu de l'envoi : l'email trouvé par scraping
(`contact@distinguez-vous.com`) ne correspond pas à son domaine propre —
suspicion d'email d'agence web plutôt que de l'entreprise elle-même,
marqué "à vérifier" dans le sheet plutôt qu'envoyé à l'aveugle.

**Why:** Julien voulait tester un ton radicalement différent de la
prospection classique — parler "comme il parle", chercher une réponse
honnête plutôt qu'une conversion, sans jouer la carte IA/technique. Le
compte principal a été choisi consciemment par Julien après que je lui ai
présenté le compromis (cohérence de marque personnelle vs. protection de
la réputation d'envoi) — son choix, pas une dérive silencieuse.

**Alternatives considered:** compte secondaire de volume (recommandé par
moi, écarté par Julien) ; envoyer aussi à AB3D avec l'email trouvé
(écarté, risque de contacter la mauvaise personne) ; attendre d'avoir une
solution SMS/WhatsApp avant d'envoyer quoi que ce soit (écarté par Julien
— l'email disponible aujourd'hui ne doit pas attendre l'outil SMS, encore
à construire).

**Owner:** Julien.

---

## 2026-07-26 — CLAUDE.md durci après comparaison avec l'AIOS de Nate Herk

**Decision:** suite à une vidéo YouTube de Nate Herk détaillant l'organisation de son
AIOS (transcription + captures de son `CLAUDE.md` et de son arborescence), quatre
changements structurels adoptés dans `CLAUDE.md` :
1. Section `## Your skills` réduite à une liste de noms + une règle ("les skills
   s'auto-enregistrent via leur frontmatter, Claude Code les affiche déjà
   automatiquement chaque session — ne pas maintenir un catalogue à la main qui
   duplique et dérive").
2. Nouvelle section `## Memory & précédence` : les 4 sources (CLAUDE.md, `context/`,
   mémoire auto, `decisions/log.md`) ont chacune un rôle, et en cas de désaccord entre
   une mémoire et `context/`, `context/` a raison.
3. Nouvelle section `## API keys` : toute clé future va dans `.env`, jamais demandée à
   Julien en cours de tâche, placeholder créé si absente.
4. `## Knowledge base` réduit à un résumé de 3 lignes + pointeurs vers `context/*.md`
   au lieu de recopier en entier l'identité/les priorités 90 jours (qui vivaient déjà
   dans `context/about-me.md`/`priorities.md`) — la duplication était un vrai risque
   de "clash" (une source mise à jour, pas l'autre).
Créé aussi `projects/_index.md` (une ligne par dossier de `projects/`, catégorie + but),
sur le même principe que son `projects/_index.md` à 55 dossiers, mais appliqué dès 4
dossiers plutôt que d'attendre que ça devienne nécessaire.

**Why:** Nate gère une échelle très différente (multi-business, équipe, 55 dossiers de
projets) et une partie de sa vidéo ne s'applique pas ici (cache hiérarchisé de wiki à
plusieurs centaines de pages, séparation `OtherWorlds`/`projects`, ClickUp) — ignoré
volontairement pour ne pas copier une solution à un problème qu'on n'a pas encore. Mais
quatre de ses principes sont génériques, pas liés à l'échelle, et corrigeaient des trous
réels déjà repérés le même jour dans l'audit de fichiers/dossiers (le catalogue de
skills dupliquait déjà ce que le harness affiche seul ; aucune règle de précédence
n'existait entre mémoire et `context/` ; `projects/`/`wiki/` avaient déjà été trouvés
non documentés plus tôt dans la session).

**Alternatives considered :** copier tout le système de Nate tel quel (écarté — plusieurs
pièces répondent à un problème d'échelle que nous n'avons pas, les copier aurait été de
la sur-ingénierie prématurée) ; garder `## Knowledge base` tel quel pour l'aspect
narratif/motivant de voir sa mission en ouvrant `CLAUDE.md` (écarté par Julien après
clarification — il a choisi l'option la plus simple, réduire à un pointeur).

**Owner:** Julien.

---

## 2026-07-26 — GTM : deux voies distinctes au lieu d'un entonnoir unique site→email

**Decision:** `context/about-business.md` décrivait un entonnoir unique ("refaire le site
d'abord, puis cold email pour proposer le site fini") qui ne reflétait plus la réalité.
Il existe en fait deux voies parallèles :
- **Voie A** (`site-revamp`) : un prospect prioritaire à la fois, site reconstruit AVANT
  le premier contact, le site est le pitch. Ne scale pas — réservé au prospect en tête de
  liste (ETS Lévesque aujourd'hui).
- **Voie B** (`cold-email-v1.md`, écrit le 2026-07-25) : mail de masse vers les ~1176
  leads du Sheet, sans site pré-construit. Pitch différent — devis auto pendant le
  rendez-vous + assistant téléphonique IA avec résumé d'appel, CTA = appel de 15 min. La
  refonte de site gratuite devient une preuve de valeur envoyée après une réponse
  positive, plus la porte d'entrée.

`context/about-business.md` mis à jour pour documenter les deux voies.

**Why:** construire un site par lead n'est pas réaliste à l'échelle de 1176 leads — Voie B
existe précisément pour ça. Mais rien n'avait acté ce pivot nulle part : `cold-email-v1.md`
existait déjà (écrit la veille) sans qu'aucun fichier canonique (`context/`) ne soit mis à
jour pour le refléter, ce qui a produit une vraie contradiction repérée le 2026-07-26 : Claude
a répondu en supposant que le cold email de masse contenait un lien vers un site refait (en
se fiant à l'ancienne description de `about-business.md`) au lieu de vérifier le template
réel. Root cause : un pivot business réel documenté seulement dans un fichier de template,
jamais remonté dans la source canonique (`context/`) ni dans le journal de décisions — exactement
le mode d'échec "clash" (deux sources en désaccord) déjà nommé plus tôt dans la session.

**Alternatives considered :** ne documenter que dans le template lui-même (écarté — c'est
précisément ce qui a causé la confusion, un template n'est pas une source canonique) ;
fusionner les deux voies en une seule description vague (écarté — elles ont des mécaniques
et des métriques de suivi différentes, taux de clic n'a pas de sens pour la Voie B qui n'a
pas de lien, seul le taux de réponse compte).

**Owner:** Julien.

---

## 2026-07-30 — MVP devis-vocal : périmètre, stack et démo, actés après étude de marché

**Decision:** Lancement du chantier `projects/devis-vocal/` — matérialisation produit de la
promesse "devis générés automatiquement pendant le rendez-vous" déjà envoyée en cold email
(Voie B). Trois décisions structurantes actées et déjà mises en œuvre :

1. **Stack 100% locale au MVP, pas d'API payante.** whisper.cpp (Metal) + Ollama (qwen3:8b +
   bge-m3) tournent sur le Mac de Julien (M4, 16 Go). Le téléphone n'est qu'un micro/écran.
   Mesuré en conditions réelles le jour même : Whisper transcrit à ~4,5x le temps réel ;
   qwen3:8b répond en ~9 s/bloc une fois chaud (`OLLAMA_KEEP_ALIVE=-1` nécessaire).
2. **PWA vanilla (HTML/CSS/JS), pas React Native/Expo.** Argument calendaire : ~6 semaines
   avant la démo de septembre, Julien n'a jamais fait de React Native. Couvre Android ET
   iPhone pour 0 € (pas de compte Apple Developer nécessaire), contrairement à une app native.
3. **Devis uniquement, jamais la facturation au MVP.** La réforme française de facturation
   électronique (réception obligatoire 1er sept. 2026, émission TPE obligatoire 1er sept.
   2027, transit par Plateforme Agréée) ne s'applique qu'aux factures — rester sur le devis
   annule 100% de cette charge réglementaire.

Plan complet : `~/.claude/plans/j-aimerais-cr-er-une-application-zazzy-cat.md`.
`context/about-business.md` et `projects/_index.md` mis à jour le jour même.

**Why:** une étude de marché faite avant de coder a montré que le "devis vocal" n'est plus un
différenciateur — Obat (leader FR, 18M€ levés), Vertuoza et Notim le proposent déjà en
production. Le plan a donc été construit sur ce qui reste défendable : la bibliothèque de
prix reconstruite depuis les VRAIS anciens devis PDF de l'artisan (pas des prix génériques
Batiprix/Batichiffrage), la vitesse de correction sur l'écran de validation, et la règle
"aucun prix jamais deviné par l'IA". Le choix 100% local vient d'une contrainte déjà connue
(Julien a refusé par le passé d'enregistrer une CB pour une API cloud, cf. décision Places
API du 2026-07-20) et d'un calendrier serré (le BTP est mort en août, démo visée en
septembre) qui interdit un détour par une stack payante à monter.

**Alternatives considered :** Expo/React Native pour l'app (écarté — 2-3 semaines
d'apprentissage sur un terrain jamais pratiqué, risque calendaire trop élevé) ; API cloud
(Deepgram/Claude) dès le MVP (écarté pour le MVP — contraire à la contrainte 0 € déjà
actée ; à rouvrir explicitement après la démo si la précision locale est insuffisante, cf.
tripwire à 60% de précision en semaine 2 du plan) ; inclure la facturation dès le MVP
(écarté — coût réglementaire 2026-2027 sans valeur différenciante).

**Owner:** Julien.

---

## 2026-07-31 — Agent téléphonique : qualification + notification, jamais un devis généré par téléphone

**Decision:** Recadrage du rôle de l'agent IA téléphonique (deuxième lame commerciale,
hors MVP `devis-vocal`) après une objection de Julien pendant une session de travail.
Version corrigée, actée :

- **Travaux sur mesure (majorité des cas)** : l'IA qui décroche le téléphone qualifie
  l'appel (nom, prénom, adresse, motif, détection d'urgence) et pousse une **notification**
  à l'artisan avec ces infos pré-remplies. Elle ne génère PAS de devis. Le devis complet
  reste produit par l'artisan après visite technique, via la dictée terrain (le MVP actuel,
  inchangé).
- **Prestations standardisées à prix quasi-fixe** (détartrage chaudière, débouchage,
  ramonage, entretien annuel) : exception — un mini-devis/prix peut être donné directement
  au téléphone, puisqu'aucune inconnue technique n'entre en jeu.
- Le schéma SQLite du MVP (`projects/devis-vocal/data/schema.sql`) encaisse ce futur usage
  sans modification : un appel entrant devient simplement un `client` + un `devis` en
  statut brouillon créés automatiquement plutôt que saisis à la main, sur les mêmes tables.

**Why:** ma première formulation ("l'IA transforme l'appel en brouillon de devis prêt à
valider") était trop optimiste — un devis BTP correct demande une connaissance technique
terrain (mesures, état réel de l'installation, ce qui doit vraiment être remplacé) qu'un
appel téléphonique ne peut pas fournir. Julien l'a repéré immédiatement : "l'IA n'a pas les
connaissances du professionnel du BTP". C'est exactement la même règle que celle déjà
actée pour le devis vocal terrain (`decisions/log.md`, 2026-07-30) : ne jamais deviner un
prix ou un poste qu'on ne connaît pas réellement. L'appliquer aussi à l'agent téléphonique
évite de vendre une promesse technique intenable, et recentre la valeur réelle sur ce qui
compte le plus : ne pas perdre un client (surtout en urgence) faute d'avoir décroché.

**Alternatives considered :** garder la formulation "appel → devis" comme argument
commercial simplifié en sachant qu'elle est technique fausse (écarté — contraire à la
règle de confiance déjà actée, et un client qui découvre que le "devis" reçu par téléphone
ne correspond pas à la réalité du chantier casse la confiance dès le premier contact) ;
faire de la qualification téléphonique un module séparé du devis vocal, sans lien de
données (écarté — le schéma existant montre que les deux flux (appel entrant, dictée
terrain) peuvent remplir les mêmes tables `client`/`devis`, pas la peine de dupliquer).

**Owner:** Julien.

---

## 2026-07-31 — Positionnement devis-vocal : agence maintenant, SaaS self-serve plus tard

**Decision:** Après étude de marché élargie (taille du marché, taux d'équipement,
concurrence, coûts réels), trois points actés sur le modèle économique de
`devis-vocal` :

1. **Mode agence au démarrage, pas de SaaS en libre-service.** Installation en
   personne (récupération des PDF, construction de la bibliothèque, paramétrage),
   pas un signup autonome. Raison : 76 % des BTP ont déjà un logiciel de
   facturation (Baromètre France Num 2025) mais seulement 13-16 % ont choisi un
   outil spécialisé métier — la majorité utilise ce qu'un tiers (comptable,
   Excel) leur a mis entre les mains, donc ce public ne s'auto-onboarde pas sur
   un nouvel outil. La distribution qui marche dans ce marché est humaine
   (Tolteck via Point P, Notim via la CAPEB/CNATP), pas digitale.
2. **Prix visé : 39-49€/mois (repère Obat "Pro"), ou un hybride setup unique
   (150-300€) + abonnement plus bas (~25-35€/mois).** Pas le prix d'entrée
   Tolteck (19-25€) — celui-là suppose l'autonomie totale du client, qu'on n'a
   pas en mode agence.
3. **Différenciateur reconfirmé après vérification directe chez Obat** : leur
   bibliothèque de prix ne s'enrichit que par saisie manuelle, copie, scraping
   de catalogues fournisseurs, ou aide à la migration Excel — **aucun import
   automatique depuis d'anciens devis PDF**. Le vrai actif défendable n'est pas
   "une bibliothèque qui s'améliore avec le temps" (ça, tout le monde l'a), c'est
   **la bibliothèque personnalisée dès le jour 1**, construite depuis les
   anciens PDF du client, plus la détection de dispersion de prix — deux choses
   absentes chez Obat.

**Coûts réels validés (recherche fournisseurs, juillet 2026)** — à mesurer à
nouveau si le volume change fortement :
- Devis vocal (STT Groq Whisper turbo + extraction Claude Sonnet 5) :
  ~0,02 €/devis, donc ~0,30€/mois/client à 15-20 devis/mois. Marge logicielle
  ~90%+ dès quelques clients.
- Agent téléphonique (Retell/Vapi/ElevenLabs, si un jour construit) :
  ~4 à 15 €/mois/client selon plateforme et volume — nettement plus cher que
  le devis (temps réel vs traitement différé). Mange une vraie part de la
  marge si bundlé dans le même abonnement, à modéliser avant de fixer un prix
  définitif incluant ce module.
- Auto-hébergement Whisper sur un VPS GPU : écarté, ne devient rentable qu'à
  >5000h d'audio/mois — hors de portée à cette échelle.

**Why:** un fondateur solo de 18 ans sans budget marketing, sans reconnaissance
de marque, ne peut pas gagner une bataille self-serve contre Obat (18M€ levés)
ou Tolteck (30 000 clients, distribué par Point P). Le seul avantage qu'il a
que les gros ne peuvent pas répliquer à son échelle, c'est l'installation en
personne et la relation de confiance — donc en faire le point de départ,
pas un vestige à abandonner dès que possible.

**Alternatives considered :** viser le prix d'entrée Tolteck pour maximiser le
volume de signups (écarté — suppose une acquisition digitale qu'on n'a pas, et
un onboarding autonome qui ne colle pas au profil du client cible) ; bundler
l'agent téléphonique dans l'abonnement devis dès le lancement (écarté pour
l'instant — deuxième lame commerciale distincte, coût par minute nettement
supérieur au devis, à vendre et pricer séparément une fois prouvé).

**Owner:** Julien.

---

## 2026-08-02 — devis-vocal : identité visuelle "chantier" (charbon/orange), abandon de la piste bleu/SaaS-IA

**Decision:** troisième refonte de l'identité visuelle de SoloBTP en une
semaine. Palette finale : fond sable chaud, charbon (quasi-noir) pour les
bandeaux de lot et le texte fort, orange sécurité chantier (`#D9480F`) comme
seule couleur d'action/accent. Police unique Archivo (plus de mélange
Plus Jakarta Sans + Instrument Serif italique). Barre d'onglets mobile
repensée : fond charbon sombre, onglet actif en pastille orange pleine
(remplace un simple changement de couleur de texte, jugé pas assez visible).
Suppression des pastilles "eyebrow" au-dessus des titres d'onglet.

**Why:** parcours en 3 temps. (1) Palette orange/bandeau navy inspirée
d'Obat/Vertuoza/Notim après recherche marché — cohérente mais Julien l'a
jugée "pas terrible" sans rejet formel. (2) Rebrand complet sur une capture
d'une landing page IA générique ("Larka") — bleu vif, pastilles pilule,
logo en serif italique. Julien : "j'aime pas les onglets, l'onglet devis
est pas clair, les couleurs sont pas sur le thème... n'aie pas peur de tout
changer." Diagnostic : le bleu + pastilles + serif italique sont des
conventions de landing page SaaS/IA, pas d'un outil de chantier utilisé sur
un téléphone plein de poussière — la référence Larka avait été suivie trop
littéralement plutôt qu'adaptée au sujet réel. (3) Palette construite sur le
vocabulaire du métier (gilet/cône orange, charbon, sable) plutôt que sur une
capture d'écran d'un secteur différent.

**Alternatives considered :** garder le bleu et juste foncer la couleur
active des onglets (écarté — ne réglait pas le vrai problème, qui était le
thème entier perçu comme hors sujet, pas juste un contraste insuffisant) ;
revenir à l'esthétique "carnet autocopiant" du tout début (écartée à
l'époque parce que non inspirée du marché — mais la nouvelle palette
récupère l'intuition tactile/matérielle de cette première piste sans
recopier l'esthétique papier/tampon).

**Owner:** Julien.

---

## 2026-08-02 — devis-vocal : retour au bleu (identité v4) + Dashboard, Appels, filtres statut, "+" Créer

**Decision:** l'entrée du même jour ci-dessus ("identité chantier
charbon/orange") est en partie corrigée quelques heures plus tard : Julien a
confirmé vouloir garder le bleu et les motifs décoratifs (formes floues en
dégradé) de la référence Larka, y compris pour une app et pas seulement un
site — "même si c'est un site web, je veux une belle refonte moderne". Le
diagnostic initial ("le bleu est hors sujet pour un outil de chantier")
était donc erroné ; le vrai problème était la clarté de la barre d'onglets
(contraste insuffisant sur l'onglet actif), corrigée entre-temps et
conservée. Palette v4 : fond bleu très pâle, bleu vif (`#3D5FE0`) en accent,
bandeau dégradé avec formes floues sur le Dashboard, cartes avec ombre
douce. Même passage : ajout d'un onglet **Dashboard** (premier de la barre,
KPI + graphique CA en SVG fait main + devis récents), pilules de filtre par
statut sur l'onglet Devis (Tous/Brouillon/Envoyé/Accepté/Refusé), un onglet
**Appels** (aperçu du futur agent téléphonique — liste appelants + fiche
détail avec résumé et carte de localisation stylisée maison, montrant
distance/temps depuis la position de l'artisan) et un bouton flottant **"+"
Créer** (devis/facture/client) qui remplace l'onglet Factures dans la barre
principale — Factures reste accessible depuis ce menu.

**Why:** la palette et les motifs décoratifs n'étaient jamais le problème
réel signalé — Julien n'avait pas explicitement rejeté le bleu la première
fois, il avait rejeté le manque de clarté des onglets et un manque général
de polish. Un revirement complet de palette a été fait sur une inférence,
pas sur un rejet explicite du bleu — cf. `feedback_ground_design_refs_in_subject`
en mémoire (leçon : ne pas sur-interpréter une critique vague). L'onglet
Appels reste un aperçu honnête (mention explicite dans l'UI) : l'agent
téléphonique reste hors périmètre MVP, cf. entrée 2026-07-31 sur le
"deuxième lame commerciale".

**Alternatives considered :** garder l'identité charbon/orange et juste
répondre "non, on garde le bleu" sans repasser derrière (écarté — Julien a
donné une direction visuelle concrète avec captures à l'appui, autant
l'exécuter proprement plutôt que de discuter la couleur en abstrait) ;
fusionner Factures et Devis en un seul écran avec toutes les données
mélangées (écarté — la contrainte réglementaire sur la facturation reste
valable, seul l'accès depuis la nav a changé, pas le contenu).

**Owner:** Julien.

---

## 2026-08-06 — Désinsectiseurs "Plus loin" : pitch commercial explicite + double canal email/formulaire

**Decision:** contact des 12 leads jamais contactés de l'onglet "Plus loin"
(sheet "Leads Désinsectiseurs - Périgueux") avec un nouveau template —
pitch commercial explicite dès la première ligne, à l'opposé du ton
"honnête, sans pitch" testé le 2026-08-04 sur l'onglet "Zone 25km". Accroche
personnalisée par entreprise : une impression globale tirée de l'ensemble
de leurs avis Google (pas la paraphrase d'un avis isolé), avec un prénom
cité quand il revient plusieurs fois dans les avis (ex. "Rémi" pour Captain
Nuisible, "M. Berland" pour Framo). Double canal : email planifié via Gmail
(compte principal, `Schedule send`, étalé de 13h00 à 21h15 le jour même) +
soumission du même message via le formulaire de contact du site pour
chaque lead qui en a un. 11 formulaires soumis avec succès sur 13 tentés.
Deux exceptions :
- **MaisonSûr Périgueux** : le site (maisonsur.com) a révélé que ce n'est
  pas un artisan désinsectiseur mais un groupe de rénovation habitat
  multi-métiers (25 ans, 6 agences, 100+ salariés) — email envoyé avec une
  accroche réécrite sur leur échelle/ancienneté (pas sur les avis, mitigés
  à 4,1★/60 avec un litige grave signalé), mais leur formulaire "Nous
  contacter" s'est avéré être un formulaire de demande de bilan gratuit
  pour propriétaires (code postal obligatoire) — pas utilisé pour ne pas
  polluer leur pipeline de leads avec un faux client.
- **VA Nuisibles 3D** : formulaire rempli mais bloqué par une question
  anti-bot ("combien font cinq plus neuf ?") — pas résolue, conformément à
  la règle qui interdit de contourner les CAPTCHAs. À terminer manuellement
  par Julien si souhaité.
- **Hygien'air** exclu du lot : site mort (`hygien-air-24.fr`,
  ERR_NAME_NOT_RESOLVED) et pas d'email dans le sheet — combiné à un avis
  1★ signalant le gérant injoignable pendant 3 mois, ça sent l'entreprise
  en sommeil.

**Why:** Julien a explicitement demandé ce pitch et ce double canal (voix,
2026-08-06), avec deux corrections en cours de route : (1) l'accroche
initiale ("félicitations pour vos avis 5 étoiles" générique) jugée creuse
pour les cas à avis mitigés — remplacée par une accroche neutre basée sur
des faits vérifiables plutôt qu'un compliment forcé ; (2) cette accroche
neutre elle-même jugée insuffisante ensuite — Julien voulait une impression
de synthèse tirée de l'ensemble des avis (façon "on sent beaucoup de
gentillesse dans vos avis"), pas un résumé/paraphrase d'un avis isolé.
Les avis ont été vérifiés un par un sur Google Maps avant rédaction pour
éviter de complimenter aveuglément une entreprise avec un vrai problème de
réputation.

**Alternatives considered :** garder le ton "honnête, sans pitch" du
2026-08-04 pour ce nouveau lot aussi (écarté par Julien, changement de
direction assumé) ; envoyer aussi ce nouveau pitch aux leads déjà
contactés de "Zone 25km" avec l'ancien ton (écarté — aucun overlap, pas
nécessaire) ; résoudre le captcha de VA Nuisibles pour boucler les 13/13
(écarté — règle explicite contre le contournement de CAPTCHA).

**Owner:** Julien.

---

## 2026-08-12 — Site CréA'deline déployé sur Vercel (v1)

**Decision:** déployer `projects/site-adeline/app` en production sur
Vercel (compte gratuit de Julien), projet renommé `creadeline` pour une
URL propre : **https://creadeline.vercel.app**. Désactivé la "Deployment
Protection" (`ssoProtection`) du projet, activée par défaut sur les
sous-domaines `.vercel.app` — sans ça, tout visiteur tombe sur un mur de
login Vercel avant de voir le site, inutilisable pour un site public.

**Why:** Julien a explicitement demandé le déploiement avec un nom de
domaine gratuit et une URL à donner. Vercel choisi (pas de config de
déploiement existante trouvée ailleurs dans le repo pour deviner une
autre plateforme) car c'est le standard pour Next.js, gratuit sans carte
bancaire, et l'authentification a pu se faire via une session navigateur
déjà connectée (aucun identifiant saisi par Claude). La désactivation de
la protection SSO n'était pas prévue — découverte en testant l'URL après
coup (redirection 302 vers `vercel.com/sso-api`), corrigée via l'API
Vercel (`PATCH /v9/projects/creadeline` avec `ssoProtection: null`).

**Alternatives considered :** Netlify (écarté, pas de raison de
préférer à Vercel pour un projet Next.js) ; laisser le nom de projet par
défaut `app` (donnait une URL moche `app-sandy-eight-84.vercel.app`,
renommé en `creadeline` pour une URL lisible) ; acheter un vrai nom de
domaine (`creadeline.fr` ou similaire) — pas fait, en attente d'une
décision de Julien, le sous-domaine gratuit suffit pour la v1.

**Owner:** Julien.

---

## 2026-09-09 — Consolidation du design sur `site-craft`

**Decision:** créer le skill `.claude/skills/site-craft/SKILL.md`, seul
arbitre du design + professionnalisme pour les builds `site-revamp`,
sourcé uniquement sur deux builds réels validés (`projects/site-adeline/`
et `projects/ets-leveque-site/`). Supprimé en conséquence :
`references/design-references/` (8 captures d'inspiration générique
collectées en juillet, avant qu'on ait du vrai contenu client à qui se
référer) et `.claude/skills/site-revamp/scroll-design-guidelines.md`
(règles trop absolues, ex. "jamais de carte", déjà contredites en pratique).
`site-revamp/SKILL.md` pointe maintenant vers `site-craft` à l'étape
Direction artistique au lieu de `frontend-design` +
`scroll-design-guidelines.md`. Conséquence directe : la règle "Image,
jamais vidéo" ajoutée le 2026-07-21 est levée pour ce skill — le moteur
scroll+vidéo d'ETS Lévesque (frames canvas, vidéo verrouillée au scroll,
chapitres synchronisés) redevient une technique disponible, pas bannie.

**Why:** Julien a jugé les règles de design existantes obsolètes — écrites
avant qu'on ait des builds réels aboutis à qui se référer. Il veut que
toute décision de design/professionnalisme s'appuie sur ce qu'on a
vraiment construit et validé (CréA'deline, ETS Lévesque) plutôt que sur de
l'inspiration générique ou des règles écrites à l'avance.

**Alternatives considered :** supprimer `frontend-design` entièrement —
écarté, il reste utilisé par `showcase-reel` (pas de vrai client, cas
différent où l'inspiration générique reste pertinente). Déplacer
`engine-recipes.md`/`mobile-reliability.md` dans `site-craft` — écarté,
laissés dans `site-revamp/` pour ne pas casser ses pointeurs internes,
`site-craft` les référence à la place.

**Owner:** Julien.

---

## 2026-09-13 — site-adeline : Neon Postgres + accès Vercel permanent

**Decision:** migrer le backend de `projects/site-adeline/` de SQLite
local vers Neon Postgres (`@neondatabase/serverless`, connexion en
singleton paresseux) pour les deux apps (`app/`, `admin/`) ; stocker un
token API Vercel permanent dans `~/.vercel_token` (chmod 600) pour que
Claude n'ait plus besoin de login interactif à chaque session ; toujours
enchaîner un déploiement prod avec `vercel alias set <url> creadeline.vercel.app`
(l'alias custom n'est pas mis à jour automatiquement par `vercel --prod`).

**Why:** SQLite sur disque local était un cul-de-sac pour passer
`/boutique` en ligne — le filesystem serverless de Vercel n'est ni
persistant ni partagé entre invocations. Julien a choisi Vercel
Postgres/Neon quand on lui a posé la question. L'accès permanent à Vercel
a été explicitement demandé par Julien ("je veux que tu y sois accès en
permanence") après plusieurs frictions de login pendant cette session.

**Alternatives considered :** garder SQLite et héberger sur un VPS dédié
(prévu dans `PROGRESS.md` du 28/08) — écarté pour l'instant, Julien veut
rester sur Vercel tant que le trafic reste faible ; Supabase — déjà écarté
le 28/08 (mise en pause automatique pour inactivité sur le plan gratuit).

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens : nouveau concept hero (portiques cliquables + workflow Blender→IA)

**Decision:** remplacer complètement le hero actuel (photo voiture statique) par une
séquence cockpit : phrase d'accroche → plongée caméra ciel vers cockpit (plan-séquence
unique, pas de coupe) → conduite → ralentissement sur une "ligne d'arrivée" où 4 portiques
façon gantry F1 apparaissent ensemble, chacun avec une phrase de qualification pour une des 4
grosses catégories de prestations. Copy finale des 4 portiques :
1. Performance & Passion — *"Vous êtes en quête de sensations fortes."*
2. Sérénité & Confiance — *"Retrouvez de la sérénité derrière un volant."*
3. Entreprise & Collectif — *"Une expérience automobile pensée pour rassembler."*
4. Industrie & Marques — *"Un service automobile taillé pour les professionnels."*

Mécanisme de clic : la vidéo se met en pause sur la fenêtre où les 4 portiques sont
visibles/stables, 4 zones cliquables HTML positionnées en % par-dessus (pas de coupe, la
caméra doit être fixe à ce moment précis pour que les zones ne bougent pas). Texte des
portiques modélisé en dur en 3D dans Blender (pas un overlay CSS), pour un rendu
intégré/réaliste plutôt que du texte plaqué.

Workflow de production : Blender pour bloquer la scène (géométrie schématique, surtout les
mouvements de caméra pour la cohérence) puis génération vidéo IA à partir d'images de
référence (voiture, cockpit) pour le rendu final photoréaliste. Probablement Higgsfield
(motion control) pour l'étape de génération — **pas encore autorisé**, à revalider
explicitement avant tout appel (règle du connecteur, voir mémoire
`feedback_higgsfield_needs_authorization`).

**Why:** la 1ère version de l'idée (14 sous-catégories affichées sur les rambardes pendant
la conduite) posait deux problèmes — texte illisible à vitesse de conduite, et durée de
séquence caméra énorme (14s+ rien que pour les tenir 1s chacune). Réduire à 4 portiques (un
par grosse catégorie, pas par sous-catégorie) règle la durée. Formuler chaque portique comme
une phrase de qualification ("vous êtes/vous cherchez...") plutôt qu'un nom de catégorie
résout la lisibilité ET donne un vrai rôle fonctionnel à la scène (le visiteur se
qualifie/choisit lui-même) au lieu d'être un doublon décoratif du menu de nav.

**Alternatives considered :** HUD dans l'habitacle façon tableau de bord digital (rejeté
comme option pour le texte final, gardé en tête pour un futur besoin d'affichage dynamique) ;
grille éditoriale statique sans voiture (écarté, Julien veut garder le côté spectaculaire) ;
plan-séquence avec coupe/whip-pan pour l'entrée ciel→cockpit (écarté par Julien au profit du
plan-séquence unique, malgré le coût de prod plus élevé — interieur cockpit à modéliser en
détail, transition lumière ext/int à gérer).

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens hero : blocking Blender construit, 3 arbitrages tranchés en construisant

**Decision:** blocking Blender du hero (586 images, 24 fps, 2560×1440) construit dans
`projects/drivingsens-site/assets/blender/drivingsens_hero_blocking.blend`, hiérarchie
`TRACK_PATH → CAR_ROOT → CAM_BASE → CAM_SHAKE → CAM_HERO` + collections `00_CAM/10_CAR/
20_COCKPIT/30_TRACK/40_GANTRY/50_LIGHTS` conformes au plan. Le plan laissait 3 points
sous-spécifiés qu'il a fallu trancher pour que les livrables numériques marchent réellement :

1. **Texte des portiques : 2 objets (titre + phrase) au lieu d'1 seul.** Le plan dit "un
   objet Text Blender par portique (titre + phrase)" mais demande aussi de mesurer "la
   hauteur angulaire du titre" spécifiquement — impossible à isoler proprement dans un seul
   bloc de texte multi-lignes. Séparé en `{GATE}_TXT_TITLE` + `{GATE}_TXT_PHRASE`.
2. **Portique positionné pour que la voiture le franchisse en FIN de traversée, pas au
   milieu.** Premier essai (portique centré sur le milieu de sa phase "traversée") donnait
   une fenêtre de lisibilité ≥6% de hauteur d'image tenue moins de 0,2s (bien sous les 0,8s
   minimum du plan) — la croissance angulaire d'un objet fixe qu'on approche est hyperbolique,
   trop rapide en fin de course. Décaler le portique pour que le franchissement réel tombe en
   fin (pas au milieu) de la phase traversée + agrandir le texte (size 1.15→3.0, largeur
   panneau 10→27m) étale la fenêtre à 1,07–1,38s selon le portique — largement au-dessus du
   minimum, vérifié numériquement via `world_to_camera_view` (pas à l'œil).
3. **Beat 6 (quinconce) : portique séparé, planté 16 m devant le point d'arrêt réel de la
   voiture**, pas centré dessus. Le plan ne précisait pas la distance de recul caméra→panneaux
   à l'arrivée ; centrer le portique exactement sur la position finale de `CAR_ROOT` plaçait
   les 4 panneaux quasiment sous la caméra (hors-cadre). Mesures finales : les 4 panneaux
   occupent chacun 14,4% de la largeur d'image, hors des 12% latéraux, alternance haut/bas
   confirmée par les coordonnées (voir `CLAUDE.md` du projet pour le détail chiffré).

**Why:** le plan (Opus, planification pure) donnait le bon découpage narratif et le bon rig
caméra, mais certaines valeurs numériques ("6-7% de hauteur, tenu 0,8s", "hors des 12%
latéraux") ne pouvaient être satisfaites qu'en ajustant la géométrie en aval — exactement ce
que le plan anticipait lui-même ("si ce n'est pas le cas, c'est la géométrie qu'il faut
corriger, pas le rendu"). Vérifié par mesure projective (`world_to_camera_view`) à chaque
itération plutôt que par inspection visuelle du rendu proxy (l'ombrage plat du blocking rend
les formes difficiles à distinguer à l'œil).

**Alternatives considered :** garder le texte en un seul objet et mesurer approximativement
la moitié supérieure de sa bounding box (écarté, imprécis) ; ralentir davantage la voiture
pendant "lecture" au lieu d'agrandir le texte/reculer le repère (écarté — le plan fixe déjà le
creux de vitesse à 72-78%, le pousser plus bas aurait cassé le rythme "soutenu" voulu pour
cette section).

**Owner:** agent Sonnet 5 (construction), à valider par Julien.

---

## 2026-09-14 — Driving Sens hero : playblast v1 cassé à l'écran, corrigé après revue visuelle frame par frame

**Decision:** le premier playblast Blender (livré plus tôt le même jour) était rapporté "bon" sur
la seule base de mesures programmatiques (`world_to_camera_view`) sans jamais avoir été regardé
frame par frame par l'agent. Julien a extrait des images du mp4 lui-même et signalé un rendu
cassé : voiture méconnaissable, immense pan gris permanent bloquant la vue en cockpit, plusieurs
titres de portiques superposés illisibles, route sans aucun marquage donc virage imperceptible.
Correction faite en regardant réellement chaque rendu (outil `Read`, pas seulement des nombres) :

1. Bug d'échelle systémique sur les primitives `size=1` (`scale` = dimension finale directe, pas
   demi-étendue) — la carrosserie faisait la moitié de la taille voulue et flottait au-dessus du
   sol.
2. Carrosserie remontée pour laisser les roues visibles en dessous (bas de caisse à 0,50 m, toit
   à 1,29 m) plutôt que posée au sol.
3. La coque extérieure (carrosserie + 4 roues + pare-brise ext) n'était jamais masquée alors que
   la caméra cockpit est positionnée *à l'intérieur* de cette boîte — c'était la vraie source du
   "pan gris géant". Habillage cockpit et coque extérieure sont maintenant mutuellement exclusifs
   par plage d'images (visibilité keyframée en réciproque, 1-97 vs 98-586).
4. Ombrage viewport `SOLID` ignore l'alpha des matériaux (le pare-brise transparent sortait
   opaque) — passé en ombrage `MATERIAL`/rendu plein pour tout export fiable.
5. Profondeur de champ désactivée pour le blocking — le flou EEVEE sur des objets très proches
   (volant à <1 m) avec une mise au point calée à 30-45 m produisait un flou géant qui remplissait
   le cadre, surtout visible au virage.
6. Volant/tableau de bord redimensionnés par itération mesurée + vérifiée à l'écran (volant
   ramené à ~23 % de la hauteur d'image, tableau de bord réduit à une fine bande de bas de cadre).
7. Marquage de route ajouté (3 lignes suivant `TRACK_PATH`, axe + 2 rives) — c'est ce qui rend le
   virage du segment 9 perceptible à l'écran, pas juste le lacet de caméra seul.
8. Les 4 portiques étaient visibles dès l'image 1 ; combiné à l'agrandissement du texte fait pour
   tenir la fenêtre de lisibilité 6-7 %/0,8 s, 2-3 titres devenaient simultanément lisibles.
   Chaque portique (2, 3, 4) n'apparaît plus que juste avant son propre segment (au moment même où
   le plan de tournage prévoit déjà qu'il "entre en champ au lointain").

**Why:** un rendu jugé correct uniquement par des mesures projectives, sans jamais être regardé,
peut cacher des bugs de composition évidents à l'œil (objet qui remplit le cadre, deux textes
superposés, silhouette qui ne se lit pas) — la mesure vérifie une propriété isolée, pas la lecture
d'ensemble de l'image. Julien a explicitement demandé qu'une revue visuelle (outil `Read` sur des
frames extraites) précède désormais toute déclaration de "c'est bon" sur un livrable visuel.

**Alternatives considered :** corriger seulement les points explicitement listés par Julien sans
chercher la cause racine (écarté — le pan gris et les triangles avaient la même cause profonde,
la coque jamais masquée ; les traiter séparément aurait laissé le bug de fond) ; garder la
profondeur de champ activée avec une distance de mise au point plus proche (écarté — le compromis
la plus sûre pour un blocking est de la désactiver entièrement, la DOF esthétique appartient à
l'étape de rendu final, pas au blocking).

**Owner:** agent Sonnet 5 (construction + correction), validation visuelle Julien toujours en
attente sur cette v2.

---

## 2026-09-14 — Migration de l'AIOS de Claude Code vers Codex

**Decision:** l'AIOS actif adopte les conventions Codex : `AGENTS.md` pour les instructions,
`.agents/skills/` pour les skills, `.codex/agents/*.toml` pour les agents et
`references/working-preferences.md` pour les préférences durables. Les anciens fichiers Claude
sont conservés dans `archives/claude-code-migration/`. Les workflows choisissent désormais le
modèle selon la difficulté et sa disponibilité, sans dépendre durablement de noms Opus/Sonnet.
Le navigateur intégré sert aux inspections ponctuelles, Computer Use aux interfaces visibles ou
natives, et Playwright aux parcours répétables et aux gros volumes. Le thread principal inspecte
les livrables réels avant toute validation finale, en particulier les rendus visuels.

**Why:** un remplacement mécanique Claude → Codex laissait des chemins inexistants, des modèles
figés et une fausse mémoire Codex. La première livraison Blender a aussi montré qu'un résumé
d'agent et des mesures numériques ne remplacent pas l'inspection du résultat à l'écran.

**Alternatives considered:** maintenir deux arborescences actives Claude/Codex (écarté, risque de
dérive) ; créer des liens symboliques de compatibilité (écarté, masque les chemins obsolètes) ;
conserver des modèles nommés dans les règles (écarté, disponibilité et gamme évolutives).

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens : la v2 Blender reste non validée après migration Codex

**Decision:** le contrôle direct du playblast final et des exports remplace le statut optimiste de
la correction précédente. Quatre défauts restent bloquants : les panneaux gris occultent les
textes des portiques, l'entrée ciel vers cockpit ne se comprend pas, le tracé place les portiques
en ligne droite puis le virage à la fin alors que la dernière consigne demande l'inverse, et les
quatre panneaux d'arrivée n'ont pas de libellé visible. La reprise détaillée est sauvegardée dans
`projects/drivingsens-site/REPRISE-BLENDER.md`.

**Why:** les images 79, 98, 192 et 586 ainsi qu'un contact sheet de neuf moments montrent ces
défauts sans ambiguïté. Les anciennes mesures de projection vérifiaient la taille théorique des
textes, mais un objet opaque placé devant les rendait malgré tout illisibles.

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens : v3 Blender corrigée et validée par relecture directe

**Decision:** les 4 défauts bloquants relevés dans `REPRISE-BLENDER.md` (textes de portique
occultés par un rectangle gris, tracé avec les 4 portiques en ligne droite puis virage juste avant
l'arrivée au lieu de l'inverse, transition ciel→cockpit illisible, 4 panneaux d'arrivée sans
libellé) sont corrigés dans le `.blend` et le playblast canoniques
(`assets/blender/drivingsens_hero_blocking.blend`,
`assets/blender/render/hero_blocking_playblast.mp4`). Corrections faites par un agent Codex de
réalisation en suivant l'ordre de reprise prescrit (portique 1 isolé et revalidé avant propagation
aux 3 autres, `TRACK_PATH` refait en S léger pendant les portiques avec sortie droite tangentielle,
trajectoire caméra extérieure→cockpit refaite en vue plongeante masquée par flou directionnel,
titres ajoutés sur les 4 panneaux du beat 6, position finale de la voiture verrouillée dès l'image
567). Le thread principal (Sonnet) a vérifié le résultat en lisant directement les exports PNG
régénérés (`portique1_lecture_f192.png`, `beat10_finish_f586.png`, `JOIN_A_before/after`,
`v3_control_f510/f550/f098`, `portique4_lecture_f431.png`) plutôt que de reprendre tel quel le
compte-rendu de l'agent de réalisation, et confirme que les 4 défauts sont résolus. `AGENTS.md`
mis à jour en conséquence.

**Why:** l'entrée précédente de ce log ("la v2 Blender reste non validée après migration Codex")
montrait déjà qu'un compte-rendu d'agent optimiste sans relecture indépendante avait laissé passer
des défauts visibles à l'œil nu. Julien a explicitement redemandé l'inspection directe du résultat
avant toute nouvelle déclaration de "c'est bon".

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens : v5 Blender, écarts au plan de tournage corrigés après référence externe

**Decision:** Julien a envoyé une référence externe (workflow Blender→Seedance 2.5 construit autour
d'une voiture, avec captures du fichier source) après avoir jugé notre scène "vide" et "brouillon".
Vérification faite directement contre `plan-tournage-hero.md` plutôt que contre le seul ressenti :
4 écarts réels au plan trouvés et corrigés — absence totale de rambarde/rail le long de la piste
(explicitement demandée au §Plan 9), grille de départ à la moitié de la taille spécifiée (15×7 m au
lieu de 30×14 m), les 4 panneaux d'arrivée sans aucun support physique, profondeur de champ
désactivée depuis la v2 (levier anti-"jeu vidéo" n°5 du plan, désactivée pour contourner un bug
d'explosion de flou jamais revisité depuis). Ajout hors plan écrit mais jugé nécessaire : un
horizon de reliefs bas de part et d'autre de la piste, cohérent avec un contexte circuit (pas
urbain), pour qu'il y ait un lieu et pas juste route + ciel noir. Le playblast a aussi été
regénéré avec un vrai rendu EEVEE (`bpy.ops.render.render`) au lieu de l'aperçu viewport rapide
utilisé jusque-là, qui n'affichait ni la profondeur de champ ni le flou de mouvement correctement.

**Why:** un rendu viewport rapide en mode d'ombrage `MATERIAL` avait été utilisé pour tous les
playblasts précédents parce qu'il est ~15-20× plus rapide, sans qu'on réalise que cette économie de
temps cachait deux des leviers cinématographiques que le plan demandait explicitement. Julien avait
raison de dire que le résultat manquait d'"effets de caméra" — ils existaient dans les données
(flou de bougé, DOF) mais n'apparaissaient jamais dans le rendu livré.

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens : v4 Blender, corrections de mise en scène après visionnage du mp4 par Julien

**Decision:** même après validation v3 par relecture de stills, Julien a regardé le mp4 en entier et
signalé 3 problèmes de mise en scène invisibles sur des images isolées : plan d'ouverture en vue de
côté figée longtemps (attendait une vue d'en haut), première barrière de départ vide qu'on traverse
sans rien ressentir, fin de parcours qui accélère brutalement puis ralentit d'un coup. Diagnostic
fait en extrayant des dizaines de frames directement du mp4 via `ffmpeg` et en lisant les courbes
d'animation réelles (fcurves caméra `CAM_EXT`, `eval_time` de `TRACK_PATH`, position monde du
véhicule par frame) plutôt qu'en se fiant aux stills déjà exportés ou aux descriptions du plan de
tournage. Cause racine de la fin de parcours : un saut instantané de vitesse ×2 à l'image 533→534
dans la courbe `eval_time`, sans transition, suivi d'une décélération jusqu'à un arrêt figé à
l'image 567 — pas un ralenti volontaire. Corrections : plan d'ouverture repositionné en vue de
grue/drone (hauteur 20 m, rotation quasi verticale) avec tenue raccourcie ; `GATE_START` (piliers
et panneau jusque-là quasi invisibles, sans texte) habillée avec géométrie agrandie et texte
"DRIVING SENS" ; courbe de vitesse finale reconstruite pour prolonger la croisière sans saut puis
décélérer progressivement sur 20 images vers un arrêt à l'image 580. Nouveau playblast complet
régénéré et revérifié par extraction de frames directement depuis le mp4 final aux moments clés des
3 corrections. `AGENTS.md` mis à jour en conséquence.

**Why:** confirme et étend la leçon de l'entrée précédente — même une relecture de stills isolés
(portique1_lecture, beat10_finish, JOIN_X) peut manquer des problèmes qui ne se voient qu'en
mouvement continu (une tenue caméra trop longue, un à-coup de vitesse). Julien a explicitement
demandé une inspection du mp4 lui-même, pas seulement des images de contrôle extraites au montage.

**Owner:** Julien.

---

## 2026-09-14 — Driving Sens : reconstruction V7 en montage automobile dynamique

**Decision:** le hero n'est plus traité comme un plan cockpit quasi continu de 24,4 s. Une copie
séparée `assets/blender/drivingsens_hero_dynamic_v7.blend` ramène la séquence à 17 s / 408 images et
alterne 10 plans (drone, roue, suivi arrière, cockpit, profil, capot), tout en conservant les quatre
portiques de catégories et une arrivée stable. La piste devient un S continu. Les anciens éléments
superposés ont été supprimés et les abords reconstruits dans l'ordre piste, vibreurs, gravier,
rails, mur béton, pneus amortisseurs. Les quatre roues utilisent désormais un moyeu parent animé ;
freins et suspensions restent fixés au châssis. La caméra cockpit est stabilisée et recadrée sur la
route.

**Why:** les captures et la référence envoyées par Julien montrent que le problème n'était plus un
simple manque de finition, mais une grammaire de montage trop longue et trop linéaire. Empiler de
nouveaux détails sur les anciens proxies avait aussi créé des doubles surfaces et des pièces de
suspension visibles depuis l'habitacle.

**Owner:** Julien.

---

## 2026-09-22 — CréA'deline : migration Vercel/Neon → VPS Hostinger + Coolify auto-hébergé

**Decision:** sortir le site public CréA'deline de Vercel (Hobby, gratuit) + Neon Postgres
(us-east-1) pour un unique VPS Hostinger (Frankfurt, Allemagne) faisant tourner Coolify, PostgreSQL
et le stockage objet (MinIO ou "S3 Storage" natif Coolify, à trancher). L'admin (`admin/`) reste sur
Vercel gratuit, séparé, protégé par login — décision antérieure inchangée.

**Why:** trois problèmes concrets identifiés le même jour, pas une préférence esthétique : (1) le
stockage uploads local ne survit pas au filesystem éphémère de Vercel serverless ; (2) la base Neon
tourne aux USA (`us-east-1`) alors que le site est 100% francophone avec un dossier RGPD déjà
construit qui suppose des données en UE ; (3) le plan gratuit Vercel interdit contractuellement
l'usage commercial, or le site encaisse de vrais paiements Stripe. Comparatif chiffré fait avec des
prix réels (API publique Clever Cloud, pages de commande réelles Hostinger/OVH/IONOS, jamais des prix
d'appel marketing) : Clever Cloud ~11-12 €/mois mais fragmenté, Hetzner plus compétitif après ses
hausses 2026, IONOS ~3x plus cher qu'OVH à specs égales, le produit "Web App Hosting" de Hostinger
écarté car MySQL natif (aurait cassé tout le code Postgres existant). Le VPS Hostinger KVM 1 en
Allemagne (~8,98 €/mois avec sauvegardes) a été préféré à l'OVH VPS-2 pourtant plus puissant à prix
comparable (~8,65 €/mois) parce que ce dernier n'était disponible qu'au Royaume-Uni (hors UE) au
moment de la commande — priorité donnée à rester strictement en UE plutôt qu'à la puissance brute.

**Alternatives considered:** Clever Cloud (PaaS géré, écarté pour fragmentation/coût), Hetzner
(écarté, hausses de prix 2026 + gamme bon marché indisponible), IONOS (écarté, ~3x plus cher),
Hostinger "Web App Hosting" (écarté, MySQL natif), OVHcloud VPS-2 (écarté de justesse, UK-only au
moment de la commande).

**Owner:** Julien. Migration en cours au 2026-09-22, détail complet et suite des étapes dans
`projects/site-adeline/PROGRESS.md` (section "Migration hébergement").

---

## 2026-09-22 (suite, même jour) — CréA'deline : deux corrections à la décision ci-dessus, migration terminée

**Decision:** deux points de la décision précédente ont changé en cours d'exécution, le même
jour :

1. **Stockage objet : Garage, pas MinIO ni le "S3 Storage" natif Coolify.** Au moment de
   configurer MinIO, son éditeur s'est révélé avoir **archivé/abandonné le projet open-source**
   (serveur ET client `mc`) — `dl.min.io` renvoie HTTP 410 "no longer maintained, no security
   updates". Écarté immédiatement (site commercial avec vrais paiements Stripe, pas acceptable d'y
   adosser un composant mort). Le "S3 Storage" natif de Coolify s'est aussi révélé être un simple
   formulaire pour enregistrer les identifiants d'un endpoint S3 EXISTANT, pas un service de
   stockage géré. **Garage** (Deuxfleurs, projet français, S3-compatible, activement maintenu)
   retenu à la place, déployé manuellement en SSH (hors gestion Coolify, qui ne sait pas piloter
   les commandes CLI post-démarrage que Garage nécessite).

2. **Admin déployée sur le VPS, pas sur Vercel.** La décision initiale ("l'admin reste sur
   Vercel") supposait à tort qu'un déploiement Vercel existant pour `admin/` existait déjà —
   vérification faite sur le compte Vercel de Julien (`vercel project ls` + API) : **aucun
   déploiement admin n'a jamais existé, l'admin n'a tourné qu'en localhost.** Comme il n'y avait
   donc aucun coût de bascule, la décision a été inversée pour rester cohérente avec l'objectif de
   départ (tout regrouper sur un seul serveur) : l'admin part aussi sur Coolify/VPS
   (`admin.creadeline16.fr`), pas sur un nouveau projet Vercel.

**Why:** Les deux corrections partagent la même logique — ne pas s'attacher à un plan initial une
fois qu'un fait nouveau (éditeur ayant abandonné son projet ; déploiement supposé qui n'existe pas)
rend ce plan moins cohérent avec l'objectif réel de la migration (consolidation, fiabilité long
terme).

**Résultat final** : site public + admin + base de données + stockage, tous sur le même VPS
Hostinger via Coolify. Code extrait du monorepo vers un repo GitHub dédié privé
(`julienbourgouin8-dev/creadeline-site`). Process généralisé pour de futurs sites documenté dans
`.agents/skills/vps-deploy/SKILL.md`. Vercel/Neon gardés en parallèle comme filet de sécurité
jusqu'à vérification bout en bout complète (pas encore faite — voir PROGRESS.md).

**Owner:** Julien.

---
