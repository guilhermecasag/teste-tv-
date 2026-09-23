"use client";

import { useActionState } from "react";
import type { EquipmentFormState } from "@/actions/equipment";

type Option = { id: string; name: string };

const initialState: EquipmentFormState = { error: null };

export function EquipmentForm({
  action,
  montadores,
  progressMethod,
  onSuccess,
}: {
  action: (prev: EquipmentFormState, formData: FormData) => Promise<EquipmentFormState>;
  montadores: Option[];
  progressMethod: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: EquipmentFormState, formData: FormData) => {
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
          <label className="field-label">Nome do equipamento *</label>
          <input name="name" required className="field-input" placeholder="Forno 01" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Código</label>
          <input name="code" className="field-input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Responsável</label>
          <select name="responsibleId" className="field-input">
            <option value="">Não definido</option>
            {montadores.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {progressMethod === "PONDERADO" && (
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Peso (para % ponderado)</label>
            <input
              name="weight"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={1}
              className="field-input"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="field-label">Descrição</label>
          <textarea name="description" className="field-input" rows={2} />
        </div>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adicionando..." : "Adicionar equipamento"}
      </button>
    </form>
  );
}
