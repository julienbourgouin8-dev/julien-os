import type { Metadata, Viewport } from "next";
import { Fraunces, Jost, Caveat } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ScrollToTopOnLoad from "@/components/ScrollToTopOnLoad";
import PostHogProvider from "@/components/PostHogProvider";
import CookieConsent from "@/components/CookieConsent";
import { CartProvider } from "@/lib/cart/CartProvider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["italic", "normal"],
  axes: ["opsz", "SOFT", "WONK"],
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
