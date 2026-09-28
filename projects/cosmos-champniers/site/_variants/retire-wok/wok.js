/* #wok — écran coupé épinglé (desktop) / empilement révélé au scroll (mobile).
 * Desktop : la section est épinglée ~3 écrans. À gauche, les 3 chapitres s'allument l'un après l'autre ;
 *   à droite, l'image suivante monte par volet (clip-path bas -> haut) pendant que la précédente recule
 *   légèrement. Chapitre 3 = deux images (sushi-saumon puis sashimis).
 * Mobile : chaque chapitre porte son image, révélée par volet au scroll (scrub), trait de chapitre qui se trace.
 * Reduced : tout visible, statique (mode empilé, aucune animation). */
Cosmos.register("wok", ({ el, gsap, ScrollTrigger, reduced, jump }) => {
  if (reduced || !gsap || !ScrollTrigger) return;

  const shots = [...el.querySelectorAll(".wk-shot")];
  const chs = [...el.querySelectorAll(".wk-ch")];
  const cur = el.querySelector(".wk-count__cur");
  const mm = gsap.matchMedia();

  /* ---------------- Desktop : écran coupé ---------------- */
  mm.add("(min-width: 761px)", () => {
    el.classList.add("is-split");
    ScrollTrigger.create({
      trigger: el, start: "top 250%", once: true,
      onEnter: () => shots.forEach((f) => { const img = f.querySelector("img"); img.loading = "eager"; img.decode && img.decode().catch(() => {}); }),
    });

    const WIPE = 0.55;
    const starts = [0.45, 1.45, 2.45]; // volets vers shots[1], [2], [3]
    const TOTAL = 3.3;
    const chapterAt = (t) => (t < starts[0] + 0.15 + WIPE / 2 ? 0 : t < starts[1] + 0.15 + WIPE / 2 ? 1 : 2);
    let lastCh = -1;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => "+=" + innerHeight * 2.6,
        pin: true,
        anticipatePin: 1,
        scrub: jump ? true : 0.9,
        invalidateOnRefresh: true,
      },
      onUpdate() {
        const c = chapterAt(this.time());
        if (c !== lastCh) { cur.textContent = "0" + (c + 1); lastCh = c; }
      },
    });

    // première image : lent recul pendant qu'on lit le chapitre 1
    tl.fromTo(shots[0].querySelector("img"), { scale: 1.08 }, { scale: 1, duration: starts[0] + WIPE }, 0);

    starts.forEach((t, i) => {
      const next = shots[i + 1], prev = shots[i];
      tl.fromTo(next, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: WIPE, ease: "power2.inOut" }, t)
        .fromTo(next.querySelector("img"), { scale: 1.16, yPercent: 6 }, { scale: 1.02, yPercent: 0, duration: WIPE + 0.35, ease: "power2.out" }, t)
        .to(prev.querySelector("img"), { yPercent: -7, duration: WIPE, ease: "power2.inOut" }, t);
    });

    // chapitres : celui qui s'allume, celui qui s'éteint (sortie plus rapide que l'entrée)
    [[0, 1, starts[0]], [1, 2, starts[1]]].forEach(([from, to, t]) => {
      const a = chs[from], b = chs[to];
      tl.to([a.querySelector(".wk-ch__t"), a.querySelector(".wk-ch__n")], { opacity: 0.3, duration: 0.18 }, t + 0.12)
        .to(a.querySelector(".wk-ch__bar"), { scaleX: 0, transformOrigin: "right center", duration: 0.2 }, t + 0.12)
        .fromTo([b.querySelector(".wk-ch__t"), b.querySelector(".wk-ch__n")], { opacity: 0.3 }, { opacity: 1, duration: 0.3 }, t + 0.2)
        .fromTo(b.querySelector(".wk-ch__t"), { x: 0 }, { x: 14, duration: 0.35, ease: "power2.out" }, t + 0.2)
        .fromTo(b.querySelector(".wk-ch__bar"), { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.45, ease: "power2.out" }, t + 0.22)
        .to(a.querySelector(".wk-ch__t"), { x: 0, duration: 0.2 }, t + 0.12);
    });
    tl.fromTo(chs[0].querySelector(".wk-ch__t"), { x: 14 }, { x: 14, duration: 0.01 }, 0);
    tl.set({}, {}, TOTAL);

    // entrée de la colonne texte pendant que la section monte vers le pin
    gsap.fromTo(el.querySelectorAll(".wk-head, .wk-chapters, .wk-body, .wk-tags"), { y: 48, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 80%", end: "top 15%", scrub: jump ? true : 0.6 },
    });
    // l'image s'ouvre depuis le bas en même temps
    gsap.fromTo(el.querySelector(".wk-visual"), { clipPath: "inset(14% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: jump ? true : 0.6 },
    });

    return () => el.classList.remove("is-split");
  });

  /* ---------------- Mobile : empilement révélé ---------------- */
  mm.add("(max-width: 760px)", () => {
    el.querySelectorAll(".wk-m__fig").forEach((fig, i) => {
      const pairSecond = fig.previousElementSibling ? 0.08 : 0;
      gsap.timeline({
        scrollTrigger: { trigger: fig, start: `top ${92 - pairSecond * 100}%`, end: "top 40%", scrub: jump ? true : 0.6 },
      })
        .fromTo(fig, { clipPath: "inset(100% 0% 0% 0% round 14px)" }, { clipPath: "inset(0% 0% 0% 0% round 14px)", ease: "power2.out" }, 0)
        .fromTo(fig.querySelector("img"), { scale: 1.22, yPercent: 8 }, { scale: 1, yPercent: 0, ease: "power2.out" }, 0);
    });
    chs.forEach((ch) => {
      gsap.fromTo(ch.querySelector(".wk-ch__bar"), { scaleX: 0 }, {
        scaleX: 1, ease: "power2.out",
        scrollTrigger: { trigger: ch, start: "top 88%", end: "top 55%", scrub: jump ? true : 0.6 },
      });
      gsap.fromTo(ch.querySelector(".wk-ch__head"), { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, ease: "power2.out",
        scrollTrigger: { trigger: ch, start: "top 92%", end: "top 62%", scrub: jump ? true : 0.6 },
      });
    });
    gsap.fromTo(el.querySelectorAll(".wk-head, .wk-body, .wk-tags"), { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 85%", end: "top 30%", scrub: jump ? true : 0.6 },
    });
  });
});
