/* ===========================================================================
   stats.js — section "chiffres clés" épinglée : les compteurs montent en
   continu, liés à la progression du scroll (scrub), pas au temps.
   =========================================================================== */
function initStatsSection() {
  const section = document.querySelector(".stats");
  if (!section) return;

  const heading = section.querySelector(".stats__heading");
  const stats = section.querySelectorAll(".stat");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Écrit toujours la valeur finale d'abord (fallback no-JS / reduced-motion).
  stats.forEach((stat) => {
    const readout = stat.querySelector(".stat__readout");
    const target = parseFloat(readout.dataset.target);
    const decimals = Number(readout.dataset.decimals || 0);
    readout.textContent = target.toFixed(decimals).replace(".", ",");
  });

  if (reduced || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.set(heading, { opacity: 0, y: 30 });
  gsap.set(stats, { opacity: 0, y: 24 });

  const pinTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "+=115%",
    pin: true,
    pinSpacing: true,
    // anticipatePin lisse l'engagement du pin (sans ça, un unique frame
    // de recalcul de layout au moment exact où le pin s'enclenche peut
    // dépasser 50ms — visible sur verify.js jank).
    anticipatePin: 1,
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=115%",
      scrub: 0.4,
    },
  });

  tl.to(heading, { opacity: 1, y: 0, duration: 0.4 })
    .to(stats, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, "<0.05");

  stats.forEach((stat, i) => {
    const readout = stat.querySelector(".stat__readout");
    const target = parseFloat(readout.dataset.target);
    const decimals = Number(readout.dataset.decimals || 0);
    const counter = { value: 0 };

    gsap.to(counter, {
      value: target,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=90%",
        scrub: 0.4,
      },
      onUpdate: () => {
        readout.textContent = counter.value.toFixed(decimals).replace(".", ",");
      },
    });
  });
}
