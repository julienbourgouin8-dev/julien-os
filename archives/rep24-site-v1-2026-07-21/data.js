// Contenu réel R.E.P 24 — source unique de vérité, lecture seule pour les deux concepts.
// Ne jamais inventer, raccourcir ou paraphraser une donnée listée ici.
// Source : https://www.rep-24.com (scrapé 2026-07-21) + fiche Google Maps (lead-gen 2026-07-20).

const REP24 = {
  company: {
    name: "R.E.P 24",
    tagline: "Plomberie – Chauffage – Sanitaires – Entretien – Dépannage chauffage – Climatisation",
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
    googleRating: "4.7",
    googleReviews: "103",
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
    heading: "Vente, installation et dépannage de chauffage et de climatisation, autour de Périgueux",
    paragraphs: [
      "Nous vous proposons la vente et l'installation de tous types de chauffage et de climatisation.",
      "Chaudières à gaz, chauffage au fioul, chaudière à condensation. Climatisation réversible. Ventilation mécanique contrôlée (VMC).",
      "Un souci avec vos équipements ? Notre service après-vente est à votre disposition.",
      "Nous vous dépannons sous 48 heures.",
    ],
    image: "assets/images/chauffage-climatisation-pac.jpg",
  },

  plomberie: {
    heading: "Vente, installation et réparation plomberie, à Coulounieix-Chamiers",
    paragraphs: [
      "Nous sommes en mesure de procéder à l'installation et la rénovation de votre plomberie et de vos sanitaires.",
      "Cuisine. Salle de bains, toilettes. Dépannage de fuites, réparation de tuyauterie. Pose de canalisations…",
      "Notre équipe de professionnels se déplace sur place pour effectuer un diagnostic gratuit de vos travaux.",
    ],
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

  autresPrestations: {
    heading: "Nos autres prestations",
    paragraphs: [
      "Dans nos prestations, nous vous proposons également, le ramonage de vos cheminées et des conduits (poêle…).",
      "Nous sommes aussi en mesure de vous proposer le nettoyage de hottes de cuisines professionnelles.",
    ],
    cta: "Demandez votre contrat annuel d'entretien !",
    images: {
      ramonage: "assets/images/ramonage-cheminee.jpg",
      hottes: "assets/images/nettoyage-hottes-pro.jpg",
    },
  },

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
  },

  atouts: [
    "Intervention sur tous combustibles",
    "Intervention sur toutes marques",
    "Conseils personnalisés",
    "Dépannage sous 48h",
  ],

  avis: [
    {
      auteur: "Dumonteil",
      texte: "Très satisfait de la première intervention de REP 24 à mon domicile : personnel très compétent, ainsi que l'accueil téléphonique. J'ai trouvé une entreprise avec laquelle j'ai envie de continuer notre collaboration. Je la recommande très fortement.",
    },
  ],

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
