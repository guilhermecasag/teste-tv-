"use client";

import { useActionState } from "react";
import type { TravelInfoFormState } from "@/actions/trips";

type TravelInfo = {
  flightInfo: string | null;
  transportInfo: string | null;
  driverName: string | null;
  driverPhone: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  hotelPhone: string | null;
  hotelCheckIn: string | null;
  hotelCheckOut: string | null;
  notes: string | null;
};

const initialState: TravelInfoFormState = { error: null };

export function TravelInfoForm({
  action,
  defaultValues,
}: {
  action: (prev: TravelInfoFormState, formData: FormData) => Promise<TravelInfoFormState>;
  defaultValues: TravelInfo;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">✈️ Deslocamento</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">Voo / detalhes de deslocamento</label>
            <textarea
              name="flightInfo"
              defaultValue={defaultValues.flightInfo ?? ""}
              className="field-input"
              rows={2}
              placeholder="Companhia, horário, escalas, bagagem..."
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">Transporte local</label>
            <input
              name="transportInfo"
              defaultValue={defaultValues.transportInfo ?? ""}
              className="field-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Motorista</label>
            <input
              name="driverName"
              defaultValue={defaultValues.driverName ?? ""}
              className="field-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Telefone do motorista</label>
            <input
              name="driverPhone"
              defaultValue={defaultValues.driverPhone ?? ""}
              className="field-input"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">🏨 Hospedagem</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">Hotel</label>
            <input
              name="hotelName"
              defaultValue={defaultValues.hotelName ?? ""}
              className="field-input"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">Endereço</label>
            <input
              name="hotelAddress"
              defaultValue={defaultValues.hotelAddress ?? ""}
              className="field-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Telefone</label>
            <input
              name="hotelPhone"
              defaultValue={defaultValues.hotelPhone ?? ""}
              className="field-input"
            />
          </div>
          <div />
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Check-in</label>
            <input
              name="hotelCheckIn"
              type="date"
              defaultValue={defaultValues.hotelCheckIn?.slice(0, 10) ?? ""}
              className="field-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Check-out</label>
            <input
              name="hotelCheckOut"
              type="date"
              defaultValue={defaultValues.hotelCheckOut?.slice(0, 10) ?? ""}
              className="field-input"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="field-label">Observações gerais</label>
        <textarea
          name="notes"
          defaultValue={defaultValues.notes ?? ""}
          className="field-input"
          rows={2}
        />
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Salvando..." : "Salvar deslocamento e hospedagem"}
      </button>
    </form>
  );
}
