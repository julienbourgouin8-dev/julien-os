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
