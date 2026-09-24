import "server-only";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/contact";
import { formatPrice } from "@/components/ProductCard";
import type { OrderItem } from "@/lib/db/orders";

const FROM = "CréA'deline <commandes@creadeline16.fr>";
const ADMIN_URL = "https://admin.creadeline16.fr";

// Notification à Adeline (CONTACT_EMAIL, voir lib/contact.ts) à chaque
// commande payée, pour ne plus avoir à ouvrir l'admin "au cas où" — demande
// explicite de Julien.
export async function sendNewOrderNotification(params: {
  orderId: string;
  items: OrderItem[];
  totalCents: number;
  shippingMethod: string | null;
  customerEmail: string | null;
  // Noms des articles payés dont le stock s'est révélé insuffisant au
  // moment du webhook (survente sur une pièce unique commandée deux fois
  // quasi simultanément) — voir app/api/webhooks/stripe/route.ts. Quand
  // c'est le cas, l'étiquette n'est jamais générée automatiquement et
  // Adeline doit intervenir à la main (rembourser ou proposer une
  // alternative à la cliente).
  oversoldItems?: string[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const itemsText = params.items.map((i) => `- ${i.name} × ${i.quantity} (${formatPrice(i.price_cents * i.quantity)})`).join("\n");
  const methodLabel =
    params.shippingMethod === "retrait"
      ? "Retrait à l'entrepôt"
      : params.shippingMethod === "domicile"
        ? "Livraison à domicile"
        : params.shippingMethod === "point_relais"
          ? "Point relais"
          : "Non renseigné";

  const hasOversold = Boolean(params.oversoldItems?.length);
  const warning = hasOversold
    ? `⚠️ ATTENTION — cette pièce n'est plus en stock : ${params.oversoldItems!.join(", ")}. La cliente a payé mais l'article a déjà été vendu à quelqu'un d'autre entre-temps. Aucune étiquette n'a été générée automatiquement. Contacte-la vite pour lui proposer une pièce similaire ou un remboursement (le remboursement Stripe se répercute maintenant automatiquement ici).\n\n`
    : "";

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to: CONTACT_EMAIL,
    subject: hasOversold
      ? `⚠️ Commande #${shortId} — article déjà vendu, action requise`
      : `🧵 Nouvelle commande #${shortId} — ${formatPrice(params.totalCents)}`,
    text: `${warning}Nouvelle commande reçue !\n\n${itemsText}\n\nTotal : ${formatPrice(params.totalCents)}\nLivraison : ${methodLabel}\nClient : ${params.customerEmail ?? "email non fourni"}\n\nVoir la commande : ${ADMIN_URL}/orders/${params.orderId}`,
  });
}
