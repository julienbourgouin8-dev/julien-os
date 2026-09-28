// Génère offre/<id>.html pour chacune des 12 prestations Particulier à partir de offre/data.mjs.
// Usage : node scripts/build-offre-pages.mjs (depuis la racine du projet drivingsens-site).
// Ne jamais éditer un offre/<id>.html à la main — modifier data.mjs puis relancer ce script.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { OFFRE } from "../offre/data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OFFRE_DIR = join(__dirname, "..", "offre");

const FONT_LINK = `https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&family=Manrope:wght@300;400&family=Outfit:wght@200;300;400&family=Space+Grotesk:wght@300;400;500;600;700&family=Urbanist:wght@200;300;400;500;600&display=swap`;

function page(id, data) {
  const highlights = data.highlights.map((h) => `        <li>${h}</li>`).join("\n");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${data.title} — Driving Sens</title>
<meta name="description" content="${data.description}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONT_LINK}" rel="stylesheet" />
<link rel="stylesheet" href="../client-preview/styles.css" />
<link rel="stylesheet" href="../services-section-blue/styles.css" />
<link rel="stylesheet" href="../offre/styles.css" />
<link rel="stylesheet" href="/css/page-transition.css" />
</head>
<body class="mono" data-stat="txt-ombre" data-page-reveal data-offre-id="${id}">

<div class="bg-field" aria-hidden="true">
  <div class="bg-blobs">
    <span class="bg-blob bg-blob--1"></span>
    <span class="bg-blob bg-blob--2"></span>
    <span class="bg-blob bg-blob--3"></span>
    <span class="bg-blob bg-blob--4"></span>
    <span class="bg-blob bg-blob--5"></span>
    <span class="bg-blob bg-blob--6"></span>
  </div>
</div>

<nav class="prestation-nav">
  <a class="prestation-back" href="../index.html#services" data-zoom>← Retour aux prestations</a>
  <a class="prestation-logo" href="../index.html"><img src="../hero-concepts/assets/logo-white.png" alt="Driving Sens" /></a>
</nav>

<main class="prestation">
  <section class="prestation-hero" data-reveal-in>
    <span class="eyebrow">${data.category}</span>
    <h1>${data.title}</h1>
    <p class="prestation-tagline">${data.tagline}</p>
    <p class="prestation-description">${data.long}</p>
  </section>

  <section class="prestation-highlights" data-reveal-in>
    <h2>Ce que ça vous apporte</h2>
    <ul>
${highlights}
    </ul>
  </section>

  <div class="prestation-cta" data-reveal-in>
    <a class="recommend-button" href="#contact">${data.cta}</a>
  </div>
</main>

<script src="/js/page-transition.js"></script>
</body>
</html>
`;
}

for (const [id, data] of Object.entries(OFFRE)) {
  const out = join(OFFRE_DIR, `${id}.html`);
  writeFileSync(out, page(id, data), "utf8");
  console.log("wrote", out);
}
