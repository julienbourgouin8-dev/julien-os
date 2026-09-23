"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, getConsent, type ConsentValue } from "@/lib/consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Chargement paresseux du script gtag.js — même logique que PostHogProvider
// (voir ce fichier) : rien n'est injecté dans la page tant que la visiteuse
// n'a pas accepté le bandeau cookies (CookieConsent.tsx), un seul et même
// consentement gate les deux outils de mesure.
function loadGtag(measurementId: string) {
  if (document.getElementById("ga4-script")) return;

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  // send_page_view désactivé : les vues de page sont envoyées manuellement
  // au changement de route (GAPageView plus bas), pour ne pas doubler le
  // premier pageview automatique de gtag avec celui du routeur client Next.
  window.gtag("config", measurementId, { send_page_view: false });
}

function GAPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window.gtag !== "function") return;
    const url = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    window.gtag("event", "page_view", { page_path: url });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consented, setConsented] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConsented(getConsent() === "accepted");
    function onChange(e: Event) {
      const detail = (e as CustomEvent<ConsentValue | null>).detail;
      setConsented(detail === "accepted");
      if (detail !== "accepted" && typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: "denied" });
      }
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!consented || !measurementId || loaded) return;
    loadGtag(measurementId);
    setLoaded(true);
  }, [consented, measurementId, loaded]);

  if (!loaded) return null;

  return (
    <Suspense fallback={null}>
      <GAPageView />
    </Suspense>
  );
}
