import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { ClientRowActions } from "./client-row-actions";
import { NewClientButton } from "./new-client-button";

export default async function ClientesPage() {
  const session = await auth();
  if (!session) return null;

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { trips: true } } },
  });

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <NewClientButton />
      </div>

      {clients.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Viagens</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {client.city ? `${client.city} - ${client.state}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {client.contactName || client.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{client._count.trips}</td>
                  <td className="px-4 py-3">
                    <ClientRowActions client={client} />
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
