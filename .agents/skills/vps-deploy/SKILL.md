---
name: vps-deploy
description: >-
  Déploie ou met à jour un site (Next.js ou autre) sur le VPS Hostinger
  partagé de Julien, via Coolify — base de données Postgres, stockage objet
  Garage (S3-compatible), domaine + SSL automatique. Trigger sur "déploie ce
  site sur le VPS", "mets [site] en ligne", "prépare l'hébergement pour
  [projet]", ou toute demande de mise en production hors Vercel/Netlify pour
  un projet de `julien-os`. Distillé de la migration CréA'deline
  (`projects/site-adeline/`, 2026-09-22) — chaque piège listé ici a été
  rencontré et corrigé en vrai, pas de la théorie.
---

# Déploiement VPS (Coolify) — playbook réutilisable

Julien a **un seul VPS partagé** pour tous ses sites (objectif explicite : arrêter d'empiler des
services tiers facturés à la pièce — Vercel + Neon + Blob storage — et tout regrouper). Chaque
nouveau site ajoute des ressources sur ce même VPS via Coolify, pas un nouveau serveur.

## Infrastructure existante (ne pas recréer)

- **VPS** : Hostinger KVM 1, Frankfurt (UE), IP `179.198.209.59`, Ubuntu 24.04.
- **Accès SSH** : alias `creadeline-vps` dans `~/.ssh/config` de Julien (clé ed25519 dédiée,
  `~/.ssh/creadeline_vps`). Marche pour n'importe quelle commande sur ce VPS, pas seulement le
  projet CréA'deline — le nom de l'alias est un héritage du premier projet migré, pas une
  limitation.
- **Coolify** : v4.3.23, dashboard sur `http://179.198.209.59:8000`, identifiants connus de
  Julien seul (jamais demandés dans le chat). Projet "My first project" / environnement
  "production" dans Coolify — réutiliser cet environnement pour les nouveaux sites plutôt que
  d'en créer un autre, sauf besoin explicite d'isolation.
- **Postgres existant** : ressource Coolify `creadeline-db`. **Un nouveau site peut soit
  réutiliser ce Postgres (nouvelle base dans la même instance via `CREATE DATABASE`), soit en
  déployer un autre** — à décider selon le volume/l'isolation voulue. Pas de règle stricte encore
  établie, demander à Julien au moment venu.
- **Garage existant** : conteneur `garage` sur le VPS (hors gestion Coolify, voir plus bas
  pourquoi), API S3 sur le port `3900`, admin sur `3903`. Un nouveau site peut créer son propre
  bucket dans cette même instance Garage (`garage bucket create <nom>` + `garage key create` +
  `garage bucket allow`) plutôt que de redéployer une instance Garage séparée.

## Étape 1 — Extraire le code du monorepo vers un repo GitHub dédié

Coolify a besoin d'un accès Git. Le monorepo `julien-os` contient toute la vie perso/business de
Julien — **ne jamais donner à Coolify un accès direct dessus**. Chaque site déployé a son propre
repo GitHub privé, alimenté depuis le monorepo via `git subtree split` (garde l'historique).

```bash
# Depuis la racine de julien-os, après avoir committé les changements du projet :
git subtree split -P projects/<nom-du-projet> -b extract-<nom-du-projet>

# Premier déploiement seulement : créer le repo vide sur GitHub (privé, sans
# README/gitignore auto-généré) via l'API, avec le token dans un fichier
# local (voir section Secrets ci-dessous) :
TOKEN=$(cat <chemin-fichier-secret> | tr -d '[:space:]')
curl -s -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d '{"name":"<nom-repo>","private":true}'

# Push (--force à chaque fois, l'historique du monorepo est réécrit à
# chaque split) :
git push "https://${TOKEN}@github.com/<compte>/<nom-repo>.git" extract-<nom-du-projet>:main --force
git branch -D extract-<nom-du-projet>
```

Script prêt à l'emploi : `.agents/skills/vps-deploy/scripts/subtree-deploy.sh` (voir plus bas).

**Chaque mise à jour ultérieure** : refaire exactement ce `subtree split` + `push --force` après
avoir committé dans le monorepo. Coolify ne voit QUE le repo dédié, jamais le monorepo — un
commit dans `julien-os` sans ce push n'ira jamais en prod tant qu'on n'a pas relancé la séquence.

## Étape 2 — Clé de déploiement (pas de token GitHub dans Coolify)

Générer une clé SSH dédiée, en lecture seule, plutôt que de donner à Coolify un token GitHub
personnel large :

```bash
ssh-keygen -t ed25519 -f <chemin-local>/deploy_key -N "" -C "coolify-deploy-<nom-site>"
```

Ajouter la clé publique au repo via l'API GitHub (`POST /repos/{owner}/{repo}/keys`,
`read_only: true`) — voir la commande exacte dans l'historique de session ou refaire par analogie
avec l'étape 1. Coller la clé **privée** dans Coolify → **Keys & Tokens** → Add (Julien colle
lui-même depuis un fichier local ouvert en TextEdit, jamais dans le chat).

## Étape 3 — Créer la ressource Application dans Coolify

**Projects → [projet] → [environnement] → New Resource → Private Git Repository (with Deploy Key)**

- Repository URL : `git@github.com:<compte>/<nom-repo>.git`
- Branch : `main`
- Deploy Key : celle créée à l'étape 2
- Build pack : laisser Railpack (auto-détection, marche bien pour Next.js)
- Port : `3000` (Next.js par défaut)

⚠️ **PIÈGE RENCONTRÉ (bug Coolify ou UI trompeuse) : le champ "Base directory" peut sembler
rempli mais ne pas être sauvegardé.** Si le repo contient plusieurs sous-dossiers (ex. `app/` +
`admin/` comme CréA'deline), et que Base directory reste vide, le build échoue silencieusement
avec un conteneur qui tourne mais dont l'image est vide (`Cmd=[/bin/bash]`, crash-loop, aucun
fichier dans `/app`). **Toujours vérifier après coup** : SSH sur le VPS, `docker ps -a`, regarder
si le conteneur reste en `Restarting`. Si oui, retourner dans les réglages de la ressource,
re-taper `/app` (ou le bon sous-dossier) dans Base directory, sauvegarder, **puis seulement**
relancer Deploy.

Après création, aller dans **Environment Variables** → bouton **Developer View** → coller toutes
les variables d'un coup au format `KEY=VALEUR` (bien plus rapide que les ajouter une par une).

## Étape 4 — Base de données Postgres

Si nouvelle instance : **New Resource → Databases → PostgreSQL** (version par défaut, sauf besoin
d'une extension spécifique — vérifier `grep -rn "extension" <projet>` avant de choisir autre chose
que la version vanilla).

- **Nom de la base réellement créée** : le champ "Initial database" de l'UI Coolify n'est **pas
  fiable** — sur CréA'deline, la base créée s'appelle `postgres` malgré `creadeline` tapé dans ce
  champ. Toujours vérifier après coup (`docker exec <conteneur> psql -U postgres -l`) plutôt que
  de supposer que le nom demandé a été appliqué.
- **Accès public** (nécessaire si une autre app hors du VPS — ex. Vercel — doit atteindre cette
  base) : Access → **"Public through TCP proxy"** (pas juste sélectionner "Public" dans une liste
  déroulante simple — le champ **Public port doit être rempli explicitement AVANT** de pouvoir
  choisir cette option, sinon elle reste grisée). Sauvegarder puis **Restart** (pas juste Save).
  Coolify crée alors un conteneur proxy séparé (`<id>-proxy`) qui porte le port public — vérifiable
  via `docker ps -a | grep proxy`.
- ⚠️ **SSL : le toggle de l'UI Coolify ne s'applique pas de façon fiable** (constaté deux fois).
  Après avoir activé "SSL" + redémarré, vérifier avec
  `docker exec <conteneur> psql -U postgres -c "SHOW ssl;"` — si `off` malgré le toggle, corriger
  manuellement en SSH :
  ```bash
  # Sur le VPS : générer un certificat auto-signé sur l'HÔTE (openssl absent
  # de l'image Postgres officielle), le copier dans le conteneur, activer
  # ssl dans postgresql.conf, redémarrer.
  openssl req -new -x509 -days 3650 -nodes -text -out server.crt -keyout server.key -subj "/CN=<domaine>"
  docker cp server.crt <conteneur>:/var/lib/postgresql/<version>/docker/server.crt
  docker cp server.key <conteneur>:/var/lib/postgresql/<version>/docker/server.key
  docker exec -u root <conteneur> chown postgres:postgres .../server.crt .../server.key
  docker exec -u root <conteneur> chmod 600 .../server.key
  # Ajouter à postgresql.conf : ssl = on, ssl_cert_file = 'server.crt', ssl_key_file = 'server.key'
  docker restart <conteneur>
  ```
  Un certificat auto-signé suffit avec `sslmode=require` côté client (chiffré, pas de vérification
  CA — pas besoin d'un vrai certificat signé pour ce cas d'usage interne).

## Étape 5 — Stockage objet : Garage, jamais MinIO

⚠️ **MinIO (serveur ET client `mc`) est officiellement archivé/abandonné par son éditeur depuis
2026** — `dl.min.io` renvoie HTTP 410 "no longer maintained, no security updates". Ne pas
utiliser MinIO pour un nouveau projet, même si de la doc/des tutos en ligne le recommandent
encore. **Garage** (Deuxfleurs, projet français, activement maintenu, cohérent avec une démarche
RGPD/UE) est l'alternative retenue.

Déploiement (hors Coolify — Garage nécessite des commandes CLI post-démarrage que l'UI Coolify ne
gère pas) :

```bash
# Sur le VPS, dans /opt/garage/ (ou un dossier dédié au nouveau site si
# instance séparée voulue) :
mkdir -p meta data
cat > garage.toml <<'EOF'
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"
replication_factor = 1
rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"

[admin]
api_bind_addr = "[::]:3903"
EOF

# Secrets générés directement dans le fichier, jamais affichés :
RPC_SECRET=$(openssl rand -hex 32)
ADMIN_TOKEN=$(openssl rand -base64 32)
cat > garage.env <<EOF
GARAGE_RPC_SECRET=${RPC_SECRET}
GARAGE_ADMIN_TOKEN=${ADMIN_TOKEN}
EOF
chmod 600 garage.env

cat > docker-compose.yml <<'EOF'
services:
  garage:
    image: dxflrs/garage:v2.4.1   # image officielle sur quay.io/dockerhub — vérifier la dernière version avant de pinner
    container_name: garage
    restart: unless-stopped
    env_file: [garage.env]
    volumes:
      - ./garage.toml:/etc/garage.toml:ro
      - ./meta:/var/lib/garage/meta
      - ./data:/var/lib/garage/data
    ports: ["3900:3900", "3903:3903"]
EOF
docker compose up -d
```

Puis, une fois démarré (`docker exec garage /garage status` pour obtenir l'ID du node) :

```bash
docker exec garage /garage layout assign -z dc1 -c 1G <node_id>
docker exec garage /garage layout apply --version 1
docker exec garage /garage bucket create <nom-bucket>
# ⚠️ NE JAMAIS exécuter `garage key create` sans rediriger — la commande
# affiche la Secret Key en clair sur stdout. Toujours :
docker exec garage /garage key create <nom-app> > /chemin/local/secret.txt   # jamais dans le chat
docker exec garage /garage bucket allow --read --write --owner <nom-bucket> --key <nom-app>
```

**Architecture recommandée : bucket privé, jamais public.** Ne pas activer "bucket website"
(nécessiterait un sous-domaine dédié + DNS wildcard, complexité inutile). À la place, faire
transiter les fichiers par l'app elle-même : upload via le SDK S3 côté serveur
(`@aws-sdk/client-s3`, `forcePathStyle: true` — requis par Garage), et servir en lecture via une
route API de l'app qui fait `GetObjectCommand` puis streame la réponse (garde le contrôle d'accès
côté serveur, pas d'exposition publique du bucket).

## Étape 6 — Domaine, DNS, SSL

1. Chez le registrar (OVH dans le cas de Julien) : zone DNS → modifier (pas forcément ajouter,
   souvent un enregistrement A par défaut existe déjà vers l'IP de parking) → **A / @ →
   `179.198.209.59`**. Répéter pour `www` ou tout sous-domaine (ex. `admin.`) si besoin. Vérifier
   la propagation : `dig +short A <domaine> @dns111.ovh.net` (interroger directement le NS
   faisant autorité, pas un résolveur public, pour ne pas attendre le TTL).
2. Dans Coolify, sur la ressource : **Domains → Add Domain** → `https://<domaine>` → Save.
3. **Redéployer** après ajout du domaine — les labels Traefik du conteneur (qui définissent la
   règle de routage `Host(...)`) ne se mettent à jour qu'au prochain déploiement, pas
   immédiatement à l'ajout du domaine. Sans ce redéploiement, le domaine répond 503/404.
4. Coolify/Traefik génère le certificat Let's Encrypt automatiquement une fois le domaine actif.

## Mettre à jour un site déjà déployé

1. Modifier le code dans `julien-os/projects/<projet>/`.
2. Committer dans le monorepo (fichiers précis, jamais `git add -A` — voir le protocole git
   standard).
3. `git subtree split -P projects/<projet> -b extract-<projet>` puis
   `git push <url-repo-dédié> extract-<projet>:main --force`, supprimer la branche locale.
4. Dans Coolify, cliquer **Deploy** sur la ressource concernée.
5. Vérifier côté VPS que le nouveau conteneur tourne (`docker ps` — le tag d'image doit
   correspondre au dernier hash de commit) et que la page répond (`curl -s -o /dev/null -w
  "%{http_code}" https://<domaine>/`).

## Vérifier une commande avant de l'exécuter : secrets

Toute commande dont la seule sortie possible est un secret (credential helper, `printenv` sur une
variable sensible, génération de clé) doit être capturée dans une variable shell ou redirigée
directement vers un fichier — **jamais exécutée nue**, même en phase d'exploration. Deux incidents
réels pendant la session CréA'deline (une clé Garage, un token GitHub personnel de Julien) sont
partis dans la conversation avant que cette discipline soit appliquée systématiquement. Pattern à
suivre : `VALEUR=$(commande-secrète)` puis utiliser `$VALEUR` inline dans la suite, sans jamais
`echo`/`cat` la variable elle-même.

## Après le premier déploiement : audit de performance

Une fois le site en ligne, lancer un audit PageSpeed Insights (mobile ET desktop) avant de
considérer le déploiement terminé — voir `.agents/skills/vps-deploy/references/perf-checklist.md`
pour la checklist condensée des pièges rencontrés sur CréA'deline (vidéos surdimensionnées,
`next/dynamic` qui ne suffit pas à différer un vrai coût CPU, images cachées en CSS quand même
téléchargées, etc.) — **toujours demander/générer le rapport PSI détaillé (tableaux par URL), pas
juste le score global**, sinon plusieurs tours de correctifs peuvent sembler corrects sans
attaquer la vraie cause.
