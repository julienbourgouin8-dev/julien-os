/* Cosmos — moteur partagé. Propriété du thread principal : les agents NE MODIFIENT PAS ce fichier.
 *
 * API pour les sections (js/sections/<id>.js) :
 *   Cosmos.register("<id>", (ctx) => { ... })   // appelé une fois, dans l'ORDRE DU DOM des sections
 *     ctx = { el, gsap, ScrollTrigger, lenis, reduced, mobile, data, jump }
 *     - el : la <section data-section="<id>"> (return tôt si absente : la fonction n'est pas appelée)
 *     - reduced : prefers-reduced-motion -> afficher l'état final, ne créer aucune animation
 *     - jump : true si ?jump=<y> (capture de vérif) -> pas d'intro, état figé
 *     - peut retourner une Promise (ex. intro du hero) : core l'attend avant refresh + __ready
 *   body.is-intro (nav masquée) est retiré par core quand toutes les Promises des sections sont
 *   résolues -> le hero DOIT retourner une Promise qui se résout à la fin de son intro.
 *   Retiré immédiatement si jump ou reduced.
 *   Cosmos.openReservation()  / tout élément [data-resa] -> événement "cosmos:resa-open" sur document
 *   [data-live-status] -> rempli avec le statut en direct (Ouvert · ce midi 20,90 €), classe .is-open
 *   [data-live-price]  -> prix du service en cours ou du prochain
 *   Cosmos.lenis.stop()/start() pour verrouiller le scroll (panneau résa, lightbox)
 *
 * Contrat de vérif (engine-recipes.md) : ?jump=<scrollY> charge la page scrollée, état figé,
 * puis window.__ready = true.
 */
(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  const JUMP = params.get("jump");
  if (JUMP !== null) history.scrollRestoration = "manual";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 760px)").matches;
  const registry = [];

  const Cosmos = (window.Cosmos = {
    reduced, mobile, jump: JUMP !== null, lenis: null,
    register(id, fn) { registry.push({ id, fn }); },
    openReservation(detail) { document.dispatchEvent(new CustomEvent("cosmos:resa-open", { detail })); },
    scrollTo(target) {
      if (Cosmos.lenis) Cosmos.lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else (typeof target === "string" ? document.querySelector(target) : target)?.scrollIntoView();
    },
  });

  document.documentElement.classList.add("js");

  // Attend Marcellus + Karla réellement chargées (document.fonts.load), plafond 2,5 s.
  // (link.sheet est illisible sur une feuille Google Fonts cross-origin : ne pas s'y fier.)
  function waitFonts() {
    const want = Promise.all(["400 1em Marcellus", "400 1em Karla", "600 1em Karla"].map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready).catch(() => {});
    return Promise.race([want, new Promise((r) => setTimeout(r, 2500))]);
  }

  function liveStatus() {
    const D = window.COSMOS_DATA; if (!D) return;
    const s = D.status();
    document.querySelectorAll("[data-live-status]").forEach((el) => {
      el.textContent = s.headline;
      el.classList.add("live-status");
      el.classList.toggle("is-open", s.open);
    });
    document.querySelectorAll("[data-live-price]").forEach((el) => (el.textContent = s.priceLabel));
    return s;
  }

  function wireGlobal() {
    document.addEventListener("click", (e) => {
      const r = e.target.closest("[data-resa]");
      if (r) { e.preventDefault(); document.body.classList.remove("menu-open"); Cosmos.openReservation({ service: r.dataset.resa || null }); return; }
      const a = e.target.closest('a[href^="#"]');
      if (a && a.getAttribute("href").length > 1) {
        const t = document.querySelector(a.getAttribute("href"));
        if (t) { e.preventDefault(); document.body.classList.remove("menu-open"); Cosmos.scrollTo(t); }
      }
      if (e.target.closest(".nav__burger")) document.body.classList.toggle("menu-open");
    });
    // Repli si aucun panneau résa n'est chargé (ex. page sans la section) : lien vers le module actuel
    document.addEventListener("cosmos:resa-open", () => {
      setTimeout(() => { if (!document.body.classList.contains("resa-open") && !window.__resaMounted) location.href = "https://booking.cosmos-tech.fr"; }, 50);
    });

    const nav = document.querySelector(".nav");
    if (nav) {
      // Nav toujours visible (jamais masquée au scroll) et sans bande de fond : choix de Julien, 2026-09-28
      const onScroll = (y) => { nav.classList.toggle("is-scrolled", y > 40); };
      Cosmos._onScroll = onScroll;
      addEventListener("scroll", () => onScroll(scrollY), { passive: true });
    }
  }

  async function boot() {
    liveStatus();
    setInterval(liveStatus, 60000);
    wireGlobal();

    const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (!reduced && window.Lenis && JUMP === null) {
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
      Cosmos.lenis = lenis;
      document.documentElement.classList.add("lenis");
      if (ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    await waitFonts();

    const pending = [];
    const sections = [...document.querySelectorAll("[data-section]")];
    // ordre du DOM, puis les enregistrements sans section (ex. panneau résa global)
    const ordered = [
      ...sections.map((el) => ({ el, entry: registry.find((r) => r.id === el.dataset.section) })).filter((x) => x.entry),
      ...registry.filter((r) => !sections.some((el) => el.dataset.section === r.id)).map((entry) => ({ el: document.getElementById(entry.id), entry })).filter((x) => x.el),
    ];
    for (const { el, entry } of ordered) {
      try {
        const res = entry.fn({ el, gsap, ScrollTrigger, lenis: Cosmos.lenis, reduced, mobile, data: window.COSMOS_DATA, jump: JUMP !== null });
        if (res && typeof res.then === "function") pending.push(res);
      } catch (err) { console.error(`[cosmos] section ${entry.id}`, err); }
    }

    // images au-dessus du pli décodées avant __ready
    await Promise.all([...document.images].filter((i) => i.loading !== "lazy").map((i) => (i.complete ? null : i.decode().catch(() => {}))));
    if (JUMP !== null) await Promise.all(pending.map((p) => Promise.race([p, new Promise((r) => setTimeout(r, 4000))])));

    const endIntro = () => document.body.classList.remove("is-intro");
    if (JUMP !== null || reduced) endIntro();
    else Promise.all(pending).then(endIntro, endIntro);

    ScrollTrigger && ScrollTrigger.refresh();
    if (JUMP !== null) {
      window.scrollTo(0, +JUMP || 0);
      ScrollTrigger && ScrollTrigger.update();
      Cosmos._onScroll && Cosmos._onScroll(scrollY);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.__ready = true;
    document.dispatchEvent(new Event("cosmos:ready"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
