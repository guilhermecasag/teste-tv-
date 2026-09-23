import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session) return null;

  const [activeTrips, clientCount, montadorCount, equipmentTotal] =
    await Promise.all([
      prisma.trip.findMany({
        where: { status: { in: ["PLANEJADA", "EM_DESLOCAMENTO", "EM_MONTAGEM", "PAUSADA"] } },
        include: { client: true, equipment: true },
        orderBy: { startDate: "asc" },
        take: 10,
      }),
      prisma.client.count(),
      prisma.user.count({ where: { role: "MONTADOR", active: true } }),
      prisma.equipment.count(),
    ]);

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <h1 className="text-xl font-semibold text-foreground">
        Olá, {session.user.name} 👋
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card">
          <p className="text-2xl font-semibold text-brand-primary">
            {activeTrips.length}
          </p>
          <p className="text-xs text-muted">Viagens ativas</p>
        </div>
        <div className="card">
          <p className="text-2xl font-semibold text-foreground">{clientCount}</p>
          <p className="text-xs text-muted">Clientes</p>
        </div>
        <div className="card">
          <p className="text-2xl font-semibold text-foreground">{montadorCount}</p>
          <p className="text-xs text-muted">Montadores ativos</p>
        </div>
        <div className="card">
          <p className="text-2xl font-semibold text-foreground">{equipmentTotal}</p>
          <p className="text-xs text-muted">Equipamentos</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Viagens em andamento
        </h2>
        <Link href="/admin/viagens" className="text-sm font-medium text-brand-primary">
          Ver todas →
        </Link>
      </div>

      {activeTrips.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nenhuma viagem ativa no momento.</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {activeTrips.map((trip) => {
            const done = trip.equipment.filter((e) => e.status === "CONCLUIDO").length;
            const percent =
              trip.equipment.length > 0 ? Math.round((done / trip.equipment.length) * 100) : 0;
            return (
              <Link
                key={trip.id}
                href={`/admin/viagens/${trip.id}`}
                className="card block transition hover:border-brand-primary"
              >
                <p className="font-semibold text-foreground">{trip.client.name}</p>
                <p className="text-sm text-muted">
                  📍 {trip.city} - {trip.state}
                </p>
                {trip.equipment.length > 0 && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="badge bg-brand-primary-light text-brand-primary">
                    {STATUS_LABEL[trip.status]}
                  </span>
                  <span className="text-muted">
                    {trip.equipment.length > 0
                      ? `${percent}% · ${done}/${trip.equipment.length} equip.`
                      : "0 equipamentos"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
