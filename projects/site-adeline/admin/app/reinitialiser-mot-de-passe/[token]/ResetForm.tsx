"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordState } from "./actions";

export default function ResetForm({ token }: { token: string }) {
  const boundAction = resetPassword.bind(null, token);
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(boundAction, undefined);

  if (state?.done) {
    return (
      <>
        <p className="mt-8 text-center text-sm text-ink/70">
          Nouveau mot de passe enregistré. Tu peux maintenant te connecter avec.
        </p>
        <Link
          href="/login"
          className="mt-6 block rounded-xl bg-denim px-6 py-3 text-center text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
        >
          Se connecter
        </Link>
      </>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
          Confirme-le
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
        />
      </div>

      {state?.error && <p className="text-center text-sm text-rust">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-denim px-6 py-3 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
      </button>
    </form>
  );
}
