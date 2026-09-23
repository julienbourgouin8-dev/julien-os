"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
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

export default function ShippingMethodPicker({
  items,
  onChange,
}: {
  items: { productId: string; quantity: number }[];
  onChange: (state: ShippingState) => void;
}) {
  const [domicile, setDomicile] = useState<Quote>(null);
  const [pointRelais, setPointRelais] = useState<Quote>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [method, setMethod] = useState<ShippingMethod | null>(null);
  const [servicePoint, setServicePoint] = useState<ServicePoint | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);

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
      })
      .catch(() => {
        if (!cancelled) {
          setDomicile(null);
          setPointRelais(null);
        }
      })
      .finally(() => !cancelled && setLoadingQuotes(false));
    return () => {
      cancelled = true;
    };
  }, [itemsKey]);

  useEffect(() => {
    const hasQuotes = Boolean(domicile || pointRelais);
    const priceCents =
      method === "domicile" ? (domicile?.priceCents ?? 0) : method === "point_relais" ? (pointRelais?.priceCents ?? 0) : 0;
    const ready = !hasQuotes || method === "domicile" || (method === "point_relais" && Boolean(servicePoint));
    onChange({ method, priceCents, servicePoint, ready });
    // onChange volontairement omis des deps : le parent doit passer une
    // fonction stable (useCallback) sous peine de boucle de rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, servicePoint, domicile, pointRelais]);

  const openPicker = () => {
    const apiKey = process.env.NEXT_PUBLIC_SENDCLOUD_PUBLIC_KEY;
    if (!widgetReady || !apiKey || !window.sendcloud) return;
    window.sendcloud.servicePoints.open(
      { apiKey, country: "FR", carriers: "mondial_relay" },
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
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Livraison</p>

        {pointRelais && (
          <div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shippingMethod"
                  checked={method === "point_relais"}
                  onChange={() => setMethod("point_relais")}
                />
                {pointRelais.label}
              </span>
              <span className="font-medium text-ink">{formatPrice(pointRelais.priceCents)}</span>
            </label>
            {method === "point_relais" && (
              <div className="mt-1.5 pl-7 text-xs">
                {servicePoint ? (
                  <p className="text-ink/60">
                    {servicePoint.name} — {servicePoint.street} {servicePoint.house_number}, {servicePoint.postal_code}{" "}
                    {servicePoint.city}{" "}
                    <button type="button" onClick={openPicker} className="text-denim underline">
                      Changer
                    </button>
                  </p>
                ) : (
                  <button type="button" onClick={openPicker} className="text-denim underline">
                    Choisir mon point relais
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {domicile && (
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="shippingMethod"
                checked={method === "domicile"}
                onChange={() => setMethod("domicile")}
              />
              {domicile.label}
            </span>
            <span className="font-medium text-ink">{formatPrice(domicile.priceCents)}</span>
          </label>
        )}
      </div>
    </>
  );
}
