// Démo statique : pas de backend branché. Intercepte l'envoi pour montrer
// le comportement attendu côté visiteur, sans prétendre transmettre la demande.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".quote-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector(".quote-form__submit");
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = "Demande envoyée ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
});
