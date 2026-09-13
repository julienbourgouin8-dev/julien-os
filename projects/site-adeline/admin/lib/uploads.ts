import "server-only";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

// Dossier partagé avec la vitrine (voir app/app/uploads/[...path]/route.ts,
// qui sert ces mêmes fichiers) — remplace Supabase Storage.
const uploadsDir = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "../data/uploads");

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

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buffer);
  if (!ext) {
    throw new Error(`Fichier "${file.name}" refusé : ce n'est pas une image valide (jpg, png, webp ou gif).`);
  }
  const filename = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

// `url` est le chemin renvoyé par saveUploadedFile ("/uploads/xxx.jpg") —
// on ignore silencieusement si le fichier est déjà absent.
export async function deleteUploadedFile(url: string): Promise<void> {
  const filename = url.split("/uploads/")[1];
  if (!filename) return;
  await unlink(path.join(uploadsDir, filename)).catch(() => {});
}
