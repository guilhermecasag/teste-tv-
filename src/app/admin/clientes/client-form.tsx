"use client";

import { useActionState } from "react";
import type { ClientFormState } from "@/actions/clients";

type Client = {
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

const initialState: ClientFormState = { error: null };

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaultValues?: Client;
  submitLabel: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: ClientFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.error) onSuccess?.();
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="field-label">Nome do cliente *</label>
          <input
            name="name"
            required
            defaultValue={defaultValues?.name}
            className="field-input"
            placeholder="Cerâmica Exemplo"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">CNPJ</label>
          <input name="cnpj" defaultValue={defaultValues?.cnpj ?? ""} className="field-input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Responsável</label>
          <input
            name="contactName"
            defaultValue={defaultValues?.contactName ?? ""}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Telefone</label>
          <input name="phone" defaultValue={defaultValues?.phone ?? ""} className="field-input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={defaultValues?.whatsapp ?? ""}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="field-label">Endereço</label>
          <input
            name="address"
            defaultValue={defaultValues?.address ?? ""}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Cidade</label>
          <input name="city" defaultValue={defaultValues?.city ?? ""} className="field-input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Estado</label>
          <input
            name="state"
            maxLength={2}
            defaultValue={defaultValues?.state ?? ""}
            className="field-input uppercase"
            placeholder="CE"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="field-label">Observações</label>
          <textarea
            name="notes"
            defaultValue={defaultValues?.notes ?? ""}
            className="field-input"
            rows={2}
          />
        </div>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
