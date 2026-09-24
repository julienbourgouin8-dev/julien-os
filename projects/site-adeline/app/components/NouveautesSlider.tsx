"use client";

import { useEffect, useState } from "react";
import NouveauteCard, { type NouveauteProduct } from "@/components/NouveauteCard";

const GROUP_INTERVAL_MS = 7500;
const ROTATE_INTERVAL_MS = 2600;
const SLIDE_TRANSITION_MS = 700;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Glisse automatiquement d'un groupe de pièces au suivant (2 par 2 sur
// desktop, une par une sur mobile — `groupSize`) — TOUJOURS de gauche à
// droite, jamais un retour en arrière (retour Julien explicite : "faut
// jamais que ça fasse droite gauche pour revenir"). Technique classique du
// carrousel infini : un clone du premier groupe est ajouté à la fin ; une
// fois glissé dessus (visuellement identique au premier), on saute
// instantanément à l'index 0 réel, transition coupée le temps du saut —
// invisible puisque le clone et l'original sont pixel pour pixel les mêmes.
//
// Toutes les cartes visibles changent de face EN MÊME TEMPS, et chaque
// nouvelle paire redémarre TOUJOURS sur la face avant (image 0, garantie en
// position 1 par l'admin) — retour Julien explicite après un premier essai
// désynchronisé : la trousse corail a 4 photos quand les autres n'en ont
// que 3, donc un simple minuteur global qui ne s'arrête jamais dérive dès
// que deux produits d'une même paire n'ont pas le même nombre de photos.
// Le cycle est donc plafonné au plus petit nombre de photos DE LA PAIRE
// ACTIVE, et repart de zéro à chaque fois qu'une nouvelle paire apparaît.
export default function NouveautesSlider({ products, groupSize }: { products: NouveauteProduct[]; groupSize: number }) {
  const groups = chunk(products, groupSize);
  const loop = groups.length > 1;
  const extendedGroups = loop ? [...groups, groups[0]] : groups;

  const [groupIndex, setGroupIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const [imageStep, setImageStep] = useState(0);

  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => setGroupIndex((i) => i + 1), GROUP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loop]);

  // Vient de glisser sur le clone final : après la durée de la transition,
  // saut instantané (sans transition) vers le vrai premier groupe.
  useEffect(() => {
    if (!loop || groupIndex !== groups.length) return;
    const t = setTimeout(() => {
      setInstant(true);
      setGroupIndex(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }, SLIDE_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [groupIndex, groups.length, loop]);

  if (groups.length === 0) return null;
  const activeDot = groupIndex % groups.length;
  const activeGroup = groups[activeDot];
  const cycleLength = Math.max(1, Math.min(...activeGroup.map((p) => p.images.length || 1)));

  // Redémarre à 0 (face avant) à chaque nouvelle paire, et ne boucle que
  // sur ce que TOUTES les pièces de cette paire ont en commun — jamais
  // au-delà, sinon celle qui a le plus de photos se désynchronise des
  // autres avant la fin de son propre cycle.
  useEffect(() => {
    setImageStep(0);
    if (cycleLength <= 1) return;
    const id = setInterval(() => setImageStep((s) => (s + 1) % cycleLength), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDot, cycleLength]);

  return (
    <div className="overflow-hidden">
      <div
        className={instant ? "flex" : "flex transition-transform duration-700 ease-in-out"}
        style={{ transform: `translateX(-${groupIndex * 100}%)` }}
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
            <span
              key={i}
              aria-hidden
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeDot ? "1.5rem" : "0.5rem",
                backgroundColor: i === activeDot ? "var(--color-denim)" : "rgba(36,27,21,0.12)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
