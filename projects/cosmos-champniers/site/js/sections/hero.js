/* Hero « Le voyage dans le tunnel »
 * 1. Intro (une fois, jamais en jump/reduced) : logo Saturne tracé + planète néon, puis l'image se pose.
 *    Lancée dès l'évaluation de ce script (sans attendre waitFonts de core, ~0,3 s depuis le correctif) ;
 *    register renvoie la même Promise, résolue à la fin de l'intro (core retire body.is-intro).
 * 2. Écran tunnel : Ken Burns CSS + parallaxe souris (pointeur fin, desktop).
 * 3. Pin +=280% : zoom dans le tunnel sur le point de fuite réel, COS/MOS s'écartent,
 *    fondu vers la salle aux planètes qui recule (atterrissage), h1 mot par mot, 0 -> 650 couverts.
 * 4. Sous le pin : le second paragraphe s'allume mot à mot au scroll. */
(function () {
  "use strict";
  const C = window.Cosmos;
  const root = document.getElementById("hero");
  if (!C || !root) return;
  const gsap = window.gsap;
  const cine = !C.reduced && !!gsap && !!window.ScrollTrigger;
  if (cine) root.classList.add("is-cine");

  /* ---------- Intro, démarrée tout de suite ---------- */
  let intro = null, introDone = false;
  if (cine && !C.jump) intro = runIntro();

  function runIntro() {
    const q = (s) => root.querySelector(s);
    const loader = q(".hero__loader");
    if (!loader) return null;
    const html = document.documentElement;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
    html.style.overflow = "hidden"; // verrou natif tant que Lenis n'existe pas encore

    const mark = q(".hero__mark");
    const orbit = q(".hero__mark-orbit");
    const rings = [...root.querySelectorAll(".hero__mark-ring")];
    const planet = q(".hero__mark-planet");
    const img = q(".hero__img");
    const drift = q(".hero__drift");
    const word = q(".hero__word");
    const introEls = [q(".hero__rating"), q(".hero__ctas")];

    loader.classList.add("is-driven");
    gsap.set(drift, { autoAlpha: 0, scale: 1.2 });
    gsap.set(word, { autoAlpha: 0, scale: 1.08 });
    gsap.set(introEls, { autoAlpha: 0, y: 22 });

    const decoded = Promise.race([
      (img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }))
        .then(() => img.decode().catch(() => {})),
      new Promise((r) => setTimeout(r, 2400)),
    ]);

    const drawn = new Promise((r) => {
      gsap.timeline({ onComplete: r })
        .to(orbit, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.1)
        .to(rings, { strokeDashoffset: 0, duration: 0.75, stagger: 0.12, ease: "power2.out" }, 0.4)
        // enseigne néon : 3 grésillements puis allumée
        .add(() => mark.classList.add("is-lit"), 1.15)
        .to(planet, {
          keyframes: [
            { opacity: 0.85, duration: 0.05 }, { opacity: 0.1, duration: 0.07 },
            { opacity: 0.9, duration: 0.05 }, { opacity: 0.25, duration: 0.09 },
            { opacity: 1, duration: 0.12 },
          ],
        }, 1.15);
    });

    return new Promise((resolve) => {
      const finish = () => {
        if (introDone) return;
        introDone = true;
        html.style.overflow = "";
        if (C.lenis) C.lenis.start();
        resolve();
      };
      Promise.all([decoded, drawn]).then(() => {
        gsap.timeline({ delay: 0.1, onComplete: () => { loader.remove(); finish(); } })
          .to(mark, { scale: 1.12, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0)
          .to(loader, { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, 0.2)
          .to(drift, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, 0.2)
          .to(drift, { scale: 1.03, duration: 1.6, ease: "power3.out" }, 0.2)
          .to(word, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power3.out" }, 0.55)
          .to(introEls, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.85)
          .add(finish, 1.35); // nav et scroll rendus pendant que l'image finit de se poser
      });
    });
  }

  /* ---------- Mise en place scroll (appelée par core) ---------- */
  C.register("hero", ({ el, gsap, ScrollTrigger, lenis, reduced, jump }) => {
    const q = (s) => el.querySelector(s);
    const qa = (s) => [...el.querySelectorAll(s)];

    if (!cine || reduced) {
      q(".hero__loader")?.remove();
      return;
    }
    if (!intro) q(".hero__loader")?.remove();
    else if (!introDone && lenis) lenis.stop();

    const isMobile = () => matchMedia("(max-width: 760px)").matches;

    /* Points focaux mesurés sur les photos (fractions de l'image) :
       tunnel-render (1:1) fond de l'arche ≈ 50 % / 49 % ; tunnel-reel (3:4) mur du fond ≈ 56 % / 57 % */
    const FOCAL = {
      tunnel: { d: { x: 0.5, y: 0.49, ar: 1 }, m: { x: 0.56, y: 0.57, ar: 1200 / 1600 } },
      land: { d: { x: 0.5, y: 0.5, ar: 1 }, m: { x: 0.38, y: 0.42, ar: 1200 / 900 } },
    };
    // Position du point focal dans la boîte d'une <img> object-fit: cover
    function originFor(img, f) {
      const W = img.clientWidth || innerWidth, H = img.clientHeight || innerHeight;
      const op = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      const s = Math.max(W / f.ar, H);
      const dw = f.ar * s, dh = s;
      const ox = (W - dw) * (op[0] ?? 0.5) + f.x * dw;
      const oy = (H - dh) * (op[1] ?? 0.5) + f.y * dh;
      return `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
    }

    const pin = q(".hero__pin");
    const nav = document.querySelector(".nav");
    const tunnel = q(".hero__screen--tunnel");
    const cam = q(".hero__cam");
    const drift = q(".hero__drift");
    const img = q(".hero__img");
    const word = q(".hero__word");
    const halfL = q(".hero__half--l");
    const halfR = q(".hero__half--r");
    const ui = q(".hero__ui");
    const land = q(".hero__screen--land");
    const landCam = q(".hero__land-cam");
    const landImg = q(".hero__land-img");
    const title = q(".hero__title");
    const text = q(".hero__text");
    const count = q(".hero__count");

    function setOrigins() {
      const t = originFor(img, isMobile() ? FOCAL.tunnel.m : FOCAL.tunnel.d);
      gsap.set([cam, drift], { transformOrigin: t });
      img.style.setProperty("--kb-origin", t);
      gsap.set(landCam, { transformOrigin: originFor(landImg, isMobile() ? FOCAL.land.m : FOCAL.land.d) });
    }
    setOrigins();
    ScrollTrigger.addEventListener("refreshInit", setOrigins);

    /* Split du h1 en mots (le texte reste identique dans le DOM) */
    title.innerHTML = title.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
    const words = qa(".hero__title .w > span");
    // paragraphe mot à mot (apparition floutée, décalée)
    text.innerHTML = text.textContent.trim().split(/\s+/).map((w) => `<span class="tw">${w}</span>`).join(" ");
    const tws = qa(".hero__text .tw");
    const countN = q(".hero__count-n"), countBar = q(".hero__count-bar"), countL = q(".hero__count-l");
    // compteur déroulant : chaque chiffre est une bande 0-9 (deux tours) qui roule jusqu'à sa valeur
    const digits = countN.textContent.trim().split("");
    countN.setAttribute("aria-label", countN.textContent.trim());
    countN.innerHTML = '<span class="odo-row">' + digits.map(() => `<span class="odo" aria-hidden="true"><span class="odo__strip">${"01234567890123456789".split("").map((d) => `<span>${d}</span>`).join("")}</span></span>`).join("") + "</span>";
    const strips = qa(".hero__count-n .odo__strip");
    // chaque colonne prend la largeur de SON chiffre final (Marcellus n'a pas de chiffres à chasse fixe)
    const fitOdo = () => strips.forEach((st, i) => {
      const fs = parseFloat(getComputedStyle(countN).fontSize);
      const w = st.children[10 + +digits[i]].getBoundingClientRect().width;
      if (fs && w) st.parentElement.style.width = `${(w / fs).toFixed(3)}em`;
    });
    fitOdo();
    document.fonts?.ready.then(fitOdo);

    /* Timeline scrubée du pin */
    if (!intro) gsap.set(drift, { scale: 1.03 }); // marge pour la parallaxe (l'intro finit à 1.03)
    const spread = () => innerWidth * (isMobile() ? 0.75 : 0.55);
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: () => "+=" + Math.round(innerHeight * 2.8),
        pin: true,
        anticipatePin: 1,
        scrub: jump ? true : 1,
        invalidateOnRefresh: true,
      },
      // la nav s'efface pendant le voyage dans le tunnel et revient à l'atterrissage (classe CSS + transition,
      // pas de tween d'opacité : il enregistrerait l'état masqué de l'intro)
      onUpdate() { if (nav) nav.classList.toggle("is-away", this.time() > 0.2 && this.time() < 5.3); },
    })
      // l'UI s'en va vite
      .to(ui, { autoAlpha: 0, y: 32, duration: 0.7, ease: "power1.in" }, 0)

      // la caméra avance dans le tunnel, en accélérant
      .fromTo(cam, { scale: 1 }, { scale: 3.4, duration: 5.8, ease: "power1.in" }, 0)
      // on passe entre les lettres
      .fromTo(halfL, { x: 0, scale: 1 }, { x: () => -spread(), scale: 1.35, duration: 3.4, ease: "power2.in" }, 0.15)
      .fromTo(halfR, { x: 0, scale: 1 }, { x: () => spread(), scale: 1.35, duration: 3.4, ease: "power2.in" }, 0.15)
      .to([halfL, halfR], { autoAlpha: 0, duration: 1.4, ease: "power1.in" }, 2.1)
      // bout du tunnel : fondu vers la salle qui arrive zoomée puis recule (atterrissage)
      // le tunnel s'éteint dans son fond sombre, puis la salle s'allume (chevauchement court : pas de double exposition)
      .to(tunnel, { autoAlpha: 0, duration: 0.75, ease: "power1.in" }, 4.5)
      .fromTo(land, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: "power1.out" }, 5.05)
      .fromTo(landCam, { scale: 1.1 }, { scale: 1, duration: 3, ease: "power2.out" }, 5.05) // zoom léger : la source (1707px) devient floue au-delà
      // titre mot par mot (masque + translation)
      .fromTo(words, { yPercent: 115, rotation: 5, opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 6.3)
      .fromTo(tws, { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.025, ease: "power2.out" }, 7.2)
      .set(count, { autoAlpha: 1 }, 7.3)
      .fromTo(countN, { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power2.out" }, 7.3)
      .fromTo(strips, { yPercent: 0 }, { yPercent: (i) => -(10 + +digits[i]) * 5, duration: 1.4, stagger: 0.12, ease: "power3.out" }, 7.3)
      .fromTo(countBar, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 7.6)
      .fromTo(countL, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, 7.9)
      .to({}, { duration: 1 }, 8.9); // tenue finale avant de libérer le pin

    /* Sous le pin : le paragraphe s'allume au scroll */
    const after = q(".hero__after-text");
    after.innerHTML = after.textContent.trim().split(/\s+/).map((w) => `<span class="aw">${w}</span>`).join(" ");
    const aws = qa(".hero__after-text .aw");
    gsap.set(aws, { opacity: 0.18 }); // état initial explicite (le rendu immédiat d'un fromTo staggeré autonome ne tient pas)
    gsap.timeline({
      scrollTrigger: { trigger: after, start: "top 85%", end: "bottom 55%", scrub: jump ? true : 0.6, invalidateOnRefresh: true },
    }).to(aws, { opacity: 1, ease: "none", duration: 0.5, stagger: 0.05 });

    /* Parallaxe souris (desktop, pointeur fin) : image et wordmark en sens inverse */
    if (matchMedia("(pointer: fine) and (min-width: 761px)").matches) {
      const o = { duration: 1.4, ease: "power3" };
      const dx = gsap.quickTo(drift, "x", o), dy = gsap.quickTo(drift, "y", o);
      const wx = gsap.quickTo(word, "x", o), wy = gsap.quickTo(word, "y", o);
      addEventListener("pointermove", (e) => {
        if (scrollY > innerHeight * 3) return;
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        dx(-nx * 16); dy(-ny * 10);
        wx(nx * 22); wy(ny * 12);
      }, { passive: true });
    }

    return intro || undefined;
  });
})();
