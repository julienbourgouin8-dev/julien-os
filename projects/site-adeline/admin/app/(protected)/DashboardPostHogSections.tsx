// Chaque section ici fait son propre appel PostHog et est montée sous sa
// propre <Suspense> (voir page.tsx) — avant, les 6 requêtes PostHog du
// dashboard étaient toutes attendues avant de rendre quoi que ce soit
// (Promise.all), donc CHAQUE clic sur "Tableau de bord" bloquait 10-15s
// (le temps que l'API cloud PostHog réponde) avant que la page n'affiche
// rien du tout. En streamant chaque section séparément, la page (stats
// locales, état vide...) s'affiche tout de suite, et chaque graphique
// apparaît dès que sa propre requête revient — plus de gel entre les onglets.
import {
  getVisitsByDay,
  getTopPages,
  getRecentVisitorCount,
  getTotalProductViews,
  getTotalProductViewsBetween,
  getCategoryBreakdown,
  getTopViewedProducts,
  getTrafficSources,
  getDeviceBreakdown,
  getLiveVisitors,
} from "@/lib/posthog";
import { getUnitsSoldByProduct } from "@/lib/db/orders";
import { getCategoryLabel } from "@/lib/categories";
import { categoryColor } from "@/lib/chart-colors";
import TimeBarChart from "@/components/TimeBarChart";
import DonutChart from "@/components/DonutChart";
import BarChart from "@/components/BarChart";
import ProductPerformanceTable from "@/components/ProductPerformanceTable";

const VISITS_RANGE_DAYS = 14;
const TOP_PAGES_RANGE_DAYS = 30;
const PRODUCT_PERFORMANCE_RANGE_DAYS = 30;

// Device/domaine référent ne sont pas dans la palette catégorielle (celle-ci
// est réservée 1:1 aux 6 catégories boutique, voir chart-colors.ts) — teintes
// de la marque réutilisées dans un ordre fixe, distinct de PALETTE.
const NEUTRAL_PALETTE = ["var(--color-denim)", "var(--color-teal)", "var(--color-rust)", "var(--color-mustard)"];

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function Delta({ value, comparedTo }: { value: number | null; comparedTo: string }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <p className="mt-2 flex items-center gap-1 text-xs">
      <span style={{ color: positive ? "var(--color-teal)" : "var(--color-rust)" }}>
        {positive ? "▲" : "▼"} {Math.abs(value)}%
      </span>
      <span className="text-ink/40">{comparedTo}</span>
    </p>
  );
}

export async function VisitorsStatValue() {
  const visits = await getVisitsByDay(VISITS_RANGE_DAYS);
  const last7 = visits.slice(-7).reduce((sum, d) => sum + d.visitors, 0);
  const prev7 = visits.slice(0, 7).reduce((sum, d) => sum + d.visitors, 0);
  return (
    <>
      <p className="mt-1 font-display text-4xl italic text-ink">{last7.toLocaleString("fr-FR")}</p>
      <Delta value={pctDelta(last7, prev7)} comparedTo="vs 7j précédents" />
    </>
  );
}

export async function CategoryDonutSection() {
  const breakdown = await getCategoryBreakdown(TOP_PAGES_RANGE_DAYS);
  const donutData = breakdown.map((c) => ({
    label: getCategoryLabel(c.category),
    value: c.count,
    color: categoryColor[c.category] ?? "var(--color-denim)",
  }));
  return <DonutChart data={donutData} />;
}

export async function VisitsBarSection() {
  const visits = await getVisitsByDay(VISITS_RANGE_DAYS);
  return <TimeBarChart data={visits.map((v) => ({ day: v.day, value: v.visitors }))} />;
}

export async function ProductViewsSection() {
  const [productViews30, productViewsPrev30, liveVisitors] = await Promise.all([
    getTotalProductViews(30),
    getTotalProductViewsBetween(60, 30),
    getRecentVisitorCount(5),
  ]);
  return (
    <>
      <p className="mt-1 font-display text-4xl italic text-ink">{productViews30.toLocaleString("fr-FR")}</p>
      <Delta value={pctDelta(productViews30, productViewsPrev30)} comparedTo="vs 30j précédents" />
      <p className="mt-5 text-xs uppercase tracking-[0.1em] text-ink/40">Visiteurs en direct</p>
      <p className="mt-1 font-display text-2xl italic text-denim">{liveVisitors}</p>
      <p className="text-xs text-ink/40">dernières 5 minutes</p>
    </>
  );
}

export async function TopPagesSection() {
  const topPages = await getTopPages(TOP_PAGES_RANGE_DAYS);
  return <BarChart data={topPages.map((p) => ({ label: p.url, value: p.views }))} />;
}

// Quelles pièces précises génèrent le plus de vues, et combien se
// transforment vraiment en vente (croise PostHog et la vraie table
// `orders` — deux sources de données, une seule requête chacune).
export async function TopProductsSection() {
  const [topViewed, unitsSold] = await Promise.all([
    getTopViewedProducts(PRODUCT_PERFORMANCE_RANGE_DAYS),
    getUnitsSoldByProduct(PRODUCT_PERFORMANCE_RANGE_DAYS),
  ]);
  const rows = topViewed.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    views: p.views,
    sold: unitsSold[p.productId] ?? 0,
  }));
  return <ProductPerformanceTable data={rows} />;
}

export async function TrafficSourcesSection() {
  const sources = await getTrafficSources(TOP_PAGES_RANGE_DAYS);
  return <BarChart data={sources.map((s) => ({ label: s.source, value: s.visits }))} />;
}

function minutesAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins === 0) return "à l'instant";
  if (mins === 1) return "il y a 1 min";
  return `il y a ${mins} min`;
}

// Liste (pas juste un compte) des sessions actives récentes, avec
// localisation approximative (ville/pays déduits de l'IP par PostHog) et
// dernière page vue — rafraîchi périodiquement avec le reste du tableau de
// bord (voir AutoRefresh.tsx), pas besoin de websocket pour un usage
// "je vérifie régulièrement" plutôt que du temps réel seconde par seconde.
export async function LiveVisitorsSection() {
  const visitors = await getLiveVisitors(15);
  if (visitors.length === 0) {
    return <p className="text-sm text-ink/40">Personne sur le site pour l&apos;instant.</p>;
  }
  return (
    <div className="divide-y divide-ink/[0.06]">
      {visitors.map((v, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <span className="min-w-0 flex-1 truncate text-ink/80">
            {v.city && v.country ? `${v.city}, ${v.country}` : v.country || "Localisation inconnue"}
            <span className="text-ink/40"> · {v.pathname}</span>
          </span>
          <span className="shrink-0 text-xs text-ink/40">{minutesAgo(v.lastSeen)}</span>
        </div>
      ))}
    </div>
  );
}

export async function DeviceBreakdownSection() {
  const devices = await getDeviceBreakdown(TOP_PAGES_RANGE_DAYS);
  const donutData = devices.map((d, i) => ({
    label: d.device,
    value: d.visits,
    color: NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length],
  }));
  return <DonutChart data={donutData} />;
}
