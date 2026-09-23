import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { EditTripButton } from "./edit-trip-button";
import { TravelInfoForm } from "./travel-info-form";
import { EquipmentList } from "@/components/equipment/equipment-list";
import { AddEquipmentButton } from "./add-equipment-button";
import { updateTravelInfoAction } from "@/actions/trips";
import { getTripCoords, getHotelCoords } from "@/lib/trip-location";
import { WeatherCard } from "@/components/weather-card";
import { NearbyPlaces } from "@/components/nearby-places";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const TIMELINE_ICON: Record<string, string> = {
  VIAGEM_STATUS: "🚩",
  EQUIPAMENTO_STATUS: "🔧",
  EQUIPAMENTO_OBSERVACAO: "📝",
  EQUIPAMENTO_FOTO: "📷",
  PENDENCIA_ABERTA: "⚠️",
  PENDENCIA_RESOLVIDA: "✓",
};

export default async function ViagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      client: true,
      travelInfo: true,
      members: { include: { user: true } },
      viewers: { include: { user: true } },
      equipment: {
        include: {
          responsible: true,
          photos: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
          issues: { include: { responsible: true }, orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      timeline: { include: { user: true, equipment: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!trip) notFound();

  const [tripCoords, hotelCoords] = await Promise.all([
    getTripCoords(trip),
    trip.travelInfo ? getHotelCoords(trip.travelInfo) : Promise.resolve(null),
  ]);

  const [clients, allMontadores, allEspectadores] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { role: "MONTADOR", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "ESPECTADOR", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{trip.client.name}</h1>
          <p className="text-sm text-muted">
            📍 {trip.city} - {trip.state}
            {trip.address && ` · ${trip.address}`}
          </p>
          <p className="text-sm text-muted">
            {trip.startDate.toLocaleDateString("pt-BR")} →{" "}
            {trip.endDate.toLocaleDateString("pt-BR")}
          </p>
          <span className="badge mt-2 bg-brand-primary-light text-brand-primary">
            {STATUS_LABEL[trip.status]}
          </span>
        </div>

        <EditTripButton
          tripId={trip.id}
          clients={clients}
          montadores={allMontadores}
          espectadores={allEspectadores}
          defaultValues={{
            clientId: trip.clientId,
            address: trip.address,
            city: trip.city,
            state: trip.state,
            startDate: trip.startDate.toISOString(),
            endDate: trip.endDate.toISOString(),
            status: trip.status,
            progressMethod: trip.progressMethod,
            notes: trip.notes,
            memberIds: trip.members.map((m) => m.userId),
            viewerIds: trip.viewers.map((v) => v.userId),
          }}
        />
      </div>

      {trip.notes && <p className="mt-3 text-sm text-muted">{trip.notes}</p>}

      <details className="card mt-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          🔧 Equipamentos
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex justify-end">
            <AddEquipmentButton
              tripId={trip.id}
              montadores={allMontadores}
              progressMethod={trip.progressMethod}
            />
          </div>
          <EquipmentList
            tripId={trip.id}
            equipment={trip.equipment}
            progressMethod={trip.progressMethod}
            montadores={allMontadores}
          />
        </div>
      </details>

      <details className="card mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          👥 Equipe
        </summary>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
          <div>
            <p className="text-xs font-medium uppercase text-muted">Montadores</p>
            {trip.members.length === 0 ? (
              <p className="text-sm text-muted">Nenhum montador alocado.</p>
            ) : (
              <ul className="mt-1 text-sm text-foreground">
                {trip.members.map((m) => (
                  <li key={m.id}>{m.user.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted">Espectadores</p>
            {trip.viewers.length === 0 ? (
              <p className="text-sm text-muted">Nenhum espectador autorizado.</p>
            ) : (
              <ul className="mt-1 text-sm text-foreground">
                {trip.viewers.map((v) => (
                  <li key={v.id}>{v.user.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>

      <details className="card mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          ✈️ Deslocamento & 🏨 Hospedagem
        </summary>
        <div className="mt-3">
          <TravelInfoForm
            action={updateTravelInfoAction.bind(null, trip.id)}
            defaultValues={{
              flightInfo: trip.travelInfo?.flightInfo ?? null,
              transportInfo: trip.travelInfo?.transportInfo ?? null,
              driverName: trip.travelInfo?.driverName ?? null,
              driverPhone: trip.travelInfo?.driverPhone ?? null,
              hotelName: trip.travelInfo?.hotelName ?? null,
              hotelAddress: trip.travelInfo?.hotelAddress ?? null,
              hotelPhone: trip.travelInfo?.hotelPhone ?? null,
              hotelCheckIn: trip.travelInfo?.hotelCheckIn?.toISOString() ?? null,
              hotelCheckOut: trip.travelInfo?.hotelCheckOut?.toISOString() ?? null,
              notes: trip.travelInfo?.notes ?? null,
            }}
          />
        </div>
      </details>

      <details className="card mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          🌤 Clima & 📍 Locais próximos
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <WeatherCard coords={tripCoords} />
          <NearbyPlaces tripCoords={tripCoords} hotelCoords={hotelCoords} />
        </div>
      </details>

      <details className="card mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          🕓 Timeline
        </summary>
        <div className="mt-3">
          {trip.timeline.length === 0 ? (
            <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {trip.timeline.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted">
                    {event.createdAt.toLocaleDateString("pt-BR")}{" "}
                    {event.createdAt.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-foreground">
                    {TIMELINE_ICON[event.type]} {event.message}
                    {event.user && <span className="text-muted"> · {event.user.name}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </AdminShell>
  );
}
