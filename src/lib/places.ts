const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RADIUS_METERS = 3000;

export type PlaceCategory = "comida" | "farmacia" | "lavanderia" | "mercado" | "posto";

const CATEGORY_QUERY: Record<PlaceCategory, string> = {
  comida: 'node["amenity"="restaurant"]',
  farmacia: 'node["amenity"="pharmacy"]',
  lavanderia: 'node["shop"="laundry"]',
  mercado: 'node["shop"="supermarket"]',
  posto: 'node["amenity"="fuel"]',
};

export type Place = {
  id: string;
  name: string;
  distanceMeters: number;
  mapsUrl: string;
};

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Busca locais proximos por categoria via Overpass API (OpenStreetMap),
 * gratuito e sem chave. Retorna null se a API estiver indisponivel - a UI
 * deve mostrar um estado de erro, nunca inventar locais.
 */
export async function findNearbyPlaces(
  lat: number,
  lon: number,
  category: PlaceCategory
): Promise<Place[] | null> {
  const filter = CATEGORY_QUERY[category];
  const query = `[out:json][timeout:10];${filter}(around:${RADIUS_METERS},${lat},${lon});out body 15;`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const elements = (data.elements ?? []) as {
      id: number;
      lat: number;
      lon: number;
      tags?: { name?: string };
    }[];

    return elements
      .filter((el) => el.tags?.name)
      .map((el) => ({
        id: String(el.id),
        name: el.tags!.name!,
        distanceMeters: Math.round(haversineMeters(lat, lon, el.lat, el.lon)),
        mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${el.lat},${el.lon}`,
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 10);
  } catch {
    return null;
  }
}
