import Link from "next/link";
import { getAllOrdersForAdmin } from "@/lib/db/orders";

const CARD =
  "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "En attente", bg: "rgba(36,27,21,0.06)", fg: "var(--color-ink)" },
  paid: { label: "Payée", bg: "rgba(47,95,99,0.12)", fg: "var(--color-teal)" },
  fulfilled: { label: "Expédiée", bg: "rgba(79,108,143,0.12)", fg: "var(--color-denim)" },
  cancelled: { label: "Annulée", bg: "rgba(173,74,52,0.1)", fg: "var(--color-rust)" },
};

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersForAdmin();

  return (
    <div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Ventes</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Commandes</h1>
      </div>

      {orders.length === 0 ? (
        <div className={`${CARD} mt-10 max-w-md p-10 text-center`}>
          <p className="text-ink/70">Aucune commande pour l&apos;instant.</p>
        </div>
      ) : (
        <div className={`${CARD} mt-8 overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.1em] text-ink/40">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Client</th>
                <th className="px-4 py-4 font-medium">Articles</th>
                <th className="px-4 py-4 font-medium">Total</th>
                <th className="px-4 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {orders.map((o) => {
                const status = STATUS_STYLE[o.status];
                return (
                  <tr key={o.id} className="transition-colors hover:bg-ink/[0.015]">
                    <td className="px-6 py-3.5 text-ink/60">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3.5 text-ink/60">{o.customer_email ?? "—"}</td>
                    <td className="px-4 py-3.5 text-ink/60">
                      {o.items.reduce((n, i) => n + i.quantity, 0)} pièce(s)
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">{formatPrice(o.total_cents)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: status.bg, color: status.fg }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/orders/${o.id}`} className="text-ink/45 hover:text-denim">
                        Détail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
