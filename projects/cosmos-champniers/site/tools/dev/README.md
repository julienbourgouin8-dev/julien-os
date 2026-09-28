# Scripts de dev et de test (Cosmos)

- `audit.cjs` : erreurs console, débordement horizontal, positions des sections, nombre de h1 (home + Événements, desktop + mobile). `node site/tools/dev/audit.cjs`
- `walk.cjs` : parcourt une page par `?jump=` et capture chaque étape. `node walk.cjs <w> <h> <pas> <préfixe> [page.html]` (captures écrites à côté du script)
- `fonts.cjs` : mesure le temps avant `window.__ready` (test du chargement des polices)
- `find-google-cid.cjs` : trouve la fiche Google Maps et son CID (à convertir en décimal pour `scripts/playwright/scrape-google-reviews.js`)
- `fetch-instagram-avatar.cjs` : récupère l'URL de la photo de profil Instagram (og:image)
- `agent-*.mjs`, `agent-fin-de-page/` : scripts de test écrits par les agents pendant le build (drag, lightbox, reduced-motion, timing de l'intro, génération des avis en HTML)

Serveur local attendu sur `http://localhost:5178/` (lancé depuis `site/`).
