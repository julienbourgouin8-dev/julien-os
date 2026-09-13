import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import AdminSidebar from "./AdminSidebar";

// Verrou réel de l'admin : proxy.ts ne fait qu'un check optimiste (cookie
// présent ou non) pour éviter un flash de contenu ; ici on revérifie la
// signature/expiration du cookie au plus près de la donnée, conforme au
// guide Next "Data Access Layer".
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const valid = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);

  if (!valid) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10">{children}</main>
    </div>
  );
}
