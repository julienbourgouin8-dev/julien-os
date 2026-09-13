"use client";

import { useState } from "react";
import Link from "next/link";
import WriteOnHeading from "@/components/WriteOnHeading";
import { resetConsent } from "@/lib/consent";

// TODO Julien : adresse mail exacte d'Adeline pas encore confirmée (carte
// de visite coupée sur "deline1001@y..."). Volontairement vide pour
// l'instant plutôt que de deviner — le formulaire ouvre le client mail du
// visiteur pré-rempli (sujet + message), mais SANS destinataire tant que
// l'adresse réelle n'est pas donnée. Renseigner ici dès que tu l'as.
export const CONTACT_EMAIL = "";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 13.5h2.5l1-4H14V7.5c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.66 10 6.7V9.5H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2C10.5 19.5 4.5 13.5 4.5 5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

// Catégories réelles (taxonomie construite à partir des légendes Facebook,
// cf. VitrineArc) et tissus réels (lib/products.ts) — pas de choix inventés.
const PIECE_TYPES = [
  "Sac",
  "Sacoche ordinateur",
  "Pochette",
  "Trousse",
  "Accessoire du quotidien",
  "Autre",
];

const FABRICS = ["Fleuri", "Tour Eiffel", "Éventail", "Pied-de-poule", "Autre / à discuter"];

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pieceType, setPieceType] = useState(PIECE_TYPES[0]);
  const [fabric, setFabric] = useState(FABRICS[0]);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Demande via le site — ${pieceType}`);
    const body = encodeURIComponent(
      `Type de pièce : ${pieceType}\nTissu souhaité : ${fabric}\n\n${message}\n\n— ${name}${email ? ` (${email})` : ""}`,
    );
    // Ouvre le client mail du visiteur, déjà rempli — c'est LUI qui envoie
    // depuis sa propre boîte, pas d'envoi silencieux côté serveur.
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <footer id="contact" className="scroll-mt-20 bg-paper px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          Une envie précise ?
        </p>
        <WriteOnHeading
          as="h2"
          text="Parlons de votre pièce"
          italicWords={["pièce"]}
          className="mt-2 font-display text-3xl text-ink sm:text-4xl"
        />
        <p className="mx-auto mt-4 max-w-md text-ink/60">
          Un tissu en tête, une taille précise, une idée de cadeau — écrivez
          directement ici.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col items-center gap-5">
          <div className="w-full text-center">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
              Quel type de pièce ?
            </label>
            <div className="mt-2 flex flex-wrap justify-center gap-2 md:flex-nowrap">
              {PIECE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPieceType(t)}
                  className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200"
                  style={{
                    backgroundColor: pieceType === t ? "var(--color-denim)" : "rgba(255,255,255,0.6)",
                    color: pieceType === t ? "var(--color-paper)" : "var(--color-ink)",
                    border: `1px solid ${pieceType === t ? "var(--color-denim)" : "var(--color-line)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full max-w-xs text-center">
            <label htmlFor="fabric" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
              Tissu souhaité
            </label>
            <select
              id="fabric"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-center text-sm text-ink outline-none transition-colors focus:border-denim"
            >
              {FABRICS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="grid w-full gap-4 text-left sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
                Nom
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-denim"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-denim"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>
          <div className="w-full text-left">
            <label htmlFor="message" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-denim"
              placeholder="Dites-en un peu plus sur la pièce que vous imaginez..."
            />
          </div>
          <button
            type="submit"
            className="group mt-2 inline-flex items-center justify-center gap-2 self-center rounded-full bg-denim px-6 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5"
          >
            Envoyer
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </form>

        <div className="mx-auto mt-14 flex max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="font-script text-2xl text-ink/50">CréA&apos;deline</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 text-sm text-ink/70 sm:flex-row sm:justify-center sm:gap-6">
          <a href="tel:0660054286" className="inline-flex items-center gap-2 transition-colors hover:text-denim">
            <PhoneIcon className="h-4 w-4" />
            06 60 05 42 86
          </a>
          <a
            href="https://www.facebook.com/deline1001"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook CréA'deline"
            className="inline-flex items-center gap-2 transition-colors hover:text-denim"
          >
            <FacebookIcon className="h-4 w-4" />
            Facebook
          </a>
          <a
            href="https://www.instagram.com/crea_deline.16/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram CréA'deline"
            className="inline-flex items-center gap-2 transition-colors hover:text-denim"
          >
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
        </div>

        <p className="mt-10 text-xs text-ink/40">
          © {new Date().getFullYear()} CréA&apos;deline. Pièces uniques faites
          main, sur commande, en Charente.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink/40">
          <Link href="/mentions-legales" className="underline-offset-2 hover:text-ink hover:underline">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="underline-offset-2 hover:text-ink hover:underline">
            Confidentialité
          </Link>
          <Link href="/cookies" className="underline-offset-2 hover:text-ink hover:underline">
            Cookies
          </Link>
          <button
            type="button"
            onClick={resetConsent}
            className="underline-offset-2 hover:text-ink hover:underline"
          >
            Gérer les cookies
          </button>
        </div>
      </div>
    </footer>
  );
}
