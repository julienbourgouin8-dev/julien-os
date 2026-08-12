"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import WriteOnHeading from "@/components/WriteOnHeading";

const IMAGE = "/brand/vitrine-composite.jpg";

type Hotspot = {
  name: string;
  // catégorie réelle issue de la taxonomie construite à partir des
  // légendes Facebook (assets/facebook/taxonomie-produits.md) — jamais
  // inventée, voir ce fichier si une pièce change.
  category: string;
  // boîte englobante de la pièce dans l'image composite, en % de l'image
  left: number;
  top: number;
  width: number;
  height: number;
  video?: string;
};

// Coordonnées relevées à l'œil sur vitrine-composite.jpg (2752×1536).
// Les zones de SURVOL (hitbox) ci-dessous sont volontairement plus larges
// que la pièce visible : elles se touchent bord à bord (aucun trou entre
// deux pièces) et partagent une bande verticale commune assez haute pour
// couvrir toutes les tailles. Les crops visuels statiques (staticCropStyle)
// utilisent eux les coordonnées réelles de la pièce, pas la hitbox.
const HIT_TOP = 14;
const HIT_HEIGHT = 52;
const hotspots: Hotspot[] = [
  {
    name: "Sac savane",
    category: "Sacs",
    left: 6.0,
    top: 18.8,
    width: 16.5,
    height: 43.0,
    video: "/products/videos/sac-savane-360-v3.mp4",
  },
  {
    // même tissu "Paris" (baisers/tour Eiffel) que sur sa photo promo
    // légendée "Sacoche 'book'" — confirmé, pas un sac.
    name: "Sacoche \"book\"",
    category: "Sacoches ordinateur",
    left: 23.0,
    top: 25.1,
    width: 18.75,
    height: 34.5,
    video: "/products/videos/sac-paris-360-v2.mp4",
  },
  {
    name: "Lunch box",
    category: "Accessoires du quotidien",
    left: 42.0,
    top: 28.2,
    width: 19.25,
    height: 30.5,
    video: "/products/videos/lunch-box-360-v2.mp4",
  },
  {
    name: "Pochette éventail",
    category: "Pochettes",
    left: 61.5,
    top: 37.6,
    width: 19.25,
    height: 20.2,
    video: "/products/videos/pochette-eventail-360-v2.mp4",
  },
  {
    name: "Trousse papillons",
    category: "Trousses",
    left: 84.25,
    top: 35.8,
    width: 6.5,
    height: 26.4,
    video: "/products/videos/trousse-papillons-360-v2.mp4",
  },
];

// Hitbox par pièce : bord gauche/droit étendu jusqu'à mi-chemin de la pièce
// voisine (0 → première, 100 → dernière), bande verticale commune généreuse.
// Élimine tout trou "mort" entre deux pièces (ex : pochette ↔ trousse).
function hitboxStyle(i: number): CSSProperties {
  const prev = hotspots[i - 1];
  const cur = hotspots[i];
  const next = hotspots[i + 1];
  const left = i === 0 ? 0 : (prev.left + prev.width + cur.left) / 2;
  const right = i === hotspots.length - 1 ? 100 : (cur.left + cur.width + next.left) / 2;
  return {
    left: `${left}%`,
    top: `${HIT_TOP}%`,
    width: `${right - left}%`,
    height: `${HIT_HEIGHT}%`,
  };
}

// Un crop net de l'image composite pour l'état "posé" — sans flou/fondu,
// juste le fragment de photo correspondant à la pièce.
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

const CLOSE_DELAY = 180;
const FLY_MS = 520;
const SWAP_MS = 160;

// Taille cible de la pièce en vol, au centre de l'écran (inclut la vidéo
// ET le bandeau catégorie/nom/CTA en dessous, dans la même carte).
function targetSize() {
  const w = Math.min(window.innerWidth * 0.4, 420);
  const h = Math.min(window.innerHeight * 0.72, 640);
  return { w, h };
}

const IDLE_TRANSFORM = "translate(-50%, -50%) scale(0.001)";

export default function VitrineArc() {
  // État centralisé : UN SEUL panneau flottant partagé par toutes les
  // pièces, pas un par pièce. Sans ça, passer directement d'une pièce à
  // une autre rejouait l'animation de retour de l'ancienne EN MÊME TEMPS
  // que l'arrivée de la nouvelle (le "backup" signalé, pas joli). Le vol
  // vers/depuis le centre ne se joue plus qu'à l'ouverture depuis rien et
  // à la fermeture complète (curseur qui quitte toute la zone) — passer
  // d'une pièce à l'autre ne fait que basculer le contenu, panneau immobile.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [flown, setFlown] = useState(false);
  const [originTransform, setOriginTransform] = useState(IDLE_TRANSFORM);
  const [size, setSize] = useState({ w: 420, h: 640 });

  // pieceRefs suit la position VISUELLE réelle de chaque pièce (le crop
  // statique) — sert à calculer l'origine du vol et le filet de sécurité
  // scroll. triggerRefs suit la hitbox de survol, volontairement plus
  // large et distincte, pour ne pas fausser ces calculs.
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  const flownRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);
  useEffect(() => {
    flownRef.current = flown;
  }, [flown]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const computeOrigin = (i: number) => {
    const el = pieceRefs.current[i];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const t = targetSize();
    const scale = Math.min(r.width / t.w, r.height / t.h);
    const dx = r.left + r.width / 2 - window.innerWidth / 2;
    const dy = r.top + r.height / 2 - window.innerHeight / 2;
    return { t, transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale})` };
  };

  const open = (i: number) => {
    cancelClose();
    // les vidéos sont montées en permanence (jamais démontées) et lancées
    // au premier survol — idempotent, ne relance pas si déjà en lecture.
    // C'est ça qui permet un crossfade instantané sans jamais recharger,
    // donc plus de flash "double fenêtre" au changement de pièce.
    videoRefs.current[i]?.play().catch(() => {});

    if (activeIndexRef.current === i && flownRef.current) return;

    if (!flownRef.current) {
      // rien n'est ouvert : calcule le point de départ (position réelle de
      // la pièce) puis relâche vers le centre au frame suivant.
      const origin = computeOrigin(i);
      if (!origin) return;
      setSize(origin.t);
      setOriginTransform(origin.transform);
      setActiveIndex(i);
      requestAnimationFrame(() => requestAnimationFrame(() => setFlown(true)));
    } else {
      // déjà au centre : on bascule juste QUEL contenu est visible (fondu
      // croisé entre vidéos déjà en lecture), le panneau ne bouge pas.
      setActiveIndex(i);
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      // recalcule l'origine à partir de la pièce ACTUELLEMENT affichée,
      // pour que le retour vise le bon point de départ.
      const i = activeIndexRef.current;
      if (i !== null) {
        const origin = computeOrigin(i);
        if (origin) setOriginTransform(origin.transform);
      }
      setFlown(false);
    }, CLOSE_DELAY);
  };

  // filet de sécurité scroll : le panneau est `position: fixed`, donc
  // scroller la page ne le bouge pas — si la souris ne bouge pas pendant
  // qu'on scrolle, rien ne ferme la pièce. Une première version attendait
  // que la pièce d'origine sorte ENTIÈREMENT du viewport (avec marge) —
  // pour une section plus haute que l'écran, ça pouvait demander de
  // scroller une pleine hauteur d'écran avant fermeture, donc "reste trop
  // longtemps" en pratique. Fix : on ferme dès qu'un petit DELTA de scroll
  // (peu importe la position géométrique de la pièce) a eu lieu depuis
  // l'ouverture — ça capture directement l'intention "je pars d'ici".
  const scrollOriginRef = useRef<number | null>(null);
  useEffect(() => {
    if (!flown) {
      scrollOriginRef.current = null;
      return;
    }
    scrollOriginRef.current = window.scrollY;
    const SCROLL_CLOSE_THRESHOLD = 80;
    const checkScroll = () => {
      if (scrollOriginRef.current === null) return;
      if (Math.abs(window.scrollY - scrollOriginRef.current) > SCROLL_CLOSE_THRESHOLD) {
        cancelClose();
        setFlown(false);
      }
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, [flown]);

  const targetTransform = "translate(-50%, -50%) scale(1)";
  const active = activeIndex !== null ? hotspots[activeIndex] : null;

  return (
    <div className="relative w-full">
      <div className="relative w-full" style={{ aspectRatio: "2752 / 1536" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGE}
          alt="Sélection de créations CréA'deline posées sur un socle d'exposition"
          className="absolute inset-0 h-full w-full object-contain"
        />

        {/* titre posé sur l'image (façon hero) — pas un bloc à part au-dessus,
            pour que ça reste dans la section vitrine, pas entre deux sections */}
        <div className="absolute inset-x-0 top-[6%] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            Nos catégories
          </p>
          <WriteOnHeading
            as="h2"
            text="Une pièce pour chaque usage"
            italicWords={["chaque", "usage"]}
            className="mt-2 font-display text-3xl text-ink sm:text-4xl"
          />
        </div>

        {hotspots.map((spot, i) => (
          <div key={spot.name}>
            {/* image visible au repos — reste SOUS le voile pour s'assombrir
                normalement avec le reste de la scène quand une pièce est ouverte. */}
            <div
              ref={(el) => {
                pieceRefs.current[i] = el;
              }}
              aria-hidden
              className="pointer-events-none absolute"
              style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
            >
              <div className="h-full w-full" style={staticCropStyle(spot)} />
            </div>

            {/* zone de survol invisible, au-dessus (z-[60]) de tous les
                panneaux : plus large que la pièce elle-même et jointive avec
                les voisines (voir hitboxStyle) pour qu'il n'y ait aucun trou
                mort entre deux pièces et que le survol reste réactif même en
                bord de zone. */}
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              type="button"
              onMouseEnter={() => open(i)}
              onMouseLeave={scheduleClose}
              className="absolute z-[60] cursor-pointer border-0 bg-transparent p-0"
              style={hitboxStyle(i)}
            />
          </div>
        ))}

        {/* voile qui assombrit la scène */}
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-ink transition-opacity ease-out"
          style={{ opacity: flown ? 0.5 : 0, pointerEvents: "none", transitionDuration: `${FLY_MS}ms` }}
        />

        {/* panneau unique partagé — bascule de contenu sans bouger tant
            qu'on reste dans la zone ; ne vole vers/depuis le centre qu'à
            l'ouverture initiale et à la fermeture complète. */}
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="fixed left-1/2 top-1/2 z-50 will-change-transform"
          style={{
            width: size.w,
            height: size.h,
            transform: flown ? targetTransform : originTransform,
            opacity: flown ? 1 : 0,
            pointerEvents: flown ? "auto" : "none",
            transition: `transform ${FLY_MS}ms cubic-bezier(0.16,1,0.3,1), opacity ${flown ? 200 : 260}ms ease-out`,
            filter: flown
              ? "drop-shadow(0 34px 40px rgba(36,27,21,0.38))"
              : "drop-shadow(0 6px 10px rgba(36,27,21,0.15))",
          }}
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-paper">
              {/* les 5 vidéos sont TOUJOURS montées, dès le premier rendu —
                  pas seulement une fois qu'une pièce est ouverte. Avant ce
                  correctif, elles n'existaient que sous `{active && ...}`,
                  donc au tout premier survol de la session `open()` appelait
                  `.play()` sur des refs encore `null` (le panneau ne s'était
                  pas encore re-rendu) : no-op silencieux, la vidéo restait à
                  jamais en pause. Montées en permanence, les refs sont
                  toujours valides, y compris pour ce tout premier survol. */}
              {hotspots.map((spot, i) =>
                spot.video ? (
                  <video
                    key={spot.video}
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={spot.video}
                    muted
                    loop
                    playsInline
                    preload="none"
                    className="absolute inset-0 h-full w-full scale-[1.04] object-cover transition-opacity ease-out"
                    style={{
                      opacity: activeIndex === i ? 1 : 0,
                      transitionDuration: `${SWAP_MS}ms`,
                    }}
                  />
                ) : null,
              )}
            </div>
            {active && (
              <div
                className="shrink-0 bg-paper px-6 py-5 text-center transition-opacity ease-out"
                style={{ opacity: flown ? 1 : 0, transitionDuration: `${SWAP_MS}ms` }}
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-teal">
                  {active.category}
                </p>
                <p className="mt-1 font-display text-lg italic text-ink">{active.name}</p>
                <a
                  href="#creations"
                  className="group mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-denim px-6 py-2.5 text-xs font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
                  style={{ pointerEvents: flown ? "auto" : "none" }}
                >
                  Découvrir nos créations
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
