import "server-only";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/contact";
import { formatPrice } from "@/components/ProductCard";
import type { OrderItem } from "@/lib/db/orders";

const FROM = "CréA'deline <onboarding@resend.dev>";
const ADMIN_URL = "https://admin.creadeline16.fr";

// Notification à Adeline (pour l'instant CONTACT_EMAIL, voir lib/contact.ts
// — même compte Resend, même restriction que orderConfirmation.ts tant que
// le domaine n'est pas vérifié) à chaque commande payée, pour ne plus avoir
// à ouvrir l'admin "au cas où" — demande explicite de Julien.
export async function sendNewOrderNotification(params: {
  orderId: string;
  items: OrderItem[];
  totalCents: number;
  shippingMethod: string | null;
  customerEmail: string | null;
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

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to: CONTACT_EMAIL,
    subject: `🧵 Nouvelle commande #${shortId} — ${formatPrice(params.totalCents)}`,
    text: `Nouvelle commande reçue !\n\n${itemsText}\n\nTotal : ${formatPrice(params.totalCents)}\nLivraison : ${methodLabel}\nClient : ${params.customerEmail ?? "email non fourni"}\n\nVoir la commande : ${ADMIN_URL}/orders/${params.orderId}`,
  });
}
