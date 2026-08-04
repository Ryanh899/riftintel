import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeCard } from "@/components/ChangeCard";
import { DirectionBadge } from "@/components/DirectionBadge";
import { ChampionPortrait } from "@/components/EntityIcon";
import { AbilityMark } from "@/components/AbilityMark";
import { JumpLink } from "@/components/JumpLink";
import { getChampionHistory, getChampionIndex } from "@/data/patches";
import { cn, directionSolid, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { DataQualityNotice } from "@/components/DataQualityNotice";

export function generateStaticParams() {
  return getChampionIndex().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const history = getChampionHistory(slug);
  if (!history) return { title: "Champion not found" };
  return {
    title: `${history.name} balance history`,
    description: `Buffs, nerfs, and adjustments for ${history.name} across League of Legends patches.`,
  };
}

export default async function ChampionHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const history = getChampionHistory(slug);
  if (!history) notFound();

  const directions = history.entries.map((e) => e.change.direction);
  const buffs = directions.filter((d) => d === "buff").length;
  const nerfs = directions.filter((d) => d === "nerf").length;
  const adjusts = directions.filter(
    (d) => d === "adjust" || d === "rework",
  ).length;

  // Newest first for reading; timeline stays chronological (entries order)
  const timeline = history.entries;
  const detailed = [...history.entries].reverse();

  return (
    <div className="space-y-6">
      <Link
        href="/champions"
        className="inline-flex items-center gap-1 font-data text-[11px] text-muted hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        champs
      </Link>

      <header className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
        <ChampionPortrait
          name={history.name}
          assetKey={history.assetKey}
          size={56}
          className="!rounded-none"
        />
        <div className="min-w-0">
          <h1 className="font-data text-2xl font-semibold tracking-tight text-fg">
            {history.name}
          </h1>
          <p className="mt-1 font-data text-[12px] text-muted">
            <span className="tabular-nums text-fg">{history.entries.length}</span>{" "}
            patches
            <span className="mx-1.5 text-[var(--fg-faint)]">·</span>
            <span className="text-buff tabular-nums">{buffs}</span>
            <span className="text-[var(--fg-faint)]"> / </span>
            <span className="text-nerf tabular-nums">{nerfs}</span>
            <span className="text-[var(--fg-faint)]"> / </span>
            <span className="text-adjust tabular-nums">{adjusts}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Link
              href={`/calculator?champ=${encodeURIComponent(history.assetKey || history.name)}&compare=last`}
              className="inline-flex border border-accent/30 bg-accent/10 px-2 py-1 font-data text-[11px] text-accent hover:bg-accent/15"
            >
              dmg · last adj →
            </Link>
          </div>
        </div>
      </header>

      <DataQualityNotice quality="archive-review" history />

      {/* Compact jump strip — version + direction only */}
      <section>
        <h2 className="label-micro mb-2">timeline</h2>
        <div className="flex flex-wrap gap-1">
          {timeline.map((entry) => (
            <JumpLink
              key={entry.patchId}
              id={`patch-${entry.patchId}`}
              title={entry.version}
              className={cn(
                "inline-flex items-center gap-1.5 border border-border px-2 py-1 font-data text-[11px] transition",
                "hover:border-[var(--line-strong)] hover:bg-[var(--ink)]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0",
                  directionSolid(entry.change.direction).split(" ")[0],
                )}
              />
              <span className="tabular-nums text-fg">{entry.version}</span>
            </JumpLink>
          ))}
        </div>
      </section>

      <div className="space-y-1">
        <h2 className="label-micro mb-3">
          changes
          <span className="label-hint ml-2">numbers first · text under</span>
        </h2>

        {detailed.map((entry) => {
          const abilities = entry.change.changes ?? [];
          return (
            <section
              key={entry.patchId}
              id={`patch-${entry.patchId}`}
              className="scroll-mt-[var(--scroll-offset,4rem)]"
            >
              {/* Patch strip: version + date + ability chips (not prose) */}
              <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/patches/${entry.patchId}`}
                  className="font-data text-[13px] font-semibold tabular-nums text-accent hover:underline"
                >
                  {entry.version}
                </Link>
                <span className="font-data text-[11px] text-[var(--fg-faint)]">
                  {formatDate(entry.releaseDate)}
                </span>
                <DirectionBadge
                  direction={entry.change.direction}
                  size="sm"
                />
                {abilities.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    {abilities.slice(0, 5).map((a, i) => (
                      <AbilityMark
                        key={`${a.ability}-${i}`}
                        ability={a.ability}
                        title={a.title}
                        compact
                      />
                    ))}
                    {abilities.length > 5 && (
                      <span className="font-data text-[10px] text-muted">
                        +{abilities.length - 5}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <ChangeCard
                entity={entry.change}
                patchId={entry.patchId}
                showHistoryLink={false}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
