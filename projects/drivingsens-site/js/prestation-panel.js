// Panneau prestation EN PAGE (2026-09-27) — Julien, après plusieurs passes sur l'effet
// aller-retour entre index.html et les pages offre/ : "vois-le pas comme une page... une
// continuité... on aura peut-être pas à rafraîchir". Les pages offre/*.html restent de vraies
// pages (accès direct par URL, partage) générées par scripts/build-offre-pages.mjs — mais le clic
// sur une carte de recommandation n'y navigue plus du tout : ce fichier ouvre à la place un
// panneau qui grandit depuis la carte, DANS LA MÊME PAGE, avec le même contenu
// (window.OFFRE, exposé par offre/data.mjs via <script type="module">). Élimine d'un coup toute
// la classe de bugs liés à une vraie navigation (scroll à resynchroniser, sessionStorage,
// timing Safari, lenteur du chargement de page) — il n'y a plus de chargement de page du tout.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Doit correspondre à la durée de transition posée sur .prestation-panel dans
  // css/prestation-panel.css. Un minutage fixe (setTimeout), pas `transitionend` : plus robuste
  // (un `transitionend` peut ne jamais se déclencher si une propriété n'a en fait pas changé, ou
  // se déclencher plusieurs fois pour les 5 propriétés transitionnées) et permet de faire
  // chevaucher légèrement la révélation du contenu avec la toute fin de la croissance, pour un
  // ressenti plus fluide plutôt que strictement séquentiel.
  var GROW_MS = 300;
  var REVEAL_AT_MS = 220;
  var panel = null;
  var openCardEl = null;

  function setRect(el, rect, radius) {
    el.style.top = rect.top + "px";
    el.style.left = rect.left + "px";
    el.style.width = rect.width + "px";
    el.style.height = rect.height + "px";
    el.style.borderRadius = radius;
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "prestation-panel";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="prestation-panel__scroll">' +
        '<nav class="prestation-nav">' +
          '<button type="button" class="prestation-back" data-panel-close>← Retour aux prestations</button>' +
          '<a class="prestation-logo" href="/index.html"><img src="/hero-concepts/assets/logo-white.png" alt="Driving Sens" /></a>' +
        '</nav>' +
        '<main class="prestation">' +
          '<section class="prestation-hero" data-reveal-in>' +
            '<span class="eyebrow" data-field="category"></span>' +
            '<h1 data-field="title"></h1>' +
            '<p class="prestation-tagline" data-field="tagline"></p>' +
            '<p class="prestation-description" data-field="long"></p>' +
          '</section>' +
          '<section class="prestation-highlights" data-reveal-in>' +
            '<h2>Ce que ça vous apporte</h2>' +
            '<ul data-field="highlights"></ul>' +
          '</section>' +
          '<div class="prestation-cta" data-reveal-in>' +
            '<a class="recommend-button" href="#contact" data-field="cta"></a>' +
          '</div>' +
        '</main>' +
      '</div>';
    document.body.appendChild(panel);
    panel.querySelector("[data-panel-close]").addEventListener("click", closePanel);
    return panel;
  }

  function fillPanel(id) {
    var data = window.OFFRE && window.OFFRE[id];
    if (!data) return false;
    panel.querySelector('[data-field="category"]').textContent = data.category;
    panel.querySelector('[data-field="title"]').textContent = data.title;
    panel.querySelector('[data-field="tagline"]').textContent = data.tagline;
    panel.querySelector('[data-field="long"]').textContent = data.long;
    panel.querySelector('[data-field="cta"]').textContent = data.cta;
    panel.querySelector('[data-field="highlights"]').innerHTML =
      data.highlights.map(function (h) { return "<li>" + h + "</li>"; }).join("");
    panel.querySelectorAll("[data-reveal-in]").forEach(function (el, i) {
      el.style.setProperty("--reveal-i", i);
    });
    panel.querySelector(".prestation-panel__scroll").scrollTop = 0;
    return true;
  }

  function openPanel(link) {
    var id = link.dataset.offreId;
    if (!id || !window.OFFRE || !window.OFFRE[id]) return false;
    ensurePanel();
    if (!fillPanel(id)) return false;
    openCardEl = link;

    var rect = link.getBoundingClientRect();
    var radius = getComputedStyle(link).borderRadius;
    panel.classList.remove("is-content-visible");
    panel.hidden = false;

    if (reduced) {
      setRect(panel, { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }, "0px");
      panel.classList.add("is-content-visible");
      document.body.classList.add("has-open-panel");
      return true;
    }

    setRect(panel, rect, radius);
    void panel.offsetWidth; // reflow : sans ça, pas de transition visible entre les deux tailles.
    setRect(panel, { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }, "0px");

    setTimeout(function () {
      panel.classList.add("is-content-visible");
    }, REVEAL_AT_MS);
    document.body.classList.add("has-open-panel");
    return true;
  }

  function closePanel() {
    if (!panel || panel.hidden) return;
    panel.classList.remove("is-content-visible");
    document.body.classList.remove("has-open-panel");

    if (reduced) {
      panel.hidden = true;
      return;
    }

    var rect = openCardEl ? openCardEl.getBoundingClientRect() : null;
    var radius = openCardEl ? getComputedStyle(openCardEl).borderRadius : "28px";
    if (rect) {
      setRect(panel, rect, radius);
    } else {
      // Pas de carte d'origine retrouvée (rare) : repli neutre, centré, petit.
      var w = Math.min(360, window.innerWidth * 0.7);
      var h = Math.min(220, window.innerHeight * 0.5);
      setRect(panel, {
        top: (window.innerHeight - h) / 2,
        left: (window.innerWidth - w) / 2,
        width: w,
        height: h
      }, "28px");
    }

    setTimeout(function () {
      panel.hidden = true;
    }, GROW_MS);
  }

  // Phase de CAPTURE (3e argument true) : s'exécute avant le listener de js/page-transition.js
  // (phase de bulles, standard) — permet d'intercepter le clic sur une carte AVANT que ce dernier
  // ne déclenche son propre zoom + une vraie navigation. Seules les cartes portent à la fois
  // data-zoom ET data-offre-id (le lien "Retour" des pages offre/ n'a que data-zoom : il continue
  // de naviguer normalement, sans rapport avec ce panneau).
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    var link = event.target.closest("a[data-zoom][data-offre-id]");
    if (!link) return;
    if (!window.OFFRE) return; // pas encore chargé (chargement de page très lent) : repli sur la navigation normale déjà gérée par page-transition.js
    if (openPanel(link)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
