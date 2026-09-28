import "server-only";
import { sql, ensureSchema } from "./client";
import { deleteUploadedFile } from "@/lib/uploads";
import { geocodePlace } from "@/lib/geocode";

export type Market = {
  id: string;
  title: string;
  place: string;
  event_date: string | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
};

export type MarketInput = {
  title: string;
  place: string;
  event_date: string | null;
  image: string | null;
};

export async function getAllMarketsForAdmin(): Promise<Market[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, title, place, event_date::text, image, lat, lng, created_at, updated_at
    FROM markets ORDER BY event_date ASC NULLS LAST
  `) as Market[];
  return rows;
}

export async function getMarketById(id: string): Promise<Market | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, title, place, event_date::text, image, lat, lng, created_at, updated_at
    FROM markets WHERE id = ${id}
  `) as Market[];
  return rows[0] ?? null;
}

// Le site a besoin d'un pin (lat/lng) pour chaque marché — on géocode le
// lieu tel que tapé plutôt que de demander des coordonnées à la main.
// Si le lieu ne géocode vers rien, la ligne est quand même enregistrée
// (visible dans la liste/le site) mais sans pin sur la carte.
export async function createMarket(input: MarketInput): Promise<Market> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const geo = await geocodePlace(input.place);
  await sql`
    INSERT INTO markets (id, title, place, event_date, image, lat, lng, created_at, updated_at)
    VALUES (${id}, ${input.title}, ${input.place}, ${input.event_date}, ${input.image}, ${geo?.lat ?? null}, ${geo?.lng ?? null}, ${now}, ${now})
  `;
  return (await getMarketById(id))!;
}

export async function updateMarket(id: string, input: MarketInput): Promise<Market> {
  await ensureSchema();
  const current = await getMarketById(id);
  // Regéocode seulement si le lieu a changé : évite un appel réseau et un
  // pin qui "saute" légèrement à chaque enregistrement sans raison.
  const geo = current && current.place === input.place
    ? { lat: current.lat, lng: current.lng }
    : await geocodePlace(input.place);
  const now = new Date().toISOString();
  await sql`
    UPDATE markets SET title = ${input.title}, place = ${input.place}, event_date = ${input.event_date},
      image = ${input.image}, lat = ${geo?.lat ?? null}, lng = ${geo?.lng ?? null}, updated_at = ${now}
    WHERE id = ${id}
  `;
  return (await getMarketById(id))!;
}

export async function deleteMarket(id: string): Promise<void> {
  const market = await getMarketById(id);
  if (market?.image) await deleteUploadedFile(market.image);
  await sql`DELETE FROM markets WHERE id = ${id}`;
}
