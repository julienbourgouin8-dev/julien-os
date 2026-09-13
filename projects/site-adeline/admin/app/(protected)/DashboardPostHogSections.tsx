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
} from "@/lib/posthog";
import { getCategoryLabel } from "@/lib/categories";
import { categoryColor } from "@/lib/chart-colors";
import TimeBarChart from "@/components/TimeBarChart";
import DonutChart from "@/components/DonutChart";
import BarChart from "@/components/BarChart";

const VISITS_RANGE_DAYS = 14;
const TOP_PAGES_RANGE_DAYS = 30;

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
