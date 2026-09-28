/* Section 90 — Pied de page : le wordmark COSMOS monte lettre par lettre (scrub) et finit
 * pile quand on atteint le bas de page ; colonnes qui montent à l'entrée. */
Cosmos.register("footer", ({ el, gsap, ScrollTrigger, reduced, jump }) => {
  if (reduced || !gsap || !ScrollTrigger) return;

  const letters = el.querySelectorAll(".ft__letter > span");
  gsap.fromTo(letters,
    { yPercent: 105, rotate: 6 },
    {
      yPercent: 0, rotate: 0, ease: "power2.out", stagger: 0.12,
      scrollTrigger: {
        trigger: el.querySelector(".ft__word"),
        start: "top bottom",
        end: () => `bottom bottom-=${el.querySelector(".ft__legal").offsetHeight - 4}`,
        scrub: jump ? true : 0.7,
        invalidateOnRefresh: true,
      },
    });

  if (jump) return;
  gsap.from(el.querySelectorAll(".ft__top > *"), {
    y: 36, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: el, start: "top 85%", once: true },
  });
});
