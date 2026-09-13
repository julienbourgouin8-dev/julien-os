# Registre des traitements — CréA'deline

RGPD Art. 30. Document interne, pas public. À tenir à jour à chaque nouveau
traitement (nouvel outil, nouvelle finalité). Dernière mise à jour : 2026-09-13.

**Responsable de traitement** : [NOM COMPLET D'ADELINE / RAISON SOCIALE] —
mêmes coordonnées qu'aux mentions légales (`app/app/mentions-legales`).

---

## 1. Mesure d'audience du site

- **Finalité** : comprendre la fréquentation du site pour l'améliorer.
- **Base légale** : consentement (Art. 6(1)(a)) — bandeau cookies, opt-in
  explicite, révocable à tout moment via "Gérer les cookies".
- **Données** : pages vues, type d'appareil/navigateur. Pas de nom/email.
- **Destinataire** : PostHog Inc. (sous-traitant), instance hébergée dans
  l'UE (`eu.i.posthog.com`) — pas de transfert hors UE.
- **Durée de conservation** : 12 mois (configuré côté PostHog).
- **Sécurité** : aucune donnée reçue par le serveur CréA'deline lui-même,
  tout part directement du navigateur vers PostHog après consentement.

## 2. Commande / paiement (boutique en ligne)

- **Finalité** : traiter et livrer une commande.
- **Base légale** : exécution du contrat (Art. 6(1)(b)) ; obligation légale
  pour la conservation comptable (Art. 6(1)(c)).
- **Données** : email, adresse de livraison, contenu et montant de la
  commande. Aucune donnée de carte bancaire (gérée entièrement par Stripe).
- **Destinataires** :
  - Stripe, Inc. (sous-traitant paiement) — DPA standard Stripe accepté à
    la création du compte Stripe.
  - Vercel Inc. (hébergeur, société américaine) — DPA standard Vercel
    (inclut les clauses contractuelles types européennes) à vérifier/
    accepter dans le dashboard Vercel avant l'ouverture des ventes.
- **Durée de conservation** :
  - Email + adresse de livraison : **3 ans** après la commande, puis
    anonymisés (voir `admin/scripts/purge-old-orders.js`, à lancer
    manuellement — pas de cron en place).
  - Montant, articles, statut, dates : **10 ans** (pièces comptables, Code
    de commerce Art. L123-22).
- **Droit à l'effacement** : bouton "Effacer les données personnelles" sur
  chaque fiche commande dans l'admin (`admin/app/(protected)/orders/[id]`),
  utilisable à tout moment sur demande d'une cliente.

## 3. Formulaire de contact

- **Finalité** : recevoir une demande de pièce sur-mesure.
- **Base légale** : hors périmètre RGPD du site — le formulaire ouvre le
  client mail du visiteur (`mailto:`), aucune donnée ne transite par le
  serveur CréA'deline. Une fois l'email reçu dans la boîte d'Adeline, il
  relève de la correspondance privée classique, pas d'un traitement
  automatisé du site.
- **Données** : nom, email, message, préférences (type de pièce, tissu).

## 4. Compte admin

- **Finalité** : gérer le catalogue et les commandes.
- **Base légale** : intérêt légitime (Art. 6(1)(f)) — sécurité et bon
  fonctionnement de la boutique.
- **Données** : email admin, mot de passe (haché scrypt, jamais en clair).
- **Journalisation** : table `audit_log` (connexions, créations/
  modifications de produits, actions sur les commandes) — trace qui a fait
  quoi et quand, jamais le contenu des données elles-mêmes.
- **Sécurité** : verrouillage après 5 tentatives de connexion échouées (15
  min), cookie de session signé HMAC, `httpOnly`/`secure`.

---

## Sous-traitants (Art. 28)

| Sous-traitant | Rôle | Localisation | Garantie de transfert |
|---|---|---|---|
| Vercel Inc. | Hébergement | États-Unis | DPA Vercel (à confirmer dans le dashboard) |
| Stripe, Inc. | Paiement | États-Unis / UE | DPA Stripe (accepté à la création du compte) |
| PostHog Inc. | Mesure d'audience | Instance UE | Pas de transfert hors UE |
