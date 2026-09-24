"use client";

import { useActionState } from "react";
import { createAccount } from "./actions";

const CARD =
  "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-6 shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

export default function CreateAccountForm() {
  const [state, action, pending] = useActionState(createAccount, undefined);

  return (
    <div className={CARD}>
      <form key={state?.success ? "reset" : "form"} action={action} className="space-y-4">
        <div>
          <label htmlFor="new-email" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Identifiant
          </label>
          <input
            id="new-email"
            name="email"
            type="text"
            required
            autoComplete="off"
            className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Mot de passe initial
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
          />
        </div>
        <div>
          <label htmlFor="recoveryEmail" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
            Email de récupération
          </label>
          <input
            id="recoveryEmail"
            name="recoveryEmail"
            type="email"
            required
            autoComplete="off"
            className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
          />
          <p className="mt-1.5 text-xs text-ink/40">
            Sert uniquement à recevoir le lien en cas de mot de passe oublié.
          </p>
        </div>

        {state?.error && <p className="text-sm text-rust">{state.error}</p>}
        {state?.success && <p className="text-sm text-teal">Compte créé.</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer le compte"}
        </button>
      </form>
    </div>
  );
}
