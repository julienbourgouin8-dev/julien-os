// URL canonique du site public. Ne PAS dériver ça de `request.nextUrl.origin`
// ou d'un header `Host` — le reverse proxy (Traefik/Coolify) ne transmet pas
// toujours le Host original au conteneur, ce qui a produit des URLs Stripe
// Checkout (`success_url`/`cancel_url`) pointant vers `localhost:3000` en
// prod (trouvé le 2026-09-23 en interrogeant l'API Stripe sur une session
// réelle). En dev local, on reste sur localhost pour ne pas casser le test
// du checkout en local.
export const SITE_URL =
  process.env.NODE_ENV === "production" ? "https://creadeline16.fr" : "http://localhost:3000";
