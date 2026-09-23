import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MontadorShell } from "@/components/montador-shell";
import { ChangePasswordForm } from "./change-password-form";
import { PushSubscribeButton } from "@/components/push-subscribe-button";

export default async function MontadorPerfilPage() {
  const session = await auth();
  if (!session) return null;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <MontadorShell userName={user.name}>
      <h1 className="text-xl font-semibold text-foreground">Meu perfil</h1>

      <div className="card mt-4">
        <p className="text-lg font-semibold text-foreground">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
        {user.cargo && <p className="mt-2 text-sm text-foreground">Cargo: {user.cargo}</p>}
        {user.phone && <p className="text-sm text-muted">📞 {user.phone}</p>}
        {user.whatsapp && <p className="text-sm text-muted">💬 {user.whatsapp}</p>}
      </div>

      <div className="card mt-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Notificações</p>
        <PushSubscribeButton />
      </div>

      <div className="card mt-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Alterar senha</p>
        <ChangePasswordForm />
      </div>
    </MontadorShell>
  );
}
