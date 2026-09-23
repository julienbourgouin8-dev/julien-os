import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";

// Marge blanche ajoutée sur tous les bords (constaté en test réel : le
// gabarit de certaines étiquettes, ex. Mondial Relay domicile "HOM", place
// du contenu (le bloc noir de tri) collé au bord droit de la page — pas
// notre PDF, on ne le génère pas, mais rien n'empêche de le retraiter avant
// de le servir). La page garde exactement les mêmes dimensions (compatible
// rouleau d'étiquettes thermique comme impression A4 "taille réelle") — on
// réduit juste le contenu et on le recentre, plutôt que d'agrandir la page.
const MARGIN_RATIO = 0.06;

// Rétrécit et recentre chaque page du PDF source dans une marge blanche
// (voir MARGIN_RATIO) — jamais bloquant : si le retraitement échoue pour
// une raison quelconque, on sert le PDF original tel quel plutôt que de
// faire échouer tout le téléchargement de l'étiquette.
async function addMargin(sourceBytes: Uint8Array): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(sourceBytes);
  const outDoc = await PDFDocument.create();
  const pages = await outDoc.embedPdf(srcDoc);

  for (const embedded of pages) {
    const { width, height } = embedded;
    const page = outDoc.addPage([width, height]);
    const scale = 1 - MARGIN_RATIO * 2;
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    page.drawPage(embedded, {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return outDoc.save();
}

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
  const contentType = response.headers.get("Content-Type") ?? "application/pdf";

  let output: Uint8Array = new Uint8Array(buffer);
  if (contentType.includes("pdf")) {
    try {
      output = await addMargin(output);
    } catch (err) {
      console.error("[Label] Échec de l'ajout de marge, envoi du PDF original :", err);
    }
  }

  return new NextResponse(Buffer.from(output), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="etiquette-${parcelId}.pdf"`,
    },
  });
}
