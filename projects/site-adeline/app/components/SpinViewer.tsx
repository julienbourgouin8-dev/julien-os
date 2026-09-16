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

// Ms entre deux frames en rotation automatique (retour Julien 2026-09-16 :
// "essaye de laisser tourner par elle-même" puis "accélère, c'est un peu
// long" — la vidéo source faisait un tour complet en ~10s, ici on va
// nettement plus vite). ~35 frames × 55ms ≈ 1.9s par tour.
const AUTO_ROTATE_MS = 55;

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
// 360 produit. En WebP (retour Julien 2026-09-16 : "faut qu'on
// optimise, ça va rajouter du poids à la page") plutôt que jpg — ~35%
// plus léger à qualité équivalente, 5 produits × ~35 frames ≈ 3.1 Mo
// au lieu de 4.8 Mo au total.
export default function SpinViewer({ basePath, frameCount, alt, className }: SpinViewerProps) {
  const [frame, setFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startFrameRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frameSrc = (i: number) => `${basePath}/frame-${String(i + 1).padStart(3, "0")}.webp`;

  const stopAuto = () => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  // Rotation automatique dès que la vignette entre à l'écran (retour
  // Julien 2026-09-16 : "laisse tourner par elle-même pour voir ce que ça
  // donne") — toujours redémarrée pile sur la frame 0 (produit de face),
  // jamais sur la frame où un doigt l'aurait laissée avant de disparaître
  // de l'écran. `setFrame` avec une fonction (i => ...) plutôt que
  // capturer `frame` : l'intervalle est créé une seule fois par entrée
  // dans le viewport, pas question de le recréer à chaque frame pour
  // éviter la dérive de `setInterval` imbriqué dans `setState`.
  const startAuto = () => {
    stopAuto();
    setFrame(0);
    autoTimerRef.current = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, AUTO_ROTATE_MS);
  };

  // Ne précharge les frames 2..N (la 1ère se charge normalement via
  // <img loading="lazy">) que quand la vignette approche de l'écran —
  // avec 5 produits sur la page, précharger les 5 lots d'un coup au
  // montage téléchargerait ~3 Mo même pour les catégories jamais vues
  // (retour Julien : optimiser le poids de la page). `rootMargin: 400px`
  // laisse une marge confortable pour que le lot soit prêt avant que la
  // visiteuse n'atteigne vraiment la carte. La rotation auto démarre à
  // une marge plus courte (elle doit voir tourner le produit, pas
  // précharger en silence longtemps avant).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        for (let i = 1; i < frameCount; i++) {
          if (cancelled) return;
          const img = new window.Image();
          img.src = frameSrc(i);
        }
        preloadObserver.disconnect();
      },
      { rootMargin: "400px 0px" },
    );
    preloadObserver.observe(el);

    const autoObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (!draggingRef.current) startAuto();
        } else {
          stopAuto();
        }
      },
      { threshold: 0.5 },
    );
    autoObserver.observe(el);

    return () => {
      cancelled = true;
      preloadObserver.disconnect();
      autoObserver.disconnect();
      stopAuto();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, frameCount]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    stopAuto();
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

  // Relâcher le doigt reprend la rotation automatique — mais depuis la
  // frame où la visiteuse l'a laissée, pas de retour brusque à la frame 0
  // (contrairement à l'entrée dans le viewport, qui elle doit toujours
  // démarrer de face).
  const endDrag = () => {
    draggingRef.current = false;
    stopAuto();
    autoTimerRef.current = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, AUTO_ROTATE_MS);
  };

  return (
    <div
      ref={containerRef}
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
        loading="lazy"
        alt={alt}
        draggable={false}
        className="pointer-events-none h-full w-full object-cover"
      />
    </div>
  );
}
