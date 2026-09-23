import "server-only";

export type ShippingMethod = "domicile" | "point_relais";

export type ShippingQuote = {
  method: ShippingMethod;
  label: string;
  priceCents: number;
  carrierCode: string;
  optionCode: string;
};

function getAuthHeader(): string | null {
  const pub = process.env.SENDCLOUD_PUBLIC_KEY;
  const sec = process.env.SENDCLOUD_SECRET_KEY;
  if (!pub || !sec) return null;
  return `Basic ${Buffer.from(`${pub}:${sec}`).toString("base64")}`;
}

function getFromAddress(): { country_code: string; postal_code: string; city: string; address_line_1: string } | null {
  const postal_code = process.env.SENDCLOUD_FROM_POSTAL_CODE;
  const city = process.env.SENDCLOUD_FROM_CITY;
  const address_line_1 = process.env.SENDCLOUD_FROM_ADDRESS_LINE1;
  if (!postal_code || !city || !address_line_1) return null;
  return { country_code: process.env.SENDCLOUD_FROM_COUNTRY || "FR", postal_code, city, address_line_1 };
}

// Destination générique (France métropolitaine) : les tarifs domicile/point
// relais des transporteurs nationaux ne varient pas par code postal en
// France, donc cette approximation suffit pour afficher/facturer un prix
// avant que Stripe ne collecte la vraie adresse du client.
const GENERIC_FR_DESTINATION = { country_code: "FR", postal_code: "75001", city: "Paris" };

// Un ou plusieurs codes candidats par méthode — le moins cher trouvé parmi
// eux est retenu. Ajuster cette liste si Adeline veut privilégier un
// transporteur précis plus tard.
const DOMICILE_OPTION_CODES = ["colissimo:home/fr", "chronopost:18", "chronopost:18mailbox"];
const POINT_RELAIS_OPTION_CODES = [
  "mondial_relay:service_point,dualapi/size=l,c2c",
  "mondial_relay:locker_delivery,dualapi",
  "colissimo:post-office",
];

type SendcloudShippingOption = {
  code: string;
  carrier?: { code?: string; name?: string };
  quotes?: { price?: { total?: { value?: string } } }[];
};

const DEFAULT_WEIGHT_GRAMS = 300;

export async function getShippingQuotes(weightGrams: number): Promise<ShippingQuote[] | null> {
  const auth = getAuthHeader();
  const fromAddress = getFromAddress();
  if (!auth || !fromAddress) return null;

  const weightKg = Math.max(weightGrams || DEFAULT_WEIGHT_GRAMS, 1) / 1000;

  try {
    const response = await fetch("https://panel.sendcloud.sc/api/v3/shipping-options", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        from_address: fromAddress,
        to_address: GENERIC_FR_DESTINATION,
        parcels: [{ weight: { value: weightKg.toFixed(3), unit: "kg" } }],
        calculate_quotes: true,
      }),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { data?: SendcloudShippingOption[] };
    const options = data.data ?? [];

    const pick = (codes: string[], method: ShippingMethod, label: string): ShippingQuote | null => {
      let best: ShippingQuote | null = null;
      for (const opt of options) {
        if (!codes.includes(opt.code)) continue;
        const priceStr = opt.quotes?.[0]?.price?.total?.value;
        if (!priceStr) continue;
        const priceCents = Math.round(parseFloat(priceStr) * 100);
        if (Number.isNaN(priceCents)) continue;
        if (!best || priceCents < best.priceCents) {
          best = { method, label, priceCents, carrierCode: opt.carrier?.code ?? "", optionCode: opt.code };
        }
      }
      return best;
    };

    const quotes = [
      pick(DOMICILE_OPTION_CODES, "domicile", "Livraison à domicile"),
      pick(POINT_RELAIS_OPTION_CODES, "point_relais", "Point Relais"),
    ].filter((q): q is ShippingQuote => q !== null);

    return quotes.length > 0 ? quotes : null;
  } catch {
    return null;
  }
}
