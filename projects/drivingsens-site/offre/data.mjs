// Données des 12 prestations Particulier (mapping validé par Julien le 2026-09-27, voir AGENTS.md
// du projet). Source UNIQUE, utilisée par deux consommateurs :
// 1. scripts/build-offre-pages.mjs (Node) — génère les 12 pages offre/<id>.html pour l'accès
//    direct par URL (partage, SEO) — modifier ici, jamais dans les fichiers générés eux-mêmes.
// 2. Le navigateur, via <script type="module" src="/offre/data.mjs"> sur index.html et les 2
//    variantes services-section* — expose window.OFFRE pour le panneau prestation en page
//    (js/prestation-panel.js), qui affiche ce même contenu sans jamais naviguer.
export const OFFRE = {
  "stage-decouverte": {
    category: "Circuit & performance",
    title: "Stage circuit découverte",
    tagline: "Votre première fois sur circuit, en toute confiance.",
    description: "Une première approche du circuit dans un cadre encadré et sécurisé, pour découvrir les sensations sans pression de performance.",
    long: "Accompagné par un moniteur, vous prenez vos repères sur la piste à votre rythme : trajectoire, freinage, position de conduite. Aucune expérience circuit n’est nécessaire — c’est justement le point de départ pensé pour ça.",
    highlights: [
      "Encadrement individuel par un moniteur",
      "Aucune expérience circuit requise",
      "Votre propre véhicule ou un véhicule mis à disposition"
    ],
    cta: "Réserver ce stage"
  },
  perfectionnement: {
    category: "Circuit & performance",
    title: "Perfectionnement au pilotage",
    tagline: "Passer du geste correct au geste maîtrisé.",
    description: "Travailler trajectoires, freinage et lignes de conduite avec un coach pour progresser réellement derrière le volant.",
    long: "Séance après séance, vous affinez trajectoire, freinage et gestion de la vitesse en virage avec un retour précis à chaque tour. Pensé pour les pilotes qui ont déjà roulé sur circuit et veulent passer un cap.",
    highlights: [
      "Coaching individuel tour par tour",
      "Analyse de trajectoire et de freinage",
      "Progression mesurée à chaque session"
    ],
    cta: "Réserver une session"
  },
  freinage: {
    category: "Circuit & performance",
    title: "Maîtrise du freinage",
    tagline: "Le geste qui change tout sur une trajectoire.",
    description: "Un atelier dédié pour apprendre à freiner tard, fort et juste, la base de toute conduite sportive maîtrisée.",
    long: "Le freinage est souvent ce qui limite le plus une trajectoire — cet atelier y consacre l’intégralité de la séance : point de freinage, dosage, transfert de masse. Un fondamental technique qui profite à toute conduite, sur circuit comme sur route.",
    highlights: [
      "Atelier 100% dédié au freinage",
      "Exercices progressifs et répétés",
      "Bénéfice direct sur toute conduite sportive"
    ],
    cta: "Réserver cet atelier"
  },
  trackday: {
    category: "Circuit & performance",
    title: "Track Day accompagné",
    tagline: "Une journée complète sur circuit, encadrée du début à la fin.",
    description: "Une journée complète sur circuit avec un accompagnement personnalisé pour progresser à votre rythme, en toute sécurité.",
    long: "Roulez toute une journée sur circuit avec un accompagnement présent à chaque étape : briefing, sessions sur piste, retours entre les runs. Le format le plus complet pour cumuler du roulage tout en progressant réellement.",
    highlights: [
      "Journée complète sur circuit",
      "Accompagnement présent sur toute la durée",
      "Rythme adapté à votre niveau"
    ],
    cta: "Réserver ma journée"
  },
  sensations: {
    category: "Circuit & performance",
    title: "Sensations en zone contrôlée",
    tagline: "Toute la sensation, aucun des risques de la route.",
    description: "Vivre des sensations fortes dans un environnement totalement sécurisé, sans les risques de la route ouverte.",
    long: "Un format pensé pour ressentir la vitesse et la puissance sans compromis sur la sécurité : environnement fermé, encadrement présent, véhicule adapté. L’expérience prime sur la performance technique.",
    highlights: [
      "Environnement entièrement sécurisé",
      "Encadrement présent en permanence",
      "Pensé pour l’expérience, pas la performance pure"
    ],
    cta: "Vivre l’expérience"
  },
  bilan: {
    category: "Diagnostic & progression",
    title: "Bilan de conduite personnalisé",
    tagline: "Savoir précisément où vous en êtes derrière un volant.",
    description: "Un état des lieux complet de votre conduite, pour identifier vos points forts et ce qui mérite d’être travaillé.",
    long: "Avant de choisir un axe de progression, encore faut-il savoir d’où l’on part. Ce bilan observe votre conduite en situation réelle et restitue un retour clair : ce qui fonctionne déjà, ce qui mérite du travail, et par où commencer.",
    highlights: [
      "Observation en conditions réelles",
      "Retour clair et personnalisé",
      "Base pour choisir la suite de votre accompagnement"
    ],
    cta: "Faire mon bilan"
  },
  "prise-en-main-perf": {
    category: "Circuit & performance",
    title: "Prise en main véhicule haute performance",
    tagline: "Apprivoiser un véhicule qui exige du respect.",
    description: "Apprivoiser un véhicule puissant en toute confiance, avec un expert qui vous guide sur ses spécificités.",
    long: "Un véhicule haute performance ne se conduit pas comme les autres : répartition de la puissance, comportement en virage, aides électroniques. Cette prise en main vous permet de comprendre ses spécificités avant de l’exploiter pleinement.",
    highlights: [
      "Adapté à tout véhicule haute performance",
      "Explications concrètes sur son comportement",
      "Montée en confiance progressive"
    ],
    cta: "Réserver cette prise en main"
  },
  "aide-achat": {
    category: "Expertise automobile",
    title: "Aide décisionnelle à l’achat de véhicule",
    tagline: "Un avis d’expert avant de vous engager.",
    description: "Un regard automobile indépendant pour vous aider à choisir le véhicule qui correspond vraiment à vos besoins.",
    long: "Entre plusieurs véhicules qui semblent tous cocher les cases, un regard extérieur et expert change souvent la décision. On prend le temps de comprendre votre usage réel pour vous orienter vers le bon choix, pas juste le plus évident.",
    highlights: [
      "Regard indépendant, sans conflit d’intérêt",
      "Basé sur votre usage réel",
      "Vous aide à trancher entre plusieurs options"
    ],
    cta: "Être accompagné dans mon choix"
  },
  "essai-achat": {
    category: "Expertise automobile",
    title: "Essai accompagné avant achat",
    tagline: "Un essai qui va plus loin qu’un simple tour du pâté de maisons.",
    description: "Essayer le véhicule qui vous intéresse aux côtés d’un expert, pour repérer ce qu’un essai seul ne révèle pas.",
    long: "Un essai seul en concession révèle rarement grand-chose. Accompagné, vous savez quoi observer et quoi tester réellement — comportement, points d’attention, questions à poser — avant de vous décider.",
    highlights: [
      "Essai du véhicule qui vous intéresse réellement",
      "Points d’attention identifiés avec vous",
      "Décision prise en connaissance de cause"
    ],
    cta: "Organiser mon essai"
  },
  "audit-occasion": {
    category: "Expertise automobile",
    title: "Audit véhicule d’occasion",
    tagline: "Savoir ce que vous achetez, avant de l’acheter.",
    description: "Une inspection technique complète avant achat, pour acheter un véhicule d’occasion en toute sérénité.",
    long: "Avant de signer, une inspection technique détaillée permet de repérer ce qui ne se voit pas au premier coup d’œil — et d’acheter un véhicule d’occasion en connaissance de cause plutôt que sur la confiance seule.",
    highlights: [
      "Inspection technique détaillée",
      "Rapport clair avant votre décision",
      "Négociation informée si des points sont à signaler"
    ],
    cta: "Demander un audit"
  },
  "prise-en-main-tech": {
    category: "Technologies embarquées",
    title: "Prise en main véhicule haute technologie",
    tagline: "Exploiter vraiment ce que votre véhicule sait faire.",
    description: "Maîtriser les équipements et aides à la conduite de votre véhicule pour en exploiter tout le potentiel.",
    long: "Régulateur adaptatif, aides au stationnement, assistants de conduite : la plupart des véhicules récents embarquent bien plus de technologie que ce que leurs propriétaires utilisent réellement. Cette prise en main vous montre comment vous en servir, concrètement.",
    highlights: [
      "Adapté à votre véhicule et ses équipements",
      "Explications concrètes, pas juste théoriques",
      "Vous repartez en sachant vous en servir"
    ],
    cta: "Réserver cette prise en main"
  },
  "conseil-techno": {
    category: "Technologies embarquées",
    title: "Conseil technologies embarquées",
    tagline: "Choisir la technologie qui sert vraiment votre usage.",
    description: "Un accompagnement pour comprendre et choisir les technologies embarquées adaptées à votre usage.",
    long: "Entre les options disponibles sur un même modèle, toutes les technologies ne se valent pas selon votre usage réel. Cet accompagnement vous aide à comprendre ce qui compte vraiment pour vous, et à écarter ce qui ne sert à rien dans votre cas.",
    highlights: [
      "Basé sur votre usage réel, pas le catalogue",
      "Explications claires, sans jargon",
      "Vous aide à arbitrer entre les options"
    ],
    cta: "Être conseillé"
  }
};

// Exposé pour le navigateur (voir point 2 ci-dessus) — sans effet côté Node (import ES module).
if (typeof window !== "undefined") window.OFFRE = OFFRE;
