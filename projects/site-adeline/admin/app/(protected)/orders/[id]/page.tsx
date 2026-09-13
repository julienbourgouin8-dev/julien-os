import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/db/orders";
import MarkFulfilledButton from "../MarkFulfilledButton";
import AnonymizeOrderButton from "../AnonymizeOrderButton";

const CARD =
  "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const address = order.shipping_address as
    | { line1?: string; line2?: string; postal_code?: string; city?: string; country?: string }
    | null;

  return (
    <div>
      <Link href="/orders" className="text-xs font-semibold uppercase tracking-[0.15em] text-teal">
        ← Commandes
      </Link>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
            {formatDate(order.created_at)}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">{formatPrice(order.total_cents)}</h1>
        </div>
        {order.status !== "fulfilled" && <MarkFulfilledButton id={order.id} />}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className={`${CARD} p-6`}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Articles</p>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-ink">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-semibold text-ink">{formatPrice(item.price_cents * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${CARD} p-6`}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Client</p>
          <p className="mt-3 text-sm text-ink">{order.customer_email ?? "Email non fourni"}</p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Livraison</p>
          {address ? (
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {address.line1}
              {address.line2 ? <> · {address.line2}</> : null}
              <br />
              {address.postal_code} {address.city}
              <br />
              {address.country}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink/50">Adresse non fournie</p>
          )}

          {(order.customer_email || address) && (
            <div className="mt-6 border-t border-ink/[0.06] pt-4">
              <AnonymizeOrderButton id={order.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
