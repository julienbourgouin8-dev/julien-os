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

// Sélection dynamique via `functionalities.last_mile` plutôt qu'une liste de
// codes transporteur figée : un code en dur (ex. "colissimo:home/fr") avait
// fait rater Mondial Relay Home Domestic, moins cher que Colissimo Home sur
// ce compte — la comparaison sur tout le catalogue évite de refaire cette
// erreur si les tarifs ou options disponibles changent.
const HOME_DELIVERY = "home_delivery";
const POINT_RELAIS_LAST_MILE = ["service_point", "locker", "locker_or_service_point"];

// Produit de test Sendcloud ("Unstamped letter", carrier "sendcloud", 0€) —
// jamais une vraie option d'expédition, à exclure explicitement.
const EXCLUDED_CARRIER_CODES = ["sendcloud"];

type SendcloudShippingOption = {
  code: string;
  carrier?: { code?: string; name?: string };
  functionalities?: { last_mile?: string };
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

    const pick = (
      matches: (lastMile: string | undefined) => boolean,
      method: ShippingMethod,
      label: string,
    ): ShippingQuote | null => {
      let best: ShippingQuote | null = null;
      for (const opt of options) {
        const carrierCode = opt.carrier?.code ?? "";
        if (EXCLUDED_CARRIER_CODES.includes(carrierCode)) continue;
        if (!matches(opt.functionalities?.last_mile)) continue;
        const priceStr = opt.quotes?.[0]?.price?.total?.value;
        if (!priceStr) continue;
        const priceCents = Math.round(parseFloat(priceStr) * 100);
        if (Number.isNaN(priceCents) || priceCents <= 0) continue;
        if (!best || priceCents < best.priceCents) {
          best = { method, label, priceCents, carrierCode, optionCode: opt.code };
        }
      }
      return best;
    };

    const quotes = [
      pick((lastMile) => lastMile === HOME_DELIVERY, "domicile", "Livraison à domicile"),
      pick((lastMile) => Boolean(lastMile && POINT_RELAIS_LAST_MILE.includes(lastMile)), "point_relais", "Point Relais"),
    ].filter((q): q is ShippingQuote => q !== null);

    return quotes.length > 0 ? quotes : null;
  } catch {
    return null;
  }
}
