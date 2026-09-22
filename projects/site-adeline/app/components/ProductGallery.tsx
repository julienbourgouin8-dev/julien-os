import Image from "next/image";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 bg-white">
        <svg width="40" height="40" viewBox="0 0 34 34" fill="none" className="text-ink/20">
          <rect x="5" y="11" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11V9a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 18h24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 3" />
        </svg>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink/35">Photo à venir</p>
      </div>
    );
  }

  return (
    // Empilement vertical, une photo pleine largeur après l'autre. Les
    // attributs width/height donnent une réserve 16:9 (format produit
    // historique) mais `h-auto` conserve toujours le ratio intrinsèque réel.
    // Contrairement à l'ancien <img> brut, next/image sert ici une variante
    // AVIF/WebP dimensionnée pour l'écran au lieu de télécharger la source
    // Garage complète sur la fiche produit.
    <div className="flex flex-col gap-6">
      {images.map((url, i) => (
        <Image
          key={url}
          src={url}
          alt={i === 0 ? name : `${name} — vue ${i + 1}`}
          width={1600}
          height={900}
          sizes="(min-width: 1280px) 690px, (min-width: 1024px) 55vw, 100vw"
          quality={82}
          priority={i === 0}
          unoptimized={url.startsWith("/uploads/")}
          className="block h-auto w-full bg-white"
        />
      ))}
    </div>
  );
}
