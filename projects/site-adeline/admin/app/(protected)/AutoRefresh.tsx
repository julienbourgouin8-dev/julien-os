"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 45s : assez souvent pour qu'un nouveau visiteur ou une nouvelle commande
// apparaisse sans qu'Adeline ait à recharger la page elle-même, mais pas au
// point de multiplier les requêtes PostHog (facturées à l'usage côté cloud)
// pour un tableau de bord qui reste ouvert toute la journée dans un onglet.
const REFRESH_INTERVAL_MS = 45_000;

export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
