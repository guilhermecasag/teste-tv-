"use client";

import { useActionState } from "react";
import type { UserFormState } from "@/actions/users";

type UserDefaults = {
  name: string;
  email: string;
  role: "ADMIN" | "MONTADOR" | "ESPECTADOR";
  phone: string | null;
  whatsapp: string | null;
  cargo: string | null;
};

const ROLE_OPTIONS: { value: UserDefaults["role"]; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MONTADOR", label: "Montador" },
  { value: "ESPECTADOR", label: "Espectador / Gestor" },
];

const initialState: UserFormState = { error: null };

export function UserForm({
  action,
  defaultValues,
  submitLabel,
  lockRole,
  requirePassword,
  onSuccess,
}: {
  action: (prev: UserFormState, formData: FormData) => Promise<UserFormState>;
  defaultValues?: UserDefaults;
  submitLabel: string;
  lockRole?: UserDefaults["role"];
  requirePassword?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: UserFormState, formData: FormData) => {
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
          <label className="field-label">Nome *</label>
          <input name="name" required defaultValue={defaultValues?.name} className="field-input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">E-mail *</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultValues?.email}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">
            {requirePassword ? "Senha *" : "Nova senha (opcional)"}
          </label>
          <input
            name="password"
            type="password"
            required={requirePassword}
            placeholder={requirePassword ? undefined : "Deixe em branco para manter"}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Papel *</label>
          {lockRole ? (
            <>
              <input type="hidden" name="role" value={lockRole} />
              <input
                disabled
                value={ROLE_OPTIONS.find((r) => r.value === lockRole)?.label}
                className="field-input opacity-60"
              />
            </>
          ) : (
            <select
              name="role"
              defaultValue={defaultValues?.role ?? "MONTADOR"}
              className="field-input"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Cargo</label>
          <input
            name="cargo"
            defaultValue={defaultValues?.cargo ?? ""}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Telefone</label>
          <input
            name="phone"
            defaultValue={defaultValues?.phone ?? ""}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={defaultValues?.whatsapp ?? ""}
            className="field-input"
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
