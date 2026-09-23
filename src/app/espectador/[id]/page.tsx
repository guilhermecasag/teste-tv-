import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { TripRealtimeRefresh } from "@/components/trip-realtime-refresh";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const EQUIPMENT_META: Record<string, { label: string; icon: string; className: string }> = {
  CONCLUIDO: { label: "Concluído", icon: "✓", className: "bg-brand-primary-light text-brand-primary" },
  EM_ANDAMENTO: { label: "Em andamento", icon: "🔧", className: "bg-status-andamento/10 text-status-andamento" },
  BLOQUEADO: { label: "Bloqueado", icon: "⚠️", className: "bg-status-bloqueado/10 text-status-bloqueado" },
  PENDENTE: { label: "Pendente", icon: "○", className: "bg-status-pendente/10 text-status-pendente" },
};

const TIMELINE_ICON: Record<string, string> = {
  VIAGEM_STATUS: "🚩",
  EQUIPAMENTO_STATUS: "🔧",
  EQUIPAMENTO_OBSERVACAO: "📝",
  EQUIPAMENTO_FOTO: "📷",
  PENDENCIA_ABERTA: "⚠️",
  PENDENCIA_RESOLVIDA: "✓",
};

export default async function EspectadorTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  if (session.user.role !== "ADMIN") {
    const access = await prisma.tripViewer.findUnique({
      where: { tripId_userId: { tripId: id, userId: session.user.id } },
    });
    if (!access) notFound();
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      client: true,
      members: { include: { user: true } },
      equipment: { orderBy: { createdAt: "asc" } },
      timeline: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!trip) notFound();

  const photos = await prisma.equipmentPhoto.findMany({
    where: { equipment: { tripId: trip.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const done = trip.equipment.filter((e) => e.status === "CONCLUIDO").length;
  const percent = trip.equipment.length > 0 ? Math.round((done / trip.equipment.length) * 100) : 0;
  const counts = {
    CONCLUIDO: done,
    EM_ANDAMENTO: trip.equipment.filter((e) => e.status === "EM_ANDAMENTO").length,
    BLOQUEADO: trip.equipment.filter((e) => e.status === "BLOQUEADO").length,
    PENDENTE: trip.equipment.filter((e) => e.status === "PENDENTE").length,
  };

  return (
    <DashboardShell userName={session.user.name ?? ""} role={session.user.role}>
      <TripRealtimeRefresh tripId={trip.id} />
      <h1 className="text-xl font-semibold text-foreground">{trip.client.name}</h1>
      <p className="text-sm text-muted">
        📍 {trip.city} - {trip.state}
      </p>
      <span className="badge mt-2 bg-brand-primary-light text-brand-primary">
        {STATUS_LABEL[trip.status]}
      </span>

      <div className="card mt-4">
        <p className="mb-1 text-sm font-semibold text-foreground">Montagem</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{percent}% concluído</span>
          <span className="text-muted">
            {done} de {trip.equipment.length} equipamentos
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span>✓ {counts.CONCLUIDO} concluídos</span>
          <span>🔧 {counts.EM_ANDAMENTO} em andamento</span>
          <span>⚠️ {counts.BLOQUEADO} bloqueados</span>
          <span>○ {counts.PENDENTE} pendentes</span>
        </div>

        <ul className="mt-3 flex flex-col gap-1.5">
          {trip.equipment.map((eq) => {
            const meta = EQUIPMENT_META[eq.status];
            return (
              <li key={eq.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{eq.name}</span>
                <span className={`badge ${meta.className}`}>
                  {meta.icon} {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Últimas atualizações</p>
        {trip.timeline.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma atualização ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {trip.timeline.map((event) => (
              <li key={event.id} className="text-sm text-foreground">
                {TIMELINE_ICON[event.type]} {event.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {photos.length > 0 && (
        <div className="card mt-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Fotos recentes</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt="Foto da montagem"
                className="h-20 w-full rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      <div className="card mt-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Equipe</p>
        {trip.members.length === 0 ? (
          <p className="text-sm text-muted">Nenhum montador alocado.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {trip.members.map((m) => (
              <li key={m.id}>{m.user.name}</li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
