/* Page Événements : sections #ev-hero, #ev-intro, #ev-occasions, #ev-galerie, #devis.
 * Aucune section ne retourne de Promise : core retire body.is-intro tout seul. */
(function () {
  "use strict";
  const C = window.Cosmos;
  if (!C) return;

  // Découpe en mots en gardant les balises (<b>) et les espaces : texte identique au HTML statique.
  function splitWords(root, cls) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span");
            w.className = cls;
            if (cls === "ev-w") { const i = document.createElement("span"); i.className = "ev-w__i"; i.textContent = part; w.appendChild(i); out.push(i); }
            else { w.textContent = part; out.push(w); }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(root);
    return out;
  }

  /* ---------- 1. Hero : zoom d'entrée + parallaxe ---------- */
  C.register("ev-hero", ({ el, gsap, reduced, jump }) => {
    if (reduced) return;
    const media = el.querySelector(".ev-hero__media");
    const img = media.querySelector("img");
    const content = el.querySelector(".ev-hero__content");
    const words = splitWords(el.querySelector(".ev-hero__title"), "ev-w");

    if (!jump) {
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .fromTo(img, { scale: 1.32 }, { scale: 1.08, duration: 2.6 }, 0)
        .fromTo(el.querySelector(".ev-hero__shade"), { opacity: 0.4 }, { opacity: 1, duration: 1.6, ease: "power2.out" }, 0)
        .fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.07 }, 0.45)
        .fromTo(el.querySelectorAll(".ev-hero__ctas .btn"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, clearProps: "transform,opacity" }, 1.05);
    }
    // parallaxe au scroll : l'image descend plus lentement, le texte monte et s'efface
    gsap.to(media, { yPercent: 22, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(content, { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom 20%", scrub: true } });
  });

  /* ---------- 2. Texte réel : les mots s'allument au fil du scroll ---------- */
  C.register("ev-intro", ({ el, gsap, reduced }) => {
    if (reduced) return;
    const words = splitWords(el.querySelector(".ev-intro__text"), "ev-tw");
    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: el.querySelector(".ev-intro__text"), start: "top 78%", end: "bottom 45%", scrub: true },
    });
    gsap.fromTo(el.querySelectorAll(".ev-intro__tags .pill"), { y: 20, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: el.querySelector(".ev-intro__tags"), start: "top 92%", end: "top 70%", scrub: true },
    });
  });

  /* ---------- 3. Occasions : défilement horizontal épinglé (desktop), cascade (mobile) ---------- */
  C.register("ev-occasions", ({ el, gsap, reduced }) => {
    if (reduced) return;
    const track = el.querySelector(".ev-occ__track");
    const cards = [...el.querySelectorAll(".ev-occ__card")];
    const mm = gsap.matchMedia();

    mm.add("(min-width: 761px)", () => {
      el.classList.add("is-h");
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const scroll = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => "+=" + dist(), pin: true, anticipatePin: 1, scrub: 1, invalidateOnRefresh: true },
      });
      gsap.to(el.querySelector(".ev-occ__progress span"), {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => "+=" + dist(), scrub: true, invalidateOnRefresh: true },
      });
      cards.forEach((card) => {
        gsap.fromTo(card.querySelector("img"), { xPercent: -7 }, {
          xPercent: 7, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: scroll, start: "left right", end: "right left", scrub: true },
        });
        gsap.fromTo(card.querySelectorAll(".ev-occ__txt > *"), { x: 60, opacity: 0 }, {
          x: 0, opacity: 1, stagger: 0.08, ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: scroll, start: "left 85%", end: "left 35%", scrub: true },
        });
      });
      return () => el.classList.remove("is-h");
    });

    mm.add("(max-width: 760px)", () => {
      cards.forEach((card) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 96%", end: "top 30%", scrub: true } });
        tl.fromTo(card, { clipPath: "inset(10% 8% 10% 8% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "none" }, 0)
          .fromTo(card.querySelector("img"), { scale: 1.3 }, { scale: 1, ease: "none" }, 0)
          .fromTo(card.querySelectorAll(".ev-occ__txt > *"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, ease: "power2.out" }, 0.3);
      });
    });
  });

  /* ---------- 4. Galerie : les images s'ouvrent en cascade ---------- */
  C.register("ev-galerie", ({ el, gsap, reduced }) => {
    if (reduced) return;
    el.querySelectorAll(".ev-gal__item").forEach((item, i) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 100%", end: "top 55%", scrub: true } });
      const from = i % 2 ? "inset(0% 0% 100% 0% round 14px)" : "inset(100% 0% 0% 0% round 14px)";
      tl.fromTo(item, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0% round 14px)", ease: "power1.out" }, 0)
        .fromTo(item.querySelector("img"), { scale: 1.35 }, { scale: 1, ease: "none" }, 0);
    });
  });

  /* ---------- 5. Devis : formulaire de démo ---------- */
  C.register("devis", ({ el, gsap, reduced, jump, data }) => {
    const form = el.querySelector(".ev-form");
    const f = form.elements;
    const err = el.querySelector(".ev-form__error");
    const success = el.querySelector(".ev-form__success");
    const over = el.querySelector("[data-over30]");
    const btn = el.querySelector(".ev-form__btn");
    const label = btn.querySelector("[data-label]");
    const PHONE_RE = /^(?:(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4})$/;
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    f.date.min = today;

    f.personnes.addEventListener("input", () => { over.hidden = !(Number(f.personnes.value) > 30); });
    form.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));

    function fail(msg, field) {
      err.textContent = msg; err.hidden = false;
      form.querySelectorAll("[aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
      field.setAttribute("aria-invalid", "true");
      field.focus();
      if (!reduced) gsap.fromTo(err, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.35)" });
    }

    let sending = false;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (sending) return;
      err.hidden = true;
      const n = Number(f.personnes.value);
      if (!f.nom.value || f.nom.value.trim().length < 2) return fail("Veuillez indiquer votre nom (2 caractères minimum).", f.nom);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return fail("Veuillez indiquer une adresse email valide.", f.email);
      if (!PHONE_RE.test(f.telephone.value.trim())) return fail("Veuillez indiquer un numéro de téléphone français valide.", f.telephone);
      if (!f.type.value) return fail("Veuillez choisir un type d'événement.", f.type);
      if (!f.date.value || f.date.value < today) return fail("Veuillez choisir une date valide (aujourd'hui ou plus tard).", f.date);
      if (!Number.isInteger(n) || n < 1) return fail("Veuillez indiquer un nombre de personnes.", f.personnes);
      if (f.message.value.length > 500) return fail("Le message ne peut pas dépasser 500 caractères.", f.message);

      sending = true; btn.disabled = true; label.textContent = "Envoi en cours…";
      setTimeout(() => {   // DÉMO : aucune requête réseau
        sending = false; btn.disabled = false; label.textContent = "Envoyer la demande";
        const dateTxt = new Date(f.date.value + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        success.querySelector('[data-s="title"]').textContent = data.booking.successTitle.replace("{nom}", f.nom.value.trim());
        const strong = document.createElement("strong");
        strong.textContent = [f.type.value, dateTxt, n + " personnes"].join(" · ");
        success.querySelector('[data-s="text"]').replaceChildren("Votre demande de devis a bien été enregistrée : ", strong, ".");
        form.hidden = true; success.hidden = false; success.focus({ preventScroll: true });
        if (!reduced) {
          gsap.timeline()
            .fromTo(success.querySelector(".ev-form__check"), { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.8, ease: "back.out(1.8)" })
            .fromTo(success.querySelector("svg"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "power2.inOut" }, 0.35)
            .fromTo(success.querySelectorAll(":scope > p, :scope > button"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 0.3);
        }
      }, 900);
    });
    el.querySelector("[data-reset]").addEventListener("click", () => {
      form.reset(); over.hidden = true; success.hidden = true; form.hidden = false; f.nom.focus();
    });

    if (reduced || jump) return;
    gsap.fromTo(el.querySelector(".ev-devis__card"), { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, ease: "expo.out", clearProps: "transform,opacity",
      scrollTrigger: { trigger: el, start: "top 75%", once: true },
    });
  });
})();
