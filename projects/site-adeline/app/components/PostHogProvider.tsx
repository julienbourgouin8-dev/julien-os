"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { CONSENT_EVENT, getConsent, type ConsentValue } from "@/lib/consent";

// Next.js App Router ne déclenche pas de vrai rechargement de page à la
// navigation (client-side routing) — le pageview automatique de PostHog
// (pensé pour des rechargements complets) rate donc les changements de
// route. On désactive `capture_pageview` par défaut et on capture
// manuellement à chaque changement de pathname/query, pattern recommandé
// par PostHog pour l'App Router.
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (!pathname || !posthogClient) return;
    const url = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    posthogClient.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthogClient]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // RGPD/CNIL : PostHog n'est pas strictement nécessaire au fonctionnement
  // du site, donc jamais initialisé avant un consentement explicite (voir
  // CookieConsent.tsx). Pas de choix stocké = pas de tracking, par défaut.
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(getConsent() === "accepted");
    function onChange(e: Event) {
      const detail = (e as CustomEvent<ConsentValue | null>).detail;
      setConsented(detail === "accepted");
      if (detail !== "accepted") posthog.opt_out_capturing();
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // Pas de clé configurée (dev local avant setup PostHog, ou variable
  // manquante en prod) : on rend juste les enfants sans tracker, plutôt que
  // de planter le site.
  if (!key || !host || !consented) return <>{children}</>;

  return (
    <PHProvider
      apiKey={key}
      options={{
        api_host: host,
        capture_pageview: false,
        capture_pageleave: true,
      }}
    >
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

export { posthog };
