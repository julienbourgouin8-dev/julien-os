// Contenu réel R.E.P 24 — source unique de vérité, lecture seule pour toutes les versions du site.
// Ne jamais inventer, raccourcir ou paraphraser une donnée listée ici.
// Source : https://www.rep-24.com (re-scrapé 2026-07-21, pages home/chauffage-climatisation/
// ramonage/plomberie/nettoyage-hottes/avis-clients/contact — voir scrape/raw/ et scrape/text/)
// + fiche Google Maps (avis re-scrapés 2026-07-21, triés "les plus favorables" — voir
// scrape/google-reviews.json pour le JSON source avec réponses du propriétaire).

const REP24 = {
  company: {
    name: "R.E.P 24",
    tagline: "Plomberie – Chauffage – Sanitaires – Entretien – Dépannage chauffage – Climatisation",
    strapline: "Une entreprise, 6 métiers",
    experience: "plus de 60 ans d'expérience",
    address: "172 avenue Winston Churchill, 24660 Coulounieix-Chamiers",
    phone: "05 53 53 12 32",
    phoneHref: "tel:+33553531232",
    email: "rep24@rep.services",
    hours: [
      "Du lundi au jeudi de 9h à 12h et de 14h à 17h",
      "Le vendredi de 9h à 12h et de 14h à 16h",
    ],
    zone: ["Coulounieix-Chamiers", "Périgueux", "Dordogne"],
    googleRating: "4,7",
    googleReviews: "103",
    googleBreakdown: { "5": 92, "4": 4, "3": 1, "2": 0, "1": 6 },
  },

  intro: {
    heading: "Société REP 24, à Coulounieix-Chamiers : plomberie, chauffage, climatisation",
    paragraphs: [
      "Implantée à Coulounieix-Chamiers, dans le département de la Dordogne, notre entreprise REP 24 est forte de plus de 60 ans d'expérience.",
      "Intervenant auprès des particuliers et des professionnels, nous sommes à même de répondre à toutes vos demandes. Nous travaillons également pour les collectivités et les entreprises privées.",
      "Nous assurons la vente, la pose et le dépannage de toutes vos installations. Notre équipe de professionnels intervient dans tout le département de la Dordogne.",
    ],
    services: ["chauffage, climatisation", "ramonage de cheminées", "plomberie", "nettoyage de hottes de cuisines professionnelles"],
    cta: "Demandez votre devis gratuit",
  },

  team: {
    heading: "Une équipe dynamique et polyvalente à votre service",
    paragraphs: [
      "Habilitée et formée régulièrement, notre équipe est polyvalente et à l'écoute de vos besoins.",
      "Nous nous déplaçons sur place pour une étude personnalisée de votre projet et vous délivrons des devis personnalisés, détaillés et gratuits.",
      "Nous souhaitons vous apporter un travail qualitatif qui répond parfaitement à vos besoins ; nous vous garantissons un résultat en adéquation avec vos attentes.",
    ],
  },

  chauffageClim: {
    heading: "Installation et dépannage de chauffage et de climatisation, autour de Périgueux",
    intro: [
      "Toute notre équipe de chauffagistes professionnels sur Périgueux est à votre disposition pour installer, mettre en service et assurer la maintenance de tous vos systèmes de chauffage, de climatisation ou de plomberie.",
      "Nous étudions préalablement votre projet de rénovation de chauffage et climatisation. Nous vous proposons une installation sur mesure, puis nous vous délivrons un devis gratuit, détaillé et sans engagement.",
      "Notre équipe se déplace dans tout le département de la Dordogne, à Périgueux que vous soyez particulier ou professionnel (commerce, industrie, collectivité…).",
    ],
    depannage: {
      heading: "Dépannage chauffage toutes marques et SAV sous 48h, en Dordogne",
      paragraphs: [
        "Nous nous déplaçons préalablement à Périgueux pour effectuer un diagnostic gratuit de votre chauffage et vous dépanner au besoin sous 48h.",
        "Nous effectuons par exemple le désembouage, le détartrage ou le nettoyage de vos équipements et système de chauffage.",
        "Votre chauffagiste assure la conformité de ces derniers et effectuons les opérations nécessaires si besoin.",
      ],
    },
    entretien: {
      heading: "Demandez notre contrat d'entretien annuel pour votre chauffage et climatisation",
      paragraphs: [
        "Nous mettons à votre disposition de nombreux dispositifs de chauffage de qualité ; nous en assurons également un service d'entretien.",
        "Nous nous engageons à effectuer au minimum une visite de contrôle annuelle ; notre chauffagiste vérifie vos installations, répare ou remplace les pièces si nécessaire.",
      ],
    },
    renouvelable: {
      heading: "Une entreprise impliquée dans les énergies renouvelables",
      paragraphs: [
        "Certifiée Reconnu Garant de l'Environnement (RGE), notre entreprise REP 24 est soucieuse de la préservation de la planète.",
        "En faisant appel à nos chauffagistes, vous bénéficiez de plus d'un crédit d'impôt et d'aides de l'État, applicables selon la législation en vigueur, pour tous vos travaux de rénovation énergétique.",
      ],
    },
    pac: {
      heading: "Pose de climatisations, pompes à chaleur autour de Périgueux",
      paragraphs: [
        "Systèmes de chauffage thermodynamique, les pompes à chaleur pompent les calories qui sont présentes dans l'air ambiant, la terre ou le sol et les transmettent dans les espaces à chauffer. En utilisant une énergie naturelle, ce système de chauffage apparaît comme l'un des plus économique et respectueux de l'environnement.",
      ],
      types: ["Pompes à chaleur à air", "Pompes à chaleur à eau (puisent la chaleur dans les nappes phréatiques)", "Pompes à chaleur géothermiques (puisent la chaleur de la terre)"],
      paragraphs2: [
        "Nos pompes à chaleurs réversibles font également climatisation et vous permettent de gagner en confort.",
        "Elles sont réversibles (produisent du frais en été et du chaud en hiver).",
        "Notre entreprise se charge aussi de la pose et l'entretien de vos réseaux VMC (ventilation mécanique contrôlée).",
        "Nos chauffagistes installent et dépannent votre pompe à chaleur et système de climatisation à Périgueux.",
      ],
    },
    chaudiere: {
      heading: "Optez pour l'installation de chaudières sur mesure avec nos chauffagistes",
      paragraphs: [
        "La chaudière est un système de chauffage qui produit de la chaleur et produit de l'eau chaude sanitaire, vous permettant de chauffer la surface de votre habitation ou de votre lieu de travail à Périgueux. Nos chauffagistes assurent la pose de plusieurs systèmes de chauffage :",
      ],
      types: ["Chaudière au fioul", "Brûleur", "Chaudière au gaz", "Chaudière à condensation"],
    },
    chauffeEau: {
      heading: "Nos plombiers installent votre chauffe-eau électrique, gaz ou thermodynamique",
      paragraphs: [
        "Vous avez fait appel à nos services pour l'installation de votre pompe à chaleur ? Pourquoi ne pas profiter de cette nouvelle source d'énergie pour votre eau chaude sanitaire ?",
        "En remplaçant votre chaudière par un chauffe-eau thermodynamique, vous profitez de l'énergie produite par votre pompe à chaleur pour chauffer toute l'eau dont vous avez besoin au quotidien. Cet équipement est également rattaché au réseau électrique pour compenser les potentiels manques d'énergie.",
        "Nos plombiers réalisent aussi l'installation de modèles de chauffe-eau plus classiques : chauffe-eau électrique ou au gaz.",
        "En cumulant nos chauffe-eau à des systèmes de filtration et d'adoucisseurs d'eau, vous profiterez d'équipements sanitaires performants et d'une eau parfaitement saine pour toutes les utilisations.",
      ],
    },
    equipements: ["Chaudières à gaz", "Chauffage au fioul", "Chaudière à condensation", "Climatisation réversible", "Ventilation mécanique contrôlée (VMC)"],
    image: "assets/images/chauffage-climatisation-pac.jpg",
  },

  plomberie: {
    heading: "Pose et dépannage de vos installations sanitaires",
    paragraphs: [
      "Notre équipe vous propose son savoir-faire pour installer votre plomberie, vos canalisations (tuyauterie), votre robinetterie et vos raccordements en eau chaude et froide.",
      "Nous nous occupons également de l'alimentation de vos lave-linge et lave-vaisselle.",
      "Nous intervenons sur le secteur géographique autour de Périgueux.",
      "Nous travaillons pour les particuliers et pour les professionnels (industries, entreprises, collectivités…)",
      "Certifiés RGE (Reconnu Garant de l'Environnement), nous sommes soucieux de vous faire bénéficier d'économies d'énergie.",
    ],
    installation: {
      heading: "Installation de plomberie et canalisations près de Coulounieix-Chamiers",
      paragraphs: [
        "Les installations sanitaires permettent à l'eau d'arriver dans votre domicile, via les réseaux de la ville ; elles sont également nécessaires au bon fonctionnement de votre chauffage ou à l'évacuation des eaux pluviales.",
      ],
      liste: ["Pose et entretien régulier de vos chauffe-eaux ou de vos cumulus", "Installation d'adoucisseurs d'eau ou de systèmes de filtration", "Vente et installation de lavabos, éviers, douches ou baignoires"],
      paragraphs2: ["Nous intervenons chez vous pour installer vos conduits d'eau et votre tuyauterie (raccordements eau chaude et froide), tuyaux d'évacuation, ou vos canalisations d'eau et de gaz."],
    },
    depannage: {
      heading: "Dépannage plomberie",
      paragraphs: [
        "Une fuite d'eau, de gaz, une évacuation ou une canalisation bouchée ? Un dysfonctionnement de vos installations sanitaires ?",
        "Nous intervenons rapidement, sous 48h maximum.",
        "Nous recherchons les causes des fuites et réparons rapidement vos installations ; nous remplaçons vos pièces ou effectuons des travaux si nécessaire.",
        "Nous débouchons toilettes, lavabos, éviers ou baignoires.",
      ],
    },
    normes: {
      heading: "La remise aux normes de vos installations",
      paragraphs: [
        "Avec notre société REP 24, vous avez l'assurance de faire appel à un expert pour vérifier, effectuer la maintenance ou dépanner votre chauffage, votre plomberie ou vos installations sanitaires, et remettre aux normes vos équipements si besoin !",
        "Les installations sanitaires non conformes et les eaux usées domestiques non traitées peuvent contenir des virus et des parasites susceptibles d'être transmis aux humains. Elles peuvent être facteurs de gastro-entérite ou d'apparition de maladies respiratoires.",
        "Avant d'être remises aux normes, vos canalisations et vos évacuations d'eau doivent subir un diagnostic : nous effectuons ce dernier gratuitement.",
        "Envie d'être rassuré ? Nous vous proposons des contrats annuels d'entretien.",
      ],
    },
    image: "assets/images/plomberie-fuite-tuyauterie.jpg",
    imageAlt: "assets/images/plomberie-sanitaires.jpg",
  },

  environnement: {
    heading: "La préservation de votre environnement",
    paragraphs: [
      "Reconnus Garants de l'Environnement (RGE), nous vous faisons bénéficier de crédit d'impôt et d'aides de l'État pour tous vos travaux de rénovation énergétique.",
      "Quelques exemples d'installations : chaudière gaz à condensation à haute performance énergétique.",
      "Utilisation de produits préservant l'environnement pour tous nos travaux de nettoyage.",
      "Suivi de déchets de chantier.",
      "Avec notre société REP 24, protégez la planète tout en faisant des économies !",
    ],
    image: "assets/images/environnement-conseil-chaudiere.jpg",
    cta: "Parcourez notre livre d'or",
  },

  ramonage: {
    heading: "Votre expert en ramonage de cheminée à Coulounieix-Chamiers, près de Périgueux",
    paragraphs: [
      "Notre équipe intervient chez vous pour vérifier le bon fonctionnement de vos installations de chauffage et pour vous dépanner sous 48h au besoin ; nous vous proposons également des contrats d'entretien annuels.",
      "Le ramonage de vos cheminées et le nettoyage de vos hottes de cuisines professionnelles, autres prestations que nous vous proposons, permettent d'assurer la pérennité de vos installations et d'assurer votre sécurité.",
      "Nous nous déplaçons dans toute la Dordogne.",
      "Après notre intervention, nous vous fournissons un certificat de ramonage.",
    ],
    obligation: {
      heading: "Une obligation régie par la loi",
      paragraphs: [
        "Il est obligatoire de faire ramoner sa cheminée tous les ans ; sans cela, si un incendie survenait dans votre habitation, vous ne seriez pas indemnisé par votre assurance.",
        "En effet, selon l'article 31-6 du Règlement Sanitaire Départemental Type (RSDT) :",
      ],
      citation: "« Les conduits de fumée intérieurs ou extérieurs, fixes ou amovibles, utilisés pour l'évacuation des gaz de la combustion doivent être maintenus constamment en bon état d'entretien et de fonctionnement et ramonés périodiquement en vue d'assurer le bon fonctionnement des appareils et d'éviter les risques d'incendie et d'émanation de gaz nocifs dans l'immeuble, ainsi que le rejet des particules dans l'atmosphère extérieure. »",
      suite: "Cette réglementation s'applique également aux conduits de chaudière et de poêle, qu'ils soient alimentés au bois ou au gaz.",
    },
    intervention: {
      heading: "Le ramonage de votre cheminée ou de vos installations de chauffage",
      paragraphs: [
        "Un souci avec votre chaudière ?",
        "Vous souhaitez faire du feu dans votre cheminée ou votre insert mais ces derniers ont besoin d'être nettoyés ?",
        "Nous nettoyons les conduits de cheminée et de fumée, opérations également régies par des réglementations et des normes, que nous respectons scrupuleusement.",
        "Nous effectuons également le tubage et le retubage de vos conduits défectueux ou en mauvais état et les remplaçons par des conduits neufs.",
        "Nous protégeons vos sols, vidons vos cheminées ; nous nettoyons le chantier après notre passage.",
      ],
    },
    image: "assets/images/ramonage-cheminee.jpg",
  },

  hottes: {
    heading: "Nettoyage et dégraissage de hottes à Coulounieix-Chamiers, en Dordogne",
    paragraphs: [
      "Toute notre équipe de REP 24 est formée régulièrement aux dernières normes hygiéniques en vigueur.",
      "Pour des raisons de sécurité, d'hygiène et d'efficience, il est indispensable et même obligatoire de faire dégraisser et nettoyer régulièrement ses hottes et systèmes de ventilation.",
    ],
    prestations: ["Nettoyage et dégraissage de filtres, ventilateurs", "Nettoyage et dégraissage, débouchage au besoin de conduits d'extraction et d'évacuation de fumées et de vapeurs."],
    pourquoi: {
      heading: "Pourquoi dégraisser vos hottes et systèmes de ventilation ?",
      liste: [
        "Pour éviter la propagation des mauvaises odeurs, dues à une mauvaise aspiration",
        "Pour contrer l'apparition des coulures et des taches sur les murs",
        "Enfin, et surtout, pour protéger votre santé et votre sécurité : un mauvais entretien cause l'accumulation de graisses sur les filtres, les moteurs ou les conduits, et peut créer des bouchons et provoquer un incendie.",
      ],
    },
    axes: {
      heading: "Une activité articulée autour de trois axes principaux",
      liste: [
        "La préparation du chantier : nous protégeons, au moyen de bâches, toutes les parties susceptibles d'être en contact avec nos produits et/ou ustensiles",
        "Le nettoyage de la hotte et de votre ventilation : nous respectons un mode opératoire très précis, nous démontons et dégraissons tous les filtres, les ventilateurs et les conduits",
        "La remise en état du chantier : nous effectuons un contrôle de la qualité et remettons vos équipements en place ; nous nettoyons méticuleusement les pièces dans lesquelles nous avons travaillé",
      ],
    },
    image: "assets/images/nettoyage-hottes-pro.jpg",
  },

  atouts: [
    "Intervention sur tous combustibles",
    "Intervention sur toutes marques",
    "Conseils personnalisés",
    "Dépannage sous 48h",
  ],

  certifications: {
    heading: "Nos certifications",
    intro: "Nos agréments sont gages de sérieux et de compétences ; en faisant appel à notre entreprise, vous avez l'assurance de solliciter des professionnels qualifiés.",
    list: [
      "CAPEB",
      "Professionnel du gaz",
      "Qualibat 5111 (Plomberie-sanitaire)",
      "Qualibat 5421 (Ramonage en habitat individuel)",
      "Qualibat 5211 (Remplacement de chaudière gaz/fuel en logement individuel)",
      "Qualibat 5261 (Entretien et maintenance d'installation de chauffage)",
      "Qualibat 5133 (Installation chauffe-eau thermodynamique)",
      "Qualibat 5231 (Installation Pompe à Chaleur et Groupe Froid)",
    ],
    // Logos réels du site — ne jamais recolorer/retoucher, copier tel quel depuis rep-24.com si repris.
    logos: [
      { name: "CAPEB", src: "https://www.rep-24.com/wp-content/uploads/sites/3193/2015/04/logo-capeb.jpg" },
      { name: "RGE Qualibat", src: "https://www.rep-24.com/wp-content/uploads/sites/3193/2015/04/logo-rge-qualibat.jpg" },
    ],
    pictos: [
      { label: "Intervention sur tous combustibles", src: "https://www.rep-24.com/wp-content/uploads/sites/3193/2015/04/picto-intervention-combustibles.png" },
      { label: "Intervention sur toutes marques", src: "https://www.rep-24.com/wp-content/uploads/sites/3193/2015/04/picto-intervention-marques.png" },
      { label: "Conseils personnalisés", src: "https://www.rep-24.com/wp-content/uploads/sites/3193/2015/04/picto-conseils-personnalises.png" },
      { label: "Dépannage sous 48h", src: "https://www.rep-24.com/wp-content/uploads/sites/3193/2015/04/picto-depannage-48h.png" },
    ],
  },

  // 10 avis Google 5★ les plus favorables, verbatim (re-scrapés 2026-07-21, triés "les plus
  // favorables"). Texte complet et réponses du propriétaire : voir scrape/google-reviews.json.
  avisGoogle: "scrape/google-reviews.json",

  // Unique avis publié directement sur le livre d'or du site (rep-24.com/avis-clients/).
  avisSiteLivreDor: {
    auteur: "Dumonteil",
    date: "31 mai 2026",
    note: 5,
    texte: "Très satisfait de la première intervention de REP 24 à mon domicile : personnel très compétent, ainsi que l'accueil téléphonique. J'ai trouvé une entreprise avec laquelle j'ai envie de continuer notre collaboration. Je la recommande très fortement.",
  },

  logo: "https://www.rep-24.com/wp-content/uploads/sites/3193/2017/03/logo-rep-24.png",

  brand: {
    // Couleurs réelles extraites du CSS du site (getComputedStyle) — signature à 3 accents
    // (bleu = eau/plomberie, rouge = chauffage, orange = gaz/énergie), pas une palette générique.
    blue: "#0088CC",
    // rouge et orange confirmés visuellement (barres de séparation de section) mais hex exact
    // non extrait du CSS — à affiner en Étape 3 (direction artistique) si besoin de précision.
  },
};

if (typeof module !== "undefined") module.exports = REP24;
