import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import { NewTripForm } from "./new-trip-form";

export default async function NovaViagemPage() {
  const session = await auth();
  if (!session) return null;

  const [clients, montadores, espectadores] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { role: "MONTADOR", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "ESPECTADOR", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AdminShell userName={session.user.name ?? ""}>
      <h1 className="text-xl font-semibold text-foreground">Nova viagem</h1>

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Cadastre um{" "}
          <Link href="/admin/clientes" className="font-medium text-brand-primary">
            cliente
          </Link>{" "}
          antes de criar uma viagem.
        </p>
      ) : (
        <div className="card mt-4 max-w-2xl">
          <NewTripForm clients={clients} montadores={montadores} espectadores={espectadores} />
        </div>
      )}
    </AdminShell>
  );
}
