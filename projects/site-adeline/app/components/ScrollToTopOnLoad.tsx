"use client";

import { useEffect } from "react";

export default function ScrollToTopOnLoad() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // `scrollRestoration` ne passe en "manual" que le temps de gérer ce hash
    // précis — sinon ce réglage reste actif pour le reste de la session
    // (cette page ne remonte qu'une fois, dans app/layout.tsx) et désactive
    // la restauration native de la position de scroll par le navigateur sur
    // TOUT retour arrière ultérieur, même sans hash. Régression du
    // 2026-09-27 (retour Julien : la page revenait toujours en haut après un
    // retour arrière, laissant les sections chargées à l'intersection
    // — Nouveautés notamment — blanches tant qu'on ne rescrolle pas).
    const hadManualRestoration = "scrollRestoration" in window.history;
    if (hadManualRestoration) window.history.scrollRestoration = "manual";

    // Le navigateur garde en interne une référence à l'élément ciblé par le
    // hash et re-scrolle dessus à chaque décalage de mise en page (image qui
    // charge, police qui arrive), même après avoir nettoyé l'URL. Seul moyen
    // fiable : casser temporairement cette référence en retirant l'id de la
    // cible, le temps que la page finisse de se stabiliser.
    const target = document.getElementById(hash.slice(1));
    const originalId = target?.id;
    if (target) target.removeAttribute("id");

    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    const until = Date.now() + 1500;
    const pin = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      if (Date.now() < until) {
        requestAnimationFrame(pin);
        return;
      }
      if (target && originalId) target.id = originalId;
      if (hadManualRestoration) window.history.scrollRestoration = "auto";
    };
    pin();
  }, []);

  return null;
}
