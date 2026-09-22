import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Migration 2026-09-22 : filesystem local (UPLOADS_DIR, non persistant en
// serverless) → bucket S3 privé sur Garage, auto-hébergé sur le VPS à côté
// du reste (voir projects/site-adeline/PROGRESS.md, section migration
// hébergement). Le bucket reste privé : ni l'app ni l'admin n'exposent
// d'URL publique directe vers Garage, les deux continuent de servir les
// images via leur route `/uploads/[...path]` existante (voir
// app/app/uploads/[...path]/route.ts et l'équivalent admin), qui lit
// maintenant l'objet depuis S3 au lieu du disque.
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
      forcePathStyle: true, // requis par Garage (pas de virtual-hosted-style)
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return s3Instance;
}

function bucket(): string {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error("Variable S3_BUCKET manquante.");
  return name;
}

// Détection par signature binaire (magic bytes), pas par le nom donné par le
// navigateur — un fichier renommé "photo.jpg" contenant tout autre chose
// serait sinon accepté tel quel (voir audit sécurité 2026-09-13). Mêmes
// formats que la whitelist de content-type dans app/app/uploads/[...path]/route.ts.
function detectImageExt(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a")
    return "gif";
  return null;
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buffer);
  if (!ext) {
    throw new Error(`Fichier "${file.name}" refusé : ce n'est pas une image valide (jpg, png, webp ou gif).`);
  }
  const filename = `${crypto.randomUUID()}.${ext}`;
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: filename,
      Body: buffer,
      ContentType: CONTENT_TYPES[ext],
    }),
  );
  return `/uploads/${filename}`;
}

// `url` est le chemin renvoyé par saveUploadedFile ("/uploads/xxx.jpg") —
// on ignore silencieusement si l'objet est déjà absent.
export async function deleteUploadedFile(url: string): Promise<void> {
  const filename = url.split("/uploads/")[1];
  if (!filename) return;
  await getS3()
    .send(new DeleteObjectCommand({ Bucket: bucket(), Key: filename }))
    .catch(() => {});
}
