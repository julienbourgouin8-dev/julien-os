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

// Adresse d'expédition (atelier d'Adeline) — mêmes variables d'env que
// lib/sendcloud/rates.ts (déjà utilisées pour les devis de port).
function getFromAddress(): { name: string; address_line_1: string; postal_code: string; city: string; country_code: string } | null {
  const address_line_1 = process.env.SENDCLOUD_FROM_ADDRESS_LINE1;
  const postal_code = process.env.SENDCLOUD_FROM_POSTAL_CODE;
  const city = process.env.SENDCLOUD_FROM_CITY;
  if (!address_line_1 || !postal_code || !city) return null;
  return {
    name: "CréA'deline",
    address_line_1,
    postal_code,
    city,
    country_code: process.env.SENDCLOUD_FROM_COUNTRY || "FR",
  };
}

export type ServicePointDelivery = {
  id: number;
  postNumber?: string;
};

const ADDRESS_LINE_1_MAX = 32;

function splitAddressLine1(line1: string, maxLen = ADDRESS_LINE_1_MAX): { line1: string; overflow: string } {
  if (line1.length <= maxLen) return { line1, overflow: "" };
  let cut = line1.lastIndexOf(" ", maxLen);
  if (cut <= 0) cut = maxLen; // pas d'espace trouvé (mot unique très long) : coupe brute
  return { line1: line1.slice(0, cut).trim(), overflow: line1.slice(cut).trim() };
}

export async function createParcelAndLabel(params: {
  orderId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  address: RecipientAddress | null;
  totalCents: number;
  weightKg?: number;
  servicePoint?: ServicePointDelivery | null;
  // Code de l'option d'expédition (ex. "mondial_relay:home_domestic,dualapi/c2c")
  // — l'API v3 exige de préciser explicitement le service demandé, contrairement
  // à v2 qui laissait Sendcloud choisir seul. Vient de lib/sendcloud/rates.ts,
  // le même que celui utilisé pour calculer le prix facturé au client.
  shippingOptionCode?: string | null;
}): Promise<SendcloudParcelResult> {
  if (!isSendcloudConfigured()) {
    console.warn("[Sendcloud] Clés non configurées. Saut de la génération d'étiquette.");
    return {
      success: false,
      error: "Sendcloud n'est pas configuré (clés d'API absentes).",
    };
  }

  const fromAddress = getFromAddress();
  if (!fromAddress) {
    return { success: false, error: "Adresse d'expédition (SENDCLOUD_FROM_*) non configurée." };
  }

  if (!params.shippingOptionCode) {
    return { success: false, error: "Aucune option d'expédition retenue pour cette commande." };
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
  const weightKg = (params.weightKg ?? 0.5).toFixed(3); // Poids par défaut 500g pour confection textile si non fourni
  const totalValue = (params.totalCents / 100).toFixed(2);

  // Sendcloud limite address_line_1 à 32 caractères ("address 1 combined
  // with the house number") — une vraie adresse française avec un nom de
  // rue long la dépasse facilement (ex. "22 Rue du Terrier de
  // Bourguignole", 34 caractères, rencontré en test réel). On coupe au
  // dernier espace avant la limite et on renvoie le surplus sur la ligne 2
  // plutôt que de faire échouer toute la commande.
  const { line1: addressLine1, overflow } = splitAddressLine1(params.address.line1 || fromAddress.address_line_1);
  const addressLine2 = [overflow, params.address.line2].filter(Boolean).join(", ") || undefined;

  const payload = {
    from_address: fromAddress,
    to_address: {
      name: recipientName,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city: params.address.city,
      postal_code: params.address.postal_code,
      country_code: params.address.country || "FR",
      email: params.customerEmail || undefined,
      // Requis par certains transporteurs pour la livraison en point relais —
      // voir doc Sendcloud "post number goes in to_address.po_box".
      po_box: params.servicePoint?.postNumber || undefined,
    },
    ...(params.servicePoint ? { to_service_point: { id: String(params.servicePoint.id) } } : {}),
    ship_with: {
      type: "shipping_option_code",
      properties: { shipping_option_code: params.shippingOptionCode },
    },
    order_number: params.orderId,
    total_order_price: { currency: "EUR", value: totalValue },
    parcels: [{ weight: { value: weightKg, unit: "kg" } }],
  };

  try {
    const response = await fetch("https://panel.sendcloud.sc/api/v3/shipments/announce", {
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
      data?: {
        carrier?: { code?: string; name?: string };
        parcels?: {
          id?: number;
          tracking_number?: string;
          tracking_url?: string;
          documents?: { type?: string; link?: string }[];
        }[];
      };
    };

    const shipment = data.data;
    const parcel = shipment?.parcels?.[0];
    if (!parcel) {
      return { success: false, error: "Réponse Sendcloud vide." };
    }

    const labelUrl = parcel.documents?.find((d) => d.type === "label")?.link ?? null;
    const carrierName = shipment?.carrier?.name || shipment?.carrier?.code || "Sendcloud";

    return {
      success: true,
      parcelId: parcel.id ? String(parcel.id) : undefined,
      trackingNumber: parcel.tracking_number || null,
      trackingUrl: parcel.tracking_url || null,
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
