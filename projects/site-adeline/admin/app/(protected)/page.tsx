import Link from "next/link";
import { Suspense } from "react";
import { getAllProductsForAdmin } from "@/lib/db/products";
import { getCategoryLabel } from "@/lib/categories";
import { isPostHogConfigured } from "@/lib/posthog";
import {
  VisitorsStatValue,
  CategoryDonutSection,
  VisitsBarSection,
  ProductViewsSection,
  TopPagesSection,
} from "./DashboardPostHogSections";

const LOW_STOCK_THRESHOLD = 2;
const CARD = "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] p-6 shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

// Petit clin d'œil "point de suture" en signature de carte — un tiret court
// en haut à gauche plutôt que la bordure pointillée intégrale de la v1,
// pour garder l'identité "cousu main" sans retomber dans le chromage lourd.
function Stitch({ color = "var(--color-denim)" }: { color?: string }) {
  return <div aria-hidden className="mb-4 h-[3px] w-8 rounded-full" style={{ backgroundColor: color, opacity: 0.55 }} />;
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function StatTile({
  value,
  label,
  accent,
  children,
}: {
  value?: number;
  label: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={CARD}>
      <Stitch color={accent ? "var(--color-rust)" : "var(--color-denim)"} />
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/45">{label}</p>
      {children ?? (
        <p className="mt-1 font-display text-4xl italic" style={{ color: accent ? "var(--color-rust)" : "var(--color-ink)" }}>
          {value?.toLocaleString("fr-FR")}
        </p>
      )}
    </div>
  );
}

// Squelette générique pendant qu'une section attend sa réponse PostHog —
// même gabarit que la carte finale pour ne pas faire sauter la mise en page.
function ChartSkeleton({ height = "h-40" }: { height?: string }) {
  return <div className={`${height} animate-pulse rounded-xl bg-ink/[0.04]`} />;
}

function StatSkeleton() {
  return <div className="mt-1 h-10 w-16 animate-pulse rounded bg-ink/[0.06]" />;
}

export default async function DashboardPage() {
  const posthogReady = isPostHogConfigured();
  const products = await getAllProductsForAdmin();

  const active = products.filter((p) => p.status === "active").length;
  const draft = products.filter((p) => p.status === "draft").length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products
    .filter((p) => p.status !== "archived" && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);
  const recent = [...products].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Tableau de bord</p>
          <h1 className="mt-1 font-display text-3xl text-ink">
            L&apos;atelier <span className="italic text-denim">en un coup d&apos;œil</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <p className="text-sm text-ink/40">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <Link
            href="/products/new"
            className="rounded-full bg-denim px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.3)] transition-transform hover:-translate-y-0.5"
          >
            + Ajouter un produit
          </Link>
        </div>
      </div>

      {/* Ligne de stats — catalogue (DB locale, instantané) + visiteurs
          (PostHog, streamé séparément) dans la même rangée. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile value={active} label="Produits publiés" />
        <StatTile value={totalStock} label="Pièces en stock" />
        <StatTile value={lowStock.length} label="Stock à surveiller" accent={lowStock.length > 0} />
        {posthogReady ? (
          <StatTile label="Visiteurs (7 jours)">
            <Suspense fallback={<StatSkeleton />}>
              <VisitorsStatValue />
            </Suspense>
          </StatTile>
        ) : (
          <StatTile value={draft} label="Brouillons" />
        )}
      </div>

      {products.length === 0 && (
        <div className={`${CARD} max-w-md text-center`}>
          <p className="text-ink/70">Aucun produit encore. La boutique publique reste vide tant que rien n&apos;est ajouté ici.</p>
          <Link
            href="/products/new"
            className="mt-5 inline-flex rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
          >
            Ajouter le premier produit
          </Link>
        </div>
      )}

      {!posthogReady ? (
        <div className={`${CARD} max-w-md text-center`}>
          <p className="text-sm text-ink/60">
            Suivi visiteurs pas encore connecté — ajoute les clés PostHog dans{" "}
            <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code> pour activer les graphiques.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <div className={CARD}>
              <Stitch />
              <h2 className="font-display text-lg italic text-ink">Répartition des vues, par catégorie</h2>
              <p className="text-xs text-ink/40">30 derniers jours</p>
              <div className="mt-6">
                <Suspense fallback={<ChartSkeleton />}>
                  <CategoryDonutSection />
                </Suspense>
              </div>
            </div>

            <div className={CARD}>
              <Stitch />
              <h2 className="font-display text-lg italic text-ink">Visiteurs par jour</h2>
              <p className="text-xs text-ink/40">14 derniers jours</p>
              <div className="mt-6">
                <Suspense fallback={<ChartSkeleton />}>
                  <VisitsBarSection />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <div className={CARD}>
              <Stitch color="var(--color-teal)" />
              <h2 className="font-display text-lg italic text-ink">Vues produits</h2>
              <Suspense fallback={<StatSkeleton />}>
                <ProductViewsSection />
              </Suspense>
            </div>

            <div className={CARD}>
              <Stitch />
              <h2 className="font-display text-lg italic text-ink">Pages les plus vues</h2>
              <p className="text-xs text-ink/40">30 derniers jours</p>
              <div className="mt-6">
                <Suspense fallback={<ChartSkeleton />}>
                  <TopPagesSection />
                </Suspense>
              </div>
            </div>
          </div>
        </>
      )}

      {products.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={CARD}>
            <Stitch color="var(--color-teal)" />
            <h2 className="font-display text-lg italic text-ink">Activité récente</h2>
            <div className="mt-3 divide-y divide-ink/[0.06]">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}/edit`}
                  className="flex items-center justify-between py-3 text-sm transition-colors hover:text-denim"
                >
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink/40">
                    {getCategoryLabel(p.category)} · {relativeDate(p.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <Stitch color="var(--color-mustard)" />
            <h2 className="font-display text-lg italic text-ink">Stock à surveiller</h2>
            {lowStock.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">Tout est correctement approvisionné.</p>
            ) : (
              <div className="mt-3 divide-y divide-ink/[0.06]">
                {lowStock.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}/edit`}
                    className="flex items-center justify-between py-3 text-sm transition-colors hover:text-denim"
                  >
                    <span className="text-ink">{p.name}</span>
                    <span className="font-semibold" style={{ color: p.stock === 0 ? "var(--color-rust)" : "var(--color-mustard)" }}>
                      {p.stock === 0 ? "Rupture" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
