"use server";

import { z } from "zod";
import { requireSession } from "@/lib/guards";
import { findNearbyPlaces, type Place, type PlaceCategory } from "@/lib/places";

const searchSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  category: z.enum(["comida", "farmacia", "lavanderia", "mercado", "posto"]),
});

export type SearchPlacesResult =
  | { ok: true; places: Place[] }
  | { ok: false; error: string };

export async function searchNearbyPlacesAction(
  latitude: number,
  longitude: number,
  category: PlaceCategory
): Promise<SearchPlacesResult> {
  await requireSession();

  const parsed = searchSchema.safeParse({ latitude, longitude, category });
  if (!parsed.success) {
    return { ok: false, error: "Localização inválida." };
  }

  const places = await findNearbyPlaces(
    parsed.data.latitude,
    parsed.data.longitude,
    parsed.data.category
  );

  if (places === null) {
    return { ok: false, error: "Busca de locais próximos indisponível no momento." };
  }
  if (places.length === 0) {
    return { ok: true, places: [] };
  }

  return { ok: true, places };
}
