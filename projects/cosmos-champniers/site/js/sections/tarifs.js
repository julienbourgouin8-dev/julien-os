/* Section Tarifs : 3 cartes adultes en éventail (scrubé), tarif du moment en orbite, tilt + lumière au survol. */
Cosmos.register("tarifs", ({ el, gsap, ScrollTrigger, reduced, jump, data }) => {
  const $ = (s) => el.querySelector(s);
  const cards = [...el.querySelectorAll(".tf-card")];

  function paint() {
    const s = data.status();
    if (!s) return;
    cards.forEach((c) => {
      const on = c.dataset.tier === s.tier.key;
      c.classList.toggle("is-now", on);
      c.querySelector("[data-tf-badge]").textContent = s.open ? "En ce moment" : "Prochain service";
      if (on) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
    });
  }
  paint();
  setInterval(paint, 60000);

  /* ---------- Ciel : parallaxe lente de la planète + étoiles ---------- */
  const skyImg = $(".tf-sky__img");
  if (!reduced) {
    gsap.fromTo(skyImg, { yPercent: -5, scale: 1.2 }, {
      yPercent: 5, scale: 1.1, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    });
  }

  const cv = $(".tf-sky__stars"), g = cv.getContext("2d");
  let W = 0, H = 0, stars = [], running = false, progress = 0;
  function sizeSky() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(140, Math.min(360, Math.round((W * H) / 4200)));
    stars = Array.from({ length: n }, () => {
      const big = Math.random() < 0.08;
      return {
        x: Math.random() * W, y: Math.random() * H,
        r: big ? 1.1 + Math.random() * 0.9 : 0.35 + Math.random() * 0.75,
        a: 0.25 + Math.random() * 0.6, tw: 0.4 + Math.random() * 1.8, ph: Math.random() * 6.283,
        z: 0.2 + Math.random(), blue: Math.random() < 0.25,
      };
    });
  }
  function drawSky(t) {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    for (const s of stars) {
      // dérive lente vers le haut + parallaxe au scroll selon la profondeur
      let y = (s.y - t * 4 * s.z - progress * H * 0.35 * s.z) % H;
      if (y < 0) y += H;
      const x = (s.x + t * 1.2 * s.z) % W;
      const a = reduced ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph));
      g.fillStyle = s.blue ? `rgba(95,200,255,${a})` : `rgba(238,243,248,${a})`;
      if (s.r < 0.9) g.fillRect(x, y, s.r * 1.6, s.r * 1.6);
      else { g.beginPath(); g.arc(x, y, s.r, 0, 6.283); g.fill(); }
    }
  }
  sizeSky(); drawSky(0);
  ScrollTrigger.create({
    trigger: el, start: "top bottom", end: "bottom top",
    onToggle: (self) => (running = self.isActive),
    onUpdate: (self) => { progress = self.progress; if (reduced) drawSky(0); },
    onRefresh: () => { sizeSky(); drawSky(gsap.ticker.time); },
  });
  if (!reduced) gsap.ticker.add((t) => { if (running && !document.hidden) drawSky(t); });

  /* ---------- Entrée : les cartes partent empilées au centre et s'ouvrent en éventail ---------- */
  const deck = $(".tf-deck");
  if (!reduced && !jump) {
    gsap.matchMedia().add({ desk: "(min-width: 1001px)", mob: "(max-width: 1000px)" }, (ctx) => {
      if (ctx.conditions.desk) {
        const mid = (cards.length - 1) / 2;
        const tl = gsap.timeline({ scrollTrigger: { trigger: deck, start: "top 92%", end: "center 55%", scrub: 0.8, invalidateOnRefresh: true } });
        cards.forEach((c, i) => {
          const k = i - mid;
          tl.fromTo(c,
            { x: () => deck.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2), y: 80 + Math.abs(k) * 10, rotation: k * 7, scale: 0.86, opacity: 0.2 },
            { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, ease: "power2.inOut", duration: 1 }, Math.abs(k) * 0.06);
        });
        tl.fromTo($(".tf-kids"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.6);
      } else {
        [...cards, $(".tf-kids")].forEach((c) => gsap.from(c, {
          y: 60, rotationX: 12, opacity: 0, duration: 1, ease: "power3.out", clearProps: "transform,opacity",
          scrollTrigger: { trigger: c, start: "top 88%", once: true },
        }));
      }
    });
  }

  /* ---------- Survol : inclinaison 3D + lumière qui suit le curseur ---------- */
  if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    cards.forEach((c) => {
      const inn = c.querySelector(".tf-card__in");
      const rx = gsap.quickTo(inn, "rotationX", { duration: 0.7, ease: "power3.out" });
      const ry = gsap.quickTo(inn, "rotationY", { duration: 0.7, ease: "power3.out" });
      const lift = gsap.quickTo(inn, "y", { duration: 0.7, ease: "power3.out" });
      gsap.set(inn, { transformPerspective: 900 });
      c.addEventListener("pointermove", (e) => {
        const r = inn.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        inn.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        inn.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        ry((px - 0.5) * 12); rx(-(py - 0.5) * 12); lift(-10);
      });
      c.addEventListener("pointerleave", () => { rx(0); ry(0); lift(0); });
    });
  }
});
