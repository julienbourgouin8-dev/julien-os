"use client";

import dynamic from "next/dynamic";

// MapLibre GL (JS + CSS) est lourd (rendu WebGL, ~200 Ko) et la carte est
// toujours en bas de page, jamais visible au chargement initial — le
// charger en dehors du bundle critique (au lieu d'un import statique) sort
// son JS et son CSS du chemin de rendu critique. `ssr: false` : MapLibre
// touche `window`/le DOM directement à l'init, pas de rendu serveur
// possible de toute façon — nécessite ce wrapper "use client" séparé,
// `ssr: false` n'est pas autorisé dans un Server Component (page.tsx).
// Placeholder à la même hauteur que la carte réelle (aspect-[4/3] sur la
// colonne carte) pour ne pas provoquer de décalage de mise en page (CLS)
// pendant le chargement du chunk.
const Marches = dynamic(() => import("@/components/Marches"), {
  ssr: false,
  loading: () => (
    <section className="bg-paper px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div />
          <div className="rounded-3xl border border-ink/10" style={{ aspectRatio: "4 / 3" }} />
        </div>
      </div>
    </section>
  ),
});

export default Marches;
