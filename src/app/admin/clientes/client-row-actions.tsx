"use client";

import { useTransition } from "react";
import { Modal } from "@/components/modal";
import { ClientForm } from "./client-form";
import { updateClientAction, deleteClientAction } from "@/actions/clients";

type Client = {
  id: string;
  name: string;
  cnpj: string | null;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
};

export function ClientRowActions({ client }: { client: Client }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Modal title={`Editar ${client.name}`} trigger={<button className="btn-secondary py-1.5 text-xs">Editar</button>}>
        {(close) => (
          <ClientForm
            action={updateClientAction.bind(null, client.id)}
            defaultValues={client}
            submitLabel="Salvar alterações"
            onSuccess={close}
          />
        )}
      </Modal>

      <button
        type="button"
        disabled={pending}
        className="btn-danger"
        onClick={() => {
          if (!confirm(`Excluir o cliente "${client.name}"?`)) return;
          startTransition(async () => {
            try {
              await deleteClientAction(client.id);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Erro ao excluir.");
            }
          });
        }}
      >
        {pending ? "..." : "Excluir"}
      </button>
    </div>
  );
}
