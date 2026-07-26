function initHandwritingType() {
  const targets = document.querySelectorAll(".handwrite");
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Actif sur desktop et mobile (demandé explicitement) ; sous
  // reduced-motion le texte reste tel quel dans le markup plutôt que
  // d'être découpé en spans invisibles.
  if (prefersReducedMotion) return;

  // Environ 2x plus rapide que le réglage précédent (60-110ms), tout en
  // restant un tracé lettre par lettre plutôt qu'un flash instantané.
  const CHAR_DELAY_MIN_MS = 30;
  const CHAR_DELAY_MAX_MS = 55;

  targets.forEach((el) => {
    const text = el.textContent;
    // Le texte réel est retiré du DOM (remplacé par des spans par
    // lettre) : aria-label sur le conteneur garde la phrase complète
    // accessible aux lecteurs d'écran, même en cours d'animation.
    el.setAttribute("aria-label", text);
    el.textContent = "";

    const chars = [];
    const words = text.split(" ");
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "handwrite-word";
      for (const ch of word) {
        const charSpan = document.createElement("span");
        charSpan.className = "handwrite-char";
        charSpan.textContent = ch;
        wordSpan.appendChild(charSpan);
        chars.push(charSpan);
      }
      el.appendChild(wordSpan);
      // Espace réel entre les mots (pas de span) : c'est ce qui donne un
      // point de retour à la ligne naturel au navigateur.
      if (wordIndex < words.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });

    function typeChars() {
      let i = 0;
      function step() {
        if (i >= chars.length) return;
        chars[i].classList.add("is-visible");
        i++;
        const delay =
          CHAR_DELAY_MIN_MS + Math.random() * (CHAR_DELAY_MAX_MS - CHAR_DELAY_MIN_MS);
        setTimeout(step, delay);
      }
      step();
    }

    // Rapporté sur mobile : le texte commençait parfois à s'écrire avant
    // que la vidéo associée n'ait vraiment démarré (sanitaire), ou avant
    // que la section ne soit vraiment "en face" (diaporama pac, pas de
    // vidéo) — le seuil bas de .reveal (js/reveal.js, 0.15) est pensé pour
    // un fondu de 700ms où démarrer un peu tôt ne se voit pas, pas pour un
    // tracé de plusieurs secondes. La vidéo réelle de la section (si il y
    // en a une) est le signal le plus fiable de "prêt à être lu" — plus
    // fiable qu'un seuil de visibilité, puisqu'elle ne peut de toute façon
    // démarrer que section en vue (voir js/video-inview.js et
    // js/service-panel-video.js).
    let started = false;
    const panel = el.closest("section, article");
    function start() {
      if (started) return;
      started = true;
      window.__dbg &&
        window.__dbg("handwrite[" + (panel ? panel.id : "?") + "]: start typing");
      typeChars();
    }

    const associatedVideo = panel && panel.querySelector("video");

    if (associatedVideo) {
      if (!associatedVideo.paused && associatedVideo.currentTime > 0) {
        start();
        return;
      }
      associatedVideo.addEventListener("playing", start, { once: true });
      // Filet de sécurité : si la vidéo ne démarre jamais (autoplay bloqué
      // sans geste de récupération, connexion morte...), ne pas laisser le
      // texte invisible indéfiniment une fois la section en vue.
      const fallbackObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(start, 6000);
              fallbackObserver.disconnect();
            }
          });
        },
        { threshold: 0.15 }
      );
      fallbackObserver.observe(panel || el);
      return;
    }

    // Pas de vidéo associée (diaporama photo #service-pac) : seuil de
    // visibilité dédié et plus strict que .reveal, pour ne démarrer
    // l'écriture qu'une fois la section vraiment en face — indépendant du
    // seuil bas partagé par le fondu kicker/titre/CTA de la même section.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            start();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(panel || el);
  });
}

document.addEventListener("DOMContentLoaded", initHandwritingType);
