import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { UserRowActions } from "./user-row-actions";
import { NewUserButton } from "./new-user-button";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MONTADOR: "Montador",
  ESPECTADOR: "Espectador",
};

export default async function UsuariosPage() {
  const session = await auth();
  if (!session) return null;

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
        <NewUserButton
          title="Novo usuário"
          triggerLabel="+ Novo usuário"
          submitLabel="Cadastrar usuário"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted">{user.email}</td>
                <td className="px-4 py-3 text-muted">{ROLE_LABEL[user.role]}</td>
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
                  <UserRowActions user={user} isSelf={user.id === session.user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
