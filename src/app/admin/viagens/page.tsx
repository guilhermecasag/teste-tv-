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

const STATUS_COLOR: Record<string, string> = {
  PLANEJADA: "bg-status-pendente/10 text-status-pendente",
  EM_DESLOCAMENTO: "bg-status-andamento/10 text-status-andamento",
  EM_MONTAGEM: "bg-brand-primary-light text-brand-primary",
  PAUSADA: "bg-status-andamento/10 text-status-andamento",
  CONCLUIDA: "bg-brand-primary-light text-brand-primary",
  CANCELADA: "bg-status-bloqueado/10 text-status-bloqueado",
};

export default async function ViagensPage() {
  const session = await auth();
  if (!session) return null;

  const trips = await prisma.trip.findMany({
    orderBy: { startDate: "desc" },
    include: { client: true, equipment: true, members: true },
  });

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Viagens</h1>
        <Link href="/admin/viagens/nova" className="btn-primary">
          + Nova viagem
        </Link>
      </div>

      {trips.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhuma viagem cadastrada ainda.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/admin/viagens/${trip.id}`}
              className="card block transition hover:border-brand-primary"
            >
              <p className="font-semibold text-foreground">{trip.client.name}</p>
              <p className="text-sm text-muted">
                📍 {trip.city} - {trip.state}
              </p>
              <p className="text-xs text-muted">
                {trip.startDate.toLocaleDateString("pt-BR")} →{" "}
                {trip.endDate.toLocaleDateString("pt-BR")}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={`badge ${STATUS_COLOR[trip.status]}`}>
                  {STATUS_LABEL[trip.status]}
                </span>
                <span className="text-muted">
                  {trip.members.length} montador(es) · {trip.equipment.length} equip.
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
