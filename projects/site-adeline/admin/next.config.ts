import type { NextConfig } from "next";

// Images servies en same-origin depuis /uploads (voir admin/app/uploads/[...path]/route.ts)
// depuis le passage à un stockage local — plus de remotePatterns externe requis.
const nextConfig: NextConfig = {
  // Petit badge "N" en bas à gauche en dev (infos de route Next.js) — coupé,
  // Julien le prenait pour un widget qu'on avait ajouté et le trouvait
  // gênant. Les erreurs de compilation/runtime restent affichées quand même.
  devIndicators: false,
  // Le formulaire produit envoie plusieurs photos réelles (souvent 2-5 Mo
  // chacune, pas les JPEG déjà compressés utilisés en test) dans une seule
  // Server Action — la limite par défaut de Next (1 Mo) rejette ça direct
  // ("Body exceeded 1 MB limit"). 20 Mo laisse de la marge pour plusieurs
  // photos non compressées à la fois.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    // proxy.ts tourne sur toutes les routes (dont /products/new) — Next
    // bufferise une copie du corps de requête pour lui, plafonnée à 10 Mo
    // par défaut. Au-delà, le corps est tronqué silencieusement (juste un
    // warning en log) et le parseur multipart plante ensuite avec
    // "Unexpected end of form". Alignée sur bodySizeLimit ci-dessus.
    proxyClientMaxBodySize: "20mb",
  },
  // Même durcissement que app/ (voir audit sécurité 2026-09-13) — l'admin
  // n'a encore aucune raison d'être chargé dans une iframe tierce.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
