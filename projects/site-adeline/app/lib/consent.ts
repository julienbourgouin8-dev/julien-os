"use client";

// Consentement cookies (PostHog). Choix stocké en localStorage, jamais un
// cookie de tracking lui-même — c'est le mécanisme qui décide si PostHog a
// le droit de s'initialiser, pas une donnée qu'on transmet à un tiers.
export const CONSENT_KEY = "creadeline_cookie_consent";
export const CONSENT_EVENT = "creadeline-cookie-consent-change";

export type ConsentValue = "accepted" | "refused";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "refused" ? v : null;
}

export function setConsent(value: ConsentValue): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

// Permet de rouvrir le bandeau depuis un lien "Gérer les cookies" au pied
// de page — le retrait du consentement doit être aussi simple que le don.
export function resetConsent(): void {
  window.localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}
