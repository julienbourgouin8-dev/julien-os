// #service-sanitaire : vidéo verticale (9:16) unique, affichée telle quelle
// aux deux breakpoints (voir .services-duo dans gallery-duo.css) — plus de
// choix de source en JS selon l'écran, le <video src> est directement dans
// le HTML. Ce script ne gère plus que : préchargement différé (idle) +
// lancement de la lecture au moment où la section entre réellement dans le
// viewport (comme #poele), sans verrouiller le scroll.
(function () {
  var video = document.querySelector("#service-sanitaire .service-panel__media-fg");
  if (!video) return;

  // #service-sanitaire est loin sous le pli (après hero/partenaires/drone/
  // avis/poêle/chiffres) : basculer preload="auto" dès DOMContentLoaded
  // mettait ce fichier en concurrence directe avec le chargement prioritaire
  // du hero au tout premier affichage de la page. Même recette que la vidéo
  // #poele (js/video-inview.js, voir CLAUDE.md) : le vrai fetch démarre à
  // l'idle, largement avant que la section soit réellement scrollée en vue,
  // mais jamais au prix de la bande passante initiale.
  function startBuffering() {
    video.preload = "auto";
  }
  window.requestIdleCallback
    ? requestIdleCallback(startBuffering)
    : setTimeout(startBuffering, 200);

  // attachNetworkRecovery est une fonction globale définie dans
  // scroll-video.js (scripts classiques, pas de modules — même scope
  // global partagé). Cette vidéo n'en bénéficiait pas jusqu'ici,
  // contrairement au hero/drone : sur le tunnel Cloudflare (latence/coupures
  // plus fréquentes qu'en wifi normal, voir CLAUDE.md), un stall en cours de
  // buffering la laissait bloquée indéfiniment sans aucun rattrapage —
  // signalé "ne se déclenche toujours pas" alors même que tryPlay()/play()
  // avaient bien été appelés (le déclenchement scroll fonctionnait, c'est le
  // réseau qui restait bloqué derrière).
  if (typeof attachNetworkRecovery === "function") {
    attachNetworkRecovery(video);
  }

  // La vidéo ne boucle plus (retirée du HTML, demandé explicitement) : lancer
  // play() dès l'idle du chargement faisait qu'elle jouait et se figeait sur
  // sa dernière frame bien avant que l'utilisateur ait scrollé jusqu'à cette
  // section, plusieurs écrans plus bas — il n'y avait plus rien à voir une
  // fois arrivé. On ne lance la lecture qu'au moment où la section entre
  // réellement dans le viewport, comme #poele (video-inview.js), mais sans
  // verrouiller le scroll : juste un déclenchement au bon moment.
  var played = false;
  var lastLogTime = 0;
  function tryPlay() {
    if (played) return;
    var rect = section.getBoundingClientRect();
    if (window.__dbg) {
      var now = performance.now();
      if (now - lastLogTime > 400 && rect.top < window.innerHeight * 1.5 && rect.bottom > -window.innerHeight * 0.5) {
        lastLogTime = now;
        window.__dbg(
          "sanitaire: check top=" + Math.round(rect.top) +
          " bottom=" + Math.round(rect.bottom) +
          " innerH=" + window.innerHeight
        );
      }
    }
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    played = true;
    window.__dbg && window.__dbg("sanitaire: in view, calling play()");
    window.removeEventListener("scroll", tryPlay);
    video.addEventListener("playing", function () {
      window.__dbg && window.__dbg("sanitaire: playing event fired");
    }, { once: true });
    video.play().catch(function (err) {
      window.__dbg && window.__dbg(
        "sanitaire: play() rejected (" + (err && err.name) + "), arming gesture retry"
      );
      function retry() {
        ["touchstart", "click"].forEach(function (e) {
          document.removeEventListener(e, retry);
        });
        window.__dbg && window.__dbg("sanitaire: retry play() on gesture");
        video.play().catch(function () {
          window.__dbg && window.__dbg("sanitaire: retry play() also rejected");
        });
      }
      ["touchstart", "click"].forEach(function (e) {
        document.addEventListener(e, retry, { once: true, passive: true });
      });
    });
  }

  // .closest("section") remontait à #services-duo (la section englobante qui
  // contient les DEUX panneaux empilés sur mobile), pas à #service-sanitaire
  // lui-même — l'<article> est le bon conteneur, sa propre géométrie
  // correspond à ce panneau précis, pas aux deux combinés.
  var section = video.closest("article") || video.closest("section") || video.parentElement;

  // Rapporté sur mobile réel : la vidéo ne se déclenchait qu'à une position
  // de scroll très précise, décorrélée de la position réelle du panneau.
  // Cause probable : le tout premier appel à tryPlay() ci-dessous s'exécutait
  // de façon synchrone, avant que la mise en page de tout ce qui précède
  // (chiffres clés calculés en JS, polices, etc.) soit stabilisée — une
  // mesure prise trop tôt pouvait donc marquer la vidéo "jouée" (et retirer
  // l'écouteur de scroll) sur une géométrie temporairement fausse, avant même
  // le premier scroll de l'utilisateur. Un rAF laisse la mise en page se
  // stabiliser avant cette toute première mesure.
  window.addEventListener("scroll", tryPlay, { passive: true });
  requestAnimationFrame(tryPlay);

  // Filet de secours au repos, même principe que #poele (video-inview.js) :
  // la condition de tryPlay() est déjà large (n'importe quelle visibilité
  // partielle suffit), mais un fling assez rapide peut en théorie traverser
  // toute la hauteur du panneau (~100vh) entre deux évènements "scroll" —
  // le panneau ne serait alors jamais surpris "visible" sur aucun tick, et
  // resterait sur pause jusqu'à un scroll ultérieur qui repasse dessus.
  // Ce filet redéclenche une vérification 250ms après que le scroll s'est
  // arrêté, au cas où la position finale serait visible sans qu'aucun
  // évènement "scroll" ne l'ait jamais capturée.
  var idleTimer = null;
  function onScrollIdleCheck() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(tryPlay, 250);
  }
  window.addEventListener("scroll", onScrollIdleCheck, { passive: true });
})();
