/* #buffet — défilement horizontal épinglé (desktop) / carrousel swipe natif (mobile).
 * Desktop : la section est épinglée, la piste glisse vers la gauche (tween linéaire = containerAnimation).
 *   Dans chaque panneau : l'image glisse moins vite que son cadre (parallaxe horizontale) et le cadre
 *   relâche un léger zoom jusqu'au centre de l'écran.
 * Mobile : scroll-snap natif (momentum du pouce conservé), parallaxe légère pilotée par scrollLeft,
 *   entrée animée des premiers panneaux.
 * Reduced : carrousel natif, rien d'animé. */
Cosmos.register("buffet", ({ el, gsap, ScrollTrigger, reduced, jump }) => {
  const track = el.querySelector(".bf-track");
  const panels = [...el.querySelectorAll(".bf-panel")];
  if (reduced || !gsap || !ScrollTrigger) return;

  // Préchargement : on décode les photos bien avant le pin pour éviter une frame longue à l'entrée
  const warm = () => el.querySelectorAll(".bf-media img").forEach((img) => { img.loading = "eager"; img.decode && img.decode().catch(() => {}); });
  ScrollTrigger.create({ trigger: el, start: "top 250%", once: true, onEnter: warm });

  const mm = gsap.matchMedia();

  /* ---------------- Desktop : pin horizontal ---------------- */
  mm.add("(min-width: 761px)", () => {
    el.classList.add("is-pinned");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);

    const scroll = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        // la piste avance ~1,7× plus vite que le scroll
        end: () => "+=" + Math.round(dist() * 0.6),
        pin: true,
        anticipatePin: 1,
        scrub: jump ? true : 0.7,
        invalidateOnRefresh: true,
      },
    });

    panels.forEach((p) => {
      const media = p.querySelector(".bf-media");
      const img = media && media.querySelector("img");
      if (!img) return;
      // Parallaxe : le cadre part à gauche, l'image recule vers la droite dans son cadre
      gsap.fromTo(img, { xPercent: -6 }, {
        xPercent: 6, ease: "none",
        scrollTrigger: { trigger: p, containerAnimation: scroll, start: "left right", end: "right left", scrub: true, invalidateOnRefresh: true },
      });
      if (p.classList.contains("bf-open")) return;
      // Zoom qui se relâche jusqu'au centre, puis reste posé
      gsap.fromTo(media, { scale: 1.14 }, {
        scale: 1, ease: "power1.out",
        scrollTrigger: { trigger: p, containerAnimation: scroll, start: "left right", end: "center 55%", scrub: true, invalidateOnRefresh: true },
      });
    });

    // Entrée : on "rentre" dans le panneau d'ouverture pendant que la section monte vers le pin
    const open = el.querySelector(".bf-open");
    gsap.fromTo(open, { clipPath: "inset(9% 7% 9% 0% round 28px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 14px)", ease: "none",
      scrollTrigger: { trigger: el, start: "top 85%", end: "top top", scrub: jump ? true : 0.6, invalidateOnRefresh: true },
    });
    gsap.fromTo(el.querySelectorAll(".bf-open__text > *"), { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 60%", end: "top 5%", scrub: jump ? true : 0.6 },
    });

    return () => {
      el.classList.remove("is-pinned");
      gsap.set(track, { clearProps: "transform" });
    };
  });

  /* ---------------- Mobile : carrousel natif ---------------- */
  mm.add("(max-width: 760px)", () => {
    const imgs = panels.map((p) => p.querySelector(".bf-media img"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vw = innerWidth;
      panels.forEach((p, i) => {
        const img = imgs[i]; if (!img) return;
        const r = p.getBoundingClientRect();
        if (r.right < -vw * 0.2 || r.left > vw * 1.2) return;
        // -1 (panneau à droite) .. 1 (panneau à gauche) -> glissement de l'image dans son cadre
        const t = Math.max(-1, Math.min(1, (vw / 2 - (r.left + r.width / 2)) / vw));
        img.style.transform = `translate3d(${(t * 6).toFixed(2)}%,0,0)`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    track.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();

    // Entrée : les trois premiers panneaux arrivent de la droite, en éventail
    let intro;
    if (!jump) {
      intro = gsap.from(panels.slice(0, 3), {
        x: 90, opacity: 0, duration: 1.15, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: track, start: "top 82%", once: true },
      });
    }

    return () => {
      track.removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      imgs.forEach((img) => img && (img.style.transform = ""));
      intro && intro.kill();
    };
  });
});
