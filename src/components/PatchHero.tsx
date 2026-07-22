import Link from "next/link";
import type { Patch } from "@/lib/types";
import { allEntities, countByDirection, formatDate } from "@/lib/utils";
import { cleanSummary } from "@/lib/text";

/** Compact patch identity strip — data, not a hero card */
export function PatchHero({
  patch,
  showBrowseAll = true,
}: {
  patch: Patch;
  showBrowseAll?: boolean;
}) {
  const counts = countByDirection(allEntities(patch));
  const buffs = counts.buff ?? 0;
  const nerfs = counts.nerf ?? 0;
  const adjusts = (counts.adjust ?? 0) + (counts.rework ?? 0);
  const summary = cleanSummary(patch.summary, 280);

  return (
    <div className="space-y-3 border-b border-border pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-micro mb-1">current balance patch</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-data text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              {patch.version}
            </h1>
            {patch.releaseDate && patch.releaseDate !== "1970-01-01" && (
              <span className="font-data text-[12px] text-muted">
                {formatDate(patch.releaseDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-4 font-data text-[13px]">
          <Metric n={buffs} label="buff" color="text-buff" />
          <Metric n={nerfs} label="nerf" color="text-nerf" />
          <Metric n={adjusts} label="adj" color="text-adjust" />
          <Metric
            n={patch.champions.length}
            label="champs"
            color="text-muted"
          />
        </div>
      </div>

      {summary && (
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted">
          {summary}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="label-hint">
          use: click icon → jump · hover → preview · filter then read numbers
        </span>
        <span className="text-muted/50">·</span>
        {showBrowseAll && (
          <Link
            href="/patches"
            className="font-data text-[12px] text-accent hover:underline"
          >
            all patches
          </Link>
        )}
        <Link
          href="/calculator"
          className="font-data text-[12px] text-muted hover:text-fg"
        >
          dmg calc
        </Link>
        {patch.sourceUrl && (
          <a
            href={patch.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-data text-[12px] text-muted hover:text-fg"
          >
            source ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Metric({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={`text-lg font-semibold tabular-nums ${color}`}>{n}</span>
      <span className="text-[10px] uppercase tracking-wider text-[var(--fg-faint)]">
        {label}
      </span>
    </span>
  );
}
