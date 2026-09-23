import "server-only";

export type SendcloudParcelResult = {
  success: boolean;
  parcelId?: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  carrier?: string;
  error?: string;
};

export type RecipientAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  state?: string | null;
  country?: string | null;
};

export function isSendcloudConfigured(): boolean {
  return Boolean(process.env.SENDCLOUD_PUBLIC_KEY && process.env.SENDCLOUD_SECRET_KEY);
}

function getAuthHeader(): string {
  const pub = process.env.SENDCLOUD_PUBLIC_KEY;
  const sec = process.env.SENDCLOUD_SECRET_KEY;
  if (!pub || !sec) {
    throw new Error("Clés Sendcloud manquantes (SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY).");
  }
  return `Basic ${Buffer.from(`${pub}:${sec}`).toString("base64")}`;
}

export type ServicePointDelivery = {
  id: number;
  postNumber?: string;
};

export async function createParcelAndLabel(params: {
  orderId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  address: RecipientAddress | null;
  totalCents: number;
  weightKg?: number;
  servicePoint?: ServicePointDelivery | null;
}): Promise<SendcloudParcelResult> {
  if (!isSendcloudConfigured()) {
    console.warn("[Sendcloud] Clés non configurées. Saut de la génération d'étiquette.");
    return {
      success: false,
      error: "Sendcloud n'est pas configuré (clés d'API absentes).",
    };
  }

  // Livraison en point relais : Sendcloud a quand même besoin d'une adresse
  // postale du client (facturation/identité), mais achemine physiquement le
  // colis vers `to_service_point`, pas vers cette adresse — voir
  // https://sendcloud.dev/docs/service-points/creating-a-parcel-with-service-point-delivery
  if (!params.address || !params.address.postal_code || !params.address.city) {
    return {
      success: false,
      error: "Adresse de livraison incomplète.",
    };
  }
  if (!params.servicePoint && !params.address.line1) {
    return {
      success: false,
      error: "Adresse de livraison incomplète.",
    };
  }

  const recipientName = params.customerName?.trim() || "Client CréA'deline";
  const weight = (params.weightKg ?? 0.5).toFixed(3); // Poids par défaut 500g pour confection textile si non fourni
  const totalValue = (params.totalCents / 100).toFixed(2);

  const payload = {
    parcel: {
      name: recipientName,
      address: params.address.line1 || "Point Relais",
      address_2: params.address.line2 || "",
      city: params.address.city,
      postal_code: params.address.postal_code,
      country: params.address.country || "FR",
      email: params.customerEmail || "",
      order_number: params.orderId,
      total_order_value: totalValue,
      total_order_value_currency: "EUR",
      weight,
      request_label: true,
      ...(params.servicePoint
        ? {
            to_service_point: params.servicePoint.id,
            to_post_number: params.servicePoint.postNumber || "",
          }
        : {}),
    },
  };

  try {
    const response = await fetch("https://panel.sendcloud.sc/api/v2/parcels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Sendcloud API Error]", response.status, errorText);
      return {
        success: false,
        error: `Erreur Sendcloud (${response.status}): ${errorText}`,
      };
    }

    const data = (await response.json()) as {
      parcel?: {
        id?: number;
        tracking_number?: string;
        tracking_url?: string;
        label?: {
          label_printer?: string;
          normal_printer?: string[];
        };
        carrier?: {
          code?: string;
          name?: string;
        };
      };
    };

    const p = data.parcel;
    if (!p) {
      return { success: false, error: "Réponse Sendcloud vide." };
    }

    const labelUrl =
      p.label?.label_printer ||
      (Array.isArray(p.label?.normal_printer) && p.label.normal_printer[0]) ||
      null;

    const carrierName = p.carrier?.name || p.carrier?.code || "Sendcloud / Colissimo";

    return {
      success: true,
      parcelId: p.id ? String(p.id) : undefined,
      trackingNumber: p.tracking_number || null,
      trackingUrl: p.tracking_url || null,
      labelUrl,
      carrier: carrierName,
    };
  } catch (err) {
    console.error("[Sendcloud Network/Exception]", err);
    return {
      success: false,
      error: (err as Error).message || "Erreur inconnue lors de l'appel Sendcloud.",
    };
  }
}
