import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";

const STATUS_META: Record<string, { label: string; icon: string; className: string }> = {
  CONCLUIDO: { label: "Concluído", icon: "✓", className: "bg-brand-primary-light text-brand-primary" },
  EM_ANDAMENTO: { label: "Em andamento", icon: "🔧", className: "bg-status-andamento/10 text-status-andamento" },
  BLOQUEADO: { label: "Bloqueado", icon: "⚠️", className: "bg-status-bloqueado/10 text-status-bloqueado" },
  PENDENTE: { label: "Pendente", icon: "○", className: "bg-status-pendente/10 text-status-pendente" },
};

export default async function EquipamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { status } = await searchParams;

  const equipment = await prisma.equipment.findMany({
    where: status ? { status: status as never } : undefined,
    include: { trip: { include: { client: true } }, responsible: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Equipamentos</h1>
        <div className="flex gap-1.5 text-xs">
          <Link href="/admin/equipamentos" className={`badge ${!status ? "bg-brand-primary text-white" : "bg-border text-muted"}`}>
            Todos
          </Link>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <Link
              key={key}
              href={`/admin/equipamentos?status=${key}`}
              className={`badge ${status === key ? "bg-brand-primary text-white" : "bg-border text-muted"}`}
            >
              {meta.icon} {meta.label}
            </Link>
          ))}
        </div>
      </div>

      {equipment.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhum equipamento encontrado.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Viagem</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => {
                const meta = STATUS_META[eq.status];
                return (
                  <tr key={eq.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {eq.name}
                      {eq.code && <span className="text-muted"> · {eq.code}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/viagens/${eq.tripId}`}
                        className="text-brand-primary hover:underline"
                      >
                        {eq.trip.client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{eq.responsible?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${meta.className}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
