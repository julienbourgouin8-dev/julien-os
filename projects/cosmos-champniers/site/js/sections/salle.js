/* Section Salle : carrousel coverflow en boucle (drag souris/tactile avec inertie, flèches,
 * clavier, trackpad), entrée au scroll depuis la droite en perspective, lightbox FLIP. */
Cosmos.register("salle", ({ el, gsap, ScrollTrigger, reduced, jump }) => {
  const region = el.querySelector(".sl-carousel");
  const slides = [...el.querySelectorAll(".sl-slide")];
  const N = slides.length;
  if (!region || !N) return;
  const items = slides.map((b) => ({
    b, media: b.querySelector(".sl-slide__media"), img: b.querySelector("img"),
    shade: b.querySelector(".sl-slide__shade"),
    caption: b.dataset.caption, name: b.dataset.img, w: b.dataset.w,
  }));
  const capEl = el.querySelector("[data-sl-caption]"), countEl = el.querySelector("[data-sl-count]");
  const pad = (n) => String(n).padStart(2, "0");
  const mod = (n) => ((n % N) + N) % N;
  const wrap = (d) => { d = mod(d + N / 2) - N / 2; return d; }; // [-N/2, N/2)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const P = { pos: 0 };            // position flottante du carrousel (index)
  const E = { enter: reduced ? 1 : 0 }; // progression de l'entrée au scroll
  let lbOpen = false;
  let S = 0, VW = innerWidth, dirty = true, visible = false, active = -1, hiddenIdx = -1;
  let isMobile = matchMedia("(max-width: 760px)").matches;

  function measure() {
    VW = innerWidth;
    isMobile = matchMedia("(max-width: 760px)").matches;
    S = slides[0].offsetWidth * (isMobile ? 0.9 : 0.98);
    dirty = true;
  }

  function render() {
    dirty = false;
    for (let i = 0; i < N; i++) {
      const it = items[i];
      const d = wrap(i - P.pos), ad = Math.abs(d);
      // entrée : les slides de droite arrivent un peu après, depuis la droite, pivotées
      const delay = clamp((d + 2) / 5, 0, 1) * 0.45;
      const e = clamp((E.enter - delay) / 0.55, 0, 1);
      const ee = 1 - Math.pow(1 - e, 3);
      const vis = ad < 3.2 && e > 0.001;
      it.b.style.visibility = vis ? "visible" : "hidden";
      if (!vis) continue;
      const sc = 1 - 0.24 * Math.min(ad, 1) - 0.1 * clamp(ad - 1, 0, 1.2);
      const x = d * S + Math.sign(d) * clamp(ad - 1, 0, 2) * S * -0.08 + (1 - ee) * VW * 0.85;
      const ry = clamp(-d * 9, -20, 20) - (1 - ee) * 40;
      const z = -Math.min(ad, 2.5) * 70 - (1 - ee) * 240;
      it.b.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      it.b.style.zIndex = String(100 - Math.round(ad * 10));
      it.b.style.opacity = String(ee);
      it.shade.style.opacity = String(Math.min(Math.min(ad, 1.3) * 0.72 + (1 - ee) * 0.4, 0.88));
      if (!reduced) it.img.style.transform = `translateX(${(clamp(d, -1.6, 1.6) * -6).toFixed(2)}%)`;
    }
    const idx = mod(Math.round(P.pos));
    if (idx !== active) setActive(idx);
  }

  function setActive(idx) {
    const firstTime = active === -1;
    active = idx;
    items.forEach((it, i) => {
      it.b.classList.toggle("is-active", i === idx);
      it.b.tabIndex = i === idx ? 0 : -1;
    });
    countEl.textContent = `${pad(idx + 1)} / ${pad(N)}`;
    if (firstTime || reduced) { capEl.textContent = items[idx].caption; return; }
    gsap.killTweensOf(capEl);
    gsap.to(capEl, {
      opacity: 0, y: -8, duration: 0.15, ease: "power2.in",
      onComplete: () => { capEl.textContent = items[active].caption; gsap.fromTo(capEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }); },
    });
  }

  const mark = () => (dirty = true);
  gsap.ticker.add(() => { if (dirty && (visible || lbOpen)) render(); });

  /* ---------- Navigation ---------- */
  let snapTw = null;
  function toPos(target, dur = 0.9) {
    snapTw && snapTw.kill();
    if (reduced || dur === 0) { P.pos = target; mark(); return; }
    snapTw = gsap.to(P, { pos: target, duration: dur, ease: "power3.out", onUpdate: mark });
  }
  function goTo(i, dur) {
    const base = Math.round(P.pos);
    toPos(base + wrap(i - mod(base)), dur);
  }
  const step = (dir) => toPos(Math.round(P.pos) + dir);

  el.querySelector("[data-sl-prev]").addEventListener("click", () => step(-1));
  el.querySelector("[data-sl-next]").addEventListener("click", () => step(1));
  region.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });

  /* Drag souris + tactile avec inertie */
  let down = false, dragging = false, sx = 0, sy = 0, startPos = 0, pid = null, samples = [], suppressClick = false;
  region.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || lbOpen) return;
    down = true; dragging = false; sx = e.clientX; sy = e.clientY; startPos = P.pos; pid = e.pointerId;
    samples = [{ x: e.clientX, t: performance.now() }];
  });
  region.addEventListener("pointermove", (e) => {
    if (!down || e.pointerId !== pid) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { down = false; return; } // geste vertical : on laisse scroller
      dragging = true; snapTw && snapTw.kill();
      region.setPointerCapture(pid);
      region.classList.add("is-dragging");
    }
    P.pos = startPos - dx / S; mark();
    const t = performance.now();
    samples.push({ x: e.clientX, t });
    while (samples.length > 2 && t - samples[0].t > 90) samples.shift();
  });
  const release = (e) => {
    if (!down || (e && e.pointerId !== pid)) return;
    down = false;
    if (!dragging) return;
    dragging = false; suppressClick = true;
    region.classList.remove("is-dragging");
    const a = samples[0], b = samples[samples.length - 1];
    const v = b && a && b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0; // px/ms
    const throwD = reduced ? 0 : clamp((-v * 320) / S, -3, 3);
    const target = Math.round(P.pos + throwD);
    toPos(target, clamp(0.7 + Math.abs(target - P.pos) * 0.18, 0.7, 1.4));
    setTimeout(() => (suppressClick = false), 0);
  };
  region.addEventListener("pointerup", release);
  region.addEventListener("pointercancel", release);
  region.addEventListener("dragstart", (e) => e.preventDefault());

  /* Trackpad : défilement horizontal */
  let wheelT = null;
  region.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || lbOpen) return;
    e.preventDefault();
    snapTw && snapTw.kill();
    P.pos += e.deltaX / S; mark();
    clearTimeout(wheelT);
    wheelT = setTimeout(() => toPos(Math.round(P.pos), 0.6), 120);
  }, { passive: false });

  /* Clic : voisine -> on y va ; active -> plein écran */
  slides.forEach((b, i) => {
    b.addEventListener("click", (e) => {
      if (suppressClick) { e.preventDefault(); return; }
      if (i === active) open(i); else goTo(i);
    });
  });

  /* ---------- Entrée au scroll ---------- */
  ScrollTrigger.create({
    trigger: region, start: "top bottom+=600", end: "bottom top-=200",
    onToggle: (self) => { visible = self.isActive; if (visible) mark(); },
    onEnter: () => items.forEach((it) => (it.img.loading = "eager")),
    onEnterBack: () => items.forEach((it) => (it.img.loading = "eager")),
  });
  if (!reduced) {
    gsap.to(E, {
      enter: 1, ease: "none", onUpdate: mark,
      scrollTrigger: { trigger: region, start: "top 92%", end: "top 30%", scrub: jump ? true : 1, invalidateOnRefresh: true },
    });
  }
  ScrollTrigger.addEventListener("refresh", measure);
  addEventListener("resize", measure);
  measure(); render();

  /* ---------- Lightbox ---------- */
  const lb = el.querySelector(".sl-lb"), bg = lb.querySelector(".sl-lb__bg"), frame = lb.querySelector(".sl-lb__frame");
  const layers = [...lb.querySelectorAll(".sl-lb__layer")].map((l) => ({ l, pan: l.querySelector(".sl-lb__pan"), img: l.querySelector("img") }));
  const ui = lb.querySelector(".sl-lb__ui"), lbCap = lb.querySelector("[data-lb-caption]"), lbCount = lb.querySelector("[data-lb-count]");
  const btnClose = lb.querySelector("[data-lb-close]");
  let lbIdx = 0, cur = 0, busy = false, zoomTw = null, lastFocus = null;

  function fill(layer, i) {
    const it = items[i];
    layer.img.sizes = "100vw";
    layer.img.srcset = `assets/img/${it.name}-sm.webp 1000w, assets/img/${it.name}.webp ${it.w}w`;
    layer.img.src = `assets/img/${it.name}.webp`;
    layer.img.alt = it.img.alt;
    return Promise.race([layer.img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 700))]);
  }
  function setCap(i) { lbCap.textContent = items[i].caption; lbCount.textContent = `${pad(i + 1)} / ${pad(N)}`; }
  function startZoom(layer) {
    zoomTw && zoomTw.kill();
    if (reduced) return;
    zoomTw = gsap.fromTo(layer.img, { scale: 1 }, { scale: 1.12, duration: 16, ease: "none" });
  }
  function hideSource(i) {
    if (hiddenIdx > -1) items[hiddenIdx].media.style.opacity = "";
    hiddenIdx = i;
    if (i > -1) items[i].media.style.opacity = "0";
  }
  function lockScroll(on) {
    if (Cosmos.lenis) on ? Cosmos.lenis.stop() : Cosmos.lenis.start();
    document.documentElement.style.overflow = on ? "hidden" : "";
  }
  // géométrie FLIP : la slide (rect r) vue depuis le cadre plein écran (rect F)
  function flipFrom(r, F) {
    const s = Math.max(r.width / F.width, r.height / F.height);
    return {
      clip: `inset(${r.top - F.top}px ${F.right - r.right}px ${F.bottom - r.bottom}px ${r.left - F.left}px round 28px)`,
      x: r.left + r.width / 2 - (F.left + F.width / 2), y: r.top + r.height / 2 - (F.top + F.height / 2), s,
    };
  }

  async function open(i) {
    if (lbOpen || busy) return;
    lbOpen = true; busy = true; lbIdx = i; lastFocus = items[i].b;
    lockScroll(true);
    const L = layers[cur], O = layers[1 - cur];
    gsap.set(O.l, { autoAlpha: 0 });
    gsap.set(L.l, { autoAlpha: 1, xPercent: 0, clipPath: "inset(0px 0px 0px 0px round 0px)" });
    gsap.set(L.img, { scale: 1 });
    lb.hidden = false;
    setCap(i);
    await fill(L, i);
    if (reduced) {
      gsap.set([bg, ui], { opacity: 1 }); gsap.set(L.pan, { x: 0, y: 0, scale: 1 });
      busy = false; btnClose.focus(); return;
    }
    const f = flipFrom(items[i].media.getBoundingClientRect(), frame.getBoundingClientRect());
    hideSource(i);
    gsap.set(ui, { opacity: 0 });
    gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" });
    gsap.fromTo(L.l, { clipPath: f.clip }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1.05, ease: "expo.inOut" });
    gsap.fromTo(L.pan, { x: f.x, y: f.y, scale: f.s }, {
      x: 0, y: 0, scale: 1, duration: 1.05, ease: "expo.inOut",
      onComplete: () => { busy = false; },
    });
    startZoom(L);
    gsap.to(ui, { opacity: 1, duration: 0.6, delay: 0.7, ease: "power2.out" });
    btnClose.focus({ preventScroll: true });
  }

  function close() {
    if (!lbOpen || busy) return;
    busy = true;
    const L = layers[cur];
    const done = () => {
      lb.hidden = true; hideSource(-1); zoomTw && zoomTw.kill();
      gsap.set([L.pan, L.img], { clearProps: "transform" });
      lbOpen = false; busy = false; lockScroll(false);
      (items[lbIdx].b || lastFocus).focus({ preventScroll: true });
    };
    if (reduced) { done(); return; }
    render(); // carrousel déjà synchronisé sur lbIdx
    const f = flipFrom(items[lbIdx].media.getBoundingClientRect(), frame.getBoundingClientRect());
    hideSource(lbIdx);
    zoomTw && zoomTw.kill();
    gsap.to(ui, { opacity: 0, duration: 0.25 });
    gsap.to(bg, { opacity: 0, duration: 0.7, delay: 0.25, ease: "power2.inOut" });
    gsap.to(L.img, { scale: 1, duration: 0.9, ease: "expo.inOut" });
    gsap.to(L.l, { clipPath: f.clip, duration: 0.9, ease: "expo.inOut" });
    gsap.to(L.pan, { x: f.x, y: f.y, scale: f.s, duration: 0.9, ease: "expo.inOut", onComplete: done });
  }

  async function lbStep(dir) {
    if (!lbOpen || busy) return;
    busy = true;
    const next = mod(lbIdx + dir);
    const A = layers[cur], B = layers[1 - cur];
    await fill(B, next);
    lbIdx = next; cur = 1 - cur;
    goTo(next, 0); render(); // carrousel suit, invisible derrière
    const swapCap = () => setCap(next);
    if (reduced) {
      gsap.set(A.l, { autoAlpha: 0 }); gsap.set(B.l, { autoAlpha: 1, xPercent: 0, clipPath: "inset(0px 0px 0px 0px round 0px)" });
      gsap.set(B.pan, { x: 0, y: 0, scale: 1 }); swapCap(); busy = false; return;
    }
    gsap.set(B.l, { autoAlpha: 1, xPercent: 0, zIndex: 2, clipPath: dir > 0 ? "inset(0px 0px 0px 100%)" : "inset(0px 100% 0px 0px)" });
    gsap.set(A.l, { zIndex: 1 });
    gsap.set(B.pan, { x: 0, y: 0, scale: 1, xPercent: 18 * dir });
    startZoom(B);
    gsap.to(lbCap, { opacity: 0, y: -10, duration: 0.2, onComplete: () => { swapCap(); gsap.to(lbCap, { opacity: 1, y: 0, duration: 0.5, delay: 0.35, ease: "power3.out" }); } });
    gsap.to(A.l, { xPercent: -28 * dir, duration: 1, ease: "expo.inOut" });
    gsap.to(B.pan, { xPercent: 0, duration: 1, ease: "expo.inOut" });
    gsap.to(B.l, {
      clipPath: "inset(0px 0px 0px 0%)", duration: 1, ease: "expo.inOut",
      onComplete: () => { gsap.set(A.l, { autoAlpha: 0, xPercent: 0 }); gsap.set(B.l, { clipPath: "inset(0px 0px 0px 0px round 0px)" }); busy = false; },
    });
  }

  btnClose.addEventListener("click", close);
  lb.querySelector("[data-lb-prev]").addEventListener("click", () => lbStep(-1));
  lb.querySelector("[data-lb-next]").addEventListener("click", () => lbStep(1));
  bg.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (!lbOpen) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); lbStep(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); lbStep(-1); }
    else if (e.key === "Tab") { // piège de focus dans la lightbox
      const f = [...lb.querySelectorAll("button")];
      const k = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  // swipe dans la lightbox (mobile)
  let lsx = null;
  frame.addEventListener("pointerdown", (e) => (lsx = e.clientX));
  frame.addEventListener("pointerup", (e) => {
    if (lsx === null) return;
    const dx = e.clientX - lsx; lsx = null;
    if (Math.abs(dx) > 40) lbStep(dx < 0 ? 1 : -1);
  });
});
