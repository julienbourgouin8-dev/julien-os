/* Section 80 — Infos pratiques : la façade s'ouvre (clip-path d'une fenêtre centrale vers le plein
 * cadre, l'image dézoome) au scroll ; lignes d'infos qui montent à l'entrée. */
Cosmos.register("infos", ({ el, gsap, ScrollTrigger, reduced, jump, mobile }) => {
  if (reduced || !gsap || !ScrollTrigger) return;

  const fig = el.querySelector(".infos__facade");
  const img = fig.querySelector("img");
  const r = mobile ? 14 : 28;

  gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: fig, start: "top bottom", end: "center 55%",
      scrub: jump ? true : 0.6, invalidateOnRefresh: true,
      onToggle: (self) => (img.style.willChange = self.isActive ? "transform" : ""),
    },
  })
    .fromTo(fig, { clipPath: `inset(16% 22% 16% 22% round ${r * 4}px)` }, { clipPath: `inset(0% 0% 0% 0% round ${r}px)`, ease: "power1.out" }, 0)
    .fromTo(img, { scale: 1.35 }, { scale: 1, ease: "power1.out" }, 0);

  if (jump) return;
  const rows = [el.querySelector(".infos__head"), ...el.querySelectorAll(".infos__row, .infos__note, .infos__ctas")];
  rows.forEach((row) => gsap.from(row, {
    y: 30, opacity: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: row, start: "top 90%", once: true },
  }));
  gsap.from(el.querySelector(".infos__map"), {
    y: 60, opacity: 0, duration: 1.3, ease: "power3.out",
    scrollTrigger: { trigger: el.querySelector(".infos__map"), start: "top 88%", once: true },
  });
});
