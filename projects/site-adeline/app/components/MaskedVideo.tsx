"use client";

import { useEffect, useRef } from "react";

// Lit deux vidéos H.264 standard en parallèle — une couleur, une masque en
// niveaux de gris (luminance = alpha) — et les recompose en temps réel sur
// un canvas transparent. Fonctionne dans tous les navigateurs de la même
// façon, contrairement au canal alpha du conteneur webm/VP9 (pas fiable
// partout, ex. Safari qui l'affiche en noir opaque).
// Recadrage source (en fraction 0–1 de la vidéo brute) sur la zone où le
// sac se trouve réellement, mesuré sur l'union des boîtes englobantes du
// masque alpha à travers toute la rotation — sans ça, le cadre 16:9 plein
// de vide autour du produit s'affichait étiré/déformé dans une case
// portrait, complètement décalé par rapport au crop de la photo statique.
const DEFAULT_CROP = { sx: 0.30, sy: 0.0, sw: 0.40, sh: 1.0 };

export default function MaskedVideo({
  colorSrc,
  maskSrc,
  active,
  className,
  crop = DEFAULT_CROP,
}: {
  colorSrc: string;
  maskSrc: string;
  active: boolean;
  className?: string;
  crop?: { sx: number; sy: number; sw: number; sh: number };
}) {
  const colorRef = useRef<HTMLVideoElement>(null);
  const maskRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const color = colorRef.current;
    const mask = maskRef.current;
    const canvas = canvasRef.current;
    if (!color || !mask || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !maskCtx) return;

    // résolution de sortie proportionnée au recadrage (évite toute
    // déformation par rapport à l'aspect du crop source)
    const OUT_H = 560;
    const OUT_W = Math.round(OUT_H * (crop.sw / crop.sh));
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    maskCanvas.width = OUT_W;
    maskCanvas.height = OUT_H;

    const draw = () => {
      if (color.readyState >= 2 && mask.readyState >= 2) {
        // resynchronise si les deux flux dérivent l'un de l'autre
        if (Math.abs(mask.currentTime - color.currentTime) > 0.08) {
          mask.currentTime = color.currentTime;
        }
        const sx = crop.sx * color.videoWidth;
        const sy = crop.sy * color.videoHeight;
        const sw = crop.sw * color.videoWidth;
        const sh = crop.sh * color.videoHeight;
        ctx.drawImage(color, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
        const frame = ctx.getImageData(0, 0, OUT_W, OUT_H);
        const msx = crop.sx * mask.videoWidth;
        const msy = crop.sy * mask.videoHeight;
        const msw = crop.sw * mask.videoWidth;
        const msh = crop.sh * mask.videoHeight;
        maskCtx.drawImage(mask, msx, msy, msw, msh, 0, 0, OUT_W, OUT_H);
        const maskData = maskCtx.getImageData(0, 0, OUT_W, OUT_H);
        const d = frame.data;
        const m = maskData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i + 3] = m[i];
        }
        ctx.putImageData(frame, 0, 0);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const color = colorRef.current;
    const mask = maskRef.current;
    if (!color || !mask) return;
    if (active) {
      color.currentTime = 0;
      mask.currentTime = 0;
      color.play().catch(() => {});
      mask.play().catch(() => {});
    } else {
      color.pause();
      mask.pause();
    }
  }, [active]);

  return (
    <>
      {/* pas de display:none — certains navigateurs arrêtent de décoder les
          frames d'une vidéo display:none, ce qui casse le dessin sur canvas */}
      <video
        ref={colorRef}
        src={colorSrc}
        muted
        loop
        playsInline
        preload="auto"
        style={{ position: "fixed", width: 2, height: 2, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}
      />
      <video
        ref={maskRef}
        src={maskSrc}
        muted
        loop
        playsInline
        preload="auto"
        style={{ position: "fixed", width: 2, height: 2, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}
      />
      <canvas ref={canvasRef} className={className} />
    </>
  );
}
