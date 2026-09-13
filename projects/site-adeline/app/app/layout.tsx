import type { Metadata } from "next";
import { Fraunces, Jost, Caveat } from "next/font/google";
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
      </body>
    </html>
  );
}
