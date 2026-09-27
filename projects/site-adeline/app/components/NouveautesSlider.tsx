"use client";

import { useEffect, useRef, useState } from "react";
import NouveauteCard, { type NouveauteProduct } from "@/components/NouveauteCard";

const GROUP_INTERVAL_MS = 7500;
const ROTATE_INTERVAL_MS = 2600;
const SLIDE_TRANSITION_MS = 700;
// Distance minimale (px) avant de considérer un geste tactile comme un vrai
// glissement horizontal plutôt qu'un scroll vertical de la page ou un tap.
const SWIPE_THRESHOLD_PX = 40;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Glisse automatiquement d'un groupe de pièces au suivant (2 par 2 sur
// desktop, une par une sur mobile — `groupSize`). L'automatique va
// TOUJOURS de gauche à droite, jamais de retour en arrière (retour Julien
// explicite). Mais la cliente doit pouvoir glisser à la main dans les DEUX
// sens (swipe tactile, surtout utile sur mobile en groupSize=1) pour aller
// d'une pièce à l'autre — jamais pour faire défiler les photos d'une même
// pièce, ce mouvement-là reste automatique et géré par NouveauteCard.
//
// D'où deux clones (dernier groupe avant le premier réel, premier groupe
// après le dernier réel) au lieu d'un seul : boucle infinie dans les deux
// directions, avec le même principe de saut instantané invisible une fois
// glissé sur un clone.
//
// Toutes les cartes visibles changent de face EN MÊME TEMPS, plafonné au
// plus petit nombre de photos DE LA PAIRE ACTIVE, et redémarre TOUJOURS à
// la face avant à chaque nouvelle paire (voir NouveauteCard).
export default function NouveautesSlider({ products, groupSize }: { products: NouveauteProduct[]; groupSize: number }) {
  const groups = chunk(products, groupSize);
  const loop = groups.length > 1;
  // [clone-du-dernier, ...groupes réels, clone-du-premier] — l'index "réel"
  // 0 vit donc à la position 1 dans ce tableau étendu.
  const extendedGroups = loop ? [groups[groups.length - 1], ...groups, groups[0]] : groups;

  const [pos, setPos] = useState(loop ? 1 : 0);
  const [instant, setInstant] = useState(false);
  const [imageStep, setImageStep] = useState(0);
  // Incrémenté à chaque interaction manuelle pour relancer le minuteur
  // auto à zéro — sinon un swipe juste avant le tick suivant ferait
  // repartir la piste presque aussitôt après, ce qui donnerait l'impression
  // que le geste de la cliente n'a servi à rien.
  const [autoResetKey, setAutoResetKey] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Les photos ne se téléchargent que lorsque le slider approche de l'écran
  // (et seulement pour la diapositive affichée + ses voisines). Avec toutes
  // les pièces du site dans le slider, tout charger au démarrage se
  // disputait la bande passante avec le hero : Speed Index mobile 2,2 s →
  // 6,0 s sur PageSpeed (2026-09-26). Les cadres 16/9 réservent la place :
  // aucun décalage de mise en page.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || armed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setArmed(true);
        observer.disconnect();
      },
      // marge négative : il faut voir au moins 150 px du slider pour charger (sur
      // un téléphone il dépasse déjà de quelques pixels en bas de l'écran
      // d'arrivée : ce simple débordement ne doit rien télécharger)
      { rootMargin: "0px 0px -150px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [armed]);

  const advance = (dir: 1 | -1) => {
    setPos((p) => p + dir);
    setAutoResetKey((k) => k + 1);
  };

  // En pause quand l'onglet n'est pas visible (écran verrouillé, changement
  // d'appli) — même principe que les vidéos autoplay de VitrineArc. Sans ça,
  // un onglet resté ouvert en arrière-plan pouvait revenir avec plusieurs
  // diapositives de retard à rattraper d'un coup ; leurs photos n'avaient
  // alors jamais eu l'occasion de précharger (préchargement limité au
  // voisin immédiat, un cran à la fois), d'où des cartes blanches signalées
  // par Julien après un cycle complet (2026-09-27).
  useEffect(() => {
    if (!loop) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id !== null) return;
      id = setInterval(() => setPos((p) => p + 1), GROUP_INTERVAL_MS);
    };
    const stop = () => {
      if (id === null) return;
      clearInterval(id);
      id = null;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loop, autoResetKey]);

  // Vient de glisser sur un clone (au tout début ou à la toute fin de la
  // piste étendue) : après la durée de la transition, saut instantané
  // (transition coupée) vers le vrai groupe équivalent — invisible, clone
  // et original sont pixel pour pixel identiques.
  useEffect(() => {
    if (!loop) return;
    const lastPos = extendedGroups.length - 1;
    if (pos !== 0 && pos !== lastPos) return;
    const target = pos === 0 ? groups.length : 1;
    const t = setTimeout(() => {
      setInstant(true);
      setPos(target);
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }, SLIDE_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [pos, loop, groups.length, extendedGroups.length]);

  if (groups.length === 0) return null;
  // Ramène `pos` (1..N dans la piste étendue, ou 0/N+1 pendant le saut) à
  // un index de groupe réel 0..N-1 pour tout ce qui n'est pas la piste
  // elle-même (points de progression, cycle des photos).
  const realIndex = loop ? ((pos - 1 + groups.length) % groups.length) : 0;
  const activeGroup = groups[realIndex];
  const cycleLength = Math.max(1, Math.min(...activeGroup.map((p) => p.images.length || 1)));

  useEffect(() => {
    setImageStep(0);
    if (cycleLength <= 1) return;
    const id = setInterval(() => setImageStep((s) => (s + 1) % cycleLength), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realIndex, cycleLength]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !loop) return;
    const end = e.changedTouches[0];
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    advance(dx < 0 ? 1 : -1);
  };

  return (
    <div ref={rootRef} className="overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div
        className={instant ? "flex" : "flex transition-transform duration-700 ease-in-out"}
        style={{ transform: `translateX(-${pos * 100}%)` }}
      >
        {extendedGroups.map((group, gi) => (
          <div
            key={gi}
            className="grid w-full shrink-0 gap-x-8 gap-y-10 text-left"
            style={{ gridTemplateColumns: `repeat(${groupSize}, minmax(0, 1fr))` }}
          >
            {group.map((item) => (
              <NouveauteCard
                key={item.href}
                {...item}
                activeIndex={imageStep}
                loadMode={!armed ? "none" : gi === pos ? "cycle" : Math.abs(gi - pos) === 1 ? "first" : "none"}
              />
            ))}
          </div>
        ))}
      </div>

      {groups.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {groups.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Voir la pièce ${i + 1}`}
              onClick={() => {
                setInstant(false);
                setPos(i + 1);
                setAutoResetKey((k) => k + 1);
              }}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === realIndex ? "1.5rem" : "0.5rem",
                backgroundColor: i === realIndex ? "var(--color-denim)" : "rgba(36,27,21,0.12)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
