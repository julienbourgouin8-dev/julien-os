"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, getConsent, type ConsentValue } from "@/lib/consent";
import type posthogJs from "posthog-js";
import type { PostHogProvider as PHProviderType } from "posthog-js/react";

type PosthogClient = ReturnType<typeof posthogJs.init>;

function PostHogPageView({ posthogClient }: { posthogClient: PosthogClient }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  // Chargement paresseux du SDK (import() dynamique déclenché seulement
  // après consentement, voir effet plus bas) — avant ça, ni `posthog-js`
  // ni `posthog-js/react` n'atterrissent dans le bundle envoyé au
  // visiteur. Audit performance 2026-09-22 (PageSpeed Insights) : ces deux
  // packages étaient importés statiquement ici, donc chargés pour TOUT
  // visiteur dès le premier rendu (consentement ou non) — ~22 Ko de JS
  // obsolète/inutile signalés (polyfills `core-js`, dépendance transitive
  // de posthog-js) faisaient partie de ce poids.
  const [loaded, setLoaded] = useState<{
    client: PosthogClient;
    PHProvider: typeof PHProviderType;
  } | null>(null);

  useEffect(() => {
    setConsented(getConsent() === "accepted");
    function onChange(e: Event) {
      const detail = (e as CustomEvent<ConsentValue | null>).detail;
      setConsented(detail === "accepted");
      if (detail !== "accepted") loaded?.client.opt_out_capturing();
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!consented || !key || !host || loaded) return;
    let cancelled = false;
    Promise.all([import("posthog-js"), import("posthog-js/react")]).then(([{ default: posthog }, { PostHogProvider: PHProvider }]) => {
      if (cancelled) return;
      const client = posthog.init(key, { api_host: host, capture_pageview: false, capture_pageleave: true });
      setLoaded({ client: client ?? posthog, PHProvider });
    });
    return () => {
      cancelled = true;
    };
  }, [consented, key, host, loaded]);

  // Pas de clé configurée (dev local avant setup PostHog, ou variable
  // manquante en prod), pas de consentement, ou SDK pas encore chargé :
  // on rend juste les enfants sans tracker, plutôt que de planter le site.
  if (!loaded) return <>{children}</>;

  const { client, PHProvider } = loaded;

  return (
    <PHProvider client={client}>
      <Suspense fallback={null}>
        <PostHogPageView posthogClient={client} />
      </Suspense>
      {children}
    </PHProvider>
  );
}
