import Link from "next/link";
import Image from "next/image";
import { getAllMarketsForAdmin } from "@/lib/db/markets";
import DeleteMarketButton from "./DeleteMarketButton";

const CARD = "rounded-2xl border border-ink/[0.05] bg-[#fffdf8] shadow-[0_1px_2px_rgba(36,27,21,0.05),0_10px_28px_rgba(36,27,21,0.07)]";

function formatDate(iso: string | null): string {
  if (!iso) return "Sans date";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function isPast(iso: string | null): boolean {
  if (!iso) return false;
  return iso < new Date().toISOString().slice(0, 10);
}

export default async function AdminMarketsPage() {
  const markets = await getAllMarketsForAdmin();

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Section &laquo; Nos marchés &raquo;</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Marchés</h1>
        </div>
        <Link
          href="/markets/new"
          className="rounded-full bg-denim px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.3)] transition-transform hover:-translate-y-0.5"
        >
          + Ajouter un marché
        </Link>
      </div>

      {markets.length === 0 ? (
        <div className={`${CARD} mt-10 max-w-md p-10 text-center`}>
          <p className="text-ink/70">Aucun marché pour l&apos;instant.</p>
          <Link
            href="/markets/new"
            className="mt-5 inline-flex rounded-full bg-denim px-6 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
          >
            Ajouter le premier marché
          </Link>
        </div>
      ) : (
        <div className={`${CARD} mt-8 overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.1em] text-ink/40">
                <th className="px-6 py-4 font-medium">Marché</th>
                <th className="px-4 py-4 font-medium">Lieu</th>
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {markets.map((m) => {
                const past = isPast(m.event_date);
                return (
                  <tr key={m.id} className="transition-colors hover:bg-ink/[0.015]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {m.image ? (
                          <Image
                            src={m.image}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-ink/5" />
                        )}
                        <span className="font-medium text-ink">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">
                      {m.place}
                      {m.lat === null && (
                        <span className="ml-2 rounded-full bg-rust/10 px-2 py-0.5 text-xs font-semibold text-rust">
                          Lieu non localisé
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink/60">
                      {formatDate(m.event_date)}
                      {past && (
                        <span className="ml-2 rounded-full bg-ink/[0.06] px-2 py-0.5 text-xs font-semibold text-ink/50">
                          Passé · masqué du site
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/markets/${m.id}/edit`} className="text-ink/45 hover:text-denim">
                        Modifier
                      </Link>
                      <DeleteMarketButton id={m.id} title={m.title} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
