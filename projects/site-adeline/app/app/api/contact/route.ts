import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/contact";

type ContactRequest = {
  name: string;
  email: string;
  pieceType: string;
  fabric: string;
  message: string;
};

// Domaine creadeline16.fr vérifié sur Resend (2026-09-23) — plus besoin de
// l'adresse de test resend.dev. `reply_to` pointe vers le visiteur pour
// qu'Adeline puisse répondre directement depuis son mail.
const FROM = "CréA'deline <contact@creadeline16.fr>";

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Envoi non configuré." }, { status: 500 });
  }

  let body: ContactRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { name, email, pieceType, fabric, message } = body;
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: CONTACT_EMAIL,
    replyTo: email,
    subject: `Demande via le site — ${pieceType}`,
    text: `Type de pièce : ${pieceType}\nTissu souhaité : ${fabric}\n\n${message}\n\n— ${name} (${email})`,
  });

  if (error) {
    return NextResponse.json({ error: "Envoi impossible." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
