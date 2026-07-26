# Site Adeline — e-commerce codé de zéro

## Vision de départ

Créer un site e-commerce (city commerce / petite marque, faible volume) sans passer par
Shopify. Idée : coder le site en local, puis ajouter chaque brique (paiement, tracking,
shipping, dashboard) comme des **missions séparées à apprendre une par une**, plutôt que
tout avoir "gratuitement" intégré via une plateforme. Objectif double : avoir un vrai site
fonctionnel + s'entraîner à chaque brique individuellement.

Idée annexe : construire un dashboard admin type Shopify (visites, ventes, stock) plutôt que
d'utiliser celui fourni par une plateforme.

Questions posées au départ : le processeur de paiement (a priori Stripe) semble simple,
mais le doute portait sur le tracking analytics (existe-t-il de l'open source ? gratuit ou
payant, à quel prix ?), et jusqu'où on peut se rapprocher des fonctionnalités Shopify en
ajoutant des connexions payantes brique par brique, ou s'il y a des choses impossibles à
reproduire.

---

## 1. Paiement — Stripe

- Stripe = 68% du marché e-commerce US, 45% des ecommerçants US l'utilisent en processeur
  principal. Dominant sur le paiement **produits physiques**. ([source](https://redstagfulfillment.com/what-is-the-market-share-of-stripe/))
- Globalement (tous secteurs confondus, pas que ecommerce) Stripe = ~22-29% du marché des
  paiements en ligne, 2e derrière PayPal (43,4%).
- Volume traité par Stripe en 2025 : 1,9 trillion $ (+34% YoY).
- Intégration simple : **Stripe Checkout** (page hébergée par Stripe, zéro souci PCI côté
  nous) ou **Stripe Elements** (formulaire custom intégré au site, mais toujours PCI-safe
  car les données carte ne transitent jamais par notre serveur).
- Webhooks Stripe (`checkout.session.completed`) pour synchroniser les commandes dans notre
  propre DB — c'est la brique où on apprend vraiment.
- **Stripe Radar** (anti-fraude) est inclus gratuitement avec Stripe, règles de base actives
  par défaut, rien à coder.
- Règle absolue : ne jamais stocker de données carte nous-mêmes. Toujours passer par
  Checkout ou Elements.

### Comparaison avec Whop (question posée : Whop c'est quoi, vs Stripe ?)

- Whop et Stripe ne sont **pas la même catégorie de produit**.
- Whop = plateforme tout-en-un pour **produits digitaux** : checkout + BNPL + communauté +
  hébergement de contenu + app mobile + marketplace + gestion d'affiliation. Pensé pour
  créateurs vendant formations, communautés, SaaS. Frais : 2,7% + 0,30$/transaction,
  0$/mois.
- Stripe = brique de paiement pure, plus de liberté sur le design du checkout, mais il faut
  ajouter soi-même les outils autour (200-500$/mois d'outils en plus pour Whop) si on veut
  égaler ce que Whop fait nativement.
- **Verdict pour Adeline** : Whop écarté, ça sert pour du digital (formations, communautés),
  pas pour du stock physique avec expédition. Stripe est le bon choix pour un site avec des
  produits physiques à expédier.

---

## 2. Tracking / Analytics

Question posée : existe-t-il des outils open source pour remplacer le tracking Shopify ?
Gratuit ou payant, à quel prix, quel niveau de ressemblance avec Shopify ?

### Comparatif des 4 outils envisagés

- **Plausible Analytics**
  - Open source (licence AGPL), léger, sub-2KB script, conforme RGPD/CCPA sans bandeau
    cookie.
  - Self-hosted (édition communautaire) = **gratuit MAIS bridé** : pas de funnels, pas de
    revenue tracking en version self-host gratuite.
  - Version cloud avec toutes les features = ~9$/mois, **pas gratuite**.
  - Bon bot-filtering, mais seulement sur la version cloud payante.

- **Umami**
  - Open source, licence **MIT** (plus permissive que Plausible/AGPL, utilisable en
    commercial sans restriction).
  - Self-hosted = **gratuit, zéro feature bridée**, version self-host = le produit complet
    (pas de split gratuit/payant comme Plausible).
  - Léger : tourne sur un VPS à 5$/mois, setup Docker + Postgres/MySQL, moins de 10 min.
  - Inclut funnels, cohortes de rétention, événements custom, parcours utilisateurs.
  - **Le plus honnête des quatre en "gratuit total".**

- **Matomo**
  - Open source, self-hostable, le plus proche de Google Analytics/Shopify en profondeur
    (funnels, heatmaps, ecommerce tracking natif).
  - Plus lourd à héberger que Umami.

- **PostHog**
  - Open source (licence MIT sur le cœur, licence proprio sur le dossier `ee/` — build
    "posthog-foss" pour rester 100% open source si on self-host).
  - Le plus complet : funnels, session replay, feature flags, events custom.
  - **Cloud gratuit très généreux** : 1M events/mois, 5K session recordings, 1M feature flag
    requests, 100K erreurs trackées, 1 an de rétention, membres d'équipe illimités,
    1 projet.
  - Self-host coûte cher en réalité (5 000-15 000$/mois d'infra pour des boîtes en
    croissance) — **pas pertinent de self-host à notre échelle**, le tier cloud gratuit
    suffit largement pour une petite marque.

### Verdict tracking

Deux choix "100% gratuit sans compromis" :
1. **Umami self-hosted** (VPS 5$/mois pour l'hébergement du VPS lui-même, logiciel gratuit)
2. **PostHog cloud** (gratuit tant qu'on reste sous 1M events/mois — énorme marge pour une
   petite marque, pas de serveur à gérer)

PostHog cloud est probablement le plus simple à démarrer (zéro infra), et donne en un seul
outil l'équivalent visite + comportement + conversion du dashboard Shopify, au lieu
d'assembler plusieurs outils.

---

## 3. Shipping — génération d'étiquette à la commande

### Flux complet

1. Client paie via Stripe Checkout (adresse de livraison collectée automatiquement si
   `shipping_address_collection` est activé)
2. Webhook Stripe `checkout.session.completed` déclenche le backend
3. Backend appelle l'API shipping (Sendcloud) avec : adresse expéditeur (boutique, fixe),
   adresse destinataire (client), poids/dimensions du colis (**champ à prévoir par produit
   dès la conception de la DB**, sinon impossible de calculer les tarifs automatiquement)
4. L'API retourne les tarifs des transporteurs disponibles (Colissimo, Chronopost, Mondial
   Relay pour la France)
5. Achat du label via un second appel API → PDF/PNG du label + numéro de tracking
6. Stockage de l'URL du label + tracking number sur la commande dans la DB
7. Email du tracking au client, impression du label pour l'envoi

### Comparatif des solutions

- **Sendcloud** — gratuit, pas d'abonnement. Labels colis standards **illimités** (la limite
  de 50/mois ne concerne que le format "lettre suivie", pas les colis standards). Couvre
  Colissimo/Chronopost/Mondial Relay sans négocier un contrat séparé par transporteur.
  **Choix retenu** pour la France/Europe.
- **Shippo** — plus US-centric. Plan gratuit "Starter" = 30 labels/mois, 1 utilisateur.
  Au-delà, plan Pro à partir de 19$/mois (jusqu'à 200 labels/mois).
- **Colissimo en direct (ColiShip / Web Service Affranchissement de La Poste)** — zéro frais
  de plateforme, API SOAP directe. Nécessite un compte entreprise Colissimo. Intégration
  plus lourde (SOAP, pas de SDK moderne). Tests gratuits seulement si on prévient le
  commercial avant ; dès qu'un label est flashé en prod, c'est facturé.

**Point important à retenir** : dans tous les cas, l'affranchissement (le port) lui-même
n'est jamais gratuit. Ce qui change entre les solutions, c'est la couche logicielle qui
génère le label — le coût du transport est toujours répercuté sur le prix de livraison
affiché au client.

---

## 4. Admin produit façon Shopify — comment le coder simplement

Besoin exprimé : pouvoir ajouter des articles, gérer les quantités en stock, uploader des
images et une description, sans que ce soit aussi complexe que de coder tout à la main —
comme sur Shopify où on remplit juste les champs et la plateforme génère la page produit.

### Solution retenue : Supabase

Un seul outil (open source, gratuit à ce volume) qui regroupe trois briques en une :
- DB Postgres (table `products`)
- Storage pour les images produits (upload direct, pas besoin de service séparé type
  Cloudinary)
- Authentification (protège la page admin)

### Architecture minimale

1. **Table `products`** : nom, description, prix, quantité en stock, image(s), statut
   (actif/archivé)
2. **Page admin protégée** par login (Supabase Auth) : formulaire avec upload image
   (drag & drop vers Supabase Storage), champs texte, bouton "publier"
3. **Le storefront lit directement cette table** — un produit ajouté en admin apparaît tout
   de suite sur le site public, pas de redéploiement nécessaire
4. **Stock décrémenté au moment du webhook Stripe confirmant le paiement**, jamais au clic
   "acheter" — sinon un panier abandonné bloque du stock indéfiniment

Estimation : un weekend de dev, bon morceau pour apprendre formulaires + upload fichiers +
relations DB.

---

## 5. Hébergement — Netlify

- Plan gratuit Netlify confirmé : domaine custom + SSL automatique (Let's Encrypt) inclus,
  aucune limite de bande passante sur le domaine custom, hébergement Next.js sans souci.
  300 credits/mois inclus, largement suffisant pour un site à faible trafic.
- **Le nom de domaine lui-même n'est jamais gratuit.** Netlify permet de connecter
  gratuitement un domaine qu'on achète ailleurs (Namecheap, OVH...), environ 10-15€/an pour
  un .com ou .fr. Aucune plateforme n'offre un vrai domaine gratuit à vie.
- **C'est le seul coût récurrent certain de tout le projet.**

---

## 6. Choses auxquelles Julien n'avait pas pensé (checklist essentielle e-commerce)

- **Oversell** : deux clients achètent le dernier article en même temps → il faut une
  transaction DB atomique qui revérifie le stock au moment du paiement (pas avant), sinon
  vente en négatif possible.
- **Emails transactionnels** : confirmation de commande, notif d'expédition. Brevo
  (français, gratuit jusqu'à 300 emails/jour) plutôt que Resend/Postmark.
- **Pages légales obligatoires en France** : CGV, mentions légales, politique de
  confidentialité RGPD, et surtout le **droit de rétractation de 14 jours** — obligatoire,
  sanctionnable si absent d'un site e-commerce français.
- **TVA** : si micro-entreprise en franchise en base (sous le seuil), pas de TVA à
  facturer, mais mention obligatoire : "TVA non applicable, art. 293B du CGI".
- **State machine du statut de commande** : payé → en préparation → expédié → livré →
  remboursé/annulé. Sans ça, impossible de savoir où en est une commande ni de communiquer
  avec le client.
- **SEO produit** : balises meta + données structurées schema.org Product, sinon Google
  Shopping et les résultats enrichis (prix, avis, stock affichés dans les résultats de
  recherche) ne fonctionnent pas.
- **Anti-fraude** : Stripe Radar est inclus gratuitement, actif par défaut, rien à coder.

### Ce qui est dur/pas rentable à reconstruire soi-même (limites vs Shopify)

- **Détection de fraude avancée** : Shopify s'appuie sur l'agrégat de données de tous ses
  marchands, impossible à égaler seul avec peu de volume (Stripe Radar de base reste
  suffisant à notre échelle).
- **Taxes multi-juridictions automatiques** : TaxJar/Avalara (payant) si besoin
  d'automatisation complète, sinon gestion manuelle viable pour petit volume.
- **L'écosystème d'apps Shopify** : chaque intégration (email marketing, avis clients,
  upsell...) doit être codée ou branchée nous-mêmes, une par une.

---

## 7. Stack finale retenue

| Brique | Outil | Coût |
|---|---|---|
| Frontend + hosting | Next.js + Netlify | Gratuit (hors nom de domaine ~10-15€/an) |
| DB + storage + auth admin | Supabase | Gratuit à ce volume |
| Paiement | Stripe (Checkout ou Elements) | 2,9% + frais fixe par transaction, aucun abonnement |
| Anti-fraude | Stripe Radar | Inclus avec Stripe |
| Tracking/analytics | Umami (self-host, VPS 5$/mois) ou PostHog cloud (gratuit <1M events/mois) | À trancher |
| Shipping | Sendcloud | Gratuit (labels colis standards illimités) |
| Emails transactionnels | Brevo | Gratuit jusqu'à 300 emails/jour |

**Seul coût récurrent certain sur tout le projet : le nom de domaine.**

---

## 8. To-do d'exécution

- [ ] Choisir et acheter le nom de domaine
- [ ] Setup Next.js + déploiement Netlify
- [ ] Setup Supabase (DB produits + storage images + auth admin), prévoir le champ
      poids/dimensions par produit dès la conception du schéma
- [ ] Construire la page admin : formulaire ajout produit (nom, description, prix, stock,
      upload image), édition, archivage
- [ ] Intégrer Stripe Checkout + webhook `checkout.session.completed`,
      activer `shipping_address_collection`
- [ ] Décrémenter le stock via le webhook (transaction DB atomique anti-oversell)
- [ ] Intégrer Sendcloud : génération de label au paiement confirmé, email tracking au
      client
- [ ] Trancher Umami vs PostHog, puis brancher sur le storefront
- [ ] State machine statut commande (payé → préparation → expédié → livré → remboursé)
- [ ] Emails transactionnels via Brevo (confirmation commande, notif expédition)
- [ ] Pages légales FR : CGV, mentions légales, politique de confidentialité RGPD, droit
      de rétractation 14 jours
- [ ] Mention TVA si franchise en base ("TVA non applicable, art. 293B du CGI")
- [ ] SEO produit : meta tags + schema.org Product
- [ ] Vérifier l'activation de Stripe Radar
