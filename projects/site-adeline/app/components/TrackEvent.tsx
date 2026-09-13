"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

// Les pages boutique sont des Server Components (lecture SQLite directe) —
// posthog-js ne peut capturer que côté navigateur, donc ce petit composant
// client isolé se charge juste de l'événement custom au montage, sans
// rendre la page produit/catégorie elle-même "use client".
export default function TrackEvent({ event, properties }: { event: string; properties?: Record<string, unknown> }) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    posthog.capture(event, properties);
    // Volontairement déclenché une seule fois au montage (nouvelle page =
    // nouveau montage), pas à chaque changement de `properties`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return null;
}
