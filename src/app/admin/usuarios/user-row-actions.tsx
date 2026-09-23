"use client";

import { useTransition } from "react";
import { Modal } from "@/components/modal";
import { UserForm } from "./user-form";
import { updateUserAction, toggleUserActiveAction } from "@/actions/users";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MONTADOR" | "ESPECTADOR";
  phone: string | null;
  whatsapp: string | null;
  cargo: string | null;
  active: boolean;
};

export function UserRowActions({
  user,
  lockRole,
  isSelf,
}: {
  user: UserRow;
  lockRole?: UserRow["role"];
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Modal title={`Editar ${user.name}`} trigger={<button className="btn-secondary py-1.5 text-xs">Editar</button>}>
        {(close) => (
          <UserForm
            action={updateUserAction.bind(null, user.id)}
            defaultValues={user}
            submitLabel="Salvar alterações"
            lockRole={lockRole}
            onSuccess={close}
          />
        )}
      </Modal>

      <button
        type="button"
        disabled={pending || isSelf}
        title={isSelf ? "Você não pode desativar sua própria conta" : undefined}
        className="btn-secondary py-1.5 text-xs disabled:cursor-not-allowed"
        onClick={() => {
          startTransition(async () => {
            try {
              await toggleUserActiveAction(user.id);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Erro ao atualizar.");
            }
          });
        }}
      >
        {pending ? "..." : user.active ? "Desativar" : "Ativar"}
      </button>
    </div>
  );
}
