# GWS CLI (Google Workspace CLI)

One CLI for Gmail, Calendar, Drive, Sheets, Docs, Chat, Admin — built dynamically from Google's
Discovery Service, returns structured JSON. Not an official Google product (open-source,
Apache 2.0). Covers Domains 3 (Calendar), 4 (Communication), 7 (Knowledge/files).

## Install

```
brew install googleworkspace-cli
```

## Setup (already done — for reference / re-setup on another machine)

1. Google Cloud project with an OAuth client of type **Desktop app** (not Web application —
   Desktop app clients don't need redirect URIs, they use a loopback port automatically).
2. Enable these APIs on the project (**APIs & Services → Library**): Gmail API, Google Calendar
   API, Google Drive API, and **Google People API** (backs the `userinfo.email` /
   `userinfo.profile` / `openid` scopes — missing this causes a cryptic
   "scope name is invalid... legacy API" error).
3. **OAuth consent screen** must have the account added as a **test user** (app is in testing
   mode, not verified).
4. Download the client JSON, save to `~/.config/gws/client_secret.json`.
5. Authenticate: `gws auth login -s gmail,calendar,drive`. Prints an authorization URL — open it
   (`open "<url>"` on macOS avoids copy-paste truncation issues), sign in, approve. Click
   "Continue" past the unverified-app warning (expected in testing mode).

Credentials are encrypted at `~/.config/gws/credentials.enc` (AES-256-GCM, key in OS keyring).

## Account connected

`julienbourgouinai@gmail.com` (compte principal, config par défaut `~/.config/gws`) — scopes:
`drive`, `gmail.modify`, `calendar`, `openid`, `userinfo.email`, `userinfo.profile`.

## Common commands

```
gws drive files list --params '{"pageSize": 5}'
gws gmail messages list --params '{"q": "is:unread", "maxResults": 10}'
gws calendar events list --params '{"calendarId": "primary", "maxResults": 10}'
```

Every command accepts `--params` as a JSON string mapping to the underlying Google API's request
parameters (same shape as the REST API docs for that endpoint).

## Multi-compte (comptes secondaires pour l'envoi)

`gws` ne stocke qu'un seul jeu d'identifiants par défaut (`~/.config/gws/credentials.enc`). Pour
brancher plusieurs comptes Gmail en parallèle, chaque compte a son propre dossier de config via
`GOOGLE_WORKSPACE_CLI_CONFIG_DIR`, avec une copie du même `client_secret.json` (même client OAuth,
juste des tokens différents par compte) :

```
mkdir -p ~/.config/gws-<nom>
cp ~/.config/gws/client_secret.json ~/.config/gws-<nom>/client_secret.json
GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-<nom> gws auth login -s gmail,calendar,drive
```

Puis toute commande pour ce compte se préfixe par le même env var :

```
GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-<nom> gws gmail messages list --params '{"q": "in:sent", "maxResults": 5}'
```

**Comptes secondaires connectés (2026-07-23)** — tous personnels/familiaux avec historique
d'usage réel (pas des comptes créés le jour même pour l'envoi, ce qui réduit le risque de
détection "ferme de comptes" par Google) :

| Compte | Dossier config | Usage prévu |
|---|---|---|
| `julienbourgouin06@gmail.com` | `~/.config/gws-julienbourgouin06` | Envoi cold email BTP (volume) |
| `julienbourgouin07@gmail.com` | `~/.config/gws-julienbourgouin07` | Envoi cold email BTP (volume) |
| `julienbourgouin8@gmail.com` | `~/.config/gws-julienbourgouin8` | Envoi cold email BTP (volume) |
| `julienbourgouin11@gmail.com` | `~/.config/gws-julienbourgouin11` | Envoi cold email BTP (volume) |

`julienbourgouinai@gmail.com` (compte principal) reste l'identité "propre" — pas de gros volume
poussé dessus, c'est celle qui gère les réponses des prospects. Voir `decisions/log.md` pour le
plan de montée en charge (warm-up progressif, ~5-10/j la 1ère semaine par compte secondaire).

**Piège vécu lors de la connexion multi-compte :** l'URL d'auth affichée dans le terminal se
tronque facilement au copier-coller manuel (erreur Google "response_type manquant"). Utiliser
`open "<url>"` (ou `open -a Safari "<url>"` / `open -a "Google Chrome" "<url>"` selon le
navigateur voulu) depuis le terminal pour l'ouvrir directement, plutôt que de faire coller l'URL
par l'utilisateur. Autre piège : le sélecteur de compte Google peut proposer un compte différent
de celui attendu si plusieurs sessions sont ouvertes dans le même navigateur — toujours vérifier
l'adresse retournée avec `gws auth status` (champ `user`) après coup, ne jamais supposer que le
bon compte a été choisi.
