import { cookies } from "next/headers";
import { COOKIE_NAME, getSessionEmailFromToken } from "@/lib/auth/session";
import { listAdminAccounts } from "@/lib/auth/credentials";
import ChangePasswordForm from "./ChangePasswordForm";
import CreateAccountForm from "./CreateAccountForm";

export default async function ComptePage() {
  const cookieStore = await cookies();
  const email = getSessionEmailFromToken(cookieStore.get(COOKIE_NAME)?.value);
  const accounts = await listAdminAccounts();

  return (
    <div className="max-w-md space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Mon compte</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Changer mon mot de passe</h1>
        {email && <p className="mt-1 text-sm text-ink/45">Connecté en tant que {email}</p>}
      </div>

      <ChangePasswordForm />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Comptes administrateurs</p>
        <h2 className="mt-1 font-display text-2xl text-ink">Ajouter un accès</h2>
        {accounts.length > 0 && (
          <p className="mt-1 text-sm text-ink/45">Comptes existants : {accounts.map((a) => a.email).join(", ")}.</p>
        )}
      </div>

      <CreateAccountForm />
    </div>
  );
}
