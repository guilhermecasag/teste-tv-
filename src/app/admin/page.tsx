import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function AdminPage() {
  const session = await auth();
  if (!session) return null;

  return (
    <DashboardShell userName={session.user.name ?? ""} role={session.user.role}>
      <h1 className="text-xl font-semibold text-foreground">
        Olá, {session.user.name} 👋
      </h1>
      <p className="mt-1 text-sm text-muted">
        Autenticação, permissões e identidade visual (Fase 1) concluídas.
        Dashboard de viagens e equipamentos chega na Fase 2.
      </p>
    </DashboardShell>
  );
}
