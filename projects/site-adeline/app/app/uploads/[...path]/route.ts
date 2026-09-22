import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Migration 2026-09-22 : sert les photos produits depuis le bucket S3 privé
// Garage (voir admin/lib/uploads.ts) au lieu du disque local — le bucket
// n'est jamais exposé publiquement, seule cette route (authentifiée par les
// identifiants serveur) peut le lire.
let s3Instance: S3Client | null = null;

function getS3(): S3Client {
  if (!s3Instance) {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
      throw new Error("Variables S3_ENDPOINT/S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY manquantes.");
    }
    s3Instance = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return s3Instance;
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  // Un seul segment attendu (saveUploadedFile ne crée pas de sous-dossiers)
  // — refuse tout ".." pour ne pas laisser construire une clé S3 arbitraire.
  if (segments.length !== 1 || segments[0].includes("..") || segments[0].includes("/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  const key = segments[0];
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const object = await getS3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const buffer = Buffer.from(await object.Body!.transformToByteArray());
    const ext = key.slice(key.lastIndexOf(".")).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": object.ContentType ?? CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
