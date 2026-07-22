import { getAllPatches, getPatchIndex } from "@/data/patches";
import { formatDate } from "@/lib/utils";
import { PatchIndexCard, type PatchCardData } from "@/components/PatchIndexCard";

export const metadata = {
  title: "All patches",
};

export default function PatchesPage() {
  const index = getPatchIndex();
  const full = getAllPatches();
  const byId = new Map(full.map((p) => [p.id, p]));

  const cards: PatchCardData[] = index.map((p, i) => {
    const patch = byId.get(p.id);
    const highlights =
      patch?.champions.slice(0, 8).map((c) => ({
        name: c.name,
        direction: c.direction,
        tldr: c.tldr,
      })) ?? [];
    return {
      ...p,
      summary: patch?.summary,
      highlights,
      isLatest: i === 0,
    };
  });

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h1 className="font-data text-2xl font-semibold tracking-tight text-fg">
          all patches
        </h1>
        <p className="mt-1 font-data text-[12px] text-muted">
          Browse every balance patch we track
          {index.length > 0
            ? ` · ${index.length} patches · ${formatDate(index[index.length - 1].releaseDate)} → ${formatDate(index[0].releaseDate)}`
            : null}
          <span className="text-[var(--fg-faint)]"> · hover a row for summary</span>
        </p>
      </div>

      <div>
        <div className="mb-1 hidden grid-cols-[5rem_1fr_7rem_auto] gap-3 font-data text-[9px] uppercase tracking-wider text-[var(--fg-faint)] sm:grid">
          <span>ver</span>
          <span>touched</span>
          <span>b/n/a</span>
          <span>date</span>
        </div>
        {cards.map((p) => (
          <PatchIndexCard key={p.id} patch={p} />
        ))}
      </div>
    </div>
  );
}
