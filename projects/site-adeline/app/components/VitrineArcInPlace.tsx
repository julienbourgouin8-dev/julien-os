"use client";

import { useState, type CSSProperties } from "react";
import MaskedVideo from "@/components/MaskedVideo";

const IMAGE = "/brand/vitrine-composite.jpg";

type Hotspot = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  video?: string;
  videoMask?: string;
};

const hotspots: Hotspot[] = [
  {
    name: "Sac savane",
    left: 6.0,
    top: 18.8,
    width: 16.5,
    height: 43.0,
    video: "/products/videos/sac-savane-360-v2.mp4",
    videoMask: "/products/videos/sac-savane-360-mask.mp4",
  },
  { name: "Sac Paris", left: 23.0, top: 25.1, width: 18.75, height: 34.5 },
  { name: "Sacoche jacquard", left: 42.0, top: 28.2, width: 19.25, height: 30.5 },
  { name: "Pochette éventail", left: 61.5, top: 37.6, width: 19.25, height: 20.2 },
  { name: "Trousse papillons", left: 84.25, top: 35.8, width: 6.5, height: 26.4 },
];

function staticCropStyle(spot: Hotspot): CSSProperties {
  const bgWidthPct = (100 / spot.width) * 100;
  const bgHeightPct = (100 / spot.height) * 100;
  const bgPosX = spot.width < 100 ? (spot.left / (100 - spot.width)) * 100 : 0;
  const bgPosY = spot.height < 100 ? (spot.top / (100 - spot.height)) * 100 : 0;
  return {
    backgroundImage: `url(${IMAGE})`,
    backgroundSize: `${bgWidthPct}% ${bgHeightPct}%`,
    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
    backgroundRepeat: "no-repeat",
  };
}

// Version "sur place" : le sac tourne exactement là où il est posé, aucun
// déplacement, juste un léger soulèvement + ombre pour marquer le survol.
function InPlacePiece({ spot }: { spot: Hotspot }) {
  const [hovered, setHovered] = useState(false);
  const hasVideo = Boolean(spot.video && spot.videoMask);

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute cursor-pointer border-0 bg-transparent p-0"
      style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
    >
      <div
        className="relative h-full w-full transition-transform duration-300 ease-out"
        style={{
          transform: hovered ? "scale(1.08) translateY(-3%)" : "scale(1)",
          filter: hovered
            ? "drop-shadow(0 20px 22px rgba(36,27,21,0.28))"
            : "drop-shadow(0 0 0 rgba(0,0,0,0))",
        }}
      >
        {/* la photo fixe et la vidéo ne coexistent jamais visuellement — sinon
            le sac figé reste visible en transparence sous la vidéo (fantôme) */}
        {!(hasVideo && hovered) && (
          <div className="absolute inset-0" style={staticCropStyle(spot)} />
        )}
        {hasVideo && hovered && (
          <MaskedVideo
            colorSrc={spot.video!}
            maskSrc={spot.videoMask!}
            active={hovered}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>
      <span
        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-display text-xs italic text-ink transition-opacity duration-300"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        {spot.name}
      </span>
    </button>
  );
}

export default function VitrineArcInPlace() {
  return (
    <div className="relative w-full">
      <div className="relative w-full" style={{ aspectRatio: "2752 / 1536" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGE}
          alt="Sélection de créations CréA'deline posées sur un socle d'exposition"
          className="absolute inset-0 h-full w-full object-contain"
        />
        {hotspots.map((spot) => (
          <InPlacePiece key={spot.name} spot={spot} />
        ))}
      </div>
    </div>
  );
}
