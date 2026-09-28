import "server-only";

// Même API que celle utilisée à la main pour géocoder les marchés existants
// (api-adresse.data.gouv.fr, gratuite, sans clé) — voir
// app/components/Marches.tsx pour le contexte. `limit=1` : on prend le
// meilleur résultat, pas de désambiguïsation manuelle en admin pour l'instant.
export async function geocodePlace(place: string): Promise<{ lat: number; lng: number } | null> {
  const query = place.trim();
  if (!query) return null;
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { geometry?: { coordinates?: [number, number] } }[] };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    const [lng, lat] = coords;
    return { lat, lng };
  } catch {
    return null;
  }
}
