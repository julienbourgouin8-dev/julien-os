"use client";

import { useState } from "react";

const LINKS = [
  { href: "#vitrine", label: "Créations" },
  { href: "#marches", label: "Marchés" },
  { href: "#contact", label: "Contact" },
  // TODO Julien : même destination provisoire que la nav desktop hero
  // (page.tsx) — pas de section "À propos" sur le site pour l'instant.
  { href: "#apropos", label: "À propos" },
];

// Menu hamburger mobile — remplace l'icône "Boutique" isolée (qui pointait
// déjà vers #vitrine) : mêmes liens que la nav desktop, regroupés dans un
// tiroir plutôt qu'éparpillés. `position: fixed` (pas absolute) pour
// échapper à l'`overflow-hidden` de la section hero.
export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 flex h-6 w-6 flex-col items-center justify-center gap-[5px] text-ink sm:hidden"
      >
        <span className={`h-[2.5px] w-5 rounded-full bg-current transition-transform ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
        <span className={`h-[2.5px] w-5 rounded-full bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`h-[2.5px] w-5 rounded-full bg-current transition-transform ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-x-0 top-0 flex flex-col bg-paper px-6 pb-8 pt-16 shadow-[0_20px_40px_rgba(36,27,21,0.15)]">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/[0.06] py-4 font-display text-lg font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-rust"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
