import Link from "next/link";
import { isResetTokenValid } from "@/lib/auth/reset-tokens";
import ResetForm from "./ResetForm";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await isResetTokenValid(token);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(79,108,143,0.10), transparent 55%), var(--color-paper)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#fffdf8] p-9"
        style={{ boxShadow: "0 1px 2px rgba(36,27,21,0.04), 0 24px 48px -12px rgba(36,27,21,0.12)" }}
      >
        <p className="text-center font-script text-3xl text-ink">CréA&apos;deline</p>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/35">
          Nouveau mot de passe
        </p>

        {valid ? (
          <ResetForm token={token} />
        ) : (
          <>
            <p className="mt-8 text-center text-sm text-ink/70">
              Ce lien a expiré ou a déjà été utilisé.
            </p>
            <Link
              href="/mot-de-passe-oublie"
              className="mt-6 block rounded-xl bg-denim px-6 py-3 text-center text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Refaire une demande
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
