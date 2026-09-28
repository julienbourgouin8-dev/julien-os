import MarketForm from "../MarketForm";
import { createMarketAction } from "../actions";

export default function NewMarketPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Section &laquo; Nos marchés &raquo;</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Nouveau marché</h1>
      <div className="mt-8">
        <MarketForm action={createMarketAction} />
      </div>
    </div>
  );
}
