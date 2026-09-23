import { Logo } from "@/components/logo";
import { signOutAction } from "@/actions/sign-out";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MONTADOR: "Montador",
  ESPECTADOR: "Espectador",
};

export function DashboardShell({
  userName,
  role,
  children,
}: {
  userName: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Logo variant="full" priority className="h-8 w-auto" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted">{ROLE_LABEL[role] ?? role}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand-primary hover:text-brand-primary"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
