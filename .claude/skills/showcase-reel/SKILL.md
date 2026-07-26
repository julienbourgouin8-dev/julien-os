---
name: showcase-reel
description: >-
  Use when someone asks to make a stylized demo website for Instagram/social
  content — no real client, no real business, pure creative showcase to prove
  design skill and attract prospects (typically BTP/trades niche). Trigger on
  "fais-moi une démo pour Instagram", "site stylé pour un reel", "contenu BTP
  stylé", "démo animée pour les réseaux", or any request for a fast, code-only
  stylized site meant to be recorded as a vertical video, not shipped to a
  real client. Never generates AI video — images and pure code only, so it
  stays cheap enough to produce weekly. For rebuilding a real existing
  business's website with its real content preserved, use `site-revamp`
  instead — that one has a real client, this one doesn't.
---

# Showcase Reel — démo stylée pour contenu Instagram

Produit un site vitrine stylé, pur code, dans la niche BTP, uniquement pour
être filmé et posté en contenu Instagram (Reels/Stories) — pas pour un vrai
client. Le but : construire une audience et prouver le niveau de design, en
restant assez rapide et gratuit à produire pour être **hebdomadaire**.

Différence structurante avec `site-revamp` : ici il n'y a jamais de vrai
client, jamais de vrai contenu à préserver, jamais de vidéo générée par IA
(trop cher pour un rythme hebdomadaire — seules les images le sont), et le
site n'est jamais réellement utilisé par un visiteur sur son téléphone — il
est capturé une fois en vidéo puis jeté. Ça veut dire que toute la robustesse
mobile réelle de `site-revamp` (`mobile-reliability.md` — autoplay iOS, bug
de compositor WebKit, scroll-lock résistant à l'inertie tactile) **ne
s'applique pas ici** : ne pas l'importer, ça ralentirait la production pour
rien. Si la demande implique un vrai client ou du contenu réel à préserver,
c'est le mauvais skill — redirige vers `site-revamp`.

---

## Étape 0 — L'idée, en une ligne

Pas d'interview longue — c'est du contenu, pas une offre commerciale. Une
idée suffit (ex. "plomberie, des tuyaux en cuivre qui s'animent au scroll").
S'il manque un angle créatif, tu le proposes toi-même, jamais de blocage.

## Étape 1 — Pitcher 1-2 concepts nommés, vite

Version courte du process de `site-revamp` : un nom, une narration scène par
scène en 2-3 phrases, un concept marqué "(Recommandé)" si tu en proposes 2.
Pas de walkthrough exhaustif — l'objectif est la vitesse d'itération, pas la
consultation client.

## Étape 2 — Construction, pur code uniquement

- **Jamais de vidéo générée par IA.** Uniquement des images (génération
  d'image bon marché ou libres de droit) et du pur code — GSAP + Lenis pour
  le motion. Lis `motion-vocabulary.md` pour le vocabulaire de scènes
  (reveal de titre, scènes épinglées, défilement horizontal, clip-path,
  compteurs, marquee). Pour retoucher/animer une photo précise (wordmark
  incrusté dans la scène, zoom respirant façon Ken Burns), charge
  `visual-craft`.
- Charge `frontend-design` pour la direction artistique — un vrai risque
  esthétique assumé, ce site n'a qu'un travail : être mémorable pendant 15-20
  secondes de scroll filmé.
- Pas de logo/contenu réel à préserver ici — c'est une démo, invente
  librement dans la niche BTP (plomberie, chauffage, électricité, toiture…).
- Répartition modèle : direction artistique + concept sur le modèle le plus
  capable de la session (`/model opus` si dispo) ; la construction mécanique
  peut redescendre sur Sonnet une fois le concept figé — même logique que
  `site-revamp`, en plus rapide vu la taille du site.
- **Même garde-fou dur que `site-revamp` si cette répartition passe par des
  subagents** : le prompt d'un agent Opus doit dire explicitement "tu écris
  SEULEMENT le concept/la direction artistique, pas le CSS/JS final." Un
  agent Opus qui dérive vers la construction complète doit être stoppé
  (`TaskStop`) puis relancé sur Sonnet — voir `site-revamp` Étape 2 pour
  l'incident réel qui a motivé cette règle, le même risque existe ici avec
  le même pattern de répartition de modèle.

## Étape 3 — Capture en vidéo verticale

Implémente le même contrat de dev que `site-revamp`
(`window.__ready`, voir `motion-vocabulary.md`), puis lance :

```
node scripts/capture-reel.js <url> out.mp4 [durationSeconds]
```

Ça scrolle la page du haut vers le bas de façon scriptée sur une durée
cible, en viewport portrait, et sort un MP4 vertical prêt à poster. Pas
besoin de filmer son écran manuellement ni de monter quoi que ce soit après
— le script fait la capture ET la conversion.

---

## Garde-fous

- Jamais de vidéo générée par IA dans ce skill — c'est la règle qui rend le
  rythme hebdomadaire soutenable. **`site-revamp` non plus n'en fait plus**
  (retiré le 2026-07-21 — stratégie volume, voir son `SKILL.md` Étape 0
  point 5) : aucun skill de ce repo ne couvre la génération vidéo
  aujourd'hui. Si un brief l'exige vraiment, c'est hors-scope des deux
  skills — en parler à Julien avant de improviser quoi que ce soit.
- Pas de déploiement Vercel par défaut — le site est jetable, seul le MP4
  final compte. Ne déployer que si explicitement demandé (ex. lien en bio).
- Respecter `prefers-reduced-motion` reste une bonne pratique même ici, mais
  ce n'est pas un point bloquant vu qu'il n'y a pas d'utilisateur réel.

## Fichiers de référence

- `motion-vocabulary.md` — vocabulaire de motion pur-code (GSAP + Lenis,
  sans vidéo)
- `scripts/capture-reel.js` — capture scroll scriptée → MP4 vertical
- `visual-craft` (skill séparé) — retouche/compositing d'image, animation de
  photo fixe, écriture de section
