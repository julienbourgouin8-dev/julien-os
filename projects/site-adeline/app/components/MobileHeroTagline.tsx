"use client";

import { useEffect, useState } from "react";

type Knob = { top: number; x: number; size: number };

type Knobs = {
  des: Knob;
  qui: Knob;
  vous: Knob;
  // Logo texte du header ("CréA'deline", retour Julien 2026-09-16 :
  // "il faut qu'on décale aussi le logo"). `top` est inutilisé (il vit
  // dans la rangée hamburger/panier, pas de position verticale libre) —
  // gardé dans le type pour réutiliser le même panneau de curseurs,
  // simplement pas affiché pour ce groupe.
  logo: Knob;
};

// Valeurs par défaut = réglées par Julien lui-même via le panneau de
// dev-iphone.html le 2026-09-16 (copiées-collées depuis le bouton
// "Copier"), plus fidèles que le calcul géométrique initial puisque
// jugées directement à l'œil sur le rendu réel.
const DEFAULTS: Knobs = {
  des: { top: 21, x: 3.5, size: 2.3 },
  qui: { top: 46.5, x: 1.5, size: 2.3 },
  vous: { top: 92, x: 1.5, size: 2.1 },
  logo: { top: 0, x: 0, size: 1.875 },
};

const STORAGE_KEY = "hero-tagline-tune-v1";

// Taille fluide : la valeur réglée (en rem) n'est exacte qu'à la largeur
// de référence (l'iPhone 15/16 sur lequel Julien règle habituellement,
// 390px) — en `rem` fixe, "vous correspondent" en grande taille passe à
// la ligne sur un écran plus étroit (repéré sur iPhone SE, 320px). En
// vw entre un plancher et la valeur réglée (jamais plus grand que ce que
// Julien a choisi), le texte suit la largeur de l'écran comme le fait
// déjà le grand wordmark desktop (`clamp(...)` dans page.tsx).
const REF_WIDTH = 390;
function fluidRem(rem: number): string {
  const vw = ((rem * 16) / REF_WIDTH) * 100;
  return `clamp(${(rem * 0.72).toFixed(3)}rem, ${vw.toFixed(3)}vw, ${rem.toFixed(3)}rem)`;
}

function loadStored(): Knobs | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.des || !parsed.qui || !parsed.vous || !parsed.logo) return null;
    return parsed as Knobs;
  } catch {
    return null;
  }
}

/**
 * Tagline éclatée du hero mobile ("Des créations" / "qui" / "vous
 * correspondent" + CTA). Panneau de réglage ajouté le 2026-09-16 (retour
 * Julien : les allers-retours "screenshot → je mesure → je code → je
 * déploie → tu regardes" étaient trop lents) — avec `?tune=1` dans l'URL,
 * Julien ajuste lui-même position/taille directement sur son téléphone,
 * les valeurs sont sauvegardées en localStorage (donc persistent au
 * reload) et un bouton "Copier" les met dans le presse-papier pour me les
 * renvoyer. Sans `?tune=1`, le panneau ne s'affiche jamais et les valeurs
 * réglées restent actives (juste sans les curseurs) — une fois les
 * chiffres validés, ils doivent être recopiés en dur dans page.tsx et ce
 * composant peut redevenir statique.
 */
export default function MobileHeroTagline() {
  const [knobs, setKnobs] = useState<Knobs>(DEFAULTS);
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored) setKnobs(stored);
    const params = new URLSearchParams(window.location.search);
    setShowPanel(params.get("tune") === "1");

    // Deuxième façon de piloter les réglages (retour Julien 2026-09-16 :
    // le panneau sur la page mange trop d'écran sur téléphone) : depuis
    // `public/dev-iphone.html`, ouvert dans VS Code (Simple Browser), qui
    // affiche cette page dans un iframe à la largeur exacte d'un iPhone et
    // pilote les curseurs dans sa propre barre latérale — donc le rendu
    // garde toute la hauteur de l'écran. La page parente écrit dans le
    // localStorage de l'iframe (persistance au reload) ET poste un message
    // pour une mise à jour instantanée pendant qu'on bouge un curseur (un
    // write localStorage ne déclenche pas l'événement `storage` dans la
    // fenêtre qui l'a fait elle-même).
    function onMessage(e: MessageEvent) {
      if (e.data && e.data.type === "hero-tagline-tune" && e.data.knobs) {
        setKnobs(e.data.knobs as Knobs);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Le logo texte du header ("CréA'deline") est rendu par `page.tsx`, pas
  // par ce composant — il n'y a pas de prop/contexte entre les deux, donc
  // le réglage passe par des variables CSS sur la racine du document, que
  // le logo consomme via `var(--tag-logo-x, 0%)` etc.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--tag-logo-x", `${knobs.logo.x}%`);
    root.style.setProperty("--tag-logo-size", fluidRem(knobs.logo.size));
  }, [knobs.logo.x, knobs.logo.size]);

  const update = <K extends keyof Knobs>(key: K, patch: Partial<Knobs[K]>) => {
    setKnobs((prev) => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // pas grave si localStorage est indisponible (navigation privée...)
      }
      return next;
    });
  };

  const reset = () => {
    setKnobs(DEFAULTS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // idem
    }
  };

  const copyValues = async () => {
    const text = JSON.stringify(knobs, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponible (contexte non sécurisé, permission refusée...)
    }
  };

  return (
    <>
      <p
        className="absolute inset-x-0 -translate-y-1/2 px-6 text-center font-display font-medium italic leading-tight text-ink sm:hidden"
        style={{
          top: `${knobs.des.top}%`,
          transform: `translate(${knobs.des.x}%, -50%)`,
          fontSize: fluidRem(knobs.des.size),
        }}
      >
        Des{" "}
        <span className="not-italic font-sans font-bold text-denim">
          créations
        </span>
      </p>
      <p
        className="absolute inset-x-0 -translate-y-1/2 text-center font-display italic text-ink sm:hidden"
        style={{
          top: `${knobs.qui.top}%`,
          transform: `translate(${knobs.qui.x}%, -50%)`,
          fontSize: fluidRem(knobs.qui.size),
        }}
      >
        qui
      </p>
      <div
        className="absolute inset-x-0 -translate-y-1/2 px-6 text-center sm:hidden"
        style={{
          top: `${knobs.vous.top}%`,
          transform: `translate(${knobs.vous.x}%, -50%)`,
        }}
      >
        <p
          className="font-display font-medium italic leading-tight text-ink"
          style={{ fontSize: fluidRem(knobs.vous.size) }}
        >
          vous <span className="text-denim">correspondent</span>
        </p>
        <a
          href="#vitrine"
          className="hero-pop group mt-4 inline-flex items-center gap-2 rounded-full bg-denim px-8 py-3.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
        >
          Voir les créations
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </a>
      </div>

      {showPanel && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-ink/10 bg-white/95 p-4 text-ink shadow-[0_-8px_30px_rgba(0,0,0,0.25)] backdrop-blur sm:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-sans text-sm font-bold">Réglage tagline</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={copyValues}
                className="rounded-full bg-denim px-3 py-1 text-xs font-semibold text-paper"
              >
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          {(
            [
              ["des", "Des créations"],
              ["qui", "qui"],
              ["vous", "vous correspondent"],
              ["logo", "Logo header"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="mb-4 border-b border-ink/10 pb-3 last:border-0 last:pb-0">
              <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-ink/70">
                {label}
              </p>

              {key !== "logo" && (
                <>
                  <label className="mb-1 flex items-center justify-between font-sans text-xs">
                    <span>Position verticale</span>
                    <span className="tabular-nums">{knobs[key].top.toFixed(1)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={knobs[key].top}
                    onChange={(e) => update(key, { top: Number(e.target.value) })}
                    className="mb-2 w-full"
                  />
                </>
              )}

              <label className="mb-1 flex items-center justify-between font-sans text-xs">
                <span>Position horizontale</span>
                <span className="tabular-nums">{knobs[key].x.toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={knobs[key].x}
                onChange={(e) => update(key, { x: Number(e.target.value) })}
                className="mb-2 w-full"
              />

              <label className="mb-1 flex items-center justify-between font-sans text-xs">
                <span>Taille</span>
                <span className="tabular-nums">{knobs[key].size.toFixed(2)}rem</span>
              </label>
              <input
                type="range"
                min={1}
                max={3.5}
                step={0.05}
                value={knobs[key].size}
                onChange={(e) => update(key, { size: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          ))}

          <p className="mt-1 font-sans text-[0.65rem] text-ink/50">
            Réglages sauvegardés sur cet appareil. Appuie sur "Copier" et
            renvoie-moi les valeurs pour que je les fixe dans le code.
          </p>
        </div>
      )}
    </>
  );
}
