import "server-only";
import { sql, ensureSchema } from "./client";

export type Market = {
  id: string;
  title: string;
  place: string;
  event_date: string | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
};

// Marchés à venir uniquement (date nulle = affiché quand même, en fin de
// liste — un événement sans date connue reste pertinent tant que quelqu'un
// ne le supprime pas). Les marchés passés disparaissent seuls du site sans
// que Julien/Adeline ait à penser à les supprimer ; ils restent visibles
// dans l'admin pour être nettoyés ou réutilisés.
export async function getUpcomingMarkets(): Promise<Market[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, title, place, event_date::text, image, lat, lng
    FROM markets
    WHERE event_date IS NULL OR event_date >= CURRENT_DATE
    ORDER BY event_date ASC NULLS LAST
  `) as Market[];
  return rows;
}
