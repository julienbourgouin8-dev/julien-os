// Compteurs animés — "chiffres clés" (#chiffres). Chaque nombre est réel
// (data.js) : 60 ans d'expérience, 4.7 de note Google, 103 avis, et le nombre
// de certifications/agréments calculé depuis REP24.certifications.list.length
// plutôt qu'écrit en dur, pour ne jamais désynchroniser l'affichage de la
// vraie donnée.
window.addEventListener("site:ready-to-animate", initCounters);

function initCounters() {
  const nodes = document.querySelectorAll("[data-counter]");
  if (!nodes.length) return;

  const reducedMotion = window.__reducedMotion;

  nodes.forEach((node) => {
    if (node.dataset.source === "quals-count") {
      const count = window.REP24 && REP24.certifications && REP24.certifications.list
        ? REP24.certifications.list.length
        : 8; // repli si data.js indisponible — reste le vrai total à date
      node.dataset.target = String(count);
    }
  });

  function format(value, decimals) {
    return decimals
      ? value.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : Math.ceil(value).toLocaleString("fr-FR");
  }

  function animate(node) {
    const target = Number(node.dataset.target);
    const decimals = Number(node.dataset.decimals || 0);
    const suffix = node.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    if (reducedMotion) {
      node.textContent = format(target, decimals) + suffix;
      return;
    }

    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = format(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  nodes.forEach((node) => observer.observe(node));

  // Parallax léger sur les chiffres, même principe que stats.js d'ETS Lévesque :
  // propriété CSS distincte (translate) de l'entrée reveal (opacity/transform),
  // pour que les deux animations ne se marchent jamais dessus.
  if (!reducedMotion) {
    let ticking = false;
    const items = Array.from(nodes).map((el, i) => ({ el, speed: 8 + (i % 3) * 5 }));

    function update() {
      ticking = false;
      const vh = window.innerHeight;
      items.forEach(({ el, speed }) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const progress = Math.min(Math.max((center - vh / 2) / vh, -1), 1);
        el.style.translate = `0 ${(progress * speed).toFixed(1)}px`;
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }
}
