import type { Metadata, Viewport } from "next";
import { Fraunces, Jost, Caveat } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ScrollToTopOnLoad from "@/components/ScrollToTopOnLoad";
import PostHogProvider from "@/components/PostHogProvider";
import CookieConsent from "@/components/CookieConsent";
import { CartProvider } from "@/lib/cart/CartProvider";
import "./globals.css";

// Axes variables `opsz`/`SOFT`/`WONK` retirés (audit perf 2026-09-22) :
// aucun `font-variation-settings` ne les fait varier nulle part dans le
// CSS du site — ils gonflaient le fichier de police sans jamais être
// utilisés. Seul `wght` (toujours inclus par défaut) sert réellement.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

const body = Jost({
  variable: "--font-body",
  subsets: ["latin"],
});

const script = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "CréA'deline — Créations personnalisées, cousues main",
  description:
    "Sacs, trousses et pochettes cousus main sur mesure par CréA'deline, en Charente-Maritime. Pièces uniques, tissus choisis, création personnalisée.",
  // `black-translucent` : si le site est un jour ajouté à l'écran d'accueil
  // (PWA), le contenu de la page peut s'étendre sous l'encoche/île
  // dynamique au lieu de laisser une barre système opaque au-dessus — voir
  // l'explication `env(safe-area-inset-top)` sur le header mobile du hero.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} ${script.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload')document.documentElement.classList.add('page-reload')}catch(e){}`,
          }}
        />
        {/* Préconnexion aux tuiles/style de la carte (MapLibre, section
            Marchés) — audit perf 2026-09-22, PSI l'identifiait comme
            candidat. La carte est chargée en différé (voir MarchesLazy.tsx)
            donc ça n'affecte jamais le LCP, mais accélère la première
            requête vers ces origines une fois qu'on y arrive. */}
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <CartProvider>
            <ScrollToTopOnLoad />
            {children}
          </CartProvider>
        </PostHogProvider>
        <CookieConsent />
        {/* Vercel Speed Insights — mesure les Core Web Vitals réels des
            visiteuses (LCP, CLS...) pour suivre la rapidité du site dans le
            temps. Pas de cookie, pas de donnée personnelle collectée (voir
            doc Vercel) — contrairement à PostHog, pas gaté par le
            consentement, mais quand même listé en toute transparence dans
            la politique de confidentialité. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
