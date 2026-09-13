"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_EVENT, getConsent, setConsent, type ConsentValue } from "@/lib/consent";

// Bandeau RGPD/CNIL — overlay plein écran + carte centrée, une seule vue
// (pas d'étape "Personnaliser" séparée à cliquer : les cases sont visibles
// directement). CréA'deline n'a qu'UN SEUL traitement non-essentiel (mesure
// d'audience), donc un seul vrai curseur — pas une matrice de partenaires
// publicitaires qui n'existent pas ici.
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60"
      style={{ backgroundColor: checked ? "var(--color-denim)" : "rgba(36,27,21,0.15)" }}
    >
      <span
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    function onChange(e: Event) {
      const detail = (e as CustomEvent<ConsentValue | null>).detail;
      setVisible(detail === null);
      // Le composant reste monté entre deux ouvertures (ex. réouvert via
      // "Gérer les cookies") — sans ce reset, le curseur garde le dernier
      // choix en mémoire au lieu de repartir décoché à chaque réouverture.
      if (detail === null) setAnalyticsOn(false);
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gestion des cookies"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-paper p-7 shadow-[0_24px_60px_rgba(36,27,21,0.25)] sm:p-8"
      >
        <p className="font-script text-2xl text-ink">CréA&apos;deline</p>
        <h2 className="mt-3 font-display text-xl font-semibold text-ink">Gestion des cookies</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Ce site utilise un outil de mesure d&apos;audience pour comprendre comment
          il est visité et l&apos;améliorer. Aucune donnée n&apos;est revendue ni
          utilisée à des fins publicitaires.{" "}
          <Link href="/cookies" className="underline decoration-line underline-offset-2 hover:text-denim">
            Politique de cookies
          </Link>
        </p>

        <div className="mt-5 space-y-4 border-t border-line pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">
                Fonctionnement du site <span className="font-normal text-ink/40">(toujours actif)</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                Nécessaire pour que le panier et vos préférences de navigation
                fonctionnent. Ne nécessite pas de consentement.
              </p>
            </div>
            <Toggle checked disabled />
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
            <div>
              <p className="text-sm font-semibold text-ink">Mesure d&apos;audience</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                Nous aide à comprendre quelles pages sont visitées, pour améliorer
                le site. Pas de publicité, pas de partage à des tiers.
              </p>
            </div>
            <Toggle checked={analyticsOn} onChange={setAnalyticsOn} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setConsent(analyticsOn ? "accepted" : "refused")}
            className="w-full rounded-full bg-denim px-6 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5 sm:w-auto"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  );
}
