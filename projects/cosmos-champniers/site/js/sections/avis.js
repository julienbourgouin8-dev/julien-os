/* #avis — bandeau d'avis qui défile à l'infini.
 * La série de cartes est clonée (clones aria-hidden) jusqu'à couvrir deux largeurs d'écran ;
 * l'animation CSS décale la piste d'exactement une série, puis boucle sans saut.
 * Pause au survol / au focus. Le bouton « Lire l'avis » ouvre le texte complet dans un <dialog>.
 * Reduced motion : pas de clones ni d'animation, carrousel natif (voir avis.css). */
Cosmos.register("avis", ({ el, reduced }) => {
  const track = el.querySelector(".avis__track");
  const originals = [...track.children];
  const reviews = window.COSMOS_DATA?.reviews?.items || [];
  const SPEED = 62; // px par seconde

  /* ---------- Boucle infinie ---------- */
  function build() {
    track.classList.remove("is-looping");
    track.querySelectorAll("[data-clone]").forEach((n) => n.remove());
    if (reduced) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setW = originals.reduce((w, li) => w + li.offsetWidth + gap, 0);
    if (!setW) return;
    const copies = Math.max(1, Math.ceil((innerWidth * 2) / setW));
    for (let c = 0; c < copies; c++) {
      originals.forEach((li) => {
        const n = li.cloneNode(true);
        n.setAttribute("data-clone", "");
        n.setAttribute("aria-hidden", "true");
        n.querySelectorAll("button, a").forEach((b) => b.setAttribute("tabindex", "-1"));
        n.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
        track.appendChild(n);
      });
    }
    track.style.setProperty("--loop-shift", `-${setW}px`);
    track.style.setProperty("--loop-dur", `${(setW / SPEED).toFixed(1)}s`);
    track.classList.add("is-looping");
  }
  // « Lire l'avis » seulement quand le texte est coupé (mesuré une fois les polices chargées)
  const markClamped = () => originals.forEach((li) => {
    const t = li.querySelector(".avis__text");
    li.querySelector(".avis__more").hidden = t.scrollHeight <= t.clientHeight + 4;
  });
  markClamped();
  build();
  document.fonts?.ready.then(() => { markClamped(); build(); });
  let rt;
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return; // la barre d'URL mobile ne relance pas tout
    lastW = innerWidth;
    clearTimeout(rt); rt = setTimeout(build, 200);
  });

  /* ---------- Avis complet ---------- */
  const dlg = el.querySelector(".avis__dialog");
  const dStars = dlg.querySelector(".avis__d-stars");
  const dText = dlg.querySelector(".avis__d-text");
  const dAuthor = dlg.querySelector("#avis-d-author");
  const dDate = dlg.querySelector(".avis__d-date");
  track.addEventListener("click", (e) => {
    const b = e.target.closest(".avis__more");
    if (!b) return;
    const card = b.closest(".avis__card");
    const r = reviews[+b.dataset.i];
    dStars.innerHTML = card.querySelector(".avis__stars").innerHTML;
    dStars.setAttribute("aria-label", card.querySelector(".avis__stars").getAttribute("aria-label"));
    dText.textContent = r ? r.text : card.querySelector(".avis__text").textContent;
    dAuthor.textContent = card.querySelector(".avis__author").textContent;
    dDate.textContent = card.querySelector(".avis__date").textContent;
    dlg.showModal();
    dlg.querySelector(".avis__dialog-inner").focus(); // pas d'anneau de focus sur la croix à l'ouverture
  });
  dlg.querySelector(".avis__close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // clic sur le fond
});
