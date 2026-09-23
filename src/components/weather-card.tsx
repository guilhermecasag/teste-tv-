import { getWeatherForCoords } from "@/lib/weather";

const WEEKDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export async function WeatherCard({
  coords,
}: {
  coords: { latitude: number; longitude: number } | null;
}) {
  const forecast = coords ? await getWeatherForCoords(coords.latitude, coords.longitude) : null;

  return (
    <div className="card mt-4">
      <p className="mb-2 text-sm font-semibold text-foreground">🌤 Clima</p>

      {!forecast || forecast.length === 0 ? (
        <p className="text-sm text-muted">Previsão do tempo indisponível.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {forecast.slice(0, 5).map((day) => {
            const date = new Date(`${day.date}T00:00:00`);
            return (
              <div key={day.date} className="flex min-w-16 flex-col items-center gap-0.5">
                <span className="text-xs text-muted">{WEEKDAY[date.getDay()]}</span>
                <span className="text-xl leading-none">{day.icon}</span>
                <span className="text-xs font-medium text-foreground">
                  {day.tempMax}° / {day.tempMin}°
                </span>
                {day.precipitationChance > 0 && (
                  <span className="text-[10px] text-muted">💧{day.precipitationChance}%</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
