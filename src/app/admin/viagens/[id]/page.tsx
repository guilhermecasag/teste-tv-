import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { EditTripButton } from "./edit-trip-button";
import { TravelInfoForm } from "./travel-info-form";
import { EquipmentList } from "./equipment-list";
import { AddEquipmentButton } from "./add-equipment-button";
import { updateTravelInfoAction } from "@/actions/trips";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
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
      equipment: { include: { responsible: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!trip) notFound();

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
    </AdminShell>
  );
}
