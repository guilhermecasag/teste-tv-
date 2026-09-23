"use client";

import { Modal } from "@/components/modal";
import { UserForm } from "./user-form";
import { createUserAction } from "@/actions/users";

type Role = "ADMIN" | "MONTADOR" | "ESPECTADOR";

export function NewUserButton({
  lockRole,
  title,
  triggerLabel,
  submitLabel,
}: {
  lockRole?: Role;
  title: string;
  triggerLabel: string;
  submitLabel: string;
}) {
  return (
    <Modal title={title} trigger={<button className="btn-primary">{triggerLabel}</button>}>
      {(close) => (
        <UserForm
          action={createUserAction}
          submitLabel={submitLabel}
          lockRole={lockRole}
          requirePassword
          onSuccess={close}
        />
      )}
    </Modal>
  );
}
