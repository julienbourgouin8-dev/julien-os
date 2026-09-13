import Link from "next/link";
import Header from "@/components/Header";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";
import { formatPrice } from "@/components/ProductCard";
import { getOrderByStripeSessionId } from "@/lib/db/orders";

// Le webhook Stripe (qui crée réellement la commande) peut arriver un poil
// après cette redirection navigateur — quelques tentatives espacées avant
// de retomber sur un message générique plutôt que de dépendre d'une
// course gagnée à coup sûr contre le webhook.
async function waitForOrder(sessionId: string) {
  for (let i = 0; i < 5; i++) {
    const order = await getOrderByStripeSessionId(sessionId);
    if (order) return order;
    await new Promise((r) => setTimeout(r, 800));
  }
  return null;
}

export default async function CommandeConfirmeePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id ? await waitForOrder(session_id) : null;

  return (
    <div className="min-h-screen">
      {session_id && <ClearCartOnSuccess />}
      <Header />

      <main
        className="flex min-h-[calc(100vh-77px)] items-center justify-center px-6 py-16 sm:px-10"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(47,95,99,0.10), transparent 55%), var(--color-paper)",
        }}
      >
        <div className="w-full max-w-lg text-center">
          <div className="hero-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>

          <h1 className="hero-rise mt-6 font-display text-4xl text-ink">Merci pour votre commande !</h1>

          {order ? (
            <>
              <p className="hero-rise mt-3 text-ink/60" style={{ animationDelay: "0.1s" }}>
                Adeline prépare votre pièce avec soin — total{" "}
                <strong className="text-ink">{formatPrice(order.total_cents)}</strong>.
              </p>

              <div
                className="hero-pop mt-8 rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-6 text-left shadow-[0_1px_2px_rgba(36,27,21,0.04),0_10px_28px_rgba(36,27,21,0.06)]"
                style={{ animationDelay: "0.15s" }}
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink/40">
                  Commande #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <div className="mt-4 space-y-3 border-t border-dashed border-line pt-4">
                  {order.items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm text-ink">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold">{formatPrice(item.price_cents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-bold text-ink">
                  <span>Total</span>
                  <span>{formatPrice(order.total_cents)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="hero-rise mt-3 text-ink/60" style={{ animationDelay: "0.1s" }}>
              Votre paiement est en cours de confirmation, encore un instant.
            </p>
          )}

          <Link
            href="/"
            className="hero-pop mt-10 inline-flex items-center gap-2 rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
            style={{ animationDelay: "0.25s" }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
