"use client";

import { useEffect } from "react";

export default function ScrollToTopOnLoad() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const hash = window.location.hash;
    if (!hash) return;

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
      } else if (target && originalId) {
        target.id = originalId;
      }
    };
    pin();
  }, []);

  return null;
}
