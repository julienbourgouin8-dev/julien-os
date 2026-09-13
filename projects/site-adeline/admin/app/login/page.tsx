"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(79,108,143,0.10), transparent 55%), var(--color-paper)",
      }}
    >
      <form
        action={action}
        className="w-full max-w-sm rounded-2xl bg-[#fffdf8] p-9"
        style={{ boxShadow: "0 1px 2px rgba(36,27,21,0.04), 0 24px 48px -12px rgba(36,27,21,0.12)" }}
      >
        <p className="text-center font-script text-3xl text-ink">CréA&apos;deline</p>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/35">
          Espace admin
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
              Identifiant
            </label>
            <input
              id="email"
              name="email"
              type="text"
              required
              autoComplete="username"
              className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl bg-ink/[0.04] px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-denim"
            />
          </div>
        </div>

        {state?.error && <p className="mt-4 text-center text-sm text-rust">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-7 w-full rounded-xl bg-denim px-6 py-3 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
