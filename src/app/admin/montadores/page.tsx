import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { UserRowActions } from "../usuarios/user-row-actions";
import { NewUserButton } from "../usuarios/new-user-button";

export default async function MontadoresPage() {
  const session = await auth();
  if (!session) return null;

  const montadores = await prisma.user.findMany({
    where: { role: "MONTADOR" },
    orderBy: { name: "asc" },
    include: { _count: { select: { tripMemberships: true } } },
  });

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Montadores</h1>
        <NewUserButton
          title="Novo montador"
          triggerLabel="+ Novo montador"
          submitLabel="Cadastrar montador"
          lockRole="MONTADOR"
        />
      </div>

      {montadores.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhum montador cadastrado ainda.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Viagens</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {montadores.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {user.whatsapp || user.phone || user.email}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.cargo || "—"}</td>
                  <td className="px-4 py-3 text-muted">{user._count.tripMemberships}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        user.active
                          ? "bg-brand-primary-light text-brand-primary"
                          : "bg-status-bloqueado/10 text-status-bloqueado"
                      }`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UserRowActions user={user} lockRole="MONTADOR" isSelf={user.id === session.user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
