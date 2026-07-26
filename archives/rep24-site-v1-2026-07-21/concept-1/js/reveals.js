// Chorégraphie d'entrée par section — chaque section a une entrée DIFFÉRENTE
// (fade-up, slide gauche/droite, scale-up, clip-path) et un délai échelonné
// entre ses enfants, comme demandé par scroll-design-guidelines.md. Ce fichier
// crée aussi la SEULE section pinée du site (#environnement) — elle doit être
// créée EN PREMIER, avant les autres ScrollTrigger d'ambiance (voir la règle
// d'ordre dans engine-recipes.md).
window.addEventListener("site:ready-to-animate", initReveals);

function initReveals() {
  const reduced = window.__reducedMotion;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (reduced || !hasGsap) {
    // Repli : tout est visible directement, pas de pin (voir mobile-reliability.md —
    // ne jamais verrouiller le scroll derrière un effet qui ne va pas jouer).
    document.querySelectorAll(".reveal-item").forEach((el) => el.classList.add("is-visible"));
    document.querySelectorAll(".cinematic__chapter").forEach((el, i) => {
      el.classList.toggle("is-active", i === 0);
    });
    initHeroIntroFallback();
    return;
  }

  initPinnedEnvironnement(); // pin d'abord — ordre non négociable
  initHeroIntro();
  initFadeUpSections();
  initEquipeSlideRight();
  initChauffageSlideLeft();
  initPlomberieClipReveal();
  initAutresPrestationsSlideUp();
  initReviewsScaleUp();
}

function initHeroIntroFallback() {
  const el = document.querySelector(".hero");
  if (el) el.querySelectorAll(".reveal-item").forEach((n) => n.classList.add("is-visible"));
}

// Hero : entrée au chargement (pas au scroll), séquence eyebrow → wordmark →
// tagline → expérience → CTA, stagger 0.1s.
function initHeroIntro() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const items = hero.querySelectorAll(".reveal-item");
  gsap.set(items, { opacity: 0, y: 28 });
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.1,
    delay: 0.15,
  });
}

// Section pinée : l'image + le chiffre fantôme restent fixes pendant que les
// 5 paragraphes réels de "La préservation de votre environnement" se
// succèdent, un par un, façon chapitre scrollytelling.
function initPinnedEnvironnement() {
  const pinEl = document.querySelector(".cinematic__pin");
  const section = document.querySelector(".cinematic");
  const chapters = document.querySelectorAll(".cinematic__chapter");
  if (!pinEl || !section || !chapters.length) return;

  const scrollLength = chapters.length * 500; // px de scroll par chapitre

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: `+=${scrollLength}`,
    pin: pinEl,
    pinSpacing: true,
    scrub: 0.3,
    onUpdate: (self) => {
      const idx = Math.min(chapters.length - 1, Math.floor(self.progress * chapters.length));
      chapters.forEach((c, i) => c.classList.toggle("is-active", i === idx));
    },
  });

  // Premier chapitre visible avant même d'atteindre la section.
  chapters[0].classList.add("is-active");
}

// Fade-up standard, stagger 0.1s, pour les sections texte "simples".
function initFadeUpSections() {
  const groups = [
    "#presentation .reveal-item",
    "#certifications .reveal-item",
    "#contact .reveal-item",
  ];
  groups.forEach((selector) => {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 28 });
    ScrollTrigger.create({
      trigger: items[0].closest("section, footer"),
      start: "top 78%",
      once: true,
      onEnter: () =>
        gsap.to(items, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 }),
    });
  });

  // Chiffres clés : scale-up façon "pop", pas un simple fade.
  const stats = gsap.utils.toArray("#chiffres .stat");
  if (stats.length) {
    gsap.set(stats, { opacity: 0, scale: 0.88 });
    ScrollTrigger.create({
      trigger: "#chiffres",
      start: "top 78%",
      once: true,
      onEnter: () =>
        gsap.to(stats, {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: "back.out(1.5)",
          stagger: 0.1,
        }),
    });
  }
}

// Équipe : glissement depuis la droite (le bloc est aligné à droite).
function initEquipeSlideRight() {
  const items = gsap.utils.toArray("#equipe .reveal-item");
  if (!items.length) return;
  gsap.set(items, { opacity: 0, x: 44 });
  ScrollTrigger.create({
    trigger: "#equipe",
    start: "top 75%",
    once: true,
    onEnter: () =>
      gsap.to(items, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }),
  });
}

// Chauffage & Climatisation (01) : texte glisse depuis la gauche, la photo
// arrive en scale-up — deux mouvements différents dans la même section.
function initChauffageSlideLeft() {
  const section = document.querySelector("#chauffage-clim");
  if (!section) return;
  const text = section.querySelectorAll(".reveal-item");
  const media = section.querySelector(".service__media");
  gsap.set(text, { opacity: 0, x: -44 });
  if (media) gsap.set(media, { opacity: 0, scale: 0.92 });
  ScrollTrigger.create({
    trigger: section,
    start: "top 72%",
    once: true,
    onEnter: () => {
      gsap.to(text, { opacity: 1, x: 0, duration: 0.85, ease: "power3.out", stagger: 0.1 });
      if (media) gsap.to(media, { opacity: 1, scale: 1, duration: 1, ease: "power3.out", delay: 0.1 });
    },
  });
}

// Plomberie (02) : les deux photos du diptyque se révèlent par un wipe
// clip-path (une depuis la gauche, une depuis la droite), le texte en fade-up.
function initPlomberieClipReveal() {
  const section = document.querySelector("#plomberie");
  if (!section) return;
  const frames = section.querySelectorAll(".diptych__frame img");
  const text = section.querySelectorAll(".reveal-item");

  if (frames[0]) gsap.set(frames[0], { clipPath: "inset(0 100% 0 0)" });
  if (frames[1]) gsap.set(frames[1], { clipPath: "inset(0 0 0 100%)" });
  gsap.set(text, { opacity: 0, y: 24 });

  ScrollTrigger.create({
    trigger: section,
    start: "top 70%",
    once: true,
    onEnter: () => {
      if (frames[0]) gsap.to(frames[0], { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power4.out" });
      if (frames[1]) gsap.to(frames[1], { clipPath: "inset(0 0 0 0%)", duration: 1.1, ease: "power4.out", delay: 0.08 });
      gsap.to(text, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.15 });
    },
  });
}

// Autres prestations (04) : les deux panneaux montent en scale, décalés.
function initAutresPrestationsSlideUp() {
  const panels = gsap.utils.toArray("#autres-prestations .diptych__panel");
  const head = gsap.utils.toArray("#autres-prestations .diptych__head .reveal-item");
  const foot = gsap.utils.toArray("#autres-prestations .diptych__foot .reveal-item");
  if (!panels.length) return;

  gsap.set([...head, ...panels, ...foot], { opacity: 0, y: 36 });
  gsap.set(panels, { scale: 0.95 });

  ScrollTrigger.create({
    trigger: "#autres-prestations",
    start: "top 75%",
    once: true,
    onEnter: () => {
      gsap.to(head, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1 });
      gsap.to(panels, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out", stagger: 0.15, delay: 0.15 });
      gsap.to(foot, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.5 });
    },
  });
}

// Avis client : scale-up centré, pour un effet "citation qui s'ouvre".
function initReviewsScaleUp() {
  const items = gsap.utils.toArray("#avis .reveal-item");
  if (!items.length) return;
  gsap.set(items, { opacity: 0, scale: 0.94, y: 16 });
  ScrollTrigger.create({
    trigger: "#avis",
    start: "top 75%",
    once: true,
    onEnter: () =>
      gsap.to(items, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }),
  });
}
