import { prisma } from "@/lib/prisma";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3h

export type DayForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationChance: number;
  icon: string;
  description: string;
};

const WEATHER_CODE_MAP: Record<number, { icon: string; description: string }> = {
  0: { icon: "☀️", description: "Céu limpo" },
  1: { icon: "🌤", description: "Poucas nuvens" },
  2: { icon: "⛅", description: "Parcialmente nublado" },
  3: { icon: "☁️", description: "Nublado" },
  45: { icon: "🌫️", description: "Nevoeiro" },
  48: { icon: "🌫️", description: "Nevoeiro com geada" },
  51: { icon: "🌦", description: "Garoa fraca" },
  53: { icon: "🌦", description: "Garoa" },
  55: { icon: "🌦", description: "Garoa forte" },
  61: { icon: "🌧", description: "Chuva fraca" },
  63: { icon: "🌧", description: "Chuva" },
  65: { icon: "🌧", description: "Chuva forte" },
  71: { icon: "🌨", description: "Neve fraca" },
  73: { icon: "🌨", description: "Neve" },
  75: { icon: "🌨", description: "Neve forte" },
  80: { icon: "🌦", description: "Pancadas de chuva" },
  81: { icon: "🌦", description: "Pancadas de chuva" },
  82: { icon: "🌧", description: "Pancadas fortes" },
  95: { icon: "⛈", description: "Trovoadas" },
  96: { icon: "⛈", description: "Trovoadas com granizo" },
  99: { icon: "⛈", description: "Trovoadas com granizo" },
};

function locationKey(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<DayForecast[] | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: "temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
  });

  try {
    const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const daily = data.daily as {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      weathercode: number[];
      precipitation_probability_max: number[];
    };
    if (!daily?.time) return null;

    return daily.time.map((date, i) => {
      const code = daily.weathercode[i];
      const meta = WEATHER_CODE_MAP[code] ?? { icon: "🌡", description: "—" };
      return {
        date,
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        precipitationChance: Math.round(daily.precipitation_probability_max[i] ?? 0),
        icon: meta.icon,
        description: meta.description,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Previsao de 7 dias para a coordenada, via Open-Meteo (gratuito, sem
 * chave). Cacheada por ~3h em WeatherCache para nao bater na API a cada
 * carregamento de tela. Retorna null se a API estiver indisponivel e nao
 * houver cache - a UI deve mostrar "Previsão do tempo indisponível",
 * nunca inventar dados.
 */
export async function getWeatherForCoords(
  lat: number,
  lon: number
): Promise<DayForecast[] | null> {
  const key = locationKey(lat, lon);

  const cached = await prisma.weatherCache.findUnique({ where: { locationKey: key } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return cached.payload as unknown as DayForecast[];
  }

  const fresh = await fetchOpenMeteo(lat, lon);
  if (!fresh) {
    // API indisponivel agora: melhor devolver cache velho do que nada.
    return (cached?.payload as unknown as DayForecast[]) ?? null;
  }

  await prisma.weatherCache.upsert({
    where: { locationKey: key },
    create: { locationKey: key, latitude: lat, longitude: lon, payload: fresh },
    update: { payload: fresh, fetchedAt: new Date() },
  });

  return fresh;
}
