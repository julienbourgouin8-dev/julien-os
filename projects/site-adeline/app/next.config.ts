import type { NextConfig } from "next";

// Images servies en same-origin depuis /uploads (voir app/uploads/[...path]/route.ts)
// depuis le passage à un stockage local — plus de remotePatterns externe requis.
const nextConfig: NextConfig = {
  images: {
    // AVIF avant WebP (audit perf 2026-09-22, PSI signalait le hero PNG
    // comme élément LCP avec ~291 Kio d'économie possible) — Next
    // sert déjà du WebP par défaut, AVIF compresse encore ~20-30% de
    // mieux sur les photos et se négocie automatiquement selon le header
    // Accept du navigateur (fallback WebP transparent pour les
    // navigateurs qui ne supportent pas AVIF, zéro changement visuel).
    formats: ["image/avif", "image/webp"],
  },
  // Anti-clickjacking (le site n'a aucune raison d'être chargé dans une
  // iframe tierce) + durcissement de base. Pas de Content-Security-Policy
  // script-src stricte ici : Next.js App Router s'appuie sur des scripts
  // inline pour le payload RSC, une CSP stricte demanderait un système de
  // nonce par requête à mettre en place et tester à part (voir audit
  // sécurité du 2026-09-13) — frame-ancestors suffit pour la faille réelle
  // identifiée (clickjacking), le reste est un chantier séparé.
  async headers() {
    // En développement seulement, l'encadrement same-origin est autorisé :
    // c'est ce dont a besoin l'aperçu iPhone (public/dev-iphone.html), qui
    // charge le site dans une iframe aux dimensions d'un téléphone. La prod
    // reste en DENY / frame-ancestors 'none' — aucun relâchement en ligne.
    const isDev = process.env.NODE_ENV === "development";

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: isDev ? "SAMEORIGIN" : "DENY" },
          {
            key: "Content-Security-Policy",
            value: isDev ? "frame-ancestors 'self';" : "frame-ancestors 'none';",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Migration VPS (2026-09-22) : les pages statiquement pré-rendues
      // partaient avec `Cache-Control: s-maxage=31536000` (un an) sans
      // directive `max-age`/`private` explicite pour les navigateurs eux-
      // mêmes — chaque redéploiement change les hash des fichiers JS/CSS
      // référencés par ce HTML, mais un HTML caché trop longtemps continue
      // à pointer vers d'anciens fichiers qui n'existent plus. Résultat
      // observé en vrai (retour Julien, iPhone Safari) : rechargements qui
      // alternaient entre une version fraîche et une version cassée/périmée
      // du HTML au hasard des heuristiques de cache mobile. Le document
      // HTML doit toujours être revalidé (`no-cache` : le navigateur peut
      // garder une copie mais doit vérifier l'ETag à chaque fois — rapide,
      // 304 si rien n'a changé) ; SEULS les fichiers sous `/_next/static/`
      // portent un hash de contenu dans leur nom et peuvent être mis en
      // cache indéfiniment sans risque, Next.js gère déjà ça correctement,
      // on ne touche pas à ceux-là (pattern d'exclusion regex ci-dessous).
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
      // Correction du `no-cache` ci-dessus pour les fichiers statiques du
      // dossier `public/` (vidéos, images) : la règle du dessus les
      // attrapait aussi par erreur (pas de hash de contenu dans leur nom,
      // mais couverts par le pattern d'exclusion pensé seulement pour
      // `_next/static`/`_next/image`). Conséquence observée en vrai
      // (retour Julien 2026-09-22) : les vidéos produit cassaient après un
      // simple rechargement de page sur Safari iOS — bug WebKit connu, la
      // lecture vidéo échoue quand la réponse passe par une revalidation
      // conditionnelle (304) au lieu d'un téléchargement complet, exactement
      // ce que `no-cache` force à chaque requête. Cette règle, plus
      // spécifique et placée après, reprend la main sur `Cache-Control`
      // pour ces chemins (Next.js applique les règles dans l'ordre, la
      // dernière correspondance gagne pour une même clé d'en-tête) — cache
      // d'une heure, assez court pour qu'un fichier remplacé (même nom,
      // nouveau contenu — arrivé plusieurs fois pendant l'audit perf) se
      // rafraîchisse vite, assez long pour ne jamais forcer une
      // revalidation vidéo par vidéo.
      {
        // Les médias de marque et produit sont versionnés par leur nom.
        // Toute future modification doit donc créer un nouveau nom de
        // fichier, ce qui permet un cache navigateur long et sûr.
        source: "/(brand|products)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Les uploads administrables peuvent conserver le même chemin lors
        // d'une correction : cache court pour ne pas figer une ancienne
        // photo produit pendant un an.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
