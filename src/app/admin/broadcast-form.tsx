"use client";

import { useActionState, useState } from "react";
import { broadcastNotificationAction, type BroadcastFormState } from "@/actions/notifications";

type Option = { id: string; name: string };

const initialState: BroadcastFormState = { error: null };

export function BroadcastForm({
  trips,
  montadores,
  onSuccess,
}: {
  trips: Option[];
  montadores: Option[];
  onSuccess?: () => void;
}) {
  const [target, setTarget] = useState<"todos" | "viagem" | "montador">("todos");
  const [state, formAction, pending] = useActionState(
    async (prev: BroadcastFormState, formData: FormData) => {
      const result = await broadcastNotificationAction(prev, formData);
      if (!result.error) onSuccess?.();
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Enviar para</label>
        <div className="flex flex-col gap-1.5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="target"
              value="todos"
              checked={target === "todos"}
              onChange={() => setTarget("todos")}
              className="accent-brand-primary"
            />
            Todos os montadores
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="target"
              value="viagem"
              checked={target === "viagem"}
              onChange={() => setTarget("viagem")}
              className="accent-brand-primary"
            />
            Montadores de uma viagem
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="target"
              value="montador"
              checked={target === "montador"}
              onChange={() => setTarget("montador")}
              className="accent-brand-primary"
            />
            Montador específico
          </label>
        </div>
      </div>

      {target === "viagem" && (
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Viagem</label>
          <select name="tripId" required className="field-input">
            <option value="">Selecione...</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {target === "montador" && (
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Montador</label>
          <select name="userId" required className="field-input">
            <option value="">Selecione...</option>
            {montadores.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="field-label">Mensagem</label>
        <textarea
          name="message"
          required
          rows={3}
          className="field-input"
          placeholder="Ex: O voo foi alterado. Novo horário: 06:20."
        />
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Enviando..." : "Enviar notificação"}
      </button>
    </form>
  );
}
