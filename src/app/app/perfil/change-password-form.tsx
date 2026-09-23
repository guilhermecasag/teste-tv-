"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type ChangePasswordFormState } from "@/actions/users";

const initialState: ChangePasswordFormState = { error: null };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3" key={state.success ? "reset" : "form"}>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Senha atual</label>
        <input name="currentPassword" type="password" required className="field-input" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Nova senha</label>
        <input name="newPassword" type="password" required className="field-input" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Confirmar nova senha</label>
        <input name="confirmPassword" type="password" required className="field-input" />
      </div>

      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && (
        <p className="rounded-lg bg-brand-primary-light px-3 py-2 text-sm text-brand-primary">
          Senha alterada com sucesso.
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
