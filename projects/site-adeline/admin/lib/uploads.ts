import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp, { type Sharp } from "sharp";

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

const PRODUCT_FRAME_WIDTH = 1600;
const PRODUCT_FRAME_HEIGHT = 900;
const TARGET_SUBJECT_HEIGHT = 0.79;
const MAX_SUBJECT_WIDTH = 0.9;

type SubjectBox = { minX: number; minY: number; maxX: number; maxY: number };

// Les photos produit sont réalisées sur le même fond de studio clair. On
// mesure la différence entre chaque pixel et le fond visible sur les bords
// gauche/droit de sa ligne : cela donne la boîte réelle de la pièce, sans
// dépendre de sa couleur (rose, noire, motifs clairs...). Le cadrage est
// ensuite rapproché pour que chaque pièce occupe la même hauteur que la
// trousse rose historique, tout en gardant un peu d'air sur les côtés.
async function detectSubjectBox(image: Sharp): Promise<SubjectBox | null> {
  const previewWidth = 400;
  const previewHeight = 225;
  const pixels = await image
    .clone()
    .resize(previewWidth, previewHeight, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

  let minX = previewWidth;
  let minY = previewHeight;
  let maxX = -1;
  let maxY = -1;
  const edgeWidth = 30;

  for (let y = 0; y < previewHeight; y += 1) {
    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    for (let x = 0; x < edgeWidth; x += 1) {
      for (const sampleX of [x, previewWidth - 1 - x]) {
        const sample = (y * previewWidth + sampleX) * 3;
        bgR += pixels[sample];
        bgG += pixels[sample + 1];
        bgB += pixels[sample + 2];
      }
    }
    const samples = edgeWidth * 2;
    bgR /= samples;
    bgG /= samples;
    bgB /= samples;

    for (let x = 0; x < previewWidth; x += 1) {
      const i = (y * previewWidth + x) * 3;
      const dr = pixels[i] - bgR;
      const dg = pixels[i + 1] - bgG;
      const db = pixels[i + 2] - bgB;
      if (Math.sqrt(dr * dr + dg * dg + db * db) > 32) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return maxX >= minX && maxY >= minY ? { minX, minY, maxX, maxY } : null;
}

async function normalizeProductFrame(buffer: Buffer): Promise<Buffer> {
  const oriented = sharp(buffer, { animated: false }).rotate();
  const metadata = await oriented.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Le cadrage automatique est volontairement limité aux photos paysage de
  // la boutique. Une éventuelle photo portrait reste entière au lieu d'être
  // rognée agressivement.
  if (!width || !height || width / height < 1.55 || width / height > 2.05) {
    return oriented
      .resize({ width: PRODUCT_FRAME_WIDTH, height: PRODUCT_FRAME_HEIGHT, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  }

  const box = await detectSubjectBox(oriented);
  if (!box) {
    return oriented
      .resize(PRODUCT_FRAME_WIDTH, PRODUCT_FRAME_HEIGHT, { fit: "fill" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  }

  const subjectWidth = (box.maxX - box.minX + 1) / 400;
  const subjectHeight = (box.maxY - box.minY + 1) / 225;
  const zoom = Math.max(1, Math.min(TARGET_SUBJECT_HEIGHT / subjectHeight, MAX_SUBJECT_WIDTH / subjectWidth));
  const cropHeight = Math.max(1, Math.round(height / zoom));
  const cropWidth = Math.max(1, Math.round(cropHeight * (16 / 9)));
  const centerX = ((box.minX + box.maxX + 1) / 2 / 400) * width;
  const centerY = ((box.minY + box.maxY + 1) / 2 / 225) * height;
  const left = Math.max(0, Math.min(width - cropWidth, Math.round(centerX - cropWidth / 2)));
  const top = Math.max(0, Math.min(height - cropHeight, Math.round(centerY - cropHeight / 2)));

  return oriented
    .extract({ left, top, width: Math.min(cropWidth, width), height: Math.min(cropHeight, height) })
    .resize(PRODUCT_FRAME_WIDTH, PRODUCT_FRAME_HEIGHT, { fit: "fill" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buffer);
  if (!ext) {
    throw new Error(`Fichier "${file.name}" refusé : ce n'est pas une image valide (jpg, png, webp ou gif).`);
  }
  // Les anciennes photos produit sont des fichiers déjà préparés dans
  // public/uploads, alors que les nouvelles arrivaient jusque-là dans Garage
  // exactement telles que l'iPhone les avait produites (plusieurs Mo, parfois
  // 4K). Toutes les nouvelles photos suivent désormais le même pipeline :
  // orientation EXIF appliquée, taille plafonnée à 1800 px, métadonnées
  // retirées et conversion WebP. 1800 px garde une marge confortable pour
  // l'affichage desktop/Retina sans stocker ni resservir une source 4K.
  const optimized = await normalizeProductFrame(buffer);
  const filename = `${crypto.randomUUID()}.webp`;
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: filename,
      Body: optimized,
      ContentType: CONTENT_TYPES.webp,
      CacheControl: "public, max-age=31536000, immutable",
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
