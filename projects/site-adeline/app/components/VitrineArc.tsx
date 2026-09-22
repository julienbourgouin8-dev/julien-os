"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import WriteOnHeading from "@/components/WriteOnHeading";

const IMAGE = "/brand/vitrine-composite-v4.jpg";

type Hotspot = {
  name: string;
  // catégorie réelle issue de la taxonomie construite à partir des
  // légendes Facebook (assets/facebook/taxonomie-produits.md) — jamais
  // inventée, voir ce fichier si une pièce change.
  category: string;
  // slug correspondant dans lib/categories.ts — mène au catalogue
  // /boutique/[categorySlug] de cette catégorie.
  categorySlug: string;
  // boîte englobante de la pièce dans l'image composite, en % de l'image
  left: number;
  top: number;
  width: number;
  height: number;
  video?: string;
};

// Coordonnées mesurées par script (seuillage pixel vs fond, voir historique
// de session) sur vitrine-composite-v4.jpg. Les zones DE SURVOL ci-dessous
// sont volontairement plus larges que la pièce visible : elles se touchent
// bord à bord (aucun trou entre deux pièces). Les crops visuels statiques
// (staticCropStyle) utilisent eux les coordonnées réelles de la pièce, pas
// la zone de survol.
const HIT_TOP = 7.1;
const HIT_HEIGHT = 62.0;
const hotspots: Hotspot[] = [
  {
    name: "Sac savane",
    category: "Sac et sacoche",
    categorySlug: "sac-et-sacoche",
    left: 2.9,
    top: 15.1,
    width: 16.8,
    height: 52.7,
    video: "/products/videos/sac-savane-360-v3.mp4",
  },
  {
    // bouillotte (housse fleece + tissu imprimé) — remplace la sacoche
    // "book" à cet emplacement sur la nouvelle photo.
    name: "Bouillotte",
    category: "Accessoires",
    categorySlug: "accessoires",
    left: 21.8,
    top: 20.1,
    width: 15.6,
    height: 47.7,
    video: "/products/videos/bouillotte-360.mp4",
  },
  {
    // trousse de toilette effet python noir — remplace la pochette éventail
    // à cet emplacement sur la nouvelle photo.
    name: "Trousse python",
    category: "Toilette",
    categorySlug: "toilette",
    left: 38.8,
    top: 26.1,
    width: 25.5,
    height: 41.7,
    video: "/products/videos/trousse-python-360.mp4",
  },
  {
    name: "Lunch box",
    category: "Repas",
    categorySlug: "repas",
    left: 64.9,
    top: 23.9,
    width: 20.4,
    height: 40.6,
    video: "/products/videos/lunch-box-360-v10.mp4",
  },
  {
    name: "Trousse papillons",
    category: "École",
    categorySlug: "ecole",
    left: 85.8,
    top: 35.7,
    width: 8.3,
    height: 31.3,
    video: "/products/videos/trousse-papillons-360-v2.mp4",
  },
];

// Zone de survol par pièce : bord gauche/droit étendu jusqu'à mi-chemin de
// la pièce voisine (0 → première, 100 → dernière), bande verticale commune
// généreuse. Élimine tout trou "mort" entre deux pièces.
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

// Vidéo mobile empilée : lit/pause selon la visibilité réelle à l'écran.
// L'attribut HTML `autoPlay` seul ne suffit pas ici — testé au Playwright
// mobile (2026-09-16) : Chrome ne démarre la lecture que si la vidéo est
// déjà visible au moment où elle devient prête, et ne la reprend PAS
// spontanément si elle entre dans l'écran plus tard (elle reste bloquée en
// pause, `currentTime` figé) — sur 5 vidéos empilées, seules celles visibles
// dès le chargement de la page partaient. Un IntersectionObserver qui
// déclenche `.play()`/`.pause()` à l'entrée/sortie de l'écran (même
// mécanisme que la vitrine desktop, cf. `playVideo` plus bas) corrige ça
// sans cadre ni frames — juste la vidéo d'origine, format naturel.
//
// `preload="metadata"` (pas "none", tentative annulée le 2026-09-22) :
// sur vrai mobile (retour Julien, testé sur son téléphone en 4G réelle),
// `preload="none"` + déclenchement du `.play()` uniquement à
// l'intersection s'est révélé peu fiable (vidéos qui ne démarraient plus
// du tout) — probablement des politiques de lecture plus strictes sur
// mobile réel que dans les tests devtools/émulation utilisés pour valider
// le correctif précédent. `preload="metadata"` reprend exactement la
// config déjà utilisée et fiable du panneau vidéo desktop plus bas dans ce
// fichier (jamais posé de problème) : le navigateur charge un peu de
// métadonnées à l'avance (pas la vidéo entière, coût réseau négligeable),
// ce qui rend le `.play()` déclenché par l'IntersectionObserver beaucoup
// plus robuste.
function AutoplayVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    />
  );
}

// Délai avant fermeture au survol — laisse le temps de glisser la souris de
// la pièce vers la carte (ou vers une pièce voisine) sans que ça clignote
// fermé entre les deux.
const CLOSE_DELAY = 200;
// Distance de glissement (px) à partir de laquelle un drag sur la carte
// compte comme "pièce suivante/précédente".
const SWIPE_THRESHOLD = 50;
// Distance de scroll (px) depuis l'ouverture du panneau au-delà de laquelle
// on considère que la visiteuse a quitté la section vitrine — ferme le
// panneau tout seul. Sans ça (régression 2026-09-13, ce filet de sécurité
// existait avant et avait disparu) le panneau pouvait rester affiché en
// plein écran même en remontant jusqu'au hero.
const SCROLL_CLOSE_THRESHOLD = 80;

export default function VitrineArc() {
  // Survol pour ouvrir/glisser d'une pièce à l'autre, clic gardé en plus
  // pour le tactile. La carte reste centrée à l'écran (fixe) comme avant —
  // mais pour la pièce que la carte recouvre elle-même (impossible à
  // atteindre en glissant la souris sur la bande, quelle que soit la
  // stratégie de z-index), on glisse DIRECTEMENT SUR LA CARTE (drag gauche/
  // droite) pour passer à la pièce suivante/précédente. Le drag ne dépend
  // jamais de ce qu'il y a derrière la carte, donc ça marche pour toutes les
  // pièces, y compris celle du milieu.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragHandled = useRef(false);
  // Les 5 <video> ne sont JAMAIS démontées/remontées (voir le rendu plus
  // bas) — ces refs permettent de déclencher .play()/.pause() directement
  // sans jamais recréer l'élément, seule façon d'avoir une reprise de
  // lecture instantanée au lieu de redémarrer le décodage à chaque fois.
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const cancelOpen = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const playVideo = (i: number) => {
    videoRefs.current[i]?.play().catch(() => {});
  };

  const openPiece = (i: number) => {
    cancelOpen();
    cancelClose();
    setActiveIndex(i);
    setOpen(true);
    playVideo(i);
  };

  // Ferme le panneau et met en pause la vidéo en cours — pas juste
  // `setOpen(false)` seul, sinon la vidéo continue de tourner (et de
  // consommer CPU/batterie) indéfiniment en arrière-plan une fois fermée.
  const closePanel = () => {
    if (activeIndex !== null) videoRefs.current[activeIndex]?.pause();
    setOpen(false);
  };

  // Survol : ouverture retardée d'un court instant plutôt qu'immédiate.
  // Sans ce délai, un vrai geste de souris qui VOYAGE vers la carte (pour
  // cliquer "Découvrir", par ex. depuis "Sac savane" tout à gauche jusqu'au
  // centre de l'écran) traverse physiquement d'autres zones de survol en
  // chemin (ex. "Bouillotte") — chacune bascule la pièce affichée avant même
  // que la souris n'arrive à destination. Un survol volontaire (on s'arrête
  // sur une pièce) dépasse toujours ce délai ; un simple passage en chemin
  // vers ailleurs, non.
  const HOVER_INTENT_DELAY = 130;
  const scheduleOpen = (i: number) => {
    cancelOpen();
    // Lance la lecture dès l'INTENTION de survol, pas seulement à
    // l'ouverture effective du panneau — utilise le délai d'intention (et
    // le trajet de la souris) comme temps de charge, pour supprimer le
    // décalage perçu au moment où le panneau s'affiche vraiment.
    playVideo(i);
    openTimer.current = setTimeout(() => openPiece(i), HOVER_INTENT_DELAY);
  };

  const scheduleClose = () => {
    cancelOpen();
    cancelClose();
    closeTimer.current = setTimeout(closePanel, CLOSE_DELAY);
  };

  const active = activeIndex !== null ? hotspots[activeIndex] : null;

  const goRelative = (delta: number) => {
    setActiveIndex((i) => {
      const base = i ?? 0;
      const next = (base + delta + hotspots.length) % hotspots.length;
      playVideo(next);
      return next;
    });
  };

  const onDragStart = (e: ReactPointerEvent) => {
    dragStartX.current = e.clientX;
    dragHandled.current = false;
  };
  const onDragMove = (e: ReactPointerEvent) => {
    if (dragStartX.current === null || dragHandled.current) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      goRelative(delta < 0 ? 1 : -1);
      dragHandled.current = true;
    }
  };
  const onDragEnd = () => {
    dragStartX.current = null;
    dragHandled.current = false;
  };

  // Filet de sécurité scroll : si le panneau est ouvert et qu'on scrolle de
  // plus de SCROLL_CLOSE_THRESHOLD px (dans n'importe quel sens) depuis son
  // ouverture, on le referme tout seul — évite qu'il reste affiché en plein
  // écran alors qu'on a quitté la section vitrine depuis longtemps.
  useEffect(() => {
    if (!open) return;
    const scrollAtOpen = window.scrollY;
    const handleScroll = () => {
      if (Math.abs(window.scrollY - scrollAtOpen) > SCROLL_CLOSE_THRESHOLD) {
        closePanel();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative w-full">
      {/* Titre en flux normal, au-dessus de la photo — pas superposé dessus.
          Il était posé sur l'image (façon hero) via `position: absolute` en
          %, mais cette photo n'a pas la même marge que le hero à toutes les
          tailles d'écran : sur mobile (image pleine largeur), le titre
          retombait systématiquement sur les anses/pièces en dessous, quelle
          que soit la taille de police (retour Julien 2026-09-13, vidéo
          mobile). En flux normal, aucun risque de chevauchement possible,
          à n'importe quelle largeur. */}
      <div className="px-4 pb-6 pt-8 text-center sm:pb-8">
        <p className="text-xl font-semibold uppercase tracking-[0.2em] text-teal">
          Nos catégories
        </p>
        <WriteOnHeading
          as="h2"
          text="Des pièces qui vous accompagnent au quotidien"
          italicWords={["au", "quotidien"]}
          blueWords={["pièces"]}
          className="mt-2 font-display text-[clamp(1.4rem,4.5vw,2.5rem)] text-ink"
        />
      </div>

      {/* Version mobile (retour Julien 2026-09-16 : le présentoir/hotspots
          est un dispositif pensé pour la souris — survol pour glisser
          d'une pièce à l'autre — qui n'a pas vraiment de sens au doigt,
          où le clic est le seul geste. Remplacé sous `sm` par les 5
          catégories empilées, chacune avec sa propre pièce, son nom et
          son CTA — plus besoin du panneau/hover, le lien "Découvrir" mène
          directement au catalogue de la catégorie.
          Vidéo (retour Julien 2026-09-16 : "la vidéo de base, telle
          qu'elle est, sans cadre") : le même fichier .mp4 que le desktop
          (spot.video), sans cadre/carte autour, sans accélération de
          vitesse, en format naturel (pas de crop/object-fit forcé) —
          remplace l'essai précédent (SpinViewer en frames découpées +
          vidéos "-mobile" accélérées à 1.25x), abandonné sur cette
          demande. */}
      {/* `px-4` retiré du conteneur (retour Julien 2026-09-16 : "grossir
          un peu les vidéos... zéro marge à gauche à droite") — la vidéo
          est maintenant en `w-full` sans plafond de largeur, donc bord à
          bord de l'écran (marges gauche/droite égales : zéro des deux
          côtés). Le texte/bouton en dessous récupère son propre `px-4`
          pour ne pas coller aux bords, lui. */}
      <div className="flex flex-col gap-10 pb-10 sm:hidden">
        {hotspots.map((spot) => (
          <div key={spot.name} className="flex flex-col items-center text-center">
            {spot.video && <AutoplayVideo src={spot.video} className="w-full" />}
            <p className="mt-6 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-teal">
              {spot.category}
            </p>
            <p className="mt-1 px-4 font-display text-2xl italic text-ink">{spot.name}</p>
            <a
              href={`/boutique/${spot.categorySlug}`}
              className="group mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-denim px-7 py-3 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Découvrir {spot.category}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        ))}
      </div>

      <div className="relative hidden w-full sm:block" style={{ aspectRatio: "2438 / 1254" }}>
        {/* `loading="lazy"` (audit perf 2026-09-22) : ce bloc est `hidden` en
            CSS sous `sm` (remplacé par la liste mobile juste au-dessus),
            mais le pré-parseur HTML du navigateur télécharge quand même les
            <img> par défaut AVANT que le CSS soit appliqué — cette image de
            376 Ko partait donc en réseau même sur mobile où elle n'est
            jamais affichée. `loading="lazy"` la conditionne à une
            intersection réelle avec le viewport, qui n'arrive jamais tant
            que l'élément reste `display:none`. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGE}
          alt="Sélection de créations CréA'deline posées sur un socle d'exposition"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
        />

        {hotspots.map((spot, i) => (
          <div key={spot.name}>
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
            >
              <div className="h-full w-full" style={staticCropStyle(spot)} />
            </div>

            {/* zone de survol/clic : plus large que la pièce elle-même et
                jointive avec les voisines (voir hitboxStyle). Survol ouvre
                après un court délai (voir scheduleOpen) — pas instantané —
                pour distinguer un vrai arrêt sur cette pièce d'un simple
                passage en chemin vers ailleurs (la carte, un bouton...).
                Clic gardé en plus pour le tactile, qui n'a pas de survol,
                et immédiat (pas de délai) pour rester réactif au tap. */}
            <button
              type="button"
              onClick={() => openPiece(i)}
              onMouseEnter={() => scheduleOpen(i)}
              onMouseLeave={() => {
                cancelOpen();
                scheduleClose();
              }}
              aria-label={`Découvrir ${spot.category}`}
              className="absolute z-[60] cursor-pointer border-0 bg-transparent p-0"
              style={hitboxStyle(i)}
            />
          </div>
        ))}
      </div>

      {/* fond assombri — ferme au clic (utile au tactile). z-40, sous les
          zones de survol des pièces (z-[60]) : cliquer directement sur une
          AUTRE pièce visible bascule toujours dessus sans repasser par une
          fermeture. */}
      {open && <div aria-hidden onClick={closePanel} className="fixed inset-0 z-40 bg-ink/60" />}

      {/* Panneau + vidéos — la carte (fond blanc, boutons, texte) est
          conditionnelle à `open`, mais les 5 <video> en dessous ne le sont
          JAMAIS : toujours montées, empilées, crossfade par opacité sur
          l'index actif. C'est ce qui permet à `playVideo` (appelé dès
          l'intention de survol, voir scheduleOpen) de démarrer le
          décodage en arrière-plan AVANT l'ouverture — remonter l'élément
          vidéo à chaque fois (`key` différent) annulait ce gain et
          redémarrait le décodage à zéro. */}
      <div
        className={
          open
            ? "pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-6"
            : "pointer-events-none absolute h-0 w-0 overflow-hidden"
        }
      >
        <div
          onMouseEnter={open ? cancelClose : undefined}
          onMouseLeave={open ? scheduleClose : undefined}
          onClick={open ? (e) => e.stopPropagation() : undefined}
          className={
            open
              ? "pointer-events-auto relative flex w-[min(90vw,640px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              : "relative h-0 w-0 overflow-hidden"
          }
        >
          {open && (
            <>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Fermer"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform hover:scale-105"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              {/* flèches, toujours cliquables — et zone vidéo glissable
                  (drag gauche/droite) : les deux font passer à la pièce
                  suivante/précédente SANS dépendre de la bande de survol
                  derrière la carte, donc ça marche même pour la pièce que la
                  carte recouvre elle-même. */}
              <button
                type="button"
                onClick={() => goRelative(-1)}
                aria-label="Pièce précédente"
                className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform hover:scale-105"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goRelative(1)}
                aria-label="Pièce suivante"
                className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform hover:scale-105"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}

          {/* zone vidéo à ratio FIXE (16/9) et fond blanc — chaque vidéo a un
              format natif légèrement différent, donc avec un cadre fixe +
              object-contain, le très léger espace résiduel (quasi invisible)
              est blanc comme le panneau. Glissable au doigt/souris (cursor
              grab) pour changer de pièce quand le panneau est ouvert. */}
          <div
            className={
              open
                ? "relative aspect-[16/9] w-full shrink-0 cursor-grab touch-pan-y bg-white active:cursor-grabbing"
                : "relative h-px w-px overflow-hidden"
            }
            onPointerDown={open ? onDragStart : undefined}
            onPointerMove={open ? onDragMove : undefined}
            onPointerUp={open ? onDragEnd : undefined}
            onPointerLeave={open ? onDragEnd : undefined}
          >
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
                  preload="metadata"
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-150"
                  style={{ opacity: open && activeIndex === i ? 1 : 0 }}
                />
              ) : null,
            )}
          </div>

          {open && active && (
            <div className="shrink-0 bg-white px-6 py-5 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-teal">
                {active.category}
              </p>
              <p className="mt-1 font-display text-lg italic text-ink">{active.name}</p>
              <a
                href={`/boutique/${active.categorySlug}`}
                className="group mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-denim px-6 py-2.5 text-xs font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Découvrir nos créations
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
