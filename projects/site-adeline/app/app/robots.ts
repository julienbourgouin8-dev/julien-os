import type { MetadataRoute } from "next";

const SITE_URL = "https://creadeline16.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panier", "/commande", "/api", "/vitrine-test"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
