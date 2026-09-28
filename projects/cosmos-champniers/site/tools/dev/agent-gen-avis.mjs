import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
const site = "/Users/julien/julien-os/projects/cosmos-champniers/site";
const ctx = { window: {} };
vm.runInNewContext(readFileSync(`${site}/js/content.js`, "utf8"), ctx);
const D = ctx.window.COSMOS_DATA;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stars = (n) => `<svg class="avis__stars" viewBox="0 0 136 24" aria-hidden="true">${[0,1,2,3,4].map(i => `<use href="#av-star" x="${i*28}" class="${i < n ? "is-on" : ""}"/>`).join("")}</svg>`;
const cards = D.reviews.items.map((r, i) => `      <li class="avis__item">
        <article class="avis__card" aria-label="Avis de ${esc(r.author)}">
          <header class="avis__head">
            <span class="avis__avatar" aria-hidden="true">${esc([...r.author][0])}</span>
            <div class="avis__who">
              <h3 class="avis__author">${esc(r.author)}</h3>
              <p class="avis__meta">${stars(r.stars)}<span class="sr-only">${r.stars} étoiles sur 5, </span><span>${esc(r.date)}</span></p>
            </div>
          </header>
          <p class="avis__text" id="avis-t${i + 1}">${esc(r.text)}</p>
          <button class="avis__more" type="button" aria-expanded="false" aria-controls="avis-t${i + 1}" hidden>Lire la suite</button>
        </article>
      </li>`).join("\n");

const html = `<section id="avis" data-section="avis" class="avis section" aria-labelledby="avis-title">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs><path id="av-star" d="M12 1.6l3.05 6.5 7.1.85-5.25 4.9 1.4 7.05L12 17.4l-6.3 3.5 1.4-7.05L1.85 8.95l7.1-.85z"/></defs>
  </svg>
  <div class="container avis__top">
    <div class="avis__rating">
      <p class="eyebrow">Avis ${esc(D.reviews.source)}</p>
      <p class="avis__score"><span class="sr-only">Note moyenne ${D.reviews.rating} sur 5</span><span class="avis__num" aria-hidden="true">${D.reviews.rating}</span><span class="avis__of" aria-hidden="true">/5</span></p>
      <div class="avis__bigstars" aria-hidden="true">
        <svg viewBox="0 0 136 24" class="avis__bigsvg">
          <defs><clipPath id="av-fill-clip"><rect class="avis__fillrect" x="0" y="0" width="${(4 * 28 + (parseFloat(D.reviews.rating.replace(",", ".")) - 4) * 24).toFixed(1)}" height="24"/></clipPath></defs>
          <g class="avis__empty">${[0,1,2,3,4].map(i => `<use href="#av-star" x="${i*28}"/>`).join("")}</g>
          <g class="avis__full" clip-path="url(#av-fill-clip)">${[0,1,2,3,4].map(i => `<use href="#av-star" x="${i*28}"/>`).join("")}</g>
        </svg>
      </div>
      <p class="avis__total">${D.reviews.total} avis ${esc(D.reviews.source)}</p>
    </div>
    <div class="avis__intro">
      <h2 class="display h2 avis__title" id="avis-title">La parole aux voyageurs</h2>
      <div class="avis__actions">
        <a class="avis__link" href="${D.mapsUrl}" target="_blank" rel="noopener">Voir tous les avis sur Google <span aria-hidden="true">↗</span></a>
        <div class="avis__nav">
          <button class="avis__arrow avis__arrow--prev" type="button" aria-label="Avis précédent" aria-controls="avis-track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <button class="avis__arrow avis__arrow--next" type="button" aria-label="Avis suivant" aria-controls="avis-track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
      </div>
    </div>
  </div>
  <div class="avis__viewport">
    <ul class="avis__track" id="avis-track" aria-label="Avis Google clients" tabindex="0">
${cards}
    </ul>
  </div>
</section>
`;
writeFileSync(`${site}/partials/70-avis.html`, html);
console.log("ok", D.reviews.items.length);
