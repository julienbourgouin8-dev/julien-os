"use client";

import Script from "next/script";
import { useEffect, useState, type ReactNode } from "react";
import { formatPrice } from "@/components/ProductCard";

export type ServicePoint = {
  id: number;
  postNumber?: string;
  name?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  carrier?: string;
};

type ShippingMethod = "domicile" | "point_relais";
type Quote = { method: ShippingMethod; label: string; priceCents: number } | null;

export type ShippingState = {
  method: ShippingMethod | null;
  priceCents: number;
  servicePoint: ServicePoint | null;
  // false tant qu'une sélection obligatoire manque (méthode, ou point relais
  // précis) — le bouton "Passer commande" reste désactivé jusque là.
  ready: boolean;
};

type SendcloudServicePointRaw = {
  id: number;
  name?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  carrier?: string;
};

declare global {
  interface Window {
    sendcloud?: {
      servicePoints: {
        open: (
          config: Record<string, unknown>,
          onSuccess: (servicePoint: SendcloudServicePointRaw, postNumber: string) => void,
          onFailure: (err: unknown) => void,
        ) => void;
      };
    };
  }
}

// Doit rester synchronisé avec POINT_RELAIS_CARRIERS dans lib/sendcloud/rates.ts.
const POINT_RELAIS_CARRIERS = "mondial_relay,chronopost";

// Reverse-géocodage gratuit, sans clé API (Nominatim/OpenStreetMap) — juste
// pour centrer le widget près du client, jamais stocké ni envoyé au serveur.
async function reverseGeocode(lat: number, lon: number): Promise<{ postalCode?: string; city?: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};
    return {
      postalCode: addr.postcode,
      city: addr.city || addr.town || addr.village || addr.municipality,
    };
  } catch {
    return null;
  }
}

function locateUser(): Promise<{ postalCode?: string; city?: string } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => resolve(await reverseGeocode(pos.coords.latitude, pos.coords.longitude)),
      () => resolve(null), // permission refusée/indisponible : le client tapera lui-même dans le widget
      { timeout: 5000, maximumAge: 300000 },
    );
  });
}

export default function ShippingMethodPicker({
  items,
  onChange,
}: {
  items: { productId: string; quantity: number }[];
  onChange: (state: ShippingState) => void;
}) {
  const [domicile, setDomicile] = useState<Quote>(null);
  const [pointRelais, setPointRelais] = useState<Quote>(null);
  const [pointRelaisByCarrier, setPointRelaisByCarrier] = useState<Record<string, Quote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [method, setMethod] = useState<ShippingMethod | null>(null);
  const [servicePoint, setServicePoint] = useState<ServicePoint | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [locating, setLocating] = useState(false);

  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    let cancelled = false;
    setLoadingQuotes(true);
    fetch("/api/shipping-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: JSON.parse(itemsKey) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setDomicile(data.domicile ?? null);
        setPointRelais(data.point_relais ?? null);
        setPointRelaisByCarrier(data.pointRelaisByCarrier ?? {});
      })
      .catch(() => {
        if (!cancelled) {
          setDomicile(null);
          setPointRelais(null);
          setPointRelaisByCarrier({});
        }
      })
      .finally(() => !cancelled && setLoadingQuotes(false));
    return () => {
      cancelled = true;
    };
  }, [itemsKey]);

  // Une fois un point précis choisi, le prix suit le transporteur réel de ce
  // point (Mondial Relay et Chronopost n'ont pas le même tarif) plutôt que
  // l'estimation "le moins cher" affichée avant le choix.
  const effectivePointRelais =
    method === "point_relais" && servicePoint?.carrier ? (pointRelaisByCarrier[servicePoint.carrier] ?? pointRelais) : pointRelais;

  useEffect(() => {
    const hasQuotes = Boolean(domicile || pointRelais);
    const priceCents =
      method === "domicile"
        ? (domicile?.priceCents ?? 0)
        : method === "point_relais"
          ? (effectivePointRelais?.priceCents ?? 0)
          : 0;
    const ready = !hasQuotes || method === "domicile" || (method === "point_relais" && Boolean(servicePoint));
    onChange({ method, priceCents, servicePoint, ready });
    // onChange volontairement omis des deps : le parent doit passer une
    // fonction stable (useCallback) sous peine de boucle de rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, servicePoint, domicile, pointRelais, effectivePointRelais]);

  const openPicker = async () => {
    const apiKey = process.env.NEXT_PUBLIC_SENDCLOUD_PUBLIC_KEY;
    if (!widgetReady || !apiKey || !window.sendcloud) return;

    setLocating(true);
    const located = await locateUser();
    setLocating(false);

    window.sendcloud.servicePoints.open(
      {
        apiKey,
        country: "FR",
        carriers: POINT_RELAIS_CARRIERS,
        language: "fr-fr",
        ...(located?.postalCode ? { postalCode: located.postalCode } : {}),
        ...(located?.city ? { city: located.city } : {}),
      },
      (sp, postNumber) => {
        setServicePoint({
          id: sp.id,
          postNumber,
          name: sp.name,
          street: sp.street,
          house_number: sp.house_number,
          postal_code: sp.postal_code,
          city: sp.city,
          country: sp.country,
          carrier: sp.carrier,
        });
      },
      () => {
        // Fermeture/échec du widget : on ne change rien, le client peut réessayer.
      },
    );
  };

  if (loadingQuotes) {
    return <p className="text-sm text-ink/50">Calcul des frais de port…</p>;
  }

  if (!domicile && !pointRelais) {
    return (
      <div className="flex justify-between text-ink/60">
        <span>Livraison</span>
        <span className="font-medium text-teal">Offerte</span>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://embed.sendcloud.sc/spp/1.0.0/api.min.js"
        strategy="afterInteractive"
        onReady={() => setWidgetReady(true)}
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Livraison</p>
        <div className="mt-2 space-y-2">
          {pointRelais && (
            <ShippingOption
              icon={<PinIcon />}
              label={servicePoint?.carrier ? (effectivePointRelais?.label ?? pointRelais.label) : `${pointRelais.label} (à partir de)`}
              priceCents={effectivePointRelais?.priceCents ?? pointRelais.priceCents}
              selected={method === "point_relais"}
              onSelect={() => setMethod("point_relais")}
            >
              {method === "point_relais" &&
                (servicePoint ? (
                  <div className="flex items-start justify-between gap-3 rounded-lg bg-denim/[0.06] px-3 py-2 text-xs text-ink/70">
                    <span>
                      <span className="font-semibold text-ink">{servicePoint.name}</span>
                      <br />
                      {servicePoint.street} {servicePoint.house_number}, {servicePoint.postal_code} {servicePoint.city}
                    </span>
                    <button
                      type="button"
                      onClick={openPicker}
                      className="shrink-0 font-semibold text-denim underline underline-offset-2"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.keys(pointRelaisByCarrier).length > 1 && (
                      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-ink/50">
                        {Object.values(pointRelaisByCarrier).map(
                          (q) =>
                            q && (
                              <span key={q.label}>
                                {q.label.replace("Point Relais ", "")} : {formatPrice(q.priceCents)}
                              </span>
                            ),
                        )}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={openPicker}
                      disabled={locating}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-denim/40 py-2 text-xs font-semibold text-denim transition-colors hover:bg-denim/[0.06] disabled:opacity-60"
                    >
                      {locating ? "Localisation…" : "Choisir mon point relais"}
                    </button>
                  </div>
                ))}
            </ShippingOption>
          )}

          {domicile && (
            <ShippingOption
              icon={<HomeIcon />}
              label={domicile.label}
              priceCents={domicile.priceCents}
              selected={method === "domicile"}
              onSelect={() => setMethod("domicile")}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ShippingOption({
  icon,
  label,
  priceCents,
  selected,
  onSelect,
  children,
}: {
  icon: ReactNode;
  label: string;
  priceCents: number;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-2 transition-colors ${
        selected ? "border-denim bg-denim/[0.04]" : "border-line bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-denim" : "border-ink/25"
          }`}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-denim" />}
        </span>
        <span className={`shrink-0 ${selected ? "text-denim" : "text-ink/40"}`}>{icon}</span>
        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-bold text-ink">{formatPrice(priceCents)}</span>
      </button>
      {children && <div className="px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}
