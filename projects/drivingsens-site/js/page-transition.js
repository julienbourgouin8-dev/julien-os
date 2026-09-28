// Effet "on rentre dans la carte" (demande de Julien 2026-09-27). Voir css/page-transition.css
// pour les classes utilisées. Deux mécanismes :
// 1. Clic sur un lien `[data-zoom]` : un calque plein grandit depuis CET ÉLÉMENT jusqu'à couvrir
//    tout l'écran, puis on navigue vers la vraie page. Utilisé à la fois par les cartes de
//    recommandation (aller) ET par "← Retour aux prestations" (retour) — **volontairement le même
//    mécanisme dans les deux sens**, pas deux effets différents. Julien : "je veux le même effet
//    que quand on zoom in... c'est exactement le même que quand on rentre, je veux le même quand
//    on ressort". Une 1ère version du retour (calque qui REPARTAIT plein écran pour se REFERMER
//    vers un petit rectangle) laissait le contenu de la page offre/ visible tout autour du petit
//    rectangle final — le vrai chargement de page devenait visible à ce moment-là ("ça
//    s'actualise", signalé par Julien), en plus d'un calque parfois mal positionné (voir
//    decisions/log.md et AGENTS.md pour l'historique). Repartir du même mécanisme qu'à l'entrée
//    (grandir jusqu'au plein écran, quel que soit le lien cliqué) garantit que la navigation se
//    fait TOUJOURS derrière un plein écran uni — jamais de contenu qui dépasse autour, jamais de
//    petit rectangle mal placé.
// 2. Chargement d'une page `<body data-page-reveal>` (les pages offre/) : le contenu marqué
//    [data-reveal-in] apparaît juste après le chargement, prolonge visuellement le zoom qui
//    vient de se terminer sur la page précédente.
// 3. `window.dsRevealFromZoom(targetEl)` — appelée par services-section-blue/script.js une fois
//    l'état restauré et le scroll positionné (voir settle()) : un calque plein écran (déjà là
//    quand la page apparaît, donc aucun flash de contenu nu) se REFERME sur `targetEl` (la carte
//    restaurée) avant de disparaître — le miroir exact du grandissement à l'entrée, mais mesuré
//    sur CETTE page (jamais un rect importé d'une autre page, voir le piège corrigé plus haut dans
//    AGENTS.md). Sans cet appel, la page apparaissait d'un coup, déjà entièrement positionnée —
//    Julien : "on voit toujours que ça part des cartes principales et que ça revient sur la carte
//    sélectionnée, il faudrait que l'effet soit mieux géré" — il manquait précisément ce
//    resserrement visuel sur la carte, symétrique à l'ouverture.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ZOOM_DURATION = 480;

  function createOverlay() {
    var overlay = document.createElement("div");
    overlay.className = "page-zoom-overlay";
    document.body.appendChild(overlay);
    return overlay;
  }

  // Forcer un reflow avant de poser l'état final : sans ça, le navigateur applique directement
  // l'état final sans jouer la transition entre les deux tailles.
  function reflow(el) {
    void el.offsetWidth;
  }

  function setRect(el, rect, radius) {
    el.style.top = rect.top + "px";
    el.style.left = rect.left + "px";
    el.style.width = rect.width + "px";
    el.style.height = rect.height + "px";
    el.style.borderRadius = radius;
  }

  var ORIGIN_KEY = "ds_offre_origin";

  function zoomInto(link) {
    // Mémorise la carte cliquée (id + position + profil/objectif du simulateur) pour que le
    // zoom retour depuis la page offre/ se referme exactement dessus, et pour que
    // services-section-blue/script.js reconstruise le même état à l'arrivée sur #services.
    if (link.dataset.offreId) {
      try {
        var r = link.getBoundingClientRect();
        sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({
          id: link.dataset.offreId,
          profile: link.dataset.profile,
          objective: link.dataset.objective,
          rect: { top: r.top, left: r.left, width: r.width, height: r.height }
        }));
      } catch (e) { /* sessionStorage indisponible (navigation privée…) : tant pis, pas bloquant */ }
    }
    var overlay = createOverlay();
    setRect(overlay, link.getBoundingClientRect(), getComputedStyle(link).borderRadius);
    reflow(overlay);
    overlay.classList.add("is-expanding");
  }

  window.dsRevealFromZoom = function (targetEl) {
    if (reduced) return;
    var overlay = createOverlay();
    setRect(overlay, { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }, "0px");
    reflow(overlay);
    if (targetEl) {
      var r = targetEl.getBoundingClientRect();
      var radius = getComputedStyle(targetEl).borderRadius;
      setRect(overlay, { top: r.top, left: r.left, width: r.width, height: r.height }, radius && radius !== "0px" ? radius : "28px");
    } else {
      // Pas de carte précise à viser (arrivée générique sur #services) : simple fondu de sortie.
      overlay.style.transition = "opacity " + ZOOM_DURATION + "ms ease";
      requestAnimationFrame(function () {
        overlay.style.opacity = "0";
      });
    }
    setTimeout(function () {
      overlay.remove();
    }, ZOOM_DURATION + 30);
  };

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;

    var zoomLink = event.target.closest("a[data-zoom]");
    if (!zoomLink) return;
    var href = zoomLink.getAttribute("href");
    if (!href || zoomLink.target === "_blank") return;
    event.preventDefault();
    if (reduced) {
      window.location.href = href;
      return;
    }
    zoomInto(zoomLink);
    setTimeout(function () {
      window.location.href = href;
    }, ZOOM_DURATION);
  });

  if (document.body.hasAttribute("data-page-reveal")) {
    document.querySelectorAll("[data-reveal-in]").forEach(function (el, i) {
      el.style.setProperty("--reveal-i", i);
    });
    if (reduced) {
      document.body.classList.add("is-revealed");
    } else {
      // Deux rAF imbriqués : laisse le navigateur peindre l'état initial (réduit/transparent)
      // avant d'ajouter la classe qui déclenche la transition CSS vers l'état final.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.body.classList.add("is-revealed");
        });
      });
    }
  }
})();
