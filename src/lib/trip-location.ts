import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

type TripLike = {
  id: string;
  address: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};

/**
 * Retorna as coordenadas da viagem, geocodificando e persistindo na
 * primeira vez que forem necessarias (clima, locais proximos).
 */
export async function getTripCoords(
  trip: TripLike
): Promise<{ latitude: number; longitude: number } | null> {
  if (trip.latitude != null && trip.longitude != null) {
    return { latitude: trip.latitude, longitude: trip.longitude };
  }

  const query = [trip.address, trip.city, trip.state, "Brazil"].filter(Boolean).join(", ");
  const coords = await geocodeAddress(query);
  if (!coords) return null;

  await prisma.trip.update({
    where: { id: trip.id },
    data: { latitude: coords.latitude, longitude: coords.longitude },
  });

  return coords;
}

type TravelInfoLike = {
  tripId: string;
  hotelAddress: string | null;
  hotelName: string | null;
  hotelLatitude: number | null;
  hotelLongitude: number | null;
};

export async function getHotelCoords(
  travelInfo: TravelInfoLike
): Promise<{ latitude: number; longitude: number } | null> {
  if (travelInfo.hotelLatitude != null && travelInfo.hotelLongitude != null) {
    return { latitude: travelInfo.hotelLatitude, longitude: travelInfo.hotelLongitude };
  }

  const query = [travelInfo.hotelName, travelInfo.hotelAddress, "Brazil"]
    .filter(Boolean)
    .join(", ");
  if (!query) return null;

  const coords = await geocodeAddress(query);
  if (!coords) return null;

  await prisma.tripTravelInfo.update({
    where: { tripId: travelInfo.tripId },
    data: { hotelLatitude: coords.latitude, hotelLongitude: coords.longitude },
  });

  return coords;
}
