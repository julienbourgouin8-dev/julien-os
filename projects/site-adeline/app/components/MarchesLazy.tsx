"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// MapLibre GL (JS + CSS) est lourd — pas seulement en octets (~200 Ko) mais
// en coût processeur réel à l'initialisation (création du contexte WebGL,
// parsing du style, rendu des tuiles). Un simple `next/dynamic` (tour 2 de
// l'audit perf, 2026-09-22) sort bien le JS du bundle critique au niveau
// réseau, mais son `import()` se déclenche dès que React atteint le rendu
// du composant — juste après l'hydratation, donc quasi immédiatement,
// quelle que soit la position de scroll réelle. Résultat mesuré (PSI) :
// le Total Blocking Time a AUGMENTÉ (710ms → 1080ms) après ce tour, alors
// que le poids réseau avait chuté de 67% — le travail CPU de MapLibre,
// plus rien pour le masquer côté réseau, tombait plus tôt dans la fenêtre
// de mesure du TBT (entre FCP et interactif).
// Ce wrapper ajoute un vrai déclenchement par visibilité (IntersectionObserver,
// rootMargin 400px — démarre un peu avant que la carte soit réellement à
// l'écran, pour ne pas laisser le placeholder visible le temps du chargement)
// : le composant Marches n'est ni importé ni monté tant que la section n'est
// pas sur le point d'entrer dans le viewport.
const Marches = dynamic(() => import("@/components/Marches"), { ssr: false });

const PLACEHOLDER = (
  <section className="bg-paper px-6 py-14">
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <div />
        <div className="rounded-3xl border border-ink/10" style={{ aspectRatio: "4 / 3" }} />
      </div>
    </div>
  </section>
);

export default function MarchesLazy() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  if (!visible) {
    return <div ref={ref}>{PLACEHOLDER}</div>;
  }
  return <Marches />;
}
