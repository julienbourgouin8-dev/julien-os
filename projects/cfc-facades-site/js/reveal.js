// Fade/slide-in-on-scroll pour tout élément `.reveal`, via GSAP ScrollTrigger.
document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  els.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => el.classList.add("is-visible"),
    });
  });
});
