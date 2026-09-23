"use client";

import { Modal } from "@/components/modal";
import { ClientForm } from "./client-form";
import { createClientAction } from "@/actions/clients";

export function NewClientButton() {
  return (
    <Modal title="Novo cliente" trigger={<button className="btn-primary">+ Novo cliente</button>}>
      {(close) => (
        <ClientForm action={createClientAction} submitLabel="Cadastrar cliente" onSuccess={close} />
      )}
    </Modal>
  );
}
