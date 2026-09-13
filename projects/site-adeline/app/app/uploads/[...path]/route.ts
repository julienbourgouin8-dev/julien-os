import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

// Remplace Supabase Storage : sert les photos produits écrites par l'admin
// (voir admin/lib/uploads.ts) depuis le dossier partagé UPLOADS_DIR.
const uploadsDir = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "../data/uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  // Un seul segment attendu (uploadProductImages ne crée pas de
  // sous-dossiers) — refuse tout ".." pour rester dans uploadsDir.
  if (segments.some((s) => s.includes(".."))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(uploadsDir, ...segments);
  if (!filePath.startsWith(uploadsDir)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    await stat(filePath);
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
