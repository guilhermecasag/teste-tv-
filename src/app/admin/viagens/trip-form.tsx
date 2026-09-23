"use client";

import { useActionState } from "react";
import type { TripFormState } from "@/actions/trips";

type Option = { id: string; name: string };

type TripDefaults = {
  clientId: string;
  address: string | null;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  status: string;
  progressMethod: string;
  notes: string | null;
  memberIds: string[];
  viewerIds: string[];
};

const STATUS_OPTIONS = [
  { value: "PLANEJADA", label: "Planejada" },
  { value: "EM_DESLOCAMENTO", label: "Em deslocamento" },
  { value: "EM_MONTAGEM", label: "Em montagem" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

const initialState: TripFormState = { error: null };

function toDateInputValue(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function TripForm({
  action,
  clients,
  montadores,
  espectadores,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: (prev: TripFormState, formData: FormData) => Promise<TripFormState>;
  clients: Option[];
  montadores: Option[];
  espectadores: Option[];
  defaultValues?: TripDefaults;
  submitLabel: string;
  onSuccess?: (tripId: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: TripFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.error && result.tripId) onSuccess?.(result.tripId);
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="field-label">Cliente *</label>
          <select
            name="clientId"
            required
            defaultValue={defaultValues?.clientId}
            className="field-input"
          >
            <option value="">Selecione...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="field-label">Endereço do local</label>
          <input
            name="address"
            defaultValue={defaultValues?.address ?? ""}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Cidade *</label>
          <input
            name="city"
            required
            defaultValue={defaultValues?.city}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Estado *</label>
          <input
            name="state"
            required
            maxLength={2}
            defaultValue={defaultValues?.state}
            className="field-input uppercase"
            placeholder="CE"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Data início *</label>
          <input
            name="startDate"
            type="date"
            required
            defaultValue={toDateInputValue(defaultValues?.startDate)}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Data fim *</label>
          <input
            name="endDate"
            type="date"
            required
            defaultValue={toDateInputValue(defaultValues?.endDate)}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Status</label>
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "PLANEJADA"}
            className="field-input"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Método de progresso</label>
          <select
            name="progressMethod"
            defaultValue={defaultValues?.progressMethod ?? "IGUAL"}
            className="field-input"
          >
            <option value="IGUAL">Igual entre equipamentos</option>
            <option value="PONDERADO">Ponderado (peso por equipamento)</option>
          </select>
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

        <fieldset className="sm:col-span-2">
          <legend className="field-label mb-1.5">Montadores alocados</legend>
          {montadores.length === 0 ? (
            <p className="text-sm text-muted">Nenhum montador cadastrado.</p>
          ) : (
            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border p-3">
              {montadores.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="memberIds"
                    value={m.id}
                    defaultChecked={defaultValues?.memberIds.includes(m.id)}
                    className="accent-brand-primary"
                  />
                  {m.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="sm:col-span-2">
          <legend className="field-label mb-1.5">Espectadores autorizados</legend>
          {espectadores.length === 0 ? (
            <p className="text-sm text-muted">Nenhum espectador cadastrado.</p>
          ) : (
            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border p-3">
              {espectadores.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="viewerIds"
                    value={e.id}
                    defaultChecked={defaultValues?.viewerIds.includes(e.id)}
                    className="accent-brand-primary"
                  />
                  {e.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
