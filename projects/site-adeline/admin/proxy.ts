import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";

// Next.js 16 a renommé middleware.ts en proxy.ts — voir node_modules/next/dist/docs.
//
// Toute cette app est de l'admin (contrairement au site public où seul
// /admin/** était protégé) : on protège tout sauf /login et /uploads. Check
// "optimiste" (cookie présent/valide ou non) — le vrai verrou est
// `verifySessionToken` rappelé dans app/(protected)/layout.tsx.
//
// /uploads exclu volontairement : quand next/image charge une miniature
// produit, c'est une requête serveur-à-serveur (l'optimiseur d'images de
// Next qui va chercher le fichier), pas une requête du navigateur — elle ne
// porte jamais le cookie de session. Protégée, cette route redirigeait vers
// /login (HTML, pas une image) et next/image affichait une image cassée.
// Pas un souci de sécurité : ce sont les mêmes photos déjà publiques sur la
// boutique.
export function proxy(request: NextRequest) {
  const isLoginRoute = request.nextUrl.pathname === "/login";
  const isUploadsRoute = request.nextUrl.pathname.startsWith("/uploads/");
  const valid = verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);

  if (!valid && !isLoginRoute && !isUploadsRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
