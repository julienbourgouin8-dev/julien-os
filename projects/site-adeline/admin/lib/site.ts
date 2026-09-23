// Même raison que app/lib/site.ts côté site public : ne pas dériver l'URL de
// `request.url`/`request.nextUrl` — le reverse proxy (Traefik/Coolify) ne
// transmet pas toujours le Host original au conteneur, ce qui casserait la
// redirection vers /login en prod (URL absolue résolue en localhost:3000).
export const SITE_URL =
  process.env.NODE_ENV === "production" ? "https://admin.creadeline16.fr" : "http://localhost:3000";
