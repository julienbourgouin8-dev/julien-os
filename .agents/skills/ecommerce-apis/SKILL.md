---
name: ecommerce-apis
description: >-
  Intègre la stack e-commerce Stripe (paiement) + Sendcloud (expédition
  multi-transporteur) + Resend (email transactionnel) dans un site Next.js —
  couvre le passage en mode live, les pièges réels rencontrés sur chaque
  API, la gestion des secrets, et la checklist de vérification post-
  déploiement. Trigger sur "intègre Stripe", "connecte Sendcloud", "passe
  Stripe en live", "configure Resend/l'envoi d'email", "ajoute un mode de
  livraison", ou tout site qui vend en ligne. Complète `vps-deploy` (qui ne
  couvre que l'infra/hébergement) — utiliser les deux ensemble pour un
  nouveau site e-commerce sur le VPS de Julien. Distillé de CréA'deline
  (`projects/site-adeline/`), premier vrai paiement live réussi le
  2026-09-23/24 après une session de correctifs — chaque piège listé ici a
  été rencontré et corrigé en vrai, pas de la théorie.
---

# Stack e-commerce (Stripe + Sendcloud + Resend) — playbook réutilisable

Objectif : que la prochaine intégration de cette stack sur un nouveau site prenne des heures, pas
une nuit entière. Chaque section ci-dessous part d'un vrai bug rencontré, pas d'une bonne pratique
générique.

## Architecture de référence (celle qui marche, à reproduire telle quelle)

- **Paiement** : Stripe Checkout **hébergé côté Stripe** (`stripe.checkout.sessions.create` côté
  serveur, redirection du client vers `session.url` sur `checkout.stripe.com`). Pas besoin de
  Stripe.js/Elements côté client — donc `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` n'est en pratique
  **jamais utilisée dans le code** avec cette architecture (vérifié : aucune occurrence dans tout le
  projet). Garder la variable à jour quand même par cohérence, mais ne pas chercher un bug côté
  publishable key si le paiement casse — le vrai coupable est toujours `STRIPE_SECRET_KEY` (serveur)
  ou `STRIPE_WEBHOOK_SECRET`.
- **Commande créée uniquement par le webhook** (`checkout.session.completed`), jamais au clic
  "Payer" côté client — un panier abandonné ne doit jamais créer de commande ni décrémenter de stock.
- **Prix jamais fait confiance au client** : recalculés côté serveur (produit ET port) à chaque
  étape (devis panier, création de session Checkout) à partir de la DB / de l'API Sendcloud.
- **Étiquette Sendcloud générée dans le même webhook**, juste après la création de la commande —
  permet d'inclure le lien de suivi dans l'email de confirmation envoyé juste après, sans étape
  asynchrone séparée.

## 1. Stripe

### Mise en place initiale (mode test)

Rien de spécial — clés test (`sk_test_`/`pk_test_`), webhook test créé sur
`https://dashboard.stripe.com/test/webhooks`, carte de test `4242 4242 4242 4242` (n'importe quelle
date future, n'importe quel CVC).

### Passage en mode live — étapes exactes

1. **Dashboard Stripe → toggle en haut à gauche Test mode → Live mode.**
2. **Developers → API keys** → copier la Secret key (`sk_live_...`) et la Publishable key
   (`pk_live_...`). Si l'utilisateur préfère une clé restreinte plutôt que la clé standard tous-
   pouvoirs : le modèle **"Paiements ponctuels"** ("One-time payments") suffit très largement pour
   cette architecture (elle n'utilise que `checkout.sessions.create` — vérifié en grepant tout le
   code avant de choisir). Les modèles Abonnements/Terminal/Reporting/Virements ne sont pas
   nécessaires. **Si la création d'une clé restreinte n'est pas possible sur le compte** (vu en
   pratique — bouton grisé/indisponible pour une raison non expliquée par Stripe), retomber sur la
   clé secrète standard sans bloquer dessus.
3. **⚠️ Webhook séparé et obligatoire pour le mode live** — le webhook configuré en test n'est PAS
   repris automatiquement. Sans ce webhook, un client paie réellement mais rien ne se passe côté
   site (pas de commande, pas d'étiquette, pas d'email) : **Developers → Webhooks → Add endpoint**,
   en mode Live :
   - Périmètre : **"Votre compte"** (pas "Comptes connectés", sauf usage Connect).
   - Version d'API : garder la version actuelle proposée par défaut, ne pas changer.
   - Événements : cliquer **"Événements sélectionnés"** (jamais "Tous les événements" — inutile et
     plus de surface d'erreur) → chercher **Checkout** → cocher uniquement
     **`checkout.session.completed`** (décocher les 3 autres cochées par défaut :
     `async_payment_failed`, `async_payment_succeeded`, `expired`) — sauf si le code gère
     explicitement d'autres événements (ex. `charge.refunded` si le webhook de remboursement a été
     ajouté, voir TODO du projet).
   - URL : `https://<domaine>/api/webhooks/stripe`.
   - Une fois créé, copier le **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.
4. Coller les 3 valeurs (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
   `STRIPE_WEBHOOK_SECRET`) dans les variables d'environnement de la ressource Coolify côté site
   public (pas l'admin, sauf si l'admin appelle aussi l'API Stripe).
5. **Vérifier avant tout test réel** (voir §5 "Vérification post-déploiement" plus bas) — ne jamais
   supposer qu'un copier-coller de clé secrète s'est bien passé.

### Piège rencontré : migration d'hébergement et webhook oublié

Après une migration Vercel → VPS, le webhook Stripe pointait encore vers l'ancienne URL Vercel —
paiements réussis côté Stripe, mais rien ne se passait côté site (webhook jamais livré). **Leçon
générale, pas spécifique à Stripe : toute migration d'hébergement doit inclure la mise à jour de
TOUS les services externes qui pointent vers l'ancienne URL** (webhooks, callbacks OAuth, etc.), pas
seulement le DNS et les variables d'environnement.

### Collecter le téléphone (souvent requis par les transporteurs)

`phone_number_collection: { enabled: true }` sur la session Checkout — Mondial Relay, par exemple,
**exige** un numéro de téléphone pour son produit de livraison à domicile et refuse silencieusement
l'annonce du colis sans lui (voir §2, "Détection réelle des échecs"). Activer par défaut sauf pour un
retrait en main propre où ça n'a pas d'utilité.

### Tester un vrai paiement sans perdre d'argent

Deux méthodes, à combiner :
1. **Mode de livraison gratuit sans transporteur** (ex. "Retrait à l'entrepôt", 0€, aucun appel
   Sendcloud) — teste tout le reste (webhook, email, admin) sans jamais créer de colis facturable.
2. **Vrai colis + remboursement Stripe + annulation Sendcloud** : passer une vraie commande avec un
   vrai mode de livraison, vérifier que tout fonctionne, puis (a) rembourser le paiement depuis
   Stripe Dashboard → Payments → la transaction → **Refund** (jamais "annuler", cette option
   n'existe que si le paiement n'a pas encore abouti) — seule la commission Stripe (~1,5% + 0,25€)
   n'est pas restituée ; (b) annuler le shipment Sendcloud via l'API (voir §2) avant qu'il soit
   facturé.

## 2. Sendcloud (expédition multi-transporteur)

### API v3, pas v2

Un compte Sendcloud récent peut ne pas avoir accès à l'API v2 (`403 Creating parcels via API v2 is
not available for this account`). Utiliser directement **v3** :
- Cotation : `POST /v3/shipping-options` (avec `calculate_quotes: true`) — renvoie toutes les
  options disponibles (tous transporteurs) pour une adresse/un poids donnés, chacune avec son
  `code` et son prix.
- Création d'étiquette : `POST /v3/shipments/announce`, **exige explicitement**
  `ship_with: { type: "shipping_option_code", properties: { shipping_option_code: "..." } }` —
  contrairement à v2 qui laissait Sendcloud choisir seul le transporteur.

### Choisir dynamiquement, jamais coder les transporteurs en dur

Comparer **tout le catalogue** renvoyé par `/v3/shipping-options` et garder le moins cher par
fonctionnalité (`functionalities.last_mile`: `home_delivery` / `service_point` / `locker`), pas une
liste de codes transporteur figée — un code en dur peut faire rater une option moins chère qui
apparaît plus tard dans le catalogue (constaté : un transporteur B moins cher qu'un transporteur A
supposé "par défaut" pour la livraison à domicile).

### Piège majeur : deux produits différents peuvent avoir le même prix mais un comportement radicalement différent

Sur un même `last_mile` (ex. `locker` ou `service_point`), un transporteur peut proposer **deux
produits distincts au prix strictement identique** :
- une variante **"labelless"** (`functionalities.labelless: true`) — QR seul à scanner en point de
  dépôt, aucune étiquette papier classique ;
- une variante **classique** (`functionalities.labelless: false`) — étiquette A6 complète imprimée
  par l'expéditeur.

Ne comparer que le prix pour dédupliquer fait gagner l'une ou l'autre **au hasard selon l'ordre de
réponse de l'API**, pas selon ce que le commerçant veut réellement. **Toujours regarder
`functionalities.labelless` explicitement** et choisir en connaissance de cause (dans le cas
CréA'deline : toujours préférer l'étiquette classique, cohérent avec le geste physique du commerçant
qui imprime et colle une étiquette avant dépôt).

### Détecter un casier (locker) vs une boutique

Le champ `shop_type` renvoyé par le widget de sélection de point (`sendcloud.servicePoints.open`)
est un **code à une lettre spécifique au transporteur** (ex. `"C"`/`"E"` chez Mondial Relay) — il ne
contient **jamais** le mot "locker". Le champ normalisé et documenté est **`general_shop_type`**
(`"locker"` / `"servicepoint"` / ...) — vérifié en direct sur `GET /v2/service-points`. Utiliser
`general_shop_type`, jamais `shop_type`, pour toute logique de détection casier/boutique.

### `address_line_1` limitée à 32 caractères, et personne ne le dit pour la ligne 2

Sendcloud documente une limite de 32 caractères sur `address_line_1` ("address 1 combined with the
house number") — une vraie adresse française avec un nom de rue long la dépasse facilement. Couper
au dernier espace avant la limite (jamais en plein mot) et renvoyer le surplus sur `address_line_2`.
**Cette même limite existe aussi sur `address_line_2`, non documentée** — si le surplus de la ligne 1
+ la vraie ligne 2 du client dépassent encore, c'est le transporteur qui tranche lui-même en plein
mot sur l'étiquette imprimée si on ne le fait pas nous-mêmes proprement avant.

### `order_number` tronqué par le gabarit du transporteur

Envoyer un UUID complet (36 caractères) comme `order_number` se fait tronquer en plein mot sur
l'étiquette imprimée par **plusieurs transporteurs différents** (constaté sur Mondial Relay ET
Chronopost, gabarits distincts). Envoyer une référence courte (8 premiers caractères de l'UUID,
majuscules) — largement suffisant pour identifier une commande, jamais tronqué.

### Numéro de téléphone requis pour la livraison à domicile

Mondial Relay (et probablement d'autres transporteurs pour leur produit domicile) **exige un numéro
de téléphone du destinataire**. Sans lui, `POST /v3/shipments/announce` répond quand même HTTP 200
avec un objet colis créé, mais `parcels[0].status.code = "ANNOUNCEMENT_FAILED"` et le vrai motif est
dans `data.errors[].detail` (ex. *"Un numéro de téléphone est requis pour la livraison à
domicile."*). Voir la section suivante — ce genre d'échec passe inaperçu si on ne vérifie pas le bon
champ.

### ⚠️ Détecter un vrai échec — ne jamais se fier à "un objet colis existe"

**Le bug le plus coûteux rencontré sur cette stack.** Une réponse HTTP 200 avec `parcels[0].id`
rempli ne veut PAS dire que l'annonce a réussi auprès du transporteur. Toujours vérifier :
```
const hasErrors = Boolean(shipment?.errors?.length);
const statusFailed = /FAILED/i.test(parcel.status?.code ?? "");
if (hasErrors || statusFailed) {
  // vrai échec — shipment.errors[].detail contient le motif exact du transporteur
}
```
Détection par **motif d'échec** (présence d'erreurs, `status.code` contenant "FAILED") plutôt que
par liste blanche de codes de succès — les valeurs exactes des codes de succès ne sont pas
documentées avec certitude, une liste blanche mal devinée rejetterait un vrai succès légitime.
**Symptôme si ce bug n'est pas corrigé** : un bouton "Générer l'étiquette" qui semble ne rien faire
(aucune erreur affichée, mais aucune étiquette/tracking non plus) — chaque clic recrée en fait un
nouveau colis réel raté chez le transporteur (4 colis dupliqués créés en test avant que la cause soit
trouvée).

### Documents : `document_type`, pas `type`

`parcel.documents[]` a deux champs qui se ressemblent : `type` (format visuel, "qr"/"a6"...) et
`document_type` (catégorie réelle, "label"/"customs-declaration"...). Filtrer sur `document_type ===
"label"` — confondre les deux fait rater le document même quand Sendcloud renvoie bien une étiquette.

### Étiquette PDF : certains gabarits collent le contenu au bord de la page

Sendcloud/le transporteur composent eux-mêmes le PDF (jamais nous) — impossible d'agir sur leur mise
en page interne (position du nom du point relais, code service transporteur, etc. — vérifié en
inspectant le flux de contenu brut du PDF, ce sont des textes complets, pas des mots coupés). Mais
**rien n'empêche de retraiter le PDF entier avant de le servir** : si le contenu touche le bord (ex.
constaté sur un gabarit "domicile" Mondial Relay), réduire la page à ~85-90% et la recentrer dans
**les mêmes dimensions exactes** (jamais agrandir la page — reste compatible aussi bien avec un
rouleau d'étiquettes thermique qu'une impression "taille réelle"). Implémentation avec `pdf-lib` :
`outDoc.embedPdf(srcDoc)` puis `page.drawPage(embedded, {x, y, width, height})` à l'échelle réduite.
Toujours dans un `try/catch` qui sert le PDF original en cas d'échec du retraitement (jamais
bloquant). **Vérifier le résultat avec un vrai rendu image** (`pdftoppm` de Poppler, pas juste relire
le texte du PDF) — un aperçu recadré au contenu (comme celui affiché dans certains outils de chat)
peut donner l'impression trompeuse qu'il n'y a pas de marge alors qu'elle est bien là.

### Annuler un shipment de test (pour ne jamais être facturé)

`POST /v3/shipments/{shipment_id}/cancel` — **attention, l'id du shipment est une UUID différente**
du `shipping_parcel_id` numérique habituellement stocké en base (qui est l'id du **colis**, pas du
**shipment**). Le retrouver via `GET /v3/shipments?order_number=<référence>`. Réponse `202
{"status":"queued"}` = annulation prise en compte. Un shipment déjà en cours d'annulation renvoie
`409 "already being cancelled"` — pas une erreur, juste déjà traité. **Toujours reconfirmer via `GET
/v3/invoices`** (doit rester vide) que rien n'a été réellement facturé après une série de tests.

### Doublon de code entre `app/` et `admin/`

Si les deux apps (site public + admin séparé) appellent Sendcloud chacune de leur côté, elles ont
chacune **leur propre copie** de `lib/sendcloud/client.ts` (aucun package partagé). **Toute
correction sur cette logique doit être appliquée aux deux fichiers** — un correctif oublié d'un côté
(ex. la troncature `address_line_2`) fait resurgir un bug déjà "corrigé" ailleurs dans l'app. Differ
les deux fichiers après toute modif pour vérifier qu'ils sont resynchronisés.

## 3. Resend (email transactionnel)

### Free tier

3000 emails/mois, plafond 100/jour — largement suffisant pour un petit commerce (il faudrait 100+
commandes en une seule journée pour l'atteindre). Pas la peine de comparer avec d'autres providers
pour ce volume.

⚠️ **Ne pas confondre avec "SendCloud"** (sendcloud.net) — société chinoise sans rapport, pure
coïncidence de nom avec Sendcloud/panel.sendcloud.sc (notre compte de logistique européen, voir §2).
Aucun lien, ne fait pas de mail transactionnel connectable à notre compte d'expédition.

### Domaine non vérifié = sandbox limité au propriétaire du compte

Tant qu'aucun domaine n'est vérifié, `onboarding@resend.dev` (l'expéditeur de test) **ne peut
délivrer qu'à l'adresse email du propriétaire du compte Resend lui-même** — jamais à un client
réel, même sans erreur API apparente. Un email de contact/confirmation qui "marche" en test (parce
qu'il part vers le compte du développeur) peut donc sembler fonctionnel alors qu'il ne touchera
jamais un vrai client en prod.

### Vérifier un domaine — étapes exactes

1. Dashboard Resend → **Domains → Add Domain** → taper le domaine.
2. Resend affiche 3-4 enregistrements DNS (1 TXT DKIM `resend._domainkey`, 2 CNAME SPF, 1 TXT DMARC
   optionnel `_dmarc`).
3. **Les valeurs affichées à l'écran sont tronquées visuellement** — toujours cliquer pour copier la
   valeur complète depuis Resend, jamais retaper ce qui est visible.
4. Ajouter ces enregistrements dans la zone DNS du registrar (OVH, etc.).
5. Revenir sur Resend, cliquer **Verify**. Propagation : quelques minutes à quelques heures.
6. Une fois vérifié, **changer les adresses `from:` de `onboarding@resend.dev` vers une vraie
   adresse `@domaine`** dans tout le code qui envoie des emails (contact, confirmation de commande,
   notification) — sinon le domaine vérifié ne sert à rien, resend continue d'envoyer depuis
   l'adresse sandbox tant que le code n'est pas changé.

### La clé API restreinte à l'envoi ne peut pas gérer les domaines

Une clé API Resend "restricted to only send emails" ne peut pas appeler `/domains` par API (401) —
normal, pas un bug. La vérification de domaine se fait uniquement dans le dashboard.

## 4. Gestion des secrets — pièges rencontrés (coûteux en temps)

Toujours suivre le protocole standard (fichier local `.secrets/`, `chmod 600`, `open -e` TextEdit,
l'utilisateur colle lui-même, jamais de secret dans le chat) — mais ce protocole a des angles morts
concrets rencontrés cette nuit :

- **TextEdit peut couper une longue chaîne collée sur plusieurs lignes** (constaté deux fois) — après
  tout collage d'un secret long, **vérifier le nombre de lignes du fichier** (`wc -l`) avant de
  l'utiliser. Un secret coupé sur 3 lignes au lieu d'1 est un signe quasi certain de corruption.
- **Une fenêtre TextEdit restée ouverte avec une ancienne version peut écraser une correction** faite
  entre-temps directement sur le fichier (via script) si elle se resauvegarde. Avant de rouvrir un
  fichier de secret déjà corrigé par script, **fermer d'abord toute fenêtre TextEdit existante sans
  sauvegarder** (`osascript -e 'tell application "TextEdit" to close (every document whose name is
  "X") saving no'`), puis rouvrir une fenêtre fraîche.
- **Copier un secret depuis une photo/capture d'écran via OCR ("Live Text" ou équivalent) peut
  substituer des caractères latins par des lookalikes Cyrilliques visuellement identiques** (p↔р,
  c↔с, T↔Т, E↔Е) — invisible à l'œil dans la plupart des polices, cassant totalement la validité du
  secret. **Détectable en comptant les octets non-ASCII** (`sum(1 for b in data if b > 127)` doit
  valoir 0 pour un vrai secret Stripe/API, qui sont en pur ASCII base62). Solution la plus fiable :
  lire l'image soi-même (vision, pas OCR) et transcrire à la main, ou mieux, demander à
  l'utilisateur de copier **directement depuis la source** (bouton copier du dashboard) plutôt que
  depuis une photo.
- **Toujours valider un secret contre un vrai appel API sûr et en lecture seule** avant de le
  considérer bon — un simple contrôle de longueur/préfixe ne suffit pas. Pour Stripe :
  `curl -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/balance` (HTTP 200 = valide, ne débite
  rien). Chercher l'équivalent "lecture seule, gratuit, sans effet de bord" pour chaque nouvelle API.
- **Récupérer un secret depuis le presse-papiers plutôt que de le faire retaper** dès que possible :
  `pbpaste` capturé directement dans un fichier (jamais affiché en sortie de commande) est plus
  fiable qu'un aller-retour par un éditeur de texte.

## 5. Vérification post-déploiement (checklist)

Sur une infra à plusieurs ressources Coolify (ex. site public + admin séparés, voir `vps-deploy`),
chaque déploiement doit être vérifié individuellement — un push Git met à jour le dépôt, pas les
conteneurs, et chaque ressource Coolify se déploie indépendamment sur un clic "Deploy" séparé.

1. **Vérifier le commit réellement déployé sur le VPS**, pas seulement supposé après un push :
   ```
   ssh <alias-vps> "docker ps --format '{{.Names}} {{.Image}} {{.CreatedAt}}'"
   ```
   Le tag d'image contient le hash du commit `git subtree split` (voir `vps-deploy`) — comparer à
   `git log --oneline -1`.
2. **Identifier quel conteneur correspond à quel domaine** si plusieurs ressources tournent en
   parallèle (utile quand deux hash différents apparaissent et qu'il faut savoir lequel est
   périmé) :
   ```
   docker inspect <nom-conteneur> --format '{{json .Config.Labels}}' | grep 'routers.*rule'
   ```
   Cherche la ligne `Host(\`<domaine>\`)`.
3. **Vérifier qu'un changement de code est bien présent dans le build**, pas juste que le tag de
   commit correspond (le tag prouve que Coolify a lancé un build pour ce commit, pas qu'il a
   réussi sans erreur silencieuse) :
   ```
   docker exec <conteneur> sh -c 'grep -rl "<marqueur-unique-du-code>" /app/.next 2>/dev/null'
   ```
4. **Tester la route réellement modifiée en conditions de production**, pas juste en local — pour
   une route protégée par session (ex. admin), un token de session valide peut être fabriqué
   localement avec le même `SESSION_SECRET` que la prod (HMAC signé, voir l'implémentation du
   projet) puis passé en cookie à `curl`, sans jamais avoir besoin des identifiants de connexion
   réels.
5. **Vérifier les logs applicatifs pour la fenêtre de temps du test**, filtrés sur les erreurs
   probables (`error|erreur|échec|fail|exception`, en excluant le bruit routinier comme les notices
   de migration DB `already exists`) :
   ```
   ssh <alias-vps> "docker logs <conteneur> --since 60m 2>&1 | grep -iE '...' | grep -v 'already exists'"
   ```
6. Après une série de tests avec de vrais paiements/expéditions : **nettoyer** — annuler les
   shipments Sendcloud de test (§2), rembourser les paiements Stripe de test, supprimer/annuler les
   commandes de test en base, remettre les prix produits à leur vraie valeur si modifiés
   temporairement pour un test à faible montant.
