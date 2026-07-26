# Connections

Registry of every system your AIOS can reach. Filled by `/onboard` from Q4-Q7 answers; expanded over time as you wire new tools. `/audit` checks this file for domain coverage and freshness.

| # | Domain | Tool | Mechanism | Auth | Last checked |
|---|---|---|---|---|---|
| 1 | Revenue / Financials | Revolut (prévu, une fois micro-entreprise créée) | not yet connected | — | — |
| 2 | Customer interactions | Cold email → prospects BTP Périgueux ; recherche de leads via skill `lead-gen` (Google Maps scrapé via Playwright MCP, gratuit, + scrape site + SIRENE) → Google Sheet "BTP Leads - Périgueux" (un onglet par métier — Plombiers Chauffagistes, Electricien, Couvreurs, Maçons, Peintres, Menuisiers, Carreleurs, Plaquistes, Chauffagistes Climaticiens, Terrassiers ; ~1176 leads au total après balayage Maps profond du 2026-07-23) (https://docs.google.com/spreadsheets/d/1Xn_bUU_I26SAYlE-XWj-x17CtAtENaHL17zpAe0ERVI/edit, pas de CRM). Envoi : 4 comptes Gmail secondaires connectés pour répartir le volume (`julienbourgouin06/07/8/11@gmail.com`), détail dans `references/gws-cli-api.md` § Multi-compte — le compte principal reste réservé aux réponses. | script (`gws` CLI, multi-compte via `GOOGLE_WORKSPACE_CLI_CONFIG_DIR`) + navigateur (Playwright MCP) | oauth (Sheets + 4 comptes Gmail secondaires, connectés) | 2026-07-23 |
| 3 | Calendar | Google Calendar | script (`gws` CLI) | oauth, connected | 2026-07-16 |
| 4 | Communication | Gmail (julienbourgouinai@gmail.com) | script (`gws` CLI) | oauth, connected | 2026-07-16 |
| 5 | Project / task tracking | Aucun outil pour l'instant | not yet connected | — | — |
| 6 | Meeting intelligence | Gemini (Google Meet) ou Fireflies.ai — pas encore tranché | not yet connected | — | — |
| 7 | Knowledge / files | Google Drive | script (`gws` CLI) | oauth, connected | 2026-07-16 |
| 8 | Web scraping / automation | Playwright MCP — pilote un navigateur headless, lit le DOM/JSON directement au lieu de captures d'écran (moins cher en tokens, plus rapide que `claude-in-chrome` pour du scraping pur). Méthode Pinterest documentée dans `.claude/skills/site-revamp/SKILL.md` (Étape 0 point 6). | mcp (`claude mcp add playwright -- npx @playwright/mcp@latest`) | local, aucune clé | 2026-07-21 |

**Mechanism options:** `mcp` (MCP server), `script` (Python/Bash hitting an API, in `scripts/`), `export` (CSV/JSON dump pipeline), `key+ref` (`.env` key + `references/{tool}-api.md` guide), `not yet connected`.

When you wire a new tool, also save `references/{tool}-api.md` capturing endpoints, auth flow, and common queries — researched-once-saved-forever.
