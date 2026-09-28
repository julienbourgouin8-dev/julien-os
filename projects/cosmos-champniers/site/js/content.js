/* Contenu réel Cosmos — source : site actuel (cosmos16.cosmos-tech.fr + booking), scrapé le
 * 2026-09-27, voir ../site-scrape/SCRAPE.md, et avis Google (../data/google-reviews.json).
 * LECTURE SEULE pour les agents de section. Ne jamais inventer, raccourcir ni paraphraser
 * ce qui est ici (prix, horaires, avis, textes). Les titres de section courts nouveaux sont
 * permis (voir BRIEF.md), les faits non. */
(function () {
  "use strict";

  const D = {
    name: "COSMOS",
    slogan: "Cuisine du monde · Champniers",
    phone: "05 45 38 11 07",
    phoneHref: "tel:+33545381107",
    email: "cosmos.champniers@gmail.com",
    address: ["1156 Rte de la Braconne", "16430 Champniers"],
    mapsUrl: "https://www.google.com/maps/place/cosmos/@45.6920003,0.1724598,17z",
    mapsEmbed: "https://www.google.com/maps?q=45.6920003,0.1724598&z=15&output=embed",
    instagram: "https://www.instagram.com/cosmos.champniers/",
    hoursLabel: "Lundi au dimanche · 12h00–14h30 et 19h00–22h30",

    hero: {
      eyebrow: "Buffet à volonté · 7 jours sur 7",
      title: "Le plus grand restaurant asiatique de la Charente",
      texts: [
        "Avec sa capacité exceptionnelle de 650 couverts, le Restaurant COSMOS vous accueille dans un espace moderne et chaleureux au cœur de Champniers.",
        "Venez découvrir un gigantesque buffet à volonté réunissant le meilleur de la cuisine chinoise et asiatique : un assortiment d'entrées, des sushis préparés sur place, un large choix de plats chauds, ainsi qu'un espace wok et grillades sur-mesure, sans oublier un buffet complet de desserts.",
      ],
      covers: 650,
    },

    gallery: {
      eyebrow: "Le buffet en images",
      title: "Un comptoir qui donne faim",
      // légendes exactes du site actuel -> image étalonnée dans assets/img/
      items: [
        { caption: "Grill & brochettes", img: "grill" },
        { caption: "Sushis & makis", img: "sushi-makis" },
        { caption: "Fruits de mer", img: "fruits-de-mer" },
        { caption: "Pizzas au four", img: "pizzas" },
        { caption: "Fruits & entrées", img: "fruits" },
        { caption: "Sashimis", img: "sashimis" },
        { caption: "Viandes à griller", img: "viandes-griller" },
        { caption: "Le comptoir", img: "buffet-comptoir" },
        { caption: "Sushis & sashimis", img: "sushi-sashimis" },
        { caption: "Brochettes", img: "wok" },
        { caption: "Fromages & charcuterie", img: "fromages" },
        { caption: "Desserts", img: "desserts" },
      ],
    },

    wok: {
      eyebrow: "Le wok & le grill",
      title: "Cuisiné devant vous, à la minute",
      texts: [
        "Vous composez votre assiette — légumes croquants, nouilles, gambas, bœuf mariné — et nos cuisiniers la saisissent au wok sous vos yeux. Le grill prend le relais pour les brochettes, le saumon et les Saint-Jacques.",
        "Le comptoir japonais est réapprovisionné en continu : sushis, makis et sashimis.",
      ],
      tags: ["Sushis & sashimis", "Dim sum vapeur", "Fruits de mer", "Desserts maison"],
    },

    pricing: {
      title: "Tarifs du buffet",
      note: "Par personne, boissons non incluses",
      adult: [
        { key: "midi", label: "Adulte · Midi", sub: "Du lundi au vendredi", price: 20.9 },
        { key: "soir", label: "Adulte · Soir", sub: "Du lundi au jeudi", price: 27.9 },
        { key: "weekend", label: "Adulte · Tarif week-end", sub: "Vendredi soir, samedi, dimanche et jours fériés — midi et soir", price: 29.9 },
      ],
      child: {
        label: "Enfant",
        from: "dès 7,90 €",
        rows: [
          { age: "De 6 à 9 ans", price: "10,90 € midi · 13,90 € soir" },
          { age: "De 3 à 5 ans", price: "7,90 € midi · 8,90 € soir" },
          { age: "Moins de 3 ans", price: "Gratuit" },
        ],
      },
      payments: ["CB", "Titre-Restaurant", "Chèque-Vacances", "Espèces"],
    },

    events: {
      eyebrow: "Groupes & événements",
      title: "Des salles privées pour tous vos événements",
      // <b> d'origine conservés
      html: "Vous organisez un <b>anniversaire</b>, un <b>repas de famille</b>, un <b>banquet</b> ou une <b>soirée d'entreprise</b> ? Le Restaurant COSMOS met à votre disposition des <b>salles privées</b>. Profitez d'un espace réservé pour réunir vos proches ou vos collaborateurs dans des conditions idéales, tout en bénéficiant du choix et de la convivialité du buffet à volonté.",
      tags: ["650 couverts", "Salles privatisables", "Parking gratuit"],
    },

    footer: "COSMOS · Buffet à volonté · Réservation conseillée le week-end ( A partir de 10 personnes )",

    booking: {
      tagline: "Réservez votre table en quelques instants. Service du midi et du soir.",
      services: {
        midi: { label: "Midi", hours: "12h00 – 14h00", slots: ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00"] },
        soir: { label: "Soir", hours: "19h00 – 21h30", slots: ["19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"] },
      },
      minPeople: 10,
      maxPeople: 30,
      hint: "Réservation à partir de 10 personnes uniquement (en dessous, une table est disponible sans réservation). Au-delà de 30 personnes, merci de nous appeler au 05 45 38 11 07.",
      messagePlaceholder: "Allergies, occasion particulière, demande de table…",
      fineprint: "Votre réservation est confirmée par nos équipes. Pour les groupes ou une demande urgente, appelez le 05 45 38 11 07.",
      holdNote: "Nous gardons la table 5 minutes après votre heure de réservation.",
      pets: "Les animaux ne sont pas acceptés.",
      payments: ["CB", "Chèque vacances", "Ticket restaurant", "Espèces"],
      successTitle: "Merci, {nom}.",
      successText: "Votre demande de réservation a bien été enregistrée : {recap}. Nous vous confirmons la table par téléphone ou par email.",
    },

    // Contact (contact.php) : Nom, Email, Téléphone (optionnel), Sujet (optionnel), Message
    contactFields: ["Nom", "Email", "Téléphone (optionnel)", "Sujet (optionnel)", "Message"],

    reviews: {
      rating: "4,6",
      total: "1 558",
      source: "Google",
      // Avis Google 4-5 étoiles avec texte, récents et plus anciens alternés (relevés le 2026-09-28) : ../data/google-reviews-2026-09-28.json.
      // Textes complets, jamais raccourcis. Un "Lire la suite" qui déplie le texte entier est OK.
      items: [
        { author: "Chouka Assani", stars: 5, date: "il y a 17 heures", text: "Super expérience rien à dire tout était top\nBeaucoup de choix" },
        { author: "Hei TETIAMANA", stars: 4, date: "il y a une semaine", text: "Pour une première fois j'étais émerveillé dans le cosmos☺️" },
        { author: "Charles Ferron", stars: 5, date: "il y a 23 heures", text: "Très bon service, multitude de choix, je recommande" },
        { author: "Christine Jossely", stars: 5, date: "il y a un mois", text: "Très bon endroit. Du choix dans les plats. Je recommande" },
        { author: "Gaylor Magnant", stars: 4, date: "il y a 18 heures", text: "Lieu atypique et agréable!\nJe recommande" },
        { author: "Raymond Noémie", stars: 5, date: "il y a 2 jours", text: "Je me suis régalée.\nBuffet avec énormément de choix , toujours bien remplie\nLe personnel est très gentils et à notre écoute.\nJ'y retournerais avec plaisir" },
        { author: "Jules P", stars: 4, date: "il y a un mois", text: "Agréablement surpris ! Les avis négatifs nous avaient refroidis mais on a bien fait de tenter. Pour une buffet à volonté géant on ne peut pas s’attendre à un grand restaurant  de toutes façon…\n\nPour le prix pratiqué le midi en semaine c’est franchement une bonne surprise. L’espace entre les tables est un vrai point fort par rapport aux autres buffets de la région…on respire ! Cadre agréable, ambiance calme, sushis faits sur place réussis et wok au top.\n\nConseil : privilégiez le midi, le rapport qualité-prix est imbattable.\n\nOn recommande !" },
        { author: "Coralie Vincent", stars: 5, date: "il y a un jour", text: "Excellent!! Tout ce que nous avons dégusté était de très bonne qualité. Personnel réactif! Au top" },
        { author: "Greg Hof", stars: 5, date: "il y a 5 jours", text: "Très agréablement surpris, moi qui ne suis pas adepte de ces buffets à volonté, cet établissement m'a fait changer d'avis." },
        { author: "Vanessa Clerc", stars: 4, date: "il y a une semaine", text: "Très grand restaurant, beaucoup de choix pour le buffet et une décoration magnifique.\nJ y retournerai je me suis régalé" },
        { author: "Charline Guillochet", stars: 5, date: "il y a 4 jours", text: "Un bon et beau moment. La nourriture est très bonne ! Et le lieu vraiment très beau !" },
        { author: "pierre marx", stars: 5, date: "il y a 6 jours", text: "Super choix, vaste restaurant, rempli même les midi en semaine : quel succès !" },
        { author: "prescillia siegler", stars: 4, date: "il y a 5 jours", text: "Calme et agréable." },
        { author: "Nicolas Faure", stars: 5, date: "il y a une semaine", text: "Très beau restaurant, la déco est top , le service rapide et agréable et le choix au buffet est énorme." },
        { author: "Katia LECOMTE", stars: 5, date: "il y a une semaine", text: "Beaucoup de choix (juste pas assez de choix au niveau fromage) ambiance très agréable, très bon rapport qualité prix. Nous avons bien mangé. J'apprécie aussi les espaces aérés, individuels, on reste dans l'intimité de notre table.  Nous reviendrons avec plaisir." },
        { author: "Marie Wagner", stars: 4, date: "il y a une semaine", text: "Très joli décor, beaucoup de choix . Tout est appétissant !! Le personnel est très serviables. On reviendra !" },
        { author: "Céline CLAUDE", stars: 5, date: "il y a une semaine", text: "Un choix cosmique, interplanétaire !!!" },
      ],
    },
  };

  /* ---------- Statut en direct : ouvert/fermé + tarif du moment ---------- */
  const SERVICES = [
    { key: "midi", start: 12 * 60, end: 14 * 60 + 30, label: "ce midi" },
    { key: "soir", start: 19 * 60, end: 22 * 60 + 30, label: "ce soir" },
  ];
  const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  function isHoliday(dt) {
    const y = dt.getFullYear(), md = `${dt.getMonth() + 1}-${dt.getDate()}`;
    if (["1-1", "5-1", "5-8", "7-14", "8-15", "11-1", "11-11", "12-25"].includes(md)) return true;
    const e = easter(y);
    return [1, 39, 50].some((off) => {
      const x = new Date(e); x.setDate(e.getDate() + off);
      return x.getMonth() === dt.getMonth() && x.getDate() === dt.getDate();
    });
  }
  // Grille réelle : midi lun-ven 20,90 ; soir lun-jeu 27,90 ; ven soir, sam, dim, fériés 29,90.
  function priceFor(dt, service) {
    const d = dt.getDay();
    if (isHoliday(dt) || d === 0 || d === 6 || (d === 5 && service === "soir")) return D.pricing.adult[2];
    return service === "midi" ? D.pricing.adult[0] : D.pricing.adult[1];
  }
  function fmtPrice(n) { return n.toFixed(2).replace(".", ",") + " €"; }
  function fmtTime(min) { const h = Math.floor(min / 60), m = min % 60; return `${h}h${m ? String(m).padStart(2, "0") : "00"}`; }

  /** status(now?) -> { open, service, tier, price, priceLabel, headline, next:{...} } */
  function status(now = new Date()) {
    const min = now.getHours() * 60 + now.getMinutes();
    const cur = SERVICES.find((s) => min >= s.start && min < s.end);
    if (cur) {
      const tier = priceFor(now, cur.key);
      return {
        open: true, service: cur.key, tier, price: tier.price, priceLabel: fmtPrice(tier.price),
        headline: `Ouvert · ${cur.label} ${fmtPrice(tier.price)}`,
        closesAt: fmtTime(cur.end),
      };
    }
    // prochain service
    for (let add = 0; add < 8; add++) {
      const day = new Date(now); day.setDate(now.getDate() + add);
      for (const s of SERVICES) {
        if (add === 0 && s.start <= min) continue;
        const tier = priceFor(day, s.key);
        const when = add === 0 ? (s.key === "midi" ? "ce midi" : "ce soir")
          : add === 1 ? `demain ${s.key === "midi" ? "midi" : "soir"}` : `${DAYS[day.getDay()]} ${s.key}`;
        return {
          open: false, service: s.key, tier, price: tier.price, priceLabel: fmtPrice(tier.price),
          headline: `Fermé · ouvre ${when} à ${fmtTime(s.start)}`,
          next: { when, at: fmtTime(s.start), service: s.key, priceLabel: fmtPrice(tier.price) },
        };
      }
    }
  }

  D.status = status;
  D.fmtPrice = fmtPrice;
  D.priceFor = priceFor;
  window.COSMOS_DATA = D;
})();
