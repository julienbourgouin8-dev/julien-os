import "server-only";
import { NextResponse, type NextRequest } from "next/server";

// Le lien renvoyé par Sendcloud pour une étiquette (data.parcels[].documents[].link)
// exige nos identifiants API — un clic direct depuis le navigateur d'Adeline
// échoue en 401. Cette route protégée par la session admin (voir proxy.ts,
// tout est protégé par défaut sauf /login et /uploads) sert de relais :
// elle reconstruit l'URL du document à partir du seul parcelId (jamais une
// URL arbitraire passée en paramètre) et streame le PDF avec nos clés.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ parcelId: string }> }) {
  const { parcelId } = await params;
  if (!/^\d+$/.test(parcelId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pub = process.env.SENDCLOUD_PUBLIC_KEY;
  const sec = process.env.SENDCLOUD_SECRET_KEY;
  if (!pub || !sec) {
    return new NextResponse("Sendcloud non configuré.", { status: 500 });
  }

  const auth = `Basic ${Buffer.from(`${pub}:${sec}`).toString("base64")}`;
  const response = await fetch(`https://panel.sendcloud.sc/api/v3/parcels/${parcelId}/documents/label`, {
    headers: { Authorization: auth },
  });

  if (!response.ok) {
    return new NextResponse("Étiquette introuvable.", { status: response.status });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/pdf",
      "Content-Disposition": `inline; filename="etiquette-${parcelId}.pdf"`,
    },
  });
}
