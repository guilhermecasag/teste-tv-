import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MontadorShell } from "@/components/montador-shell";
import { getActiveTripForMontador } from "@/lib/trips";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function MontadorViagemPage() {
  const session = await auth();
  if (!session) return null;

  const activeTrip = await getActiveTripForMontador(session.user.id);
  if (!activeTrip) {
    return (
      <MontadorShell userName={session.user.name ?? ""}>
        <p className="text-sm text-muted">Nenhuma viagem alocada para você no momento.</p>
      </MontadorShell>
    );
  }

  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: activeTrip.id },
    include: { client: true, travelInfo: true },
  });

  return (
    <MontadorShell userName={session.user.name ?? ""}>
      <h1 className="text-xl font-semibold text-foreground">{trip.client.name}</h1>
      <p className="text-sm text-muted">
        📍 {trip.city} - {trip.state}
        {trip.address && ` · ${trip.address}`}
      </p>
      <p className="text-sm text-muted">
        {trip.startDate.toLocaleDateString("pt-BR")} → {trip.endDate.toLocaleDateString("pt-BR")}
      </p>
      <span className="badge mt-2 bg-brand-primary-light text-brand-primary">
        {STATUS_LABEL[trip.status]}
      </span>
      {trip.notes && <p className="mt-3 text-sm text-muted">{trip.notes}</p>}

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">✈️ Deslocamento</p>
        {trip.travelInfo?.flightInfo ? (
          <p className="text-sm text-foreground">{trip.travelInfo.flightInfo}</p>
        ) : (
          <p className="text-sm text-muted">Nenhuma informação de voo cadastrada.</p>
        )}
        {trip.travelInfo?.transportInfo && (
          <p className="mt-2 text-sm text-foreground">🚗 {trip.travelInfo.transportInfo}</p>
        )}
        {trip.travelInfo?.driverName && (
          <p className="mt-1 text-sm text-muted">
            Motorista: {trip.travelInfo.driverName}
            {trip.travelInfo.driverPhone && ` · ${trip.travelInfo.driverPhone}`}
          </p>
        )}
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">🏨 Hospedagem</p>
        {trip.travelInfo?.hotelName ? (
          <>
            <p className="text-sm text-foreground">{trip.travelInfo.hotelName}</p>
            {trip.travelInfo.hotelAddress && (
              <p className="text-sm text-muted">{trip.travelInfo.hotelAddress}</p>
            )}
            {trip.travelInfo.hotelPhone && (
              <p className="mt-2 text-sm">
                <a href={`tel:${trip.travelInfo.hotelPhone}`} className="btn-secondary inline-block py-1.5 text-xs">
                  📞 Ligar
                </a>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Nenhum hotel cadastrado.</p>
        )}
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">🌤 Clima</p>
        <p className="text-sm text-muted">Previsão do tempo indisponível.</p>
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">📍 Locais próximos</p>
        <p className="text-sm text-muted">Busca de locais próximos indisponível.</p>
      </div>
    </MontadorShell>
  );
}
