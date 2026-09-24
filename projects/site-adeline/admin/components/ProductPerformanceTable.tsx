export type ProductPerformanceRow = {
  productId: string;
  productName: string;
  views: number;
  sold: number;
};

// Même gabarit que les listes "Activité récente" / "Stock à surveiller" du
// tableau de bord (divide-y, ligne cliquable) plutôt qu'un nouveau composant
// de graphique — ce qu'on affiche ici est fondamentalement un classement à 3
// colonnes, pas une forme (part-to-whole ou magnitude) qu'un chart rendrait
// mieux qu'un tableau.
export default function ProductPerformanceTable({ data }: { data: ProductPerformanceRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink/40">Pas encore de données.</p>;
  }

  return (
    <div className="divide-y divide-ink/[0.06]">
      <div className="flex items-center justify-between pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink/40">
        <span>Pièce</span>
        <span className="flex gap-6">
          <span className="w-14 text-right">Vues</span>
          <span className="w-14 text-right">Vendues</span>
          <span className="w-16 text-right">Conversion</span>
        </span>
      </div>
      {data.map((row) => {
        const rate = row.views > 0 ? (row.sold / row.views) * 100 : 0;
        return (
          <div key={row.productId} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink" title={row.productName}>
              {row.productName}
            </span>
            <span className="flex shrink-0 gap-6 text-ink/70">
              <span className="w-14 text-right">{row.views}</span>
              <span className="w-14 text-right">{row.sold}</span>
              <span className="w-16 text-right font-semibold text-denim">
                {row.views > 0 ? `${rate.toFixed(1)}%` : "—"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
