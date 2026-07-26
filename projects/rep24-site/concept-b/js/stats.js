// Chiffres clés — section épinglée : le scroll reste bloqué sur la section
// pendant que les 4 stats se révèlent et comptent en interne (scrub GSAP).
function initStatsPin(reducedMotion) {
  const section = document.querySelector(".stats");
  if (!section) return;
  const items = section.querySelectorAll(".stat");
  if (!items.length) return;

  const format = (val, decimals) =>
    Number(val).toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  if (reducedMotion || typeof gsap === "undefined") {
    items.forEach((item) => {
      item.style.opacity = 1;
      item.style.transform = "none";
      const numEl = item.querySelector(".stat__num");
      const target = Number(item.dataset.target);
      const decimals = Number(item.dataset.decimals || 0);
      if (numEl && !Number.isNaN(target)) numEl.textContent = format(target, decimals);
    });
    return;
  }

  const counters = [];
  items.forEach((item) => {
    const numEl = item.querySelector(".stat__num");
    const target = Number(item.dataset.target);
    const decimals = Number(item.dataset.decimals || 0);
    counters.push({ item, numEl, target, decimals });
    gsap.set(item, { opacity: 0, y: 34 });
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=110%",
      scrub: 0.6,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
    },
  });

  tl.from(".stats__head .eyebrow, .stats__head .section-title, .stats__head .lede", {
    opacity: 0,
    y: 20,
    stagger: 0.06,
    duration: 0.2,
  }, 0);

  counters.forEach((c, i) => {
    const proxy = { val: 0 };
    const at = 0.15 + i * 0.18;
    tl.to(c.item, { opacity: 1, y: 0, duration: 0.16, ease: "power1.out" }, at)
      .to(
        proxy,
        {
          val: c.target,
          duration: 0.32,
          ease: "power1.out",
          onUpdate: () => {
            c.numEl.textContent = format(proxy.val, c.decimals);
          },
        },
        at
      );
  });
}
