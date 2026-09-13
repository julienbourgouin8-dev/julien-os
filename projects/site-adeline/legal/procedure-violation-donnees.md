# Procédure en cas de violation de données — CréA'deline

RGPD Art. 33–34. Document interne, pas public. Objectif : ne pas perdre de
temps à réfléchir à la marche à suivre le jour où ça arrive — la CNIL doit
être notifiée dans les **72 heures** dès qu'une violation est susceptible
d'engendrer un risque pour les droits des personnes.

## 1. Détecter

Signes possibles : accès admin suspect (voir `audit_log` — connexions à des
horaires inhabituels, verrouillages répétés dans `login_attempts`), alerte
Stripe/Vercel/PostHog sur une activité anormale, fichier `data/creadeline.db`
ou `data/uploads/` accédé/modifié de façon inattendue.

## 2. Qualifier

Une violation RGPD, c'est un accès, une perte, une altération ou une
divulgation non autorisée de données personnelles — pas juste un bug. Se
demander : est-ce que des emails, adresses, ou informations de commande ont
pu être vus/copiés/modifiés par quelqu'un qui n'aurait pas dû ?

- Oui, et un risque pour les personnes est plausible → notification CNIL
  obligatoire sous 72h (Art. 33).
- Risque élevé pour les personnes concernées (ex. fuite massive d'emails +
  adresses) → informer aussi les personnes concernées directement (Art. 34).
- Incident sans donnée personnelle exposée (ex. site down sans fuite) → pas
  une violation RGPD, traiter comme un incident technique classique.

## 3. Agir immédiatement

1. Couper l'accès compromis : changer `ADMIN_PASSWORD_HASH` et
   `SESSION_SECRET` dans `.env.local` (invalide toutes les sessions en
   cours), redéployer.
2. Si la fuite vient d'un sous-traitant (Stripe, Vercel, PostHog) : les
   contacter, ils ont leurs propres obligations de notification en tant que
   sous-traitants (Art. 28(3)(f)).
3. Isoler la cause (ex. dépendance vulnérable — voir `npm audit`) avant de
   remettre le service en ligne si le problème n'est pas corrigé.

## 4. Notifier la CNIL (si applicable, sous 72h)

Formulaire de notification en ligne : https://notifications.cnil.fr/

Informations à préparer :
- Nature de la violation, catégories et nombre approximatif de personnes/
  données concernées.
- Conséquences probables.
- Mesures prises ou envisagées pour y remédier.
- Contact : [EMAIL À COMPLÉTER — même contact que les mentions légales].

## 5. Informer les personnes concernées (si risque élevé)

Email direct, langage clair, sans jargon : ce qui s'est passé, quelles
données, ce qu'on a fait, ce qu'elles peuvent faire de leur côté (ex.
surveiller leur boîte mail pour du phishing).

## 6. Documenter

Même sans notification à la CNIL (Art. 33(5) — obligation de documenter
toute violation, notifiée ou non) : consigner date, nature, personnes
concernées, mesures prises, dans ce fichier ou `decisions/log.md` du
dépôt principal.
