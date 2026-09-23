import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getAllOrdersForAdmin } from "@/lib/db/orders";
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

  // "paid" = payée mais pas encore marquée traitée par Adeline — c'est la
  // file d'attente réelle. Compté ici (pas dans la sidebar elle-même,
  // "use client") pour que le badge soit visible sur TOUTES les pages
  // admin, pas seulement le tableau de bord — Julien ne voulait plus avoir
  // à ouvrir "Commandes" pour savoir qu'il y a quelque chose à traiter.
  const orders = await getAllOrdersForAdmin();
  const pendingCount = orders.filter((o) => o.status === "paid").length;

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar pendingOrdersCount={pendingCount} />
      <main className="flex-1 px-10 py-10">{children}</main>
    </div>
  );
}
