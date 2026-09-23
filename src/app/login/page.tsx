import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="full" priority className="h-14 w-auto" />
        </div>

        <h1 className="mb-1 text-center text-lg font-semibold text-foreground">
          Entrar
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Gestão de viagens e montagens
        </p>

        <LoginForm callbackUrl={callbackUrl ?? "/"} />
      </div>
    </div>
  );
}
