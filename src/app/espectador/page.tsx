import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function EspectadorPage() {
  const session = await auth();
  if (!session) return null;

  return (
    <DashboardShell userName={session.user.name ?? ""} role={session.user.role}>
      <h1 className="text-xl font-semibold text-foreground">
        Olá, {session.user.name} 👋
      </h1>
      <p className="mt-1 text-sm text-muted">
        Nenhuma viagem liberada para acompanhamento ainda. A tela de
        acompanhamento chega na Fase 2.
      </p>
    </DashboardShell>
  );
}
