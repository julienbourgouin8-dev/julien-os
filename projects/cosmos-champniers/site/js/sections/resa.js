/* Panneau de réservation global (toutes les pages).
 * Reproduit le module actuel booking.cosmos-tech.fr (site-scrape/js/booking-app.js) :
 * mêmes champs, mêmes créneaux, mêmes messages d'erreur, même récap de succès.
 * DÉMO : aucun envoi réseau, l'envoi est simulé (900 ms).
 *
 * Le DOM est créé dès l'exécution du script (avant le boot de core.js) pour que
 * window.__resaMounted soit vrai avant tout clic sur un [data-resa]. */
(function () {
  "use strict";
  const D = window.COSMOS_DATA;
  if (!D || document.getElementById("resa")) return;
  const B = D.booking;
  const gsap = window.gsap;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Regex téléphone FR et validations : copiées de booking-app.js
  const PHONE_RE = /^(?:(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4})$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pad = (n) => String(n).padStart(2, "0");
  const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const phoneLink = `<a href="${D.phoneHref}">${D.phone}</a>`;
  const withPhone = (txt) => txt.replace(D.phone, phoneLink);

  const personnesOpts = Array.from({ length: B.maxPeople - B.minPeople + 1 }, (_, i) => B.minPeople + i)
    .map((n) => `<option value="${n}">${n} personnes</option>`).join("");
  const serviceCard = (key) => {
    const s = B.services[key];
    return `<label class="resa__svc">
      <input type="radio" name="service" value="${key}">
      <span class="resa__svc-box">
        <span class="resa__svc-dot" aria-hidden="true"></span>
        <span class="resa__svc-name">${s.label}</span>
        <span class="resa__svc-hours">${s.hours}</span>
      </span>
    </label>`;
  };

  /* ---------------- DOM ---------------- */
  const root = document.createElement("div");
  root.id = "resa";
  root.className = "resa";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "resa-title");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
  <div class="resa__scrim" data-resa-close></div>
  <div class="resa__panel" tabindex="-1" data-lenis-prevent>
    <div class="resa__bar">
      <span class="eyebrow">Réservation</span>
      <button type="button" class="resa__close" data-resa-close aria-label="Fermer la réservation">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>

    <header class="resa__head">
      <h2 id="resa-title" class="display resa__title resa__in">Réserver une table</h2>
      <p class="resa__tagline resa__in">${B.tagline}</p>
      <div class="resa__rate resa__in" aria-live="polite">
        <div class="resa__rate-txt">
          <span class="resa__rate-when" data-r="when"></span>
          <span class="resa__rate-label" data-r="label"></span>
          <span class="resa__rate-sub" data-r="sub"></span>
        </div>
        <div class="resa__rate-num">
          <span class="price resa__rate-price"><span data-r="price"></span></span>
          <span class="resa__rate-note">${D.pricing.note}</span>
        </div>
      </div>
    </header>

    <div class="resa__body">
      <form class="resa__form" novalidate>
        <div class="resa__error" role="alert" hidden></div>

        <label class="resa__field resa__in">
          <span class="resa__label">Date</span>
          <input type="date" name="date" required>
        </label>

        <fieldset class="resa__field resa__in">
          <legend class="resa__label">Service</legend>
          <div class="resa__svcs">${serviceCard("midi")}${serviceCard("soir")}</div>
        </fieldset>

        <div class="resa__row resa__in">
          <label class="resa__field">
            <span class="resa__label">Heure de réservation</span>
            <select name="heure" required></select>
          </label>
          <label class="resa__field">
            <span class="resa__label">Nombre de personnes</span>
            <select name="personnes" required>${personnesOpts}</select>
          </label>
        </div>
        <p class="resa__hint resa__in">${withPhone(B.hint)}</p>

        <div class="resa__rule resa__in" aria-hidden="true"></div>

        <div class="resa__row resa__in">
          <label class="resa__field">
            <span class="resa__label">Nom</span>
            <input type="text" name="nom" required placeholder="Votre nom" maxlength="80" autocomplete="name">
          </label>
          <label class="resa__field">
            <span class="resa__label">Numéro de téléphone</span>
            <input type="tel" name="telephone" required placeholder="06 00 00 00 00" autocomplete="tel">
          </label>
        </div>

        <label class="resa__field resa__in">
          <span class="resa__label">Adresse email</span>
          <input type="email" name="email" required placeholder="vous@exemple.fr" autocomplete="email">
        </label>

        <label class="resa__field resa__in">
          <span class="resa__label">Message <span class="resa__count" data-count>0 / 500</span></span>
          <textarea name="message" rows="4" maxlength="500" placeholder="${B.messagePlaceholder}"></textarea>
        </label>

        <div class="resa__hp" aria-hidden="true">
          <label>Site web <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>

        <div class="resa__submit resa__in">
          <button type="submit" class="btn btn--primary resa__btn"><span data-btn-label>Demander une table</span></button>
          <p class="resa__demo">Démo : aucune demande n'est envoyée</p>
        </div>
      </form>

      <div class="resa__success" hidden tabindex="-1" role="status" aria-live="polite">
        <div class="resa__orb" aria-hidden="true">
          <span class="resa__orb-halo"></span>
          <svg class="resa__orb-planet" viewBox="0 0 120 120">
            <ellipse class="resa__orb-ring" cx="60" cy="62" rx="56" ry="13" transform="rotate(-10 60 62)"/>
            <circle cx="60" cy="60" r="30"/>
          </svg>
          <svg class="resa__orb-check" viewBox="0 0 120 120"><path d="M46 61l10 10 19-22"/></svg>
        </div>
        <p class="resa__success-title display" data-s="title"></p>
        <p class="resa__success-text" data-s="text"></p>
        <p class="resa__success-note">${B.holdNote}</p>
        <div class="resa__success-actions">
          <button type="button" class="btn btn--ghost" data-resa-reset>Nouvelle réservation</button>
          <button type="button" class="btn btn--primary" data-resa-close>Fermer</button>
        </div>
      </div>
    </div>

    <footer class="resa__foot resa__in">
      <p>${withPhone(B.fineprint)}</p>
      <p class="resa__foot-quote">« ${B.holdNote} »</p>
      <p>${B.pets}</p>
      <div class="resa__pay">
        <span class="resa__pay-label">Moyens de paiement acceptés</span>
        <div class="resa__pay-tags">${B.payments.map((p) => `<span class="pill">${p}</span>`).join("")}</div>
      </div>
    </footer>
  </div>`;
  document.body.appendChild(root);
  window.__resaMounted = true;

  /* ---------------- Références ---------------- */
  const $ = (s) => root.querySelector(s);
  const scrim = $(".resa__scrim");
  const panel = $(".resa__panel");
  const form = $(".resa__form");
  const errBox = $(".resa__error");
  const success = $(".resa__success");
  const f = form.elements;
  const btn = $(".resa__btn");
  const btnLabel = $("[data-btn-label]");
  const R = (k) => root.querySelector(`[data-r="${k}"]`);
  let today = isoLocal(new Date());

  /* ---------------- Logique du formulaire (booking-app.js) ---------------- */
  function fillHeures(service) {
    const slots = B.services[service].slots;
    f.heure.innerHTML = slots.map((h) => `<option value="${h}">${h}</option>`).join("");
    f.heure.value = slots[2];
  }
  function currentService() { return form.querySelector('input[name="service"]:checked')?.value || "midi"; }
  function setService(service) {
    const r = form.querySelector(`input[name="service"][value="${service}"]`);
    if (r) r.checked = true;
    fillHeures(service);
    updateRate();
  }

  // Tarif pour la date + le service choisis : même règle que data.status() (fériés inclus),
  // en l'interrogeant à une heure du service visé.
  let lastPrice = null;
  function updateRate() {
    const iso = f.date.value && f.date.value >= today ? f.date.value : today;
    const service = currentService();
    const [y, m, d] = iso.split("-").map(Number);
    const tier = D.status(new Date(y, m - 1, d, service === "midi" ? 12 : 20, 30)).tier;
    R("when").textContent = `${fmtDate(iso)} · ${B.services[service].label.toLowerCase()}`;
    R("label").textContent = tier.label;
    R("sub").textContent = tier.sub;
    const label = D.fmtPrice(tier.price);
    const priceEl = R("price");
    if (label !== lastPrice) {
      priceEl.textContent = label;
      if (lastPrice !== null && gsap && !reduced && root.classList.contains("is-active")) {
        gsap.fromTo(priceEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out" });
      }
      lastPrice = label;
    }
  }

  function resetForm() {
    form.reset();
    today = isoLocal(new Date());
    f.date.min = today;
    f.date.value = today;
    f.personnes.value = String(B.minPeople);
    $("[data-count]").textContent = "0 / 500";
    clearError();
    setService(defaultService());
  }
  function defaultService() {
    try { return D.status().service || "midi"; } catch (_) { return "midi"; }
  }

  function showError(message, field) {
    errBox.textContent = message;
    errBox.hidden = false;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus({ preventScroll: true });
    }
    panel.scrollTo({ top: Math.max(0, errBox.offsetTop - 90), behavior: reduced ? "auto" : "smooth" });
    if (gsap && !reduced) gsap.fromTo(errBox, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.35)" });
  }
  function clearError() {
    errBox.hidden = true;
    errBox.textContent = "";
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  }

  // Messages identiques à validateClientSide() de booking-app.js
  function validate(data) {
    if (!data.date || data.date < today) return ["Veuillez choisir une date valide (aujourd'hui ou plus tard).", f.date];
    const n = Number(data.personnes);
    if (!Number.isInteger(n) || n < B.minPeople || n > B.maxPeople) return ["Veuillez indiquer un nombre de personnes entre 10 et 30. Au-delà, merci de nous appeler.", f.personnes];
    if (!data.nom || data.nom.trim().length < 2) return ["Veuillez indiquer votre nom (2 caractères minimum).", f.nom];
    if (!PHONE_RE.test(data.telephone.trim())) return ["Veuillez indiquer un numéro de téléphone français valide.", f.telephone];
    if (!EMAIL_RE.test(data.email.trim())) return ["Veuillez indiquer une adresse email valide.", f.email];
    if (data.message && data.message.length > 500) return ["Le message ne peut pas dépasser 500 caractères.", f.message];
    return null;
  }

  form.addEventListener("change", (e) => {
    if (e.target.name === "service") { fillHeures(e.target.value); updateRate(); }
    if (e.target.name === "date") updateRate();
  });
  f.date.addEventListener("input", updateRate);
  f.message.addEventListener("input", () => ($("[data-count]").textContent = `${f.message.value.length} / 500`));
  form.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid"); });

  let sending = false;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (sending) return;
    clearError();
    const data = {
      date: f.date.value, service: currentService(), heure: f.heure.value, personnes: f.personnes.value,
      nom: f.nom.value, telephone: f.telephone.value, email: f.email.value, message: f.message.value,
      website: f.website.value,
    };
    const err = validate(data);
    if (err) { showError(err[0], err[1]); return; }

    sending = true;
    btn.disabled = true;
    btnLabel.textContent = "Envoi en cours…";
    // DÉMO : pas de serveur, on simule l'aller-retour
    setTimeout(() => {
      sending = false;
      btn.disabled = false;
      btnLabel.textContent = "Demander une table";
      showSuccess(data);
    }, 900);
  });

  function showSuccess(data) {
    const recap = [fmtDate(data.date), "service du " + data.service, data.heure, data.personnes + " personnes"].filter(Boolean).join(" · ");
    success.querySelector('[data-s="title"]').textContent = B.successTitle.replace("{nom}", data.nom.trim());
    const t = success.querySelector('[data-s="text"]');
    const [before, after] = B.successText.split("{recap}");
    const strong = document.createElement("strong");
    strong.textContent = recap;
    t.replaceChildren(before, strong, after);

    const reveal = () => {
      form.hidden = true;
      success.hidden = false;
      panel.scrollTo({ top: 0 });
      success.focus({ preventScroll: true });
      if (!gsap || reduced) return;
      const q = (s) => success.querySelector(s);
      gsap.timeline()
        .fromTo(q(".resa__orb-planet"), { scale: 0.2, opacity: 0, rotate: -40 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "back.out(1.6)" })
        .fromTo(q(".resa__orb-halo"), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: "power2.out" }, 0.15)
        .fromTo(q(".resa__orb-check"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power2.inOut" }, 0.55)
        .fromTo(success.querySelectorAll(".resa__success > p, .resa__success-actions"), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0.45);
    };
    if (gsap && !reduced) gsap.to(form, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in", onComplete: () => { gsap.set(form, { clearProps: "opacity,transform" }); reveal(); } });
    else reveal();
  }

  function backToForm() {
    success.hidden = true;
    form.hidden = false;
    resetForm();
  }
  root.querySelector("[data-resa-reset]").addEventListener("click", () => {
    backToForm();
    f.date.focus({ preventScroll: true });
    if (gsap && !reduced) gsap.fromTo(form.querySelectorAll(".resa__in"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.035, ease: "power3.out" });
  });

  /* ---------------- Ouverture / fermeture ---------------- */
  let isOpen = false, trigger = null, inerted = [], tl = null;

  document.addEventListener("click", (e) => { const t = e.target.closest?.("[data-resa]"); if (t) trigger = t; }, true);

  function focusables() {
    return [...panel.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function open(detail) {
    const service = detail && (detail.service === "midi" || detail.service === "soir") ? detail.service : null;
    if (isOpen) { if (service) setService(service); return; }
    isOpen = true;
    if (!trigger) trigger = document.activeElement;
    if (!success.hidden) backToForm();
    today = isoLocal(new Date());
    f.date.min = today;
    if (!f.date.value || f.date.value < today) f.date.value = today;
    if (service) setService(service); else updateRate();

    document.body.classList.add("resa-open");
    document.body.classList.remove("menu-open");
    window.Cosmos?.lenis?.stop();
    inerted = [...document.body.children].filter((el) => el !== root && el.tagName !== "SCRIPT" && !el.inert);
    inerted.forEach((el) => (el.inert = true));
    root.classList.add("is-active");
    root.setAttribute("aria-hidden", "false");
    panel.scrollTop = 0;
    panel.focus({ preventScroll: true });

    tl && tl.kill();
    const items = root.querySelectorAll(".resa__in");
    if (!gsap || reduced) {
      gsap && gsap.set([scrim, panel, items], { clearProps: "all" });
      return;
    }
    tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0)
      .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.95 }, 0)
      .fromTo(items, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.045, ease: "power3.out", clearProps: "transform,opacity" }, 0.22);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const done = () => {
      root.classList.remove("is-active");
      root.setAttribute("aria-hidden", "true");
      gsap && gsap.set([scrim, panel], { clearProps: "all" });
    };
    inerted.forEach((el) => (el.inert = false));
    inerted = [];
    document.body.classList.remove("resa-open");
    window.Cosmos?.lenis?.start();
    const back = trigger;
    trigger = null;
    if (back && document.contains(back) && typeof back.focus === "function") back.focus({ preventScroll: true });

    tl && tl.kill();
    if (!gsap || reduced) { done(); return; }
    tl = gsap.timeline({ onComplete: done })
      .to(panel, { xPercent: 100, duration: 0.55, ease: "power3.in" }, 0)
      .to(scrim, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0.1);
  }

  root.addEventListener("click", (e) => { if (e.target.closest("[data-resa-close]")) close(); });
  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const list = focusables();
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener("cosmos:resa-open", (e) => open(e.detail));

  resetForm();

  // Enregistrement auprès du moteur (état initial cohérent une fois core démarré)
  window.Cosmos?.register("resa", () => { updateRate(); });
  window.CosmosResa = { open, close };
})();
