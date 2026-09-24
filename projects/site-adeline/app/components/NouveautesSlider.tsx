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

  const advance = (dir: 1 | -1) => {
    setPos((p) => p + dir);
    setAutoResetKey((k) => k + 1);
  };

  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => setPos((p) => p + 1), GROUP_INTERVAL_MS);
    return () => clearInterval(id);
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
    <div className="overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
              <NouveauteCard key={item.href} {...item} activeIndex={imageStep} />
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
