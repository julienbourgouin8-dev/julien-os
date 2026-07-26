function initInviewVideos() {
  const videos = document.querySelectorAll(".video-inview");
  if (!videos.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  videos.forEach((video) => {
    // Avec les animations réduites, la vidéo ne se lance pas automatiquement
    // (elle reste sur le poster) : bloquer le scroll dans ce cas piégerait
    // l'utilisateur sans rien à attendre.
    if (prefersReducedMotion) return;

    // Légèrement plus rapide que le tempo natif — rend le passage un peu
    // plus dynamique sans que ce soit perceptible comme "accéléré".
    const PLAYBACK_RATE = 1.5;

    const revealTarget = video.parentElement.querySelector(
      ".video-inview-reveal"
    );
    // La section (pas juste la vidéo) donne la géométrie fiable : elle fait
    // toujours exactement 100vh (voir .stove), donc son alignement en haut
    // du viewport correspond exactement au moment où elle remplit l'écran.
    const section = video.closest("section") || video.parentElement;
    // Le cadre (pas juste la vidéo) passe en position:fixed pendant le
    // verrouillage — voir stove.css .stove__frame.is-locked et la note
    // plus bas dans lockScroll()/unlockScroll().
    const frame = video.closest(".stove__frame") || section;

    let locked = false;
    let triggered = false;
    let lockedScrollY = 0;

    // preload reste "none" dans le HTML pour ne pas concurrencer le
    // téléchargement du hero au chargement initial — mais si le fetch ne
    // démarre qu'au moment exact du verrouillage (dans startSequence), le
    // premier affichage attend le temps de mise en mémoire tampon du
    // fichier entier, perçu comme "ça bloque avant de lancer la vidéo".
    // Idle callback : démarre le buffering en arrière-plan dès que le
    // thread principal est libre après le chargement initial, sans jamais
    // voler de bande passante au hero — par le temps où l'utilisateur
    // scrolle jusqu'à cette section, la vidéo a déjà eu une longueur
    // d'avance.
    const startBuffering = () => {
      video.preload = "auto";
    };
    if (window.requestIdleCallback) {
      requestIdleCallback(startBuffering);
    } else {
      setTimeout(startBuffering, 2000);
    }

    // attachNetworkRecovery est une fonction globale définie dans
    // scroll-video.js (scripts classiques, même scope global) — déjà
    // utilisée pour le hero/drone mais jamais branchée ici. Sur le tunnel
    // Cloudflare (latence/coupures plus fréquentes qu'en wifi normal), un
    // stall pendant le buffering laissait cette vidéo bloquée indéfiniment
    // (scroll déjà verrouillé) sans aucun rattrapage autre que le filet de
    // secours à 4s qui, lui, ne couvre que le cas "play() jamais résolu" —
    // pas un flux qui démarre puis se coupe en cours de lecture.
    if (typeof attachNetworkRecovery === "function") {
      attachNetworkRecovery(video);
    }

    // overflow:hidden seul ne suffit pas : le momentum d'un trackpad (scroll
    // inertiel après relâchement du doigt) est parfois piloté par le
    // compositeur du navigateur plutôt que par des événements "wheel"
    // interceptables, et continue à faire dériver le scroll de quelques
    // dizaines de pixels après le verrouillage — d'où un cadrage "trop bas"
    // au moment du blocage. Passer le body en position:fixed retire
    // complètement la fenêtre de tout contexte scrollable pendant le
    // verrouillage, ce qui coupe court à ce résidu quelle que soit sa source.
    // Prend la position cible explicitement plutôt que de relire
    // window.scrollY au moment du verrouillage : sur un scroll rapide
    // (flick), l'inertie pilotée par le compositeur peut continuer à
    // faire dériver scrollY après le snap et avant ce point — se figer sur
    // une lecture "live" de scrollY risquait de figer une position déjà
    // décalée. La cible précise qu'on a nous-mêmes calculée reste valable
    // quoi qu'il arrive entre-temps.
    function lockScroll(targetScrollY) {
      locked = true;
      lockedScrollY = targetScrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      frame.classList.add("is-locked");
    }

    function unlockScroll() {
      if (!locked) return;
      locked = false;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      frame.classList.remove("is-locked");
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
    }

    function blockScrollKeys(e) {
      if (!locked) return;
      const keys = [
        "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space", "End", "Home",
      ];
      if (keys.includes(e.code)) e.preventDefault();
    }

    function blockScrollEvent(e) {
      if (locked) e.preventDefault();
    }

    window.addEventListener("wheel", blockScrollEvent, { passive: false });
    window.addEventListener("touchmove", blockScrollEvent, { passive: false });
    window.addEventListener("keydown", blockScrollKeys);

    function startSequence() {
      triggered = true;
      window.__dbg && window.__dbg("poele: startSequence() triggered");
      window.removeEventListener("scroll", onScroll);

      // Aligne précisément la section en haut du viewport avant de
      // verrouiller : un scroll rapide (molette, flick trackpad) peut
      // dépasser le point exact où elle remplit l'écran avant que ce check
      // ne s'exécute, ce qui donnait un cadrage décalé une fois bloqué.
      // "instant" est nécessaire ici (pas "auto") car <html> a
      // scroll-behavior:smooth — "auto" hériterait ce comportement animé,
      // hors on veut un snap immédiat avant de verrouiller.
      //
      // Un tween (rAF + easing) a été essayé pour adoucir ce snap (jusqu'à
      // TOLERANCE=200px, voir plus bas) en un glissement rapide plutôt qu'un
      // pop instantané — mesuré ici comme s'étalant sur PLUSIEURS SECONDES
      // au lieu des ~120ms prévus (rAF sévèrement throttled dans ce contexte
      // de test, et potentiellement aussi en vrai mode Basse consommation
      // iOS, qui bride justement les timers/rAF). Un verrouillage qui
      // n'arrive plus qu'après un délai variable et imprévisible serait bien
      // pire que le snap instantané qu'il visait à adoucir — abandonné, ne
      // pas réintroduire sans un moyen fiable de mesurer que rAF tourne à un
      // rythme normal sur l'appareil réel.
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });

      // Un scroll rapide (flick) a de l'inertie qui continue à défiler la
      // page sur une frame ou deux après ce scrollTo, pilotée par le
      // compositeur plutôt que par du JS interceptable — verrouiller dans
      // le même tick pouvait figer la page une frame trop tôt, avant que ce
      // snap n'ait fini de s'appliquer, laissant la marge suivante
      // brièvement visible. Un rAF laisse ce snap passer par un cycle de
      // peinture, puis on re-snap sur la même cible `top` juste avant de
      // verrouiller (pas une relecture de scrollY, qui pourrait avoir
      // continué à dériver entre-temps) pour être sûr d'être bien aligné.
      requestAnimationFrame(() => {
        window.scrollTo({ top, behavior: "instant" });
        lockScroll(top);
        video.preload = "auto";
        video.playbackRate = PLAYBACK_RATE;
        function onPlaySuccess() {
          window.__dbg && window.__dbg("poele: play() resolved");
          if (revealTarget) revealTarget.classList.add("is-active");
        }
        window.__dbg && window.__dbg("poele: calling play()");
        video
          .play()
          .then(onPlaySuccess)
          .catch((err) => {
            // iOS bloque parfois play() hors d'un vrai geste utilisateur
            // (mode Basse consommation, réglage Safari "Lecture
            // automatique") même sur une vidéo muted+playsinline — la
            // section est déjà verrouillée en scroll à ce stade (l'usager
            // vient de faire défiler la page, donc un geste a déjà eu
            // lieu), mais l'appel play() lui-même n'était pas dans le
            // handler de ce geste. On retente une fois au prochain
            // touchstart/click plutôt que de débloquer immédiatement :
            // ça laisse une chance réelle de lire la vidéo au lieu
            // d'abandonner sur un appareil où l'autoplay est simplement
            // restreint (pas cassé).
            window.__dbg &&
              window.__dbg(
                "poele: play() rejected (" + (err && err.name) + "), arming gesture retry"
              );
            const events = ["touchstart", "click"];
            function retry() {
              events.forEach((e) => document.removeEventListener(e, retry));
              window.__dbg && window.__dbg("poele: retry play() on gesture");
              video.play().then(onPlaySuccess).catch(() => {
                window.__dbg && window.__dbg("poele: retry play() also rejected, unlocking");
                unlockScroll();
              });
            }
            events.forEach((e) =>
              document.addEventListener(e, retry, { once: true, passive: true })
            );
            // Filet de sécurité : si aucun geste ne vient dans un délai
            // raisonnable, ne pas laisser le scroll verrouillé indéfiniment.
            setTimeout(() => {
              if (video.paused) {
                events.forEach((e) => document.removeEventListener(e, retry));
                window.__dbg && window.__dbg("poele: 4s timeout, no gesture, unlocking");
                unlockScroll();
              }
            }, 4000);
          });
      });

      video.addEventListener("ended", unlockScroll, { once: true });
      // Filet de sécurité : si "ended" ne se déclenche jamais pour une
      // raison quelconque, on ne bloque pas le scroll indéfiniment.
      video.addEventListener(
        "loadedmetadata",
        () => {
          const fallbackMs =
            ((video.duration || 8) / PLAYBACK_RATE) * 1000 + 2000;
          setTimeout(unlockScroll, fallbackMs);
        },
        { once: true }
      );
    }

    // Calcul direct sur les dimensions de la section plutôt qu'un
    // IntersectionObserver à seuil quasi-100% : la section fait exactement
    // 100vh, donc "remplir l'écran" est un point unique (scrollY précis),
    // qu'un scroll rapide pouvait sauter entre deux vérifications du seuil
    // et ne jamais déclencher le blocage. Une marge de tolérance ici couvre
    // ce cas, dans les deux sens de scroll — seule la première traversée
    // (marquée par `triggered`) déclenche le blocage ; on peut ensuite
    // remonter librement sans le redéclencher.
    // Rapporté encore cassé sur un flick très rapide : une fenêtre de 60px
    // peut être entièrement sautée entre deux évènements "scroll" pendant un
    // fling véloce (le momentum peut avancer de bien plus que ça d'un event
    // à l'autre), donc `triggered` ne passait jamais à true — la section
    // n'était alors jamais calée/verrouillée, et l'utilisateur atterrissait
    // sur une position de scroll arbitraire, parfois juste après la section,
    // révélant un bout de la section suivante (lu comme "bande blanche").
    // Élargie à 200px (le re-snap précis dans startSequence() ne dépend pas
    // de cette valeur, donc l'élargir ne perd aucune précision) + un filet de
    // secours ci-dessous qui rattrape même un fling assez rapide pour sauter
    // cette fenêtre élargie.
    const TOLERANCE = 200;
    function sectionFillsViewport() {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      return rect.top <= TOLERANCE && rect.bottom >= viewportHeight - TOLERANCE;
    }

    let lastLogTime = 0;
    function onScroll() {
      if (triggered) return;
      if (window.__dbg) {
        const now = performance.now();
        if (now - lastLogTime > 400) {
          lastLogTime = now;
          const rect = section.getBoundingClientRect();
          const vh = window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;
          if (rect.top < vh * 1.5 && rect.bottom > -vh * 0.5) {
            window.__dbg(
              "poele: onScroll top=" + Math.round(rect.top) +
              " bottom=" + Math.round(rect.bottom) +
              " vh=" + Math.round(vh) +
              " fills=" + sectionFillsViewport()
            );
          }
        }
      }
      if (sectionFillsViewport()) startSequence();
    }

    // Filet de secours : si un fling est assez rapide pour sauter même la
    // fenêtre élargie ci-dessus entre deux évènements "scroll", on rattrape
    // au repos — dès que le scroll s'arrête (250ms sans nouvel évènement)
    // et que la section est encore substantiellement dans l'écran, on
    // déclenche quand même plutôt que de laisser l'utilisateur figé sur un
    // cadrage à moitié aligné.
    // Rapporté sur mobile : rester bien positionné sans que la vidéo ne se
    // déclenche, nécessitant un petit re-scroll pour la faire partir. Cause :
    // ce filet utilisait un critère (60% de surface visible) plus STRICT que
    // sectionFillsViewport() (tolérance 200px sur chaque bord) — un
    // utilisateur pouvait donc s'arrêter dans la zone que le check principal
    // aurait acceptée, mais que celui-ci refusait, sans qu'aucun autre
    // évènement "scroll" ne vienne jamais relancer une vérification. Réutilise
    // maintenant exactement le même critère que la vérification principale.
    let idleTimer = null;
    function onScrollIdleCheck() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (triggered) return;
        const fills = sectionFillsViewport();
        if (window.__dbg) {
          const rect = section.getBoundingClientRect();
          const vh = window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;
          if (rect.top < vh * 1.5 && rect.bottom > -vh * 0.5) {
            window.__dbg(
              "poele: idle check top=" + Math.round(rect.top) +
              " bottom=" + Math.round(rect.bottom) +
              " vh=" + Math.round(vh) +
              " fills=" + fills
            );
          }
        }
        if (fills) startSequence();
      }, 250);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScrollIdleCheck, { passive: true });
    onScroll();
  });
}

document.addEventListener("DOMContentLoaded", initInviewVideos);
