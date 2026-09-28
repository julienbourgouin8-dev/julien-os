/* Salles privées : la photo prive-table-ronde plein cadre se scinde en 3 panneaux qui
 * s'écartent (clip-path), les panneaux gauche/droite révèlent deux autres salles.
 * Le titre est lisible dès l'arrivée sur la section (demande de Julien, 2026-09-28), il n'est pas animé.
 * Épinglage court (+=120%), scrub. reduced : état final CSS, aucun pin. */
Cosmos.register("prive", ({ el, gsap, ScrollTrigger, reduced, jump }) => {
  if (reduced || !gsap || !ScrollTrigger) return;

  const stage = el.querySelector(".prive__stage");
  const wrap = el.querySelector(".prive__panels");
  const panels = [...el.querySelectorAll(".prive__panel")];
  const rooms = [...el.querySelectorAll(".prive__room")];

  // Valeurs finales en px (mêmes règles que prive.css), recalculées à chaque refresh
  const metrics = () => {
    const w = innerWidth, small = w <= 760;
    const navH = w <= 560 ? 64 : 76;
    const gutter = Math.min(72, Math.max(20, w * 0.05)); // --gutter: clamp(20px, 5vw, 72px)
    const gap = small ? 8 : 14;
    return { top: navH + (small ? 10 : 18), bottom: small ? 12 : 18, gutter, half: gap / 2, r: 14 };
  };
  const finalClip = (i) => {
    const m = metrics();
    const left = i === 0 ? m.gutter : m.half;
    const right = i === 2 ? m.gutter : m.half;
    return `inset(${m.top}px ${right}px ${m.bottom}px ${left}px round ${m.r}px)`;
  };
  const FULL = "inset(0px 0px 0px 0px round 0px)";

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: "+=120%",
      pin: true,
      anticipatePin: 1,
      scrub: jump ? true : 0.8,
      invalidateOnRefresh: true,
      onToggle: (self) => el.classList.toggle("is-animating", self.isActive),
    },
  });

  panels.forEach((p, i) => {
    tl.fromTo(p, { clipPath: FULL }, { clipPath: () => finalClip(i), duration: 0.45, ease: "power2.inOut" }, 0);
  });
  tl.fromTo(el.querySelector(".prive__whole"), { opacity: 1 }, { opacity: 0, duration: 0.04 }, 0.01);
  tl.fromTo(wrap, { scale: 1.07 }, { scale: 1, duration: 0.5, ease: "power1.out" }, 0)
    .fromTo(rooms[0], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power2.inOut" }, 0.28)
    .fromTo(rooms[0], { scale: 1.35 }, { scale: 1, duration: 0.6, ease: "power2.out" }, 0.28)
    .fromTo(rooms[1], { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power2.inOut" }, 0.38)
    .fromTo(rooms[1], { scale: 1.35 }, { scale: 1, duration: 0.6, ease: "power2.out" }, 0.38)
    .to({}, { duration: 0.12 }); // courte tenue de l'état final avant de relâcher

});
