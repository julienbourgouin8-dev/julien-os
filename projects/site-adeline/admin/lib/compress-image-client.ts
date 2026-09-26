// Pré-compression côté navigateur, avant l'envoi du formulaire produit.
// Le serveur (lib/uploads.ts) reste l'autorité : il recadre, plafonne à
// 1600×900 et convertit en WebP. Ici on ne fait que réduire le poids envoyé
// (un PNG "studio" sort à ~6 Mo ; 4 d'un coup dépassaient la limite de 20 Mo
// des server actions). Pas de recadrage ici : la détection du sujet côté
// serveur a besoin de l'image entière.
const MAX_SIDE = 2400;
const SKIP_UNDER_BYTES = 800 * 1024;

export async function compressImageForUpload(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    if (file.size <= SKIP_UNDER_BYTES) return file;

    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
