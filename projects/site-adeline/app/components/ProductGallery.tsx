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
    // Empilement vertical, une photo pleine largeur après l'autre — plus de
    // galerie miniature + cadre fixe (qui forçait un ratio et rognait/
    // ajoutait des bandes dès qu'une photo ne matchait pas). <img> nature
    // plutôt que next/image : on ne connaît pas à l'avance le ratio des
    // prochaines photos uploadées par l'admin, et un width/height figé sur
    // next/image aurait déformé toute photo qui ne fait pas exactement
    // 1600×893 (le format des 4 photos actuelles). Avec <img> + h-auto, le
    // navigateur respecte toujours le ratio réel du fichier, jamais
    // recadré/déformé.
    <div className="flex flex-col gap-6">
      {images.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={i === 0 ? name : `${name} — vue ${i + 1}`}
          loading={i === 0 ? "eager" : "lazy"}
          className="block h-auto w-full bg-white"
        />
      ))}
    </div>
  );
}
