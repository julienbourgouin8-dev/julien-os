"use client";

import { useActionState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { changePassword } from "./actions";

const CARD =
  "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-6 shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <div className={CARD}>
      <form key={state?.success ? "reset" : "form"} action={action} className="space-y-4">
        <div>
          <label htmlFor="current" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Mot de passe actuel
          </label>
          <PasswordInput id="current" name="current" required autoComplete="current-password" />
        </div>
        <div>
          <label htmlFor="next" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Nouveau mot de passe
          </label>
          <PasswordInput id="next" name="next" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Confirme-le
          </label>
          <PasswordInput id="confirm" name="confirm" required minLength={8} autoComplete="new-password" />
        </div>

        {state?.error && <p className="text-sm text-rust">{state.error}</p>}
        {state?.success && <p className="text-sm text-teal">Mot de passe mis à jour.</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
