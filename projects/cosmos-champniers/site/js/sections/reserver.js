/* #reserver — réservation pas à pas (une question à la fois) + carte d'embarquement qui se remplit.
 * Mêmes règles que le module actuel (booking-app.js, voir resa.js) : 10 à 30 personnes, créneaux
 * midi/soir tous les 15 min, pas de date passée, téléphone FR, email. DÉMO : envoi simulé. */
Cosmos.register("reserver", ({ el, data }) => {
  const B = data.booking;
  const $ = (s) => el.querySelector(s);
  const card = $(".rv-card");
  const steps = [...el.querySelectorAll(".rv-step")];
  const lines = [...el.querySelectorAll(".rv-line")];
  const fill = $(".rv-progress__fill");
  const back = $("[data-back]");
  const PHONE_RE = /^(?:(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4})$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = (s) => new Date(s + "T12:00:00");
  const longDate = (s) => fromIso(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const shortDate = (s) => fromIso(s).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const hh = (t) => t.replace(":", "h");

  const st = { pers: 12, date: null, svc: null, time: null, name: null };
  let cur = 0;

  /* ---------- Navigation ---------- */
  function go(i) {
    cur = i;
    steps.forEach((s, k) => {
      s.classList.toggle("is-active", k === i);
      s.classList.toggle("is-before", k < i);
    });
    fill.style.transform = `scaleX(${Math.min(1, (i + 1) / 5)})`;
    back.hidden = i === 0 || i === 5;
    lines.forEach((l, k) => {
      l.classList.toggle("is-current", k === i);
      l.disabled = i === 5 || k > maxReached();
    });
    const focusable = steps[i].querySelector(i === 4 ? "input" : ".is-on, button, [tabindex]");
    if (focusable && el.contains(document.activeElement)) setTimeout(() => focusable.focus({ preventScroll: true }), 350);
  }
  const maxReached = () => (st.name ? 4 : st.time ? 4 : st.svc ? 3 : st.date ? 2 : 1);

  function setLine(key, txt) {
    const dd = el.querySelector(`[data-p="${key}"]`);
    if (dd.textContent === txt) return;
    dd.textContent = txt;
    dd.closest(".rv-line")?.classList.toggle("is-set", txt !== "—");
    dd.classList.remove("is-pop"); void dd.offsetWidth; dd.classList.add("is-pop");
  }
  function updateEstimate() {
    if (!st.date || !st.svc) { setLine("est", "—"); return; }
    const tier = data.priceFor(fromIso(st.date), st.svc);
    setLine("est", data.fmtPrice(tier.price * st.pers));
  }

  /* ---------- 1. Passagers ---------- */
  const num = $("[data-pers-num]");
  const minus = $('[data-pers="-1"]'), plus = $('[data-pers="1"]');
  function setPers(n) {
    st.pers = Math.max(B.minPeople, Math.min(B.maxPeople, n));
    num.textContent = st.pers;
    num.classList.remove("is-bump"); void num.offsetWidth; num.classList.add("is-bump");
    minus.disabled = st.pers <= B.minPeople; plus.disabled = st.pers >= B.maxPeople;
    if (st.date || cur > 0) { setLine("pers", `${st.pers} personnes`); updateEstimate(); }
  }
  el.querySelectorAll("[data-pers]").forEach((b) => b.addEventListener("click", () => setPers(st.pers + +b.dataset.pers)));
  $("[data-next]").addEventListener("click", () => { setLine("pers", `${st.pers} personnes`); go(1); });
  setPers(st.pers);

  /* ---------- 2. Jours (14 prochains jours) ---------- */
  const days = $(".rv-days");
  const today = new Date();
  for (let k = 0; k < 14; k++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k, 12);
    const b = document.createElement("button");
    b.type = "button"; b.className = "rv-day"; b.dataset.date = iso(d); b.setAttribute("role", "option");
    const dow = k === 0 ? "Auj." : k === 1 ? "Demain" : d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
    b.innerHTML = `<span class="rv-day__dow">${dow}</span><span class="rv-day__num">${d.getDate()}</span><span class="rv-day__mon">${d.toLocaleDateString("fr-FR", { month: "short" })}</span>`;
    b.setAttribute("aria-label", longDate(iso(d)));
    days.appendChild(b);
  }
  days.addEventListener("click", (e) => {
    const b = e.target.closest(".rv-day"); if (!b) return;
    days.querySelectorAll(".rv-day").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-selected", x === b); });
    st.date = b.dataset.date;
    const label = shortDate(st.date);
    setLine("date", label.charAt(0).toUpperCase() + label.slice(1));
    // un créneau choisi peut ne plus exister (aujourd'hui, heure passée) : on le réinitialise
    st.time = null; setLine("time", "—");
    renderSvcs(); updateEstimate();
    setTimeout(() => go(2), 260);
  });

  /* ---------- 3. Service ---------- */
  const svcs = $("[data-svcs]");
  function renderSvcs() {
    svcs.innerHTML = ["midi", "soir"].map((k) => {
      const s = B.services[k];
      const price = st.date ? data.fmtPrice(data.priceFor(fromIso(st.date), k).price) : "";
      return `<button type="button" class="rv-svc${st.svc === k ? " is-on" : ""}" data-svc="${k}">
        <span class="rv-svc__name">${s.label}</span><span class="rv-svc__hours">${s.hours}</span>
        <span class="rv-svc__price price">${price}</span></button>`;
    }).join("");
  }
  svcs.addEventListener("click", (e) => {
    const b = e.target.closest(".rv-svc"); if (!b) return;
    st.svc = b.dataset.svc; st.time = null; setLine("time", "—");
    svcs.querySelectorAll(".rv-svc").forEach((x) => x.classList.toggle("is-on", x === b));
    setLine("svc", B.services[st.svc].label);
    updateEstimate(); renderSlots();
    setTimeout(() => go(3), 260);
  });

  /* ---------- 4. Créneaux ---------- */
  const slots = $("[data-slots]");
  function renderSlots() {
    const isToday = st.date === iso(today);
    const nowMin = today.getHours() * 60 + today.getMinutes() + 30; // au moins 30 min d'avance
    const list = B.services[st.svc].slots.filter((t) => {
      if (!isToday) return true;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m >= nowMin;
    });
    slots.innerHTML = list.length
      ? list.map((t) => `<button type="button" class="rv-slot${st.time === t ? " is-on" : ""}" data-t="${t}">${hh(t)}</button>`).join("")
      : `<p class="rv-empty">Plus de créneau pour ce service aujourd'hui. Choisissez un autre jour.</p>`;
  }
  slots.addEventListener("click", (e) => {
    const b = e.target.closest(".rv-slot"); if (!b) return;
    st.time = b.dataset.t;
    slots.querySelectorAll(".rv-slot").forEach((x) => x.classList.toggle("is-on", x === b));
    setLine("time", hh(st.time));
    setTimeout(() => go(4), 260);
  });

  /* ---------- 5. Coordonnées ---------- */
  const form = $(".rv-form");
  const err = $(".rv-error");
  form.nom.addEventListener("input", () => setLine("name", form.nom.value.trim() || "—"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = [];
    const nom = form.nom.value.trim(), tel = form.telephone.value.trim(), mail = form.email.value.trim();
    [form.nom, form.telephone, form.email].forEach((i) => i.classList.remove("is-bad"));
    if (!nom) bad.push(form.nom);
    if (!PHONE_RE.test(tel)) bad.push(form.telephone);
    if (!EMAIL_RE.test(mail)) bad.push(form.email);
    if (bad.length) {
      bad.forEach((i) => i.classList.add("is-bad"));
      err.textContent = !nom ? "Indiquez votre nom." : !PHONE_RE.test(tel) ? "Numéro de téléphone invalide." : "Adresse email invalide.";
      err.hidden = false; bad[0].focus(); return;
    }
    err.hidden = true;
    st.name = nom; setLine("name", nom);
    const label = $("[data-submit-label]");
    label.textContent = "Envoi…";
    setTimeout(() => {
      label.textContent = "Confirmer la réservation";
      const recap = `${st.pers} personnes, ${longDate(st.date)} à ${hh(st.time)}`;
      $("[data-done-title]").textContent = B.successTitle.replace("{nom}", nom.split(" ")[0]);
      $("[data-done-text]").textContent = B.successText.replace("{recap}", recap);
      card.classList.add("is-done");
      go(5);
    }, 900);
  });

  /* ---------- Retour / billet / recommencer ---------- */
  back.addEventListener("click", () => go(Math.max(0, cur - 1)));
  lines.forEach((l) => l.addEventListener("click", () => go(+l.dataset.go)));
  $("[data-restart]").addEventListener("click", () => {
    Object.assign(st, { pers: 12, date: null, svc: null, time: null, name: null });
    form.reset(); card.classList.remove("is-done");
    ["pers", "date", "svc", "time", "name", "est"].forEach((k) => setLine(k, "—"));
    days.querySelectorAll(".rv-day").forEach((x) => x.classList.remove("is-on"));
    setPers(12); go(0);
  });

  go(0);
});
