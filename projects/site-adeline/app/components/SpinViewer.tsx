"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type SpinViewerProps = {
  /** Dossier contenant les frames, ex. "/products/spin/sac-savane". */
  basePath: string;
  /** Nombre de frames dans ce dossier (frame-001.jpg ... frame-0XX.jpg). */
  frameCount: number;
  alt: string;
  className?: string;
};

// Px de glissement horizontal pour avancer d'une frame — plus petit =
// rotation plus "sensible" au doigt.
const PX_PER_FRAME = 6;

// Idée de Julien (2026-09-16) : remplacer la vidéo qui tourne toute seule
// par une rotation pilotée au doigt — glisser horizontalement fait
// tourner le produit frame par frame, glisser verticalement continue de
// faire défiler la page normalement. `touch-action: pan-y` (classe
// `touch-pan-y`) est ce qui rend ça fiable : ça dit au navigateur de
// gérer nativement le défilement vertical (donc de ne jamais nous
// couper au milieu d'un scroll) et de nous laisser toute latitude sur
// l'axe horizontal — pas besoin d'un `preventDefault` heuristique pour
// deviner l'intention du geste, le navigateur tranche lui-même selon
// l'axe dominant du mouvement.
//
// Frames pré-découpées (pas de scrub vidéo) : `video.currentTime` peut
// être saccadé au seek sur mobile (Safari en particulier) selon
// l'espacement des keyframes, alors que basculer entre des images déjà
// décodées est instantané — c'est le choix que font les vrais viewers
// 360 produit.
export default function SpinViewer({ basePath, frameCount, alt, className }: SpinViewerProps) {
  const [frame, setFrame] = useState(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startFrameRef = useRef(0);

  const frameSrc = (i: number) => `${basePath}/frame-${String(i + 1).padStart(3, "0")}.jpg`;

  // Précharge toutes les frames dès le montage — le lot pèse quelques
  // centaines de Ko par produit (jpg 720px), rien qui justifie un
  // chargement progressif pour l'instant.
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < frameCount; i++) {
      const img = new window.Image();
      img.src = frameSrc(i);
      images.push(img);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, frameCount]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startFrameRef.current = frame;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const steps = Math.round(dx / PX_PER_FRAME);
    let next = (startFrameRef.current + steps) % frameCount;
    if (next < 0) next += frameCount;
    setFrame(next);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  return (
    <div
      className={`touch-pan-y select-none ${className ?? ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frameSrc(frame)}
        alt={alt}
        draggable={false}
        className="pointer-events-none h-full w-full object-cover"
      />
    </div>
  );
}
