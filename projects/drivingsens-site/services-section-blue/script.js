// Un F5 doit toujours repartir du hero (pas rester où l'utilisateur avait scrollé, et pas sauter
// sur #services si l'URL a gardé ce hash suite à un clic sur une carte) — MAIS une navigation
// fraîche depuis une autre page avec un hash intentionnel (ex: le lien "← Retour aux prestations"
// d'une page offre/, qui pointe vers index.html#services) doit, elle, atterrir sur cette section.
// On distingue les deux via l'API Navigation Timing (navEntry.type === "reload" uniquement sur F5,
// "navigate" sur un clic de lien classique venant d'ailleurs).
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
var navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
var isReload = navEntry ? navEntry.type === "reload" : false;
// Posé par restoreOffreOrigin() plus bas quand une carte d'origine est restaurée : permet à
// settle() d'aligner précisément le scroll sur la position EXACTE qu'avait cette carte au moment
// du clic (pas juste "en haut de #services") — sinon le calque du zoom retour se referme un peu
// à côté de la carte réellement affichée après restauration.
var pendingScrollAlign = null;

if (isReload) {
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  function forceScrollTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  forceScrollTop();
  window.addEventListener("load", forceScrollTop);
  setTimeout(forceScrollTop, 300);
} else if (location.hash) {
  // La page est cachée depuis le tout début du <head> (classe html.hash-settling, voir le petit
  // script bloquant en tête de page) pour ne jamais montrer le saut natif du navigateur vers
  // l'ancre pendant que la mise en page n'est pas stable (polices, vidéo) — on ne révèle qu'une
  // fois notre propre positionnement fait, plutôt que de laisser Julien voir le sursaut
  // "hero → #services" que le simple re-scroll après coup laissait passer.
  (function () {
    var target = document.querySelector(location.hash);
    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      // html{scroll-behavior:smooth} (base.css) rend animé tout scroll déclenché par une MÉTHODE
      // (scrollIntoView/scrollBy/scrollTo) — y compris quand on tente de forcer behavior:"instant"
      // ou de couper scroll-behavior en inline juste avant : testé en réel sous WebKit (moteur de
      // Safari, via Playwright), l'un et l'autre restent animés dans ce moteur. C'est ce qui
      // donnait le "ça remonte sur les objectifs puis ça redescend sur les 3 cartes" signalé par
      // Julien. Seule une assignation directe à `scrollTop` (propriété, pas une méthode) est
      // garantie instantanée quel que soit scroll-behavior — même mécanisme déjà utilisé par
      // forceScrollTop() ci-dessus pour le cas F5. On calcule donc la position cible nous-mêmes
      // (juste de la géométrie, aucun scroll déclenché) puis on l'assigne d'un coup.
      var targetY = null;
      if (target) targetY = target.getBoundingClientRect().top + window.pageYOffset;
      if (pendingScrollAlign && pendingScrollAlign.el) {
        // La carte restaurée prime sur la cible générique #services : on veut qu'elle retombe
        // pile à la position Y qu'elle avait au moment du clic, pas juste "en haut de la section".
        var cardTopNow = pendingScrollAlign.el.getBoundingClientRect().top + window.pageYOffset;
        targetY = cardTopNow - pendingScrollAlign.top;
      }
      // L'assignation à scrollTop n'est PAS reflétée de façon synchrone (ni même sur la frame
      // suivante) dans certains contextes — un window.scrollY lu juste après, ou même après un
      // requestAnimationFrame, peut encore renvoyer l'ancienne valeur, alors qu'aucune animation
      // visible n'a lieu (vérifié : jusqu'à plusieurs dizaines de ms de décalage entre
      // l'assignation et sa prise en compte réelle par le moteur de rendu). Plutôt que de deviner
      // un délai fixe, on RÉAFFIRME l'assignation à chaque frame jusqu'à confirmation (relecture),
      // borné pour ne jamais bloquer indéfiniment — le corps reste caché tout ce temps (invisible,
      // quelques frames au pire), donc aucun flash quoi qu'il arrive.
      var attemptsLeft = 20;
      function applyScroll() {
        if (targetY === null) {
          reveal();
          return;
        }
        document.documentElement.scrollTop = targetY;
        document.body.scrollTop = targetY;
        attemptsLeft--;
        if (attemptsLeft <= 0 || Math.abs(window.scrollY - targetY) < 2) {
          reveal();
        } else {
          requestAnimationFrame(applyScroll);
        }
      }
      function reveal() {
        document.documentElement.classList.remove("hash-settling");
        // La page redevient visible ci-dessus ; dsRevealFromZoom (js/page-transition.js) pose dans
        // la foulée — même tick synchrone, donc rien n'est jamais visible "nu" entre les deux — un
        // calque plein écran qui se referme sur la carte restaurée (ou un simple fondu s'il n'y en
        // a pas), pour un vrai effet de retour symétrique à l'entrée plutôt qu'un contenu qui
        // apparaît déjà positionné d'un coup.
        if (window.dsRevealFromZoom) {
          window.dsRevealFromZoom(pendingScrollAlign && pendingScrollAlign.el);
        }
      }
      applyScroll();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        window.addEventListener("load", settle, { once: true });
      });
    } else {
      window.addEventListener("load", settle, { once: true });
    }
    // Filet de sécurité : si `load`/`fonts.ready` tardent ou ne se déclenchent jamais, ne pas
    // laisser la page cachée indéfiniment.
    setTimeout(settle, 700);
  })();
}

// Particulier : les 12 prestations confirmées par Julien le 2026-09-27 (liste de la femme d'Elie),
// qui font foi sur ce côté — remplace les anciennes prestations du cahier de cadrage (stage,
// coaching, sécurité, réhabilitation, senior, achat, conciergerie, voyages). Regroupées en 5
// objectifs (au lieu de 6) pour couvrir les 12 sans rien laisser de côté, mapping validé par
// Julien avant d'écrire les descriptions — voir décision du 2026-09-27 dans decisions/log.md.
// Professionnel : toujours les prestations du cahier de cadrage (24/09/2026), liste Pro équivalente
// à la liste de la femme d'Elie pas encore reçue — non touché dans cette passe.
const profiles = {
  particulier: {
    objectives: [
      ["circuit", "Vivre une expérience sur circuit"],
      ["pilotage", "Me perfectionner au pilotage"],
      ["bilan", "Faire le point sur ma conduite"],
      ["achat", "Être accompagné dans l’achat d’un véhicule"],
      ["techno", "Prendre en main les technologies embarquées"]
    ],
    services: {
      circuit: ["stage-decouverte", "trackday", "sensations"],
      pilotage: ["perfectionnement", "freinage", "prise-en-main-perf"],
      bilan: ["bilan", "perfectionnement", "freinage"],
      achat: ["aide-achat", "essai-achat", "audit-occasion"],
      techno: ["prise-en-main-tech", "conseil-techno", "prise-en-main-perf"]
    }
  },
  professionnel: {
    objectives: [
      ["flotte", "Réduire les coûts de ma flotte"],
      ["risque", "Prévenir le risque routier"],
      ["eco", "Former mes équipes à l’éco-conduite"],
      ["collectif", "Créer une expérience collective"],
      ["marque", "Valoriser ma marque automobile"],
      ["voyage-pro", "Organiser un voyage d’entreprise"]
    ],
    services: {
      flotte: ["eco-conduite", "risque", "team-building"], risque: ["risque", "eco-conduite", "team-building"],
      eco: ["eco-conduite", "risque", "voyages-pro"], collectif: ["team-building", "evenements", "voyages-pro"],
      marque: ["lancement", "esport", "evenements"], "voyage-pro": ["voyages-pro", "team-building", "evenements"]
    }
  }
};

const services = {
  "stage-decouverte": ["Circuit & performance", "Stage circuit découverte", "Une première approche du circuit dans un cadre encadré et sécurisé, pour découvrir les sensations sans pression de performance."],
  perfectionnement: ["Circuit & performance", "Perfectionnement au pilotage", "Travailler trajectoires, freinage et lignes de conduite avec un coach pour progresser réellement derrière le volant."],
  freinage: ["Circuit & performance", "Maîtrise du freinage", "Un atelier dédié pour apprendre à freiner tard, fort et juste, la base de toute conduite sportive maîtrisée."],
  trackday: ["Circuit & performance", "Track Day accompagné", "Une journée complète sur circuit avec un accompagnement personnalisé pour progresser à votre rythme, en toute sécurité."],
  sensations: ["Circuit & performance", "Sensations en zone contrôlée", "Vivre des sensations fortes dans un environnement totalement sécurisé, sans les risques de la route ouverte."],
  bilan: ["Diagnostic & progression", "Bilan de conduite personnalisé", "Un état des lieux complet de votre conduite, pour identifier vos points forts et ce qui mérite d’être travaillé."],
  "prise-en-main-perf": ["Circuit & performance", "Prise en main véhicule haute performance", "Apprivoiser un véhicule puissant en toute confiance, avec un expert qui vous guide sur ses spécificités."],
  "aide-achat": ["Expertise automobile", "Aide décisionnelle à l’achat de véhicule", "Un regard automobile indépendant pour vous aider à choisir le véhicule qui correspond vraiment à vos besoins."],
  "essai-achat": ["Expertise automobile", "Essai accompagné avant achat", "Essayer le véhicule qui vous intéresse aux côtés d’un expert, pour repérer ce qu’un essai seul ne révèle pas."],
  "audit-occasion": ["Expertise automobile", "Audit véhicule d’occasion", "Une inspection technique complète avant achat, pour acheter un véhicule d’occasion en toute sérénité."],
  "prise-en-main-tech": ["Technologies embarquées", "Prise en main véhicule haute technologie", "Maîtriser les équipements et aides à la conduite de votre véhicule pour en exploiter tout le potentiel."],
  "conseil-techno": ["Technologies embarquées", "Conseil technologies embarquées", "Un accompagnement pour comprendre et choisir les technologies embarquées adaptées à votre usage."],
  "eco-conduite": ["Conduite responsable", "Éco-conduite", "Former vos collaborateurs à une conduite plus sobre, plus sûre et plus économique."],
  risque: ["Conduite responsable", "Prévention du risque routier", "Sensibiliser vos équipes et réduire durablement les comportements à risque au volant."],
  "team-building": ["Entreprise & collectif", "Team building automobile", "Rassembler vos collaborateurs autour d’une expérience automobile fédératrice et mémorable."],
  evenements: ["Entreprise & collectif", "Événements automobile", "Concevoir et encadrer un événement automobile sur-mesure pour votre entreprise."],
  "voyages-pro": ["Entreprise & collectif", "Voyages automobile", "Un voyage automobile encadré, pensé comme une expérience collective pour vos équipes."],
  lancement: ["Industrie & marques", "Lancement de véhicule", "Accompagner la présentation et la prise en main d’un nouveau modèle auprès de votre public."],
  esport: ["Industrie & marques", "Supervision de e-sport", "Un encadrement expert pour vos activations e-sport et simulation automobile."]
};

const picker = document.querySelector(".profile-picker__control");
const profileButtons = [...document.querySelectorAll("[data-profile]")];
const objectivesViewport = document.querySelector(".objectives-viewport");
const objectiveArea = document.querySelector("#objectives");
const guidePanel = document.querySelector(".guide__panel");
const recommendations = document.querySelector("#recommendations");
const recommendationGrid = document.querySelector(".recommendations__grid");
let activeProfile = "particulier";
let selected = [];

const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const PUSH_EASE = "cubic-bezier(.65,0,.16,1)";

function objectivesHTML() {
  return profiles[activeProfile].objectives.map(([id, label], index) =>
    `<button class="objective" type="button" data-objective="${id}" aria-pressed="false" style="--order:${index}">${label}</button>`
  ).join("");
}

function renderObjectives() {
  objectiveArea.innerHTML = objectivesHTML();
}

// Slides the current objectives panel out while the new one pushes in from the opposite side.
// direction: 1 = new content enters from the right, -1 = from the left.
function pushObjectives(direction) {
  if (prefersReducedMotion()) { renderObjectives(); return; }

  const outgoing = objectiveArea.cloneNode(true);
  outgoing.classList.add("is-pushing-out");
  const startH = objectiveArea.offsetHeight;
  objectivesViewport.style.height = startH + "px";
  objectivesViewport.classList.add("is-pushing");
  objectivesViewport.appendChild(outgoing);

  renderObjectives();
  objectiveArea.classList.add("is-pushing-in");
  objectiveArea.style.transition = "none";
  objectiveArea.style.transform = `translateX(${direction * 100}%)`;
  void objectiveArea.offsetWidth;
  const endH = objectiveArea.offsetHeight;

  const dur = 520;
  requestAnimationFrame(() => {
    outgoing.style.transition = `transform ${dur}ms ${PUSH_EASE}`;
    objectiveArea.style.transition = `transform ${dur}ms ${PUSH_EASE}`;
    objectivesViewport.style.transition = `height ${dur}ms ${PUSH_EASE}`;
    outgoing.style.transform = `translateX(${-direction * 100}%)`;
    objectiveArea.style.transform = "translateX(0%)";
    objectivesViewport.style.height = endH + "px";
  });

  setTimeout(() => {
    outgoing.remove();
    objectivesViewport.classList.remove("is-pushing");
    objectivesViewport.style.height = "";
    objectivesViewport.style.transition = "";
    objectiveArea.classList.remove("is-pushing-in");
    objectiveArea.style.transition = "";
    objectiveArea.style.transform = "";
  }, dur + 40);
}

function selectObjective(button) {
  const id = button.dataset.objective;
  selected = [id];
  objectiveArea.querySelectorAll(".objective").forEach(item => {
    item.setAttribute("aria-pressed", String(item.dataset.objective === id));
  });
  pushToRecommendations();
}

function getRecommendations() {
  const score = new Map();
  selected.forEach(objective => profiles[activeProfile].services[objective].forEach((service, rank) => score.set(service, (score.get(service) || 0) + 3 - rank)));
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => [id, ...services[id]]);
}

// Les 12 prestations Particulier ont chacune une vraie page de détail dans offre/<id>.html
// (voir offre/data.mjs). Le côté Professionnel n'en a pas encore — fallback sur #services
// pour ces id-là plutôt que sur un lien mort.
const OFFRE_PAGE_IDS = new Set([
  "stage-decouverte", "perfectionnement", "freinage", "trackday", "sensations", "bilan",
  "prise-en-main-perf", "aide-achat", "essai-achat", "audit-occasion", "prise-en-main-tech", "conseil-techno"
]);

function recommendationsHTML() {
  return getRecommendations().map(([id, category, title, description], index) => {
    // Chemin absolu (pas relatif) : ce script tourne aussi depuis services-section/ et
    // services-section-blue/ (comparateurs de Julien), pas seulement depuis la racine — offre/
    // n'existe qu'à la racine du site, un lien relatif casserait depuis ces deux sous-dossiers.
    const hasPage = OFFRE_PAGE_IDS.has(id);
    const href = hasPage ? `/offre/${id}.html` : "#services";
    // data-zoom déclenche l'effet "on rentre dans la carte" (js/page-transition.js) : un calque
    // grandit depuis cette carte jusqu'à couvrir l'écran avant de naviguer vers la vraie page.
    // data-offre-id/profile/objective : permettent à page-transition.js de mémoriser CETTE carte
    // précise (via sessionStorage) pour que le zoom retour se referme dessus exactement, et à ce
    // script de reconstruire le même état (profil + objectif + recommandations) à l'arrivée sur
    // #services — Julien : "il faut que ça redevienne comme quand on a cliqué au début pour y aller".
    const zoomAttr = hasPage
      ? ` data-zoom data-offre-id="${id}" data-profile="${activeProfile}" data-objective="${selected[0]}"`
      : "";
    return `
    <a class="recommendation-card" href="${href}" style="--order:${index}"${zoomAttr}>
      <span class="recommendation-card__number">0${index + 1}</span>
      <div class="recommendation-card__body">
        <h3>${title}</h3>
        <p class="recommendation-card__description">${description}</p>
      </div>
    </a>`;
  }).join("");
}

// Le panneau reste visible (on garde l'accès aux objectifs) : les recommandations
// s'ajoutent juste en dessous, avec un léger scroll pour les amener à l'écran.
function pushToRecommendations() {
  recommendationGrid.innerHTML = recommendationsHTML();
  recommendations.hidden = false;
  recommendations.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

profileButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (button.dataset.profile === activeProfile) return;
  picker.style.setProperty("--active-index", index);
  profileButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  activeProfile = button.dataset.profile;
  selected = [];
  pushObjectives(index === 1 ? 1 : -1);
}));

objectiveArea.addEventListener("click", event => {
  const button = event.target.closest(".objective");
  if (button) selectObjective(button);
});

// Restauration après un "Retour" depuis une page offre/ : reconstruit le même état (profil,
// objectif, recommandations) qu'au moment du clic vers cette page, pour que le zoom retour de
// js/page-transition.js se referme visuellement sur une carte identique à celle cliquée à
// l'origine — Julien : "il faut que ça redevienne comme quand on a cliqué au début pour y aller".
// Lue une seule fois (sessionStorage vidé aussitôt) : une simple visite ultérieure sur #services
// (lien direct, favori...) ne doit pas rejouer un vieux choix.
function restoreOffreOrigin() {
  let origin;
  try {
    const raw = sessionStorage.getItem("ds_offre_origin");
    if (!raw) return false;
    sessionStorage.removeItem("ds_offre_origin");
    origin = JSON.parse(raw);
  } catch (e) {
    return false;
  }
  if (!origin || !profiles[origin.profile]) return false;
  const index = profileButtons.findIndex(item => item.dataset.profile === origin.profile);
  if (index === -1) return false;
  activeProfile = origin.profile;
  picker.style.setProperty("--active-index", index);
  profileButtons.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.profile === origin.profile)));
  renderObjectives();
  if (origin.objective && profiles[activeProfile].services[origin.objective]) {
    selected = [origin.objective];
    const btn = objectiveArea.querySelector('[data-objective="' + origin.objective + '"]');
    if (btn) btn.setAttribute("aria-pressed", "true");
    recommendationGrid.innerHTML = recommendationsHTML();
    recommendations.hidden = false;
    // Aligne finement le scroll (voir pendingScrollAlign / settle() plus haut) pour que la carte
    // d'origine retombe pixel pour pixel à la même position qu'au moment du clic.
    if (origin.id && origin.rect) {
      const cardEl = recommendationGrid.querySelector('[data-offre-id="' + origin.id + '"]');
      if (cardEl) pendingScrollAlign = { el: cardEl, top: origin.rect.top };
    }
  }
  return true;
}

if (!restoreOffreOrigin()) renderObjectives();

// Défilement lent et contrôlé (pas le scroll natif, trop rapide) pour laisser le temps
// aux 3 phrases puis au titre puis au panneau de jouer leur apparition au passage.
function slowScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (Math.abs(diff) < 1) return;
  const startTime = performance.now();
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    window.scrollTo(0, targetY);
  }
  function step(now) {
    if (done) return;
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + diff * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
    else finish();
  }
  requestAnimationFrame(step);
  // Filet de sécurité : si l'onglet passe en arrière-plan, requestAnimationFrame peut être
  // suspendu par le navigateur et laisser le scroll bloqué à mi-chemin. setTimeout continue
  // de tourner (même ralenti) et garantit qu'on termine toujours au bon endroit.
  setTimeout(finish, duration + 500);
}

// Cartes "Particulier"/"Entreprise" du hero : pas de navigation, on reste sur la même page.
// On règle le profil puis on glisse lentement jusqu'au titre + panneau (les deux visibles ensemble,
// pas juste le panneau collé en haut de l'écran).
document.querySelectorAll("[data-profile-link]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const profile = link.dataset.profileLink;
    if (profiles[profile] && profile !== activeProfile) {
      const index = profileButtons.findIndex(item => item.dataset.profile === profile);
      activeProfile = profile;
      selected = [];
      picker.style.setProperty("--active-index", index);
      profileButtons.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.profile === profile)));
      renderObjectives();
    }
    if (prefersReducedMotion()) {
      guidePanel.scrollIntoView({ behavior: "auto", block: "end" });
      return;
    }
    // Le panneau porte data-reveal (translateY(30px) tant qu'il n'a pas été vu) : comme on
    // clique avant d'avoir scrollé jusque-là, il est encore décalé au moment de la mesure —
    // on force sa position finale d'abord, sinon la cible du scroll est fausse.
    guidePanel.classList.add("is-revealed");
    const titleEl = document.getElementById("guide-title");
    titleEl?.classList.add("is-revealed");
    // On ancre sur le HAUT du titre, pas sur le bas du panneau : le nombre de lignes que
    // font les pastilles d'objectifs change selon la largeur d'écran (2 ou 3 rangées), donc
    // la hauteur du panneau n'est pas stable — ancrer dessus donne un résultat différent
    // sur chaque écran. Le haut du titre, lui, ne bouge jamais : solution fiable partout.
    const anchor = titleEl || guidePanel;
    const targetY = anchor.getBoundingClientRect().top + window.scrollY - 20;
    setTimeout(() => slowScrollTo(targetY, 3400), 100);
  });
});

// Révèle le titre, le panneau et les 3 phrases de transition au scroll (une seule fois chacun).
(function setupScrollReveal() {
  const targets = [...document.querySelectorAll("[data-reveal]"), document.querySelector(".handoff__copy")].filter(Boolean);
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    targets.forEach(el => el.classList.add("is-revealed"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: .35 });
  targets.forEach(el => observer.observe(el));
})();

// Halo qui suit le curseur sur le fond dynamique.
(function setupBackgroundGlow() {
  const field = document.querySelector(".bg-field");
  if (!field) return;
  window.addEventListener("pointermove", event => {
    field.style.setProperty("--mx", event.clientX + "px");
    field.style.setProperty("--my", event.clientY + "px");
    field.classList.add("is-active");
  });
  window.addEventListener("pointerleave", () => field.classList.remove("is-active"));
})();
