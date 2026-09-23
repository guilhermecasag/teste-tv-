import Link from "next/link";
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

const TIMELINE_ICON: Record<string, string> = {
  VIAGEM_STATUS: "🚩",
  EQUIPAMENTO_STATUS: "🔧",
  EQUIPAMENTO_OBSERVACAO: "📝",
  EQUIPAMENTO_FOTO: "📷",
  PENDENCIA_ABERTA: "⚠️",
  PENDENCIA_RESOLVIDA: "✓",
};

export default async function MontadorHomePage() {
  const session = await auth();
  if (!session) return null;

  const trip = await getActiveTripForMontador(session.user.id);

  const [equipment, recentEvents] = trip
    ? await Promise.all([
        prisma.equipment.findMany({ where: { tripId: trip.id } }),
        prisma.timelineEvent.findMany({
          where: { tripId: trip.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])
    : [[], []];

  const isMontagem = trip?.status === "EM_MONTAGEM";
  const totalWeight = equipment.reduce(
    (sum, e) => sum + (trip?.progressMethod === "PONDERADO" ? e.weight : 1),
    0
  );
  const doneWeight = equipment
    .filter((e) => e.status === "CONCLUIDO")
    .reduce((sum, e) => sum + (trip?.progressMethod === "PONDERADO" ? e.weight : 1), 0);
  const percent = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
  const counts = {
    CONCLUIDO: equipment.filter((e) => e.status === "CONCLUIDO").length,
    EM_ANDAMENTO: equipment.filter((e) => e.status === "EM_ANDAMENTO").length,
    BLOQUEADO: equipment.filter((e) => e.status === "BLOQUEADO").length,
    PENDENTE: equipment.filter((e) => e.status === "PENDENTE").length,
  };

  return (
    <MontadorShell userName={session.user.name ?? ""}>
      <h1 className="text-xl font-semibold text-foreground">Olá, {session.user.name} 👋</h1>

      {!trip ? (
        <p className="mt-4 text-sm text-muted">Nenhuma viagem alocada para você no momento.</p>
      ) : (
        <>
          <div className="card mt-4">
            <p className="text-xs font-medium uppercase text-muted">
              {isMontagem ? "Montagem atual" : "Próxima viagem"}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{trip.client.name}</p>
            <p className="text-sm text-muted">
              📍 {trip.city} - {trip.state}
            </p>
            <p className="text-sm text-muted">
              📅 {trip.startDate.toLocaleDateString("pt-BR")}
            </p>
            <span className="badge mt-2 bg-brand-primary-light text-brand-primary">
              {STATUS_LABEL[trip.status]}
            </span>
            <div className="mt-3">
              <Link href="/app/viagem" className="btn-primary inline-block">
                Ver viagem
              </Link>
            </div>
          </div>

          {equipment.length > 0 && (
            <div className="card mt-4">
              <p className="text-xs font-medium uppercase text-muted">Montagem</p>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{percent}% concluído</span>
                <span className="text-muted">
                  {counts.CONCLUIDO} de {equipment.length} equipamentos
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                <span>✓ {counts.CONCLUIDO} concluídos</span>
                <span>🔧 {counts.EM_ANDAMENTO} em andamento</span>
                <span>⚠️ {counts.BLOQUEADO} bloqueados</span>
                <span>○ {counts.PENDENTE} pendentes</span>
              </div>
              <div className="mt-3">
                <Link href="/app/montagem" className="btn-secondary inline-block">
                  Ver montagem
                </Link>
              </div>
            </div>
          )}

          {recentEvents.length > 0 && (
            <div className="card mt-4">
              <p className="mb-2 text-xs font-medium uppercase text-muted">Últimas atualizações</p>
              <ul className="flex flex-col gap-2">
                {recentEvents.map((event) => (
                  <li key={event.id} className="text-sm text-foreground">
                    {TIMELINE_ICON[event.type]} {event.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </MontadorShell>
  );
}
