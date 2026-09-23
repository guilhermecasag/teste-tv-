import Link from "next/link";
import { Logo } from "@/components/logo";
import { signOutAction } from "@/actions/sign-out";

const NAV = [
  { href: "/app", label: "Início", icon: "🏠" },
  { href: "/app/viagem", label: "Viagem", icon: "✈️" },
  { href: "/app/montagem", label: "Montagem", icon: "🔧" },
  { href: "/app/perfil", label: "Perfil", icon: "👤" },
];

export function MontadorShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0 sm:pl-56">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:hidden">
        <Logo variant="full" priority className="h-7 w-auto" />
        <form action={signOutAction}>
          <button type="submit" className="btn-secondary py-1.5 text-xs">
            Sair
          </button>
        </form>
      </header>

      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r border-border bg-surface p-4 sm:flex">
        <Logo variant="full" priority className="mb-6 h-8 w-auto" />
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-brand-primary-light hover:text-brand-primary"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <p className="truncate text-sm font-medium text-foreground">{userName}</p>
          <form action={signOutAction}>
            <button type="submit" className="btn-secondary w-full py-1.5 text-xs">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-surface py-1.5 sm:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition hover:text-brand-primary"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
