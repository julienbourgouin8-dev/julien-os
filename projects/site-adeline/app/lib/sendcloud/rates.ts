import "server-only";

export type ShippingMethod = "domicile" | "point_relais";

export type ShippingQuote = {
  method: ShippingMethod;
  label: string;
  priceCents: number;
  carrierCode: string;
  optionCode: string;
  // Casier automatique (QR à scanner, "labelless") vs boutique tenue par un
  // commerçant (étiquette classique à imprimer) — un même transporteur (ex.
  // Mondial Relay) propose les deux avec des prix ET des shipping_option_code
  // différents. Sans cette distinction, le code réservait systématiquement
  // l'option la moins chère (souvent un casier) même quand le client avait
  // choisi une vraie boutique dans le widget — bug réel constaté en test :
  // point "Vival" (boutique) réservé comme casier, étiquette = juste un QR.
  isLocker: boolean;
};

export type ShippingQuotes = {
  domicile: ShippingQuote | null;
  // Toutes les options point relais (pas dédupliquées à "la moins chère par
  // transporteur") — nécessaire pour retrouver, une fois un point précis
  // choisi dans le widget, l'option qui correspond à son vrai type
  // (casier/boutique), pas juste son transporteur.
  pointRelaisOptions: ShippingQuote[];
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
// France (vérifié : même prix Paris/Marseille/Lille/Ajaccio), donc cette
// approximation suffit pour afficher/facturer un prix avant que Stripe ne
// collecte la vraie adresse du client.
const GENERIC_FR_DESTINATION = { country_code: "FR", postal_code: "75001", city: "Paris" };

// Sélection dynamique via `functionalities.last_mile` plutôt qu'une liste de
// codes transporteur figée : un code en dur (ex. "colissimo:home/fr") avait
// fait rater Mondial Relay Home Domestic, moins cher que Colissimo Home sur
// ce compte — la comparaison sur tout le catalogue évite de refaire cette
// erreur si les tarifs ou options disponibles changent.
const HOME_DELIVERY = "home_delivery";
const LOCKER_LAST_MILE = ["locker"];
const POINT_RELAIS_LAST_MILE = ["service_point", "locker", "locker_or_service_point"];

// Transporteurs proposés dans le widget de sélection de point relais — doit
// rester synchronisé avec `carriers` dans ShippingMethodPicker.tsx.
export const POINT_RELAIS_CARRIERS = ["mondial_relay", "chronopost"];

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

export async function getShippingQuotes(weightGrams: number): Promise<ShippingQuotes | null> {
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

    const toQuote = (opt: SendcloudShippingOption, method: ShippingMethod, label: string, isLocker: boolean): ShippingQuote | null => {
      const priceStr = opt.quotes?.[0]?.price?.total?.value;
      if (!priceStr) return null;
      const priceCents = Math.round(parseFloat(priceStr) * 100);
      if (Number.isNaN(priceCents) || priceCents <= 0) return null;
      return { method, label, priceCents, carrierCode: opt.carrier?.code ?? "", optionCode: opt.code, isLocker };
    };

    let domicile: ShippingQuote | null = null;
    // Meilleure option trouvée par (carrier, isLocker) — évite les doublons
    // tout en gardant chaque combinaison distincte.
    const bestByKey = new Map<string, ShippingQuote>();

    for (const opt of options) {
      const carrierCode = opt.carrier?.code ?? "";
      if (EXCLUDED_CARRIER_CODES.includes(carrierCode)) continue;
      const lastMile = opt.functionalities?.last_mile;

      if (lastMile === HOME_DELIVERY) {
        const quote = toQuote(opt, "domicile", "Livraison à domicile", false);
        if (quote && (!domicile || quote.priceCents < domicile.priceCents)) domicile = quote;
      } else if (lastMile && POINT_RELAIS_LAST_MILE.includes(lastMile) && POINT_RELAIS_CARRIERS.includes(carrierCode)) {
        const isLocker = LOCKER_LAST_MILE.includes(lastMile);
        const quote = toQuote(
          opt,
          "point_relais",
          `Point Relais ${opt.carrier?.name ?? carrierCode}`,
          isLocker,
        );
        const key = `${carrierCode}:${isLocker}`;
        const existing = bestByKey.get(key);
        if (quote && (!existing || quote.priceCents < existing.priceCents)) bestByKey.set(key, quote);
      }
    }

    const pointRelaisOptions = [...bestByKey.values()];
    if (!domicile && pointRelaisOptions.length === 0) return null;
    return { domicile, pointRelaisOptions };
  } catch {
    return null;
  }
}

// Le moins cher des points relais disponibles, utilisé comme prix affiché
// tant que le client n'a pas encore choisi un point précis via le widget
// (à ce moment-là, le type réel du point choisi tranche le prix exact).
export function cheapestPointRelais(quotes: ShippingQuotes): ShippingQuote | null {
  if (quotes.pointRelaisOptions.length === 0) return null;
  return quotes.pointRelaisOptions.reduce((best, q) => (q.priceCents < best.priceCents ? q : best));
}

// Retrouve l'option qui correspond au vrai point choisi dans le widget
// (même transporteur, même type casier/boutique) — retombe sur la moins
// chère de ce transporteur si le type exact n'est pas trouvé (ne devrait pas
// arriver, mais mieux vaut un prix légèrement différent qu'un échec total).
export function matchPointRelaisOption(
  quotes: ShippingQuotes,
  carrierCode: string,
  isLocker: boolean,
): ShippingQuote | null {
  const sameCarrier = quotes.pointRelaisOptions.filter((q) => q.carrierCode === carrierCode);
  const exact = sameCarrier.find((q) => q.isLocker === isLocker);
  if (exact) return exact;
  if (sameCarrier.length === 0) return null;
  return sameCarrier.reduce((best, q) => (q.priceCents < best.priceCents ? q : best));
}
