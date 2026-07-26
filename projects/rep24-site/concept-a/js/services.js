/* ===========================================================================
   services.js — les 4 sections numérotées : chorégraphie d'entrée
   (kicker → titre → corps → CTA/badges), numéro fantôme en parallax lent,
   média qui se révèle en clip-path.
   =========================================================================== */
function initServicesSections() {
  const sections = document.querySelectorAll(".service");
  if (!sections.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (reduced || !hasGsap) return;

  sections.forEach((section, index) => {
    const ghost = section.querySelector(".service__ghost");
    const kicker = section.querySelector(".service__kicker");
    const title = section.querySelector(".service__title");
    const lead = section.querySelector(".service__lead");
    const badges = section.querySelector(".service__badge-row");
    const media = section.querySelector(".service__media-frame, .service__badge-panel");
    const modules = section.querySelectorAll(".service-module");

    const entranceTargets = [kicker, title, lead, badges].filter(Boolean);
    gsap.set(entranceTargets, { opacity: 0, y: 26 });
    if (media) gsap.set(media, { clipPath: "inset(6% 6% 6% 6% round 40px)", opacity: 0 });
    if (modules.length) gsap.set(modules, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
      },
      defaults: { ease: "power3.out", duration: 0.8 },
    });
    tl.to(entranceTargets, { opacity: 1, y: 0, stagger: 0.1 });
    if (media) tl.to(media, { clipPath: "inset(0% 0% 0% 0% round 40px)", opacity: 1, duration: 1 }, "-=0.55");

    if (modules.length) {
      gsap.to(modules, {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section.querySelector(".service__modules"),
          start: "top 85%",
        },
      });
    }

    // Numéro fantôme : dérive verticale lente, opposée au sens du scroll,
    // pour donner de la profondeur derrière le texte.
    if (ghost) {
      // Le variant centré positionne le fantôme via CSS (left:50% +
      // transform:translateX(-50%)) — un tween GSAP sur y écrirait un
      // nouveau transform inline qui écraserait ce décalage. On déclare le
      // xPercent explicitement pour que GSAP compose les deux au lieu de
      // perdre le centrage dès que le parallax démarre.
      if (section.classList.contains("service--ghost-center")) {
        gsap.set(ghost, { xPercent: -50 });
      }
      gsap.fromTo(
        ghost,
        { y: 60 },
        {
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    }
  });
}
