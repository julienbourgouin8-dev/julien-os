(function () {
  "use strict";

  const MIDI = ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00"];
  const SOIR = ["19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"];
  const PHONE_RE = /^(?:(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4})$/;

  const form = document.getElementById("reservationForm");
  const successView = document.getElementById("successView");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  const dateInput = document.getElementById("date");
  const heureSelect = document.getElementById("heure");
  const serviceInput = document.getElementById("service");
  const pickMidiBtn = document.getElementById("pickMidi");
  const pickSoirBtn = document.getElementById("pickSoir");
  const personnesSelect = document.getElementById("personnes");
  const nomInput = document.getElementById("nom");
  const telephoneInput = document.getElementById("telephone");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  let csrfToken = null;

  // Certains navigateurs restaurent l'état du DOM (hidden/textContent) lors d'un
  // rechargement ou d'une navigation retour/avant, ce qui peut laisser le message
  // de succès affiché avec des champs vides. On force l'état initial explicitement.
  successView.hidden = true;
  form.hidden = false;

  // Empêche la sélection d'une date passée.
  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;
  dateInput.value = today;

  function fillPersonnesOptions() {
    for (let n = 10; n <= 30; n++) {
      const opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = `${n} personnes`;
      personnesSelect.appendChild(opt);
    }
  }
  fillPersonnesOptions();

  function fillHeureOptions(service) {
    const slots = service === "soir" ? SOIR : MIDI;
    heureSelect.innerHTML = "";
    slots.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      heureSelect.appendChild(opt);
    });
    heureSelect.value = slots[2];
  }

  function setService(service) {
    serviceInput.value = service;
    pickMidiBtn.classList.toggle("active", service === "midi");
    pickMidiBtn.setAttribute("aria-pressed", String(service === "midi"));
    pickSoirBtn.classList.toggle("active", service === "soir");
    pickSoirBtn.setAttribute("aria-pressed", String(service === "soir"));
    fillHeureOptions(service);
  }

  pickMidiBtn.addEventListener("click", () => setService("midi"));
  pickSoirBtn.addEventListener("click", () => setService("soir"));

  setService("midi");

  async function fetchCsrfToken() {
    try {
      const res = await fetch("/api/csrf-token", { credentials: "same-origin" });
      const data = await res.json();
      csrfToken = data.csrfToken;
    } catch (err) {
      console.error("Impossible de récupérer le jeton de sécurité.", err);
    }
  }
  fetchCsrfToken();

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  function validateClientSide(data) {
    if (!data.date || data.date < today) {
      return "Veuillez choisir une date valide (aujourd'hui ou plus tard).";
    }
    const personnesNum = Number(data.personnes);
    if (!Number.isInteger(personnesNum) || personnesNum < 10 || personnesNum > 30) {
      return "Veuillez indiquer un nombre de personnes entre 10 et 30. Au-delà, merci de nous appeler.";
    }
    if (!data.nom || data.nom.trim().length < 2) {
      return "Veuillez indiquer votre nom (2 caractères minimum).";
    }
    if (!PHONE_RE.test(data.telephone.trim())) {
      return "Veuillez indiquer un numéro de téléphone français valide.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      return "Veuillez indiquer une adresse email valide.";
    }
    if (data.message && data.message.length > 500) {
      return "Le message ne peut pas dépasser 500 caractères.";
    }
    return null;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError();

    const data = {
      date: dateInput.value,
      service: serviceInput.value,
      heure: heureSelect.value,
      personnes: personnesSelect.value,
      nom: nomInput.value,
      telephone: telephoneInput.value,
      email: emailInput.value,
      message: messageInput.value,
      website: document.getElementById("website").value, // honeypot
    };

    const clientError = validateClientSide(data);
    if (clientError) {
      showError(clientError);
      return;
    }

    if (!csrfToken) {
      await fetchCsrfToken();
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours…";

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        body: JSON.stringify(data),
      });

      let payload = {};
      try {
        payload = await res.json();
      } catch (_) {
        // réponse sans corps JSON
      }

      if (res.status === 429) {
        showError(payload.error || "Trop de demandes envoyées. Merci de réessayer dans quelques minutes.");
        return;
      }

      if (!res.ok || !payload.ok) {
        const detail =
          payload.details && payload.details.length ? payload.details[0].message : payload.error;
        showError(detail || "Une erreur est survenue. Merci de réessayer.");
        return;
      }

      const dateTxt = new Date(data.date + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      document.getElementById("successName").textContent = data.nom;
      document.getElementById("successRecap").textContent =
        [dateTxt, "service du " + data.service, data.heure, data.personnes + " personnes"]
          .filter(Boolean)
          .join(" · ");

      form.hidden = true;
      successView.hidden = false;
      successView.focus();
      successView.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      showError("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Demander une table";
    }
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    form.reset();
    dateInput.value = today;
    personnesSelect.value = "10";
    setService("midi");
    successView.hidden = true;
    form.hidden = false;
    clearError();
    fetchCsrfToken();
  });
})();
