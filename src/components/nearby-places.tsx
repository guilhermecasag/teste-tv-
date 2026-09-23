"use client";

import { useEffect, useRef, useState } from "react";
import { searchNearbyPlacesAction } from "@/actions/places";
import type { Place, PlaceCategory } from "@/lib/places";

type Coords = { latitude: number; longitude: number };

type Source = "trip" | "hotel" | "mine";

const CATEGORIES: { key: PlaceCategory; label: string; icon: string }[] = [
  { key: "comida", label: "Comida", icon: "🍽" },
  { key: "farmacia", label: "Farmácia", icon: "💊" },
  { key: "lavanderia", label: "Lavanderia", icon: "🧺" },
  { key: "mercado", label: "Mercado", icon: "🛒" },
  { key: "posto", label: "Posto", icon: "⛽" },
];

const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  comida: "Comida",
  farmacia: "Farmácia",
  lavanderia: "Lavanderia",
  mercado: "Mercado",
  posto: "Posto",
};

export function NearbyPlaces({
  tripCoords,
  hotelCoords,
}: {
  tripCoords: Coords | null;
  hotelCoords: Coords | null;
}) {
  const [source, setSource] = useState<Source>(tripCoords ? "trip" : "mine");
  const [myCoords, setMyCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; places: Place[]; error?: string } | null>(
    null
  );

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeCategory && !dialog.open) dialog.showModal();
    if (!activeCategory && dialog.open) dialog.close();
  }, [activeCategory]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocalização não suportada neste navegador.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setSource("mine");
        setGeoLoading(false);
      },
      () => {
        setGeoError("Não foi possível obter sua localização. Verifique a permissão.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function currentCoords(): Coords | null {
    if (source === "mine") return myCoords;
    if (source === "hotel") return hotelCoords;
    return tripCoords;
  }

  async function openCategory(category: PlaceCategory) {
    const coords = currentCoords();
    setActiveCategory(category);
    setResult(null);

    if (!coords) {
      setResult({ ok: false, places: [], error: "Escolha uma localização válida primeiro." });
      return;
    }

    setLoading(true);
    const res = await searchNearbyPlacesAction(coords.latitude, coords.longitude, category);
    setLoading(false);
    setResult(res.ok ? { ok: true, places: res.places } : { ok: false, places: [], error: res.error });
  }

  return (
    <div className="card mt-4">
      <p className="mb-2 text-sm font-semibold text-foreground">📍 Locais próximos</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          className={`badge border ${source === "mine" ? "border-brand-primary bg-brand-primary-light text-brand-primary" : "border-border text-muted"}`}
        >
          {geoLoading ? "Obtendo..." : "📍 Usar minha localização"}
        </button>
        {tripCoords && (
          <button
            type="button"
            onClick={() => setSource("trip")}
            className={`badge border ${source === "trip" ? "border-brand-primary bg-brand-primary-light text-brand-primary" : "border-border text-muted"}`}
          >
            Local da viagem
          </button>
        )}
        {hotelCoords && (
          <button
            type="button"
            onClick={() => setSource("hotel")}
            className={`badge border ${source === "hotel" ? "border-brand-primary bg-brand-primary-light text-brand-primary" : "border-border text-muted"}`}
          >
            Local do hotel
          </button>
        )}
      </div>
      {geoError && <p className="mb-2 text-xs text-status-bloqueado">{geoError}</p>}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => openCategory(cat.key)}
            className="btn-secondary"
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setActiveCategory(null)}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">
            {activeCategory && CATEGORY_LABEL[activeCategory]}
          </h2>
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="rounded-full px-2 py-1 text-sm text-muted hover:bg-background"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-muted">Buscando...</p>}
          {!loading && result && !result.ok && (
            <p className="text-sm text-muted">{result.error}</p>
          )}
          {!loading && result?.ok && result.places.length === 0 && (
            <p className="text-sm text-muted">Nenhum local encontrado por perto.</p>
          )}
          {!loading && result?.ok && result.places.length > 0 && (
            <ul className="flex flex-col gap-2">
              {result.places.map((place) => (
                <li
                  key={place.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{place.name}</p>
                    <p className="text-xs text-muted">
                      {place.distanceMeters < 1000
                        ? `${place.distanceMeters} m`
                        : `${(place.distanceMeters / 1000).toFixed(1)} km`}
                    </p>
                  </div>
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary py-1.5 text-xs"
                  >
                    Ver rota
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </div>
  );
}
