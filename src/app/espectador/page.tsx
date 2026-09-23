import Link from "next/link";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { listViewerTrips } from "@/lib/trips";
import { PushSubscribeButton } from "@/components/push-subscribe-button";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function EspectadorPage() {
  const session = await auth();
  if (!session) return null;

  const trips = await listViewerTrips(session.user.id);

  return (
    <DashboardShell userName={session.user.name ?? ""} role={session.user.role}>
      <h1 className="text-xl font-semibold text-foreground">Olá, {session.user.name} 👋</h1>

      {trips.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Nenhuma viagem liberada para acompanhamento ainda.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {trips.map((trip) => {
            const done = trip.equipment.filter((e) => e.status === "CONCLUIDO").length;
            const percent =
              trip.equipment.length > 0 ? Math.round((done / trip.equipment.length) * 100) : 0;
            return (
              <Link
                key={trip.id}
                href={`/espectador/${trip.id}`}
                className="card block transition hover:border-brand-primary"
              >
                <p className="font-semibold text-foreground">{trip.client.name}</p>
                <p className="text-sm text-muted">
                  📍 {trip.city} - {trip.state}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="badge bg-brand-primary-light text-brand-primary">
                    {STATUS_LABEL[trip.status]}
                  </span>
                  <span className="text-muted">{percent}% concluído</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Notificações</p>
        <PushSubscribeButton />
      </div>
    </DashboardShell>
  );
}
