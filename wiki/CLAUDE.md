# Wiki — le second brain business de Julien

Tu es l'agent qui construit et maintient ce wiki. C'est mon second brain pour le
business : au lieu de redécouvrir mes connaissances à chaque question, tu les
accumules, les relies, et les gardes à jour. **Scope : business, création de contenu
(LinkedIn), automatisation IA — tout ce qui touche de près ou de loin à cet OS.**
Pas de suivi perso/gymnastique/santé ici — ça reste hors scope de ce dossier.

Ce fichier ne s'applique que dans `wiki/`. Le `CLAUDE.md` racine (mon AIOS business —
ETS Lévesque, priorités, voix, connexions) reste le manuel canonique du reste du repo.

## Le principe

Une source que j'ingère n'est pas juste indexée pour plus tard — tu la lis, tu en
extrais l'essentiel, et tu l'intègres : tu mets à jour les pages d'entités concernées,
tu révises les synthèses, tu notes quand une nouvelle info contredit une ancienne. Le
wiki se compile une fois puis reste à jour — il ne se re-dérive pas à chaque question.

Tu écris tout le wiki. Je m'occupe du sourcing, de l'exploration, et des bonnes
questions.

## Structure

- `raw/` — sources brutes, **immuables**. Articles, PDFs, notes vocales transcrites,
  comptes-rendus d'appels prospects. Je dépose ici, tu ne modifies jamais ces fichiers.
  - `raw/assets/` — images téléchargées localement (Obsidian Web Clipper + hotkey de
    download), pour que tu puisses les voir directement plutôt que dépendre d'URLs.
- `pages/` — le wiki lui-même, organisé par catégorie. Catégories de départ :
  - `pages/people/` — entités : prospects BTP (ETS Lévesque...), contacts business,
    créateurs de contenu suivis pour la stratégie LinkedIn
  - `pages/concepts/` — idées et sujets : stratégies de contenu, frameworks
    business, automatisations, tout concept business qui revient
  - `pages/sources/` — une page de synthèse par source ingérée
  - Ajoute de nouvelles catégories librement au fil de la croissance du wiki — pas
    besoin de tout prévoir maintenant. Si un sujet a assez de pages pour mériter son
    propre dossier, crée-le.
- `index.md` — catalogue de toutes les pages (lien + résumé d'une ligne). Tu le lis
  en premier pour répondre à une question ; tu le mets à jour à chaque ingestion.
- `log.md` — journal chronologique append-only : ingestions, requêtes, lints.

## Workflows

### Ingérer une source

1. Lis la source dans `raw/`.
2. Discute avec moi des points clés — qu'est-ce qui mérite d'être retenu.
3. Écris une page de synthèse dans `pages/sources/`.
4. Mets à jour les pages `people/`/`concepts/` concernées : nouvelles infos, et
   surtout note explicitement si ça contredit ou nuance ce qu'on savait déjà.
5. Mets à jour `index.md`.
6. Ajoute une entrée à `log.md`.

Par défaut, on ingère une source à la fois et je reste impliqué (je lis les
synthèses, je guide ce qui mérite d'être creusé). Si je demande un traitement en
lot avec moins de supervision, adapte-toi.

### Répondre à une question

1. Lis `index.md` pour repérer les pages pertinentes.
2. Lis ces pages, synthétise une réponse avec citations vers les pages sources.
3. Si la réponse vaut la peine d'être gardée (comparaison, analyse, connexion
   découverte pendant la discussion), propose-moi de la classer comme nouvelle page
   du wiki plutôt que de la laisser disparaître dans l'historique de conversation.

### Lint (santé du wiki)

Sur demande ("lint le wiki", "check la wiki", ou périodiquement si je ne pense pas à
demander), cherche :
- contradictions entre pages
- affirmations obsolètes qu'une source plus récente contredit
- pages orphelines sans lien entrant
- concepts mentionnés souvent mais sans page dédiée
- questions à creuser ou sources à chercher pour combler un manque

## Conventions

- Log : une entrée par action, format `## [YYYY-MM-DD] ingest|query|lint | description
  courte`. Préfixe cohérent pour rester grep-able (`grep "^## \[" log.md | tail -5`).
- Chaque page du wiki : titre H1, résumé d'une ou deux lignes en haut, puis le détail.
  Liens internes en `[[wikilink]]` (compatible Obsidian, si je l'utilise pour naviguer).
- Une source peut toucher 10-15 pages en une passe — c'est normal et voulu.
