// Assemble index.html à partir de partials/*.html (ordre alphabétique : 00-nav, 10-hero, 20-...).
// Injecte automatiquement css/sections/*.css et js/sections/*.js.
// Usage : node tools/build.mjs     (à relancer après toute modif d'un partial ; sans risque en parallèle)
import { readFileSync, readdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ls = (d, ext) => readdirSync(join(root, d)).filter((f) => f.endsWith(ext) && !f.startsWith("_")).sort();
const parts = ls("partials", ".html").map((f) => `<!-- ===== partials/${f} ===== -->\n` + readFileSync(join(root, "partials", f), "utf8"));
const css = ls("css/sections", ".css").map((f) => `<link rel="stylesheet" href="css/sections/${f}">`).join("\n");
const js = ls("js/sections", ".js").map((f) => `<script src="js/sections/${f}"></script>`).join("\n");
const head = readFileSync(join(root, "partials/_head.html"), "utf8").replace("<!--SECTION_CSS-->", css);
const foot = readFileSync(join(root, "partials/_foot.html"), "utf8").replace("<!--SECTION_JS-->", js);
// Anti-cache : ?v=<horodatage> sur les css/js locaux, sinon le navigateur garde d'anciennes versions
// (le serveur de dev python n'envoie aucun en-tête de cache). Appliqué aussi à evenements.html.
const v = Date.now().toString(36);
const bust = (html) => html.replace(/((?:href|src)="(?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[a-z0-9]+)?"/g, `$1?v=${v}"`);
const out = bust(head + "\n" + parts.join("\n") + "\n" + foot);
const evPath = join(root, "evenements.html");
writeFileSync(evPath, bust(readFileSync(evPath, "utf8")));
const tmp = join(root, `.index.${process.pid}.tmp`);
writeFileSync(tmp, out); renameSync(tmp, join(root, "index.html"));
console.log(`index.html : ${parts.length} partials, ${css.split("\n").filter(Boolean).length} css, ${js.split("\n").filter(Boolean).length} js`);
