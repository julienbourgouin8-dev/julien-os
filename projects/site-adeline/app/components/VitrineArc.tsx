"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import WriteOnHeading from "@/components/WriteOnHeading";

const IMAGE = "/brand/vitrine-composite-v5.jpg";
const MOBILE_UNLOCK_VIDEO = "/products/videos/mobile-unlock.mp4";

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
  mobileVideo?: string;
  mobilePoster?: string;
};

// Coordonnées mesurées par script (seuillage pixel vs fond, voir historique
// de session) sur vitrine-composite-v5.jpg. Les zones DE SURVOL ci-dessous
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
    mobileVideo: "/products/videos/sac-savane-360-v3-mobile.mp4",
    mobilePoster: "/products/videos/sac-savane-360-v3-mobile-poster.jpg",
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
    mobileVideo: "/products/videos/bouillotte-360-mobile.mp4",
    mobilePoster: "/products/videos/bouillotte-360-mobile-poster.jpg",
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
    mobileVideo: "/products/videos/trousse-python-360-mobile.mp4",
    mobilePoster: "/products/videos/trousse-python-360-mobile-poster.jpg",
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
    mobileVideo: "/products/videos/lunch-box-360-v10-mobile.mp4",
    mobilePoster: "/products/videos/lunch-box-360-v10-mobile-poster.jpg",
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
    mobileVideo: "/products/videos/trousse-papillons-360-v2-mobile.mp4",
    mobilePoster: "/products/videos/trousse-papillons-360-v2-mobile-poster.jpg",
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
function AutoplayVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [sourceReady, setSourceReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !sourceReady) return;
    let shouldPlay = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    let lastTime = -1;
    let stalledTicks = 0;

    const attemptPlay = () => {
      if (!shouldPlay || document.visibilityState === "hidden") return;
      el.muted = true;
      el.defaultMuted = true;
      el.play().catch(() => {
        // Safari peut refuser le premier play() pendant un refresh alors que
        // la vidéo n'a pas encore assez de données. On retente après le
        // prochain événement média, avec un petit filet de sécurité temporisé.
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(attemptPlay, 350);
      });
    };

    const startWatchdog = () => {
      if (watchdog) clearInterval(watchdog);
      watchdog = setInterval(() => {
        if (!shouldPlay || document.visibilityState === "hidden") return;
        if (el.paused || el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          attemptPlay();
          return;
        }

        // Safari peut résoudre play() tout en laissant l'image figée. Si
        // le temps n'avance pas pendant ~1,5 s alors que des données sont
        // disponibles, on réarme proprement la lecture sans recharger le
        // fichier ni perdre le cache déjà téléchargé.
        if (Math.abs(el.currentTime - lastTime) < 0.01) stalledTicks += 1;
        else stalledTicks = 0;
        lastTime = el.currentTime;
        if (stalledTicks >= 3) {
          stalledTicks = 0;
          el.pause();
          attemptPlay();
        }
      }, 500);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        shouldPlay = Boolean(entries[0]?.isIntersecting);
        if (shouldPlay) {
          attemptPlay();
          startWatchdog();
        } else {
          el.pause();
          if (retryTimer) clearTimeout(retryTimer);
          if (watchdog) clearInterval(watchdog);
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );

    const onMediaReady = () => attemptPlay();
    const onPageShow = () => attemptPlay();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") attemptPlay();
      else el.pause();
    };

    el.addEventListener("loadedmetadata", onMediaReady);
    el.addEventListener("loadeddata", onMediaReady);
    el.addEventListener("canplay", onMediaReady);
    el.addEventListener("progress", onMediaReady);
    el.addEventListener("stalled", onMediaReady);
    el.addEventListener("waiting", onMediaReady);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (retryTimer) clearTimeout(retryTimer);
      if (watchdog) clearInterval(watchdog);
      el.removeEventListener("loadedmetadata", onMediaReady);
      el.removeEventListener("loadeddata", onMediaReady);
      el.removeEventListener("canplay", onMediaReady);
      el.removeEventListener("progress", onMediaReady);
      el.removeEventListener("stalled", onMediaReady);
      el.removeEventListener("waiting", onMediaReady);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sourceReady]);

  // Hors interaction tactile, la source n'est ajoutée que peu avant
  // l'arrivée de la vidéo à l'écran. Le rapport Lighthouse du 23/09
  // montrait que `preload="metadata"` avec un `src` présent suffisait à
  // faire télécharger les cinq MP4 en entier (3,3 Mio) dès l'accueil.
  useEffect(() => {
    const el = ref.current;
    if (!el || sourceReady) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setSourceReady(true);
        observer.disconnect();
      },
      { rootMargin: "250px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sourceReady]);

  return (
    <video
      ref={(node) => {
        ref.current = node;
        // Safari évalue sa politique d'autoplay très tôt, parfois avant les
        // effets React. Poser les propriétés directement pendant l'attache
        // de la ref garantit que la vidéo est déjà muette à ce moment-là.
        if (node) {
          node.muted = true;
          node.defaultMuted = true;
        }
      }}
      src={sourceReady ? src : undefined}
      data-mobile-rotation
      data-video-src={src}
      poster={poster}
      autoPlay={sourceReady}
      muted
      loop
      playsInline
      preload={sourceReady ? "auto" : "none"}
      width={640}
      height={360}
      className={className}
    />
  );
}

// Délai avant fermeture au survol — laisse le temps de glisser la souris de
// la pièce vers la carte (ou vers une pièce voisine) sans que ça clignote
// fermé entre les deux.
// 200 ms ne laissait pas assez de temps au curseur pour quitter la pièce et
// atteindre le panneau central : le panneau se refermait et pausait la vidéo
// pendant son premier démarrage, d'où l'impression d'une image figée.
const CLOSE_DELAY = 650;
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
  // Breakpoint Tailwind `sm` (640px) — pilote le montage du panneau vidéo
  // desktop (voir plus bas). `false` par défaut (SSR/premier rendu) : ça
  // matche le comportement mobile par défaut avant hydratation, cohérent
  // avec `hidden sm:block` en CSS pour le reste du composant.
  const [isDesktop, setIsDesktop] = useState(false);
  // Les 5 vidéos du panneau desktop (~3,3 Mo) ne démarrent leur téléchargement
  // que lorsque la section approche de l'écran. Avant (`.load()` dès le
  // montage) elles se disputaient la bande passante avec l'image du hero :
  // Speed Index desktop 5,4 s sur PageSpeed (2026-09-26). Le survol reste
  // instantané : elles sont prêtes dès que le visiteur défile vers la vitrine.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [videosArmed, setVideosArmed] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const frame = window.requestAnimationFrame(() => setIsDesktop(mql.matches));
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => {
      window.cancelAnimationFrame(frame);
      mql.removeEventListener("change", onChange);
    };
  }, []);

  // iOS coupe volontairement l'autoplay en mode économie d'énergie. Le
  // premier contact du doigt utilisé pour commencer à faire défiler le
  // hero est néanmoins une interaction utilisateur valide. On l'utilise
  // silencieusement pour autoriser les cinq vidéos dans CE geste, avant
  // qu'elles n'entrent à l'écran. Aucun bouton ni blocage du scroll.
  useEffect(() => {
    if (isDesktop) return;

    const unlockMobileVideos = () => {
      const videos = Array.from(
        document.querySelectorAll<HTMLVideoElement>("video[data-mobile-rotation]"),
      );

      videos.forEach((video) => {
        video.muted = true;
        video.defaultMuted = true;
        if (!video.getAttribute("src")) {
          // Un seul fichier blanc de 1,5 Kio, partagé par les cinq lecteurs.
          // Le `play()` reste bien lié au geste utilisateur, mais on évite
          // d'amorcer 3,3 Mio de MP4 et cinq décodages complexes sur la
          // première frame du scroll.
          video.src = MOBILE_UNLOCK_VIDEO;
          video.preload = "auto";
        }
        // Appelé synchroniquement depuis `touchstart` : Safari considère
        // ceci comme une lecture demandée par l'utilisatrice, y compris en
        // économie d'énergie.
        void video.play().catch(() => {});
      });

      // Les cinq éléments ont reçu l'autorisation dans le geste tactile,
      // mais seules les vidéos proches de l'écran doivent continuer à
      // décoder. Leur observer les relancera ensuite à l'entrée en vue.
      window.setTimeout(() => {
        videos.forEach((video) => {
          const rect = video.getBoundingClientRect();
          if (rect.bottom < -120 || rect.top > window.innerHeight + 120) video.pause();
        });
      }, 150);
    };

    document.addEventListener("touchstart", unlockMobileVideos, {
      capture: true,
      passive: true,
      once: true,
    });
    return () => document.removeEventListener("touchstart", unlockMobileVideos, true);
  }, [isDesktop]);

  // Le parent fermé faisait 0×0 : malgré `preload="auto"`, Chromium et
  // Safari pouvaient différer le téléchargement jusqu'au premier survol.
  // Une fois les cinq éléments desktop réellement montés, `.load()` force
  // leur préchargement tout de suite pour que le hover ne reste pas figé.
  useEffect(() => {
    if (!isDesktop || videosArmed) return;
    const el = rootRef.current;
    if (!el) return;
    // Déclencheurs : la section est à moins de 100 px de l'écran, OU le
    // visiteur commence à défiler (il se dirige vers la vitrine : on prépare
    // les vidéos pendant le trajet). Un simple chargement de page sans
    // défilement — ce que mesure PageSpeed — ne télécharge rien.
    const arm = () => setVideosArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) arm();
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(el);
    window.addEventListener("scroll", arm, { once: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", arm);
    };
  }, [isDesktop, videosArmed]);

  useEffect(() => {
    if (!isDesktop || !videosArmed) return;
    videoRefs.current.forEach((video) => video?.load());
  }, [isDesktop, videosArmed]);
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
    <div ref={rootRef} className="relative w-full">
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
            {spot.mobileVideo && (
              <AutoplayVideo
                src={spot.mobileVideo}
                poster={spot.mobilePoster}
                className="w-full"
              />
            )}
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
              onMouseEnter={() => openPiece(i)}
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
      {/* `isDesktop &&` (retour Julien 2026-09-22) : ces 5 <video> ne
          servent qu'au survol desktop (open ne devient jamais true sur
          mobile, les boutons qui l'ouvrent sont dans le bloc `hidden
          sm:block` plus haut) mais restaient montées dans le DOM sur
          mobile aussi — 10 <video src> simultanées au total avec les 5 de
          la liste mobile empilée, probablement au-delà de la limite de
          décodage vidéo concurrent de Safari iOS (comportement observé :
          vidéos mobiles qui ne se chargent pas de façon aléatoire, environ
          une fois sur deux). Ne plus les monter du tout sur mobile. */}
      {isDesktop && (
      <div
        className={
          open
            ? "pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-6"
            : "pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
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
                  // Les versions 720p sont visuellement suffisantes dans un
                  // panneau de 640 px et pèsent environ trois fois moins :
                  // elles sont prêtes même si l'on descend immédiatement.
                  src={videosArmed ? (spot.mobileVideo ?? spot.video) : undefined}
                  muted
                  loop
                  playsInline
                  // `auto` (retour Julien 2026-09-22 : 1-2s de délai visible
                  // au premier survol avant que la vidéo démarre, image figée
                  // pendant ce temps). Sûr uniquement parce que ce panneau
                  // n'est désormais monté que sur desktop (voir `isDesktop`
                  // plus haut) — précharger les 5 vidéos en tâche de fond
                  // après le chargement initial de la page coûte quelques Mo
                  // de bande passante desktop (pas mobile), en échange d'une
                  // lecture instantanée au survol au lieu d'une image figée.
                  preload={videosArmed ? "auto" : "none"}
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
      )}
    </div>
  );
}
