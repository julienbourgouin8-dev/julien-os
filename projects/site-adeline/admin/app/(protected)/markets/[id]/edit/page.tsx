import { notFound } from "next/navigation";
import MarketForm from "../../MarketForm";
import { updateMarketAction } from "../../actions";
import { getMarketById } from "@/lib/db/markets";

export default async function EditMarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await getMarketById(id);
  if (!market) notFound();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Section &laquo; Nos marchés &raquo;</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Modifier {market.title}</h1>
      <div className="mt-8">
        <MarketForm market={market} action={updateMarketAction.bind(null, id)} />
      </div>
    </div>
  );
}
