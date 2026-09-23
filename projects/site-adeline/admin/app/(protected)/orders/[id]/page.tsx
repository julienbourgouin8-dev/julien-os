import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/db/orders";
import MarkFulfilledButton from "../MarkFulfilledButton";
import AnonymizeOrderButton from "../AnonymizeOrderButton";
import GenerateShippingLabelButton from "../GenerateShippingLabelButton";
import CancelOrderButton from "../CancelOrderButton";

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
          {order.status === "cancelled" && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-rust">Annulée</p>
          )}
        </div>
        {order.status !== "cancelled" && (
          <div className="flex items-center gap-3">
            {order.status !== "fulfilled" && <MarkFulfilledButton id={order.id} />}
            <CancelOrderButton id={order.id} />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">Expédition & Suivi</p>
              <span className="text-xs font-medium text-ink/50">{order.shipping_carrier || "Sendcloud"}</span>
            </div>

            {order.shipping_tracking_number ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs text-ink/50">Numéro de suivi :</p>
                    <p className="font-mono text-sm font-semibold text-ink">{order.shipping_tracking_number}</p>
                  </div>
                  {order.shipping_tracking_url && (
                    <a
                      href={order.shipping_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-teal hover:underline"
                    >
                      Suivre le colis ↗
                    </a>
                  )}
                </div>

                {order.shipping_parcel_id && (
                  <div className="pt-2">
                    <a
                      href={`/api/sendcloud-label/${order.shipping_parcel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-denim px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-denim/90"
                    >
                      📄 Télécharger l&apos;étiquette d&apos;affranchissement (PDF)
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-ink/60">
                  Aucune étiquette n&apos;est encore associée à cette commande.
                </p>
                {address && <GenerateShippingLabelButton id={order.id} />}
              </div>
            )}
          </div>
        </div>

        <div className={`${CARD} p-6 self-start`}>
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
