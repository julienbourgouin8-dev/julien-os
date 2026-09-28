"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import WriteOnHeading from "@/components/WriteOnHeading";

// Turbopack ne résout pas correctement le worker que maplibre-gl essaie de
// charger via `import.meta.url` (le chemin calculé pointe vers le chunk
// bundlé, pas vers le fichier réel du package) — résultat : la carte
// affichait un fond vide, aucune tuile jamais chargée, sans la moindre
// erreur visible (l'échec du Worker est silencieux). Fix documenté par
// MapLibre pour ce cas : copier le bundle worker en asset statique et
// pointer dessus explicitement avant de créer la carte.
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.js");
}

// Depuis le 2026-09-28, les marchés sont gérés depuis l'admin (section
// "Marchés", voir admin/app/(protected)/markets) plutôt qu'en dur ici — ce
// composant ne fait plus que les afficher. `lat`/`lng` sont géocodés
// automatiquement en admin depuis le champ "lieu" (api-adresse.data.gouv.fr) ;
// seuls les marchés ayant géocodé avec succès arrivent jusqu'ici (voir
// MarchesLazy.tsx), un marché sans coordonnées n'aurait ni pin ni flyTo
// possible.
export type MarketPin = {
  id: string;
  title: string;
  place: string;
  event_date: string | null;
  image: string | null;
  lat: number;
  lng: number;
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// Style vectoriel CARTO Positron — gratuit, sans clé API, rendu WebGL
// (vrai pan/zoom fluide), esthétique claire et minimale qui se fond dans
// la palette du site plutôt qu'un fond de carte chargé/daté.
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function Marches({ markets }: { markets: MarketPin[] }) {
  const [active, setActive] = useState(0);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);

  // création de la carte une seule fois
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [markets[0].lng, markets[0].lat],
      zoom: 10.3,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const popup = new Popup({
      offset: 20,
      closeButton: false,
      className: "marche-popup",
      maxWidth: "240px",
    });
    popupRef.current = popup;

    markersRef.current = markets.map((d, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "marche-pin";
      el.setAttribute("aria-label", `${d.title}, ${d.place}`);
      el.addEventListener("click", () => setActive(i));

      return new Marker({ element: el, anchor: "bottom" })
        .setLngLat([d.lng, d.lat])
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // synchronise pin actif + popup + cadrage à chaque changement de
  // sélection, que ce soit depuis la liste de gauche ou un clic sur la carte
  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup) return;
    const current = markets[active];

    markersRef.current.forEach((m, i) => {
      m.getElement().classList.toggle("marche-pin--active", i === active);
    });

    popup
      .setLngLat([current.lng, current.lat])
      .setHTML(
        `<div class="marche-popup-card">
          <img src="${current.image ?? "/products/stand-marche.webp"}" alt="" width="320" height="320" loading="lazy" />
          <div class="marche-popup-body">
            <p class="marche-popup-date">${formatDate(current.event_date) ?? "Charente"}</p>
            <p class="marche-popup-name">${current.title}</p>
            <p class="marche-popup-place">${current.place}</p>
          </div>
        </div>`,
      )
      .addTo(map);

    map.flyTo({ center: [current.lng, current.lat], zoom: 11.6, duration: 900, essential: true });
  }, [active, markets]);

  return (
    <section id="marches" className="scroll-mt-20 bg-paper px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            Nos marchés
          </p>
          <WriteOnHeading
            as="h2"
            text="Nos prochains évènements"
            blueWords={["évènements"]}
            className="mt-2 font-display text-3xl text-ink sm:text-4xl"
          />
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          {/* liste des marchés — la sélectionnée grossit et prend la
              couleur denim, cliquer recadre la carte sur la bonne ville */}
          <div className="flex flex-col gap-2">
            {markets.map((d, i) => {
              const date = formatDate(d.event_date);
              return (
                <button
                  key={d.id}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="group flex items-center gap-5 rounded-2xl px-4 py-4 text-left transition-colors duration-300"
                  style={{
                    backgroundColor: active === i ? "var(--color-denim)" : "transparent",
                  }}
                >
                  <div
                    className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl py-3 transition-colors duration-300"
                    style={{
                      backgroundColor: active === i ? "rgba(255,255,255,0.15)" : "var(--color-line)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={active === i ? "var(--color-paper)" : "var(--color-ink)"}
                      strokeWidth="1.8"
                    >
                      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <div>
                    {date && (
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-300"
                        style={{ color: active === i ? "var(--color-paper)" : "var(--color-teal)", opacity: active === i ? 0.85 : 1 }}
                      >
                        {date}
                      </p>
                    )}
                    <p
                      className="font-display text-lg italic transition-colors duration-300"
                      style={{ color: active === i ? "var(--color-paper)" : "var(--color-ink)" }}
                    >
                      {d.title}
                    </p>
                    <p
                      className="text-sm transition-colors duration-300"
                      style={{ color: active === i ? "var(--color-paper)" : "var(--color-ink)", opacity: active === i ? 0.75 : 0.55 }}
                    >
                      {d.place}
                    </p>
                  </div>
                </button>
              );
            })}
            <p className="mt-4 px-4 text-xs text-ink/40">
              Retrouvez CréA&apos;deline sur ces marchés en Charente.
            </p>
          </div>

          {/* carte réelle — MapLibre GL, vrai pan/zoom, pin cliquable avec
              popup image + description, synchronisée avec la liste */}
          <div className="relative overflow-hidden rounded-3xl border border-ink/10">
            <div ref={mapContainer} className="h-full w-full" style={{ aspectRatio: "4 / 3" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
