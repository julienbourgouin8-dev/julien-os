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
  // Conserver exactement la forme du snippet officiel Google. Le chargeur
  // gtag reconnaît les objets `arguments`, pas de simples tableaux issus
  // d'un rest parameter : avec `push(args)`, les commandes restaient dans
  // dataLayer sans jamais produire de requête /g/collect.
  window.gtag = function gtag(..._args: unknown[]) {
    window.dataLayer.push(arguments);
  };
  // Consent Mode : loadGtag() n'est appelé qu'après acceptation explicite du
  // toggle "Mesure d'audience" (voir plus bas), donc analytics_storage est
  // toujours "granted" ici — mais Google exige un signal de consentement
  // explicite (même juste celui-ci) avant de accepter d'envoyer le moindre
  // hit ; sans cet appel, le tag charge et traite les commandes en interne
  // (dataLayer, window.google_tag_manager) mais n'émet jamais de requête
  // réseau vers google-analytics.com (constaté en prod le 2026-09-23,
  // zéro hit malgré un tag correctement initialisé). ad_storage reste
  // "denied" : le bandeau ne demande jamais de consentement publicitaire.
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
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
