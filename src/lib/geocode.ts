const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Geocodifica um endereco livre em latitude/longitude usando o Nominatim
 * (OpenStreetMap), que e gratuito e nao exige chave de API. Uso respeitoso
 * da politica do servico: um User-Agent identificavel, sem retry agressivo.
 */
export async function geocodeAddress(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!query.trim()) return null;

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LTMAutomacaoSaaS/1.0 (contato@ltmautomacao.com)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const results = (await res.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return null;

    return { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) };
  } catch {
    return null;
  }
}
