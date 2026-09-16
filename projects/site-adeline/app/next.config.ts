import type { NextConfig } from "next";

// Images servies en same-origin depuis /uploads (voir app/uploads/[...path]/route.ts)
// depuis le passage à un stockage local — plus de remotePatterns externe requis.
const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
