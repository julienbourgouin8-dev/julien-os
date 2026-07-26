---
name: video-teardown
description: >-
  Décortique une vidéo YouTube (tuto design/build) pour en extraire des
  techniques réutilisables dans `visual-craft` — automatiquement ce que
  Julien faisait à la main (captures d'écran + lecture de la transcription).
  Trigger sur "décortique cette vidéo", "analyse ce tuto YouTube", un lien
  YouTube accompagné de "comprends comment il a fait ça", ou toute demande
  d'enrichir `visual-craft` à partir d'une vidéo plutôt que de captures
  déjà prises à la main. Télécharge, détecte les changements de plan à
  espacement variable (pas un intervalle fixe), recoupe avec la
  transcription, propose des ajouts à `visual-craft` — jamais une copie
  verbatim des frames/transcript dans le repo.
---

# Video Teardown — extraire des techniques d'une vidéo YouTube

Automatise le process qu'on a fait à la main sur la vidéo VANTA : télécharger,
repérer les moments où l'écran change vraiment (pas un intervalle fixe —
l'espacement doit suivre le montage, parfois 1s, parfois 5s), recouper avec
ce qui est dit à ce moment-là, puis faire la même passe d'analyse que
d'habitude pour enrichir `visual-craft`.

## Étape 0 — Vérifier les dépendances

```
which yt-dlp ffmpeg
```
Les deux doivent être installés (`brew install yt-dlp` si besoin — ffmpeg
est déjà présent sur cette machine). Ne pas continuer sans les deux.

## Étape 1 — Lancer l'extraction

```
node scripts/teardown.js <url-youtube> <dossier-de-travail> [seuil=0.15]
```

Le script :
1. Télécharge la vidéo (720p max) + les sous-titres (anglais/français,
   humains ou auto-générés) via `yt-dlp`
2. Détecte les changements de plan avec le filtre `scene` de ffmpeg — c'est
   ce qui donne l'espacement irrégulier voulu, pas un screenshot toutes les
   N secondes
3. Extrait une frame à chaque changement détecté
4. Recoupe chaque frame avec les lignes de transcription dites dans les 8
   secondes autour (contexte de ce qui est en train d'être fait/dit)
5. Écrit `manifest.json` : liste de `{ frame, timestamp, context }`

**Régler le seuil selon le contenu**, pas un seuil universel :
- Écran de démo/UI (Figma, code, navigateur) : commencer à **0.15**, monter
  si trop de frames quasi-identiques, descendre vers 0.08 si des étapes
  importantes sont ratées.
- Plan filmé classique (interview, b-roll) : les seuils par défaut de
  détection de scène (0.3+) fonctionnent mieux — les vrais changements de
  plan sont des coupures franches, pas des mises à jour subtiles d'UI.
- Zéro frame détectée → seuil trop haut pour ce contenu, redescendre.
  Des dizaines de frames quasi-identiques → seuil trop bas, remonter.

### Variante — vidéo présentateur face caméra avec beaucoup d'illustrations courtes

La détection de scène seule rate énormément sur ce format (constaté sur une
vidéo de théorie du design de 30min : 34 frames sur tout le film à un seuil
qui fonctionne bien pour du screen-recording — alors que le contenu était
plein d'illustrations courtes entre les plans du présentateur). Symptôme à
surveiller : peu de frames extraites malgré une vidéo visiblement riche en
exemples visuels.

Dans ce cas, **découper par thème plutôt que par changement de plan brut** :

1. Récupérer les chapitres YouTube si l'auteur en a posé (`yt-dlp
   --skip-download --print-json <url>`, champ `chapters` — bien meilleurs
   que deviner des frontières de thème depuis la transcription seule).
2. Pour chaque chapitre, extraire des frames à **intervalle fixe et serré**
   (10-15s) plutôt que par détection de scène — un talking-head n'a pas
   assez de vrais "changements de plan" pour que la détection de scène
   fonctionne, mais les illustrations qui apparaissent et disparaissent
   vite ont besoin d'un échantillonnage dense pour être captées.
3. **Boucle de vérification, chapitre par chapitre** : ouvrir les frames du
   chapitre (Read), croiser avec le passage de transcript correspondant,
   juger sur le moment ce qui est une vraie illustration (diagramme,
   exemple de composition, poster de référence) vs du présentateur qui
   parle sans rien montrer — garder seulement les premières. Traiter un
   chapitre à la fois, pas toute la vidéo d'un coup, pour rester
   gérable. Supprimer les frames de ce chapitre une fois le principe qui
   en ressort écrit, puis passer au chapitre suivant.
4. Écrire le résultat en langage généralisé (jamais reproduire un poster ou
   une planche d'exemple telle quelle, jamais recopier de longs passages de
   narration) — voir `layout-composition.md` dans `visual-craft` pour un
   exemple de ce que donne cette méthode appliquée en entier.

## Étape 2 — Analyser (la même passe qu'à la main)

Lire `manifest.json`, ouvrir les frames qui semblent correspondre à une
étape distincte du process (Read supporte les images), croiser avec le
`context` transcript de chacune. Pour chaque technique repérée : identifier
le principe généralisable (pas l'exemple précis), puis proposer un ajout
à un des fichiers de `visual-craft` (`image-compositing.md`,
`motion-recipes.md`, `section-copy.md`, `figma-handoff.md`, ou un nouveau
fichier si le sujet ne rentre dans aucun) — toujours reformulé comme
principe réutilisable, jamais copié tel quel.

Comme pour tout apport à `visual-craft` : ne pas figer la technique en
patterns tant que Julien n'a pas vu et confirmé l'analyse — même règle que
pour les captures apportées à la main.

## Étape 3 — Nettoyage (obligatoire)

Supprimer le dossier de travail (vidéo source + frames + manifest) une fois
l'analyse écrite dans `visual-craft`. Rien de la vidéo ne doit persister
dans le repo — ce qui reste, c'est le principe extrait en markdown, jamais
les frames ni la transcription brute.

```
rm -rf <dossier-de-travail>
```

---

## Garde-fous

- **Jamais de vidéo/frames commités dans le repo** — dossier de travail
  toujours dans le scratchpad ou un chemin temporaire, supprimé après
  l'étape 2. Ce skill produit des notes, pas une copie de la vidéo.
- **Jamais une reproduction verbatim** — ni des frames telles quelles, ni
  de longs extraits de transcript recopiés mot pour mot dans
  `visual-craft`. Toujours le principe reformulé, comme pour les captures
  apportées à la main.
- Un seuil de détection de scène mal choisi produit soit rien, soit du
  bruit — toujours vérifier le nombre de frames obtenu avant de se lancer
  dans l'analyse, réajuster si c'est visiblement 0 ou disproportionné.
- Si la vidéo n'a pas de sous-titres (humains ou auto), le `context` du
  manifest reste vide — l'analyse repose alors uniquement sur les frames,
  prévenir Julien que la lecture sera moins précise.

## Fichiers de référence

- `scripts/teardown.js` — téléchargement, détection de scène, extraction,
  recoupement transcript → `manifest.json`
- `visual-craft` (skill séparé) — c'est là que les techniques extraites
  atterrissent
