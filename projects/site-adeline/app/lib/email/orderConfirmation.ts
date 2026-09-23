import "server-only";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import { formatPrice } from "@/components/ProductCard";
import { getProductById } from "@/lib/db/products";
import type { OrderItem } from "@/lib/db/orders";

// Domaine creadeline16.fr vérifié sur Resend (2026-09-23) — envoie
// maintenant vers n'importe quel client, plus limité à l'adresse du compte.
const FROM = "CréA'deline <commandes@creadeline16.fr>";

export async function sendOrderConfirmationEmail(params: {
  customerEmail: string | null;
  customerName?: string | null;
  orderId: string;
  items: OrderItem[];
  totalCents: number;
  shippingMethod: string | null;
  trackingUrl?: string | null;
  trackingNumber?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !params.customerEmail) return;

  // Image réelle de chaque article au moment de l'envoi — jamais une image
  // statique/générique (demande explicite de Julien, risque constaté :
  // confondre les pièces si la même image apparaît pour tout le monde).
  const itemsWithImage = await Promise.all(
    params.items.map(async (item) => {
      const product = await getProductById(item.product_id);
      const image = product?.images[0];
      return {
        ...item,
        imageUrl: image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : null,
      };
    }),
  );

  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const firstName = params.customerName?.trim().split(/\s+/)[0] || null;

  const itemsHtml = itemsWithImage
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #ece5da;" width="72">
            ${
              item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${item.name}" width="64" height="64" style="width:64px;height:64px;border-radius:10px;object-fit:cover;display:block;" />`
                : ""
            }
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #ece5da;font-family:Georgia,serif;color:#241b15;font-size:15px;">
            ${item.name} × ${item.quantity}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #ece5da;font-family:Georgia,serif;color:#241b15;font-size:15px;text-align:right;white-space:nowrap;">
            ${formatPrice(item.price_cents * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const trackingBlock =
    params.shippingMethod === "retrait"
      ? `<p style="font-family:Georgia,serif;color:#241b15;font-size:15px;line-height:1.6;">
           📦 Retrait à l'entrepôt — Adeline vous recontactera pour convenir d'un créneau, aucune expédition prévue.
         </p>`
      : params.trackingUrl
        ? `<p style="text-align:center;margin:28px 0;">
             <a href="${params.trackingUrl}" style="background:#4f6c8f;color:#fffdf8;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:999px;display:inline-block;">
               Suivre mon colis
             </a>
           </p>
           ${params.trackingNumber ? `<p style="text-align:center;font-family:Arial,sans-serif;color:#8a7f72;font-size:12px;">N° de suivi : ${params.trackingNumber}</p>` : ""}`
        : `<p style="font-family:Georgia,serif;color:#241b15;font-size:15px;line-height:1.6;">
             Votre étiquette d'expédition est en cours de préparation — vous recevrez le lien de suivi dès qu'elle sera prête.
           </p>`;

  const html = `
    <div style="background:#f3efe8;padding:32px 16px;font-family:Georgia,serif;">
      <div style="max-width:520px;margin:0 auto;background:#fffdf8;border-radius:16px;padding:32px;">
        <h1 style="font-family:Georgia,serif;color:#241b15;font-size:24px;margin:0 0 8px;">
          Merci${firstName ? ` ${firstName}` : ""} pour votre commande !
        </h1>
        <p style="font-family:Georgia,serif;color:#6b5f52;font-size:14px;margin:0 0 24px;">
          Commande #${shortId} — Adeline prépare votre pièce avec soin.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px dashed #d8cdbc;">
          ${itemsHtml}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr>
            <td style="padding-top:12px;font-family:Arial,sans-serif;font-weight:bold;color:#241b15;">Total</td>
            <td style="padding-top:12px;font-family:Arial,sans-serif;font-weight:bold;color:#241b15;text-align:right;">
              ${formatPrice(params.totalCents)}
            </td>
          </tr>
        </table>
        <div style="margin-top:16px;">${trackingBlock}</div>
      </div>
    </div>
  `;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to: params.customerEmail,
    replyTo: CONTACT_EMAIL,
    subject: `Votre commande CréA'deline #${shortId}`,
    html,
  });
}
