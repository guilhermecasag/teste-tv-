import Link from "next/link";
import { Logo } from "@/components/logo";
import { signOutAction } from "@/actions/sign-out";
import { AdminMoreMenu } from "@/components/admin-more-menu";
import { NotificationBell } from "@/components/notification-bell";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/viagens", label: "Viagens", icon: "✈️" },
  { href: "/admin/equipamentos", label: "Equipamentos", icon: "🔧" },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo variant="full" priority className="h-8 w-auto" />

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-brand-primary-light hover:text-brand-primary"
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <AdminMoreMenu />
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <p className="hidden text-sm font-medium text-foreground sm:block">
              {userName}
            </p>
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary py-1.5 text-xs">
                Sair
              </button>
            </form>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-brand-primary-light hover:text-brand-primary"
            >
              {item.icon} {item.label}
            </Link>
          ))}
          <AdminMoreMenu />
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
