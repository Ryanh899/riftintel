"use client";

import Link from "next/link";
import type { ChangeDirection, DataQuality } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { HoverCard } from "./HoverCard";
import { PatchPreviewContent } from "./ChangePreview";
import { cleanSummary } from "@/lib/text";
import { DirectionDot } from "./DirectionBadge";

export interface PatchCardData {
  id: string;
  version: string;
  title: string;
  releaseDate: string;
  summary?: string;
  championCount: number;
  itemCount: number;
  buffCount: number;
  nerfCount: number;
  adjustCount: number;
  highlights?: { name: string; direction: ChangeDirection; tldr: string }[];
  isLatest?: boolean;
  dataQuality?: DataQuality;
}

/** Patch history row — table-like, not a card */
export function PatchIndexCard({ patch }: { patch: PatchCardData }) {
  const href = patch.isLatest ? "/" : `/patches/${patch.id}`;

  return (
    <HoverCard
      content={
        <PatchPreviewContent
          version={patch.version}
          title={patch.title}
          summary={cleanSummary(patch.summary, 200)}
          buffs={patch.buffCount}
          nerfs={patch.nerfCount}
          adjusts={patch.adjustCount}
          highlights={patch.highlights}
        />
      }
    >
      <Link
        href={href}
        className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-b border-border py-2.5 transition hover:bg-[var(--ink)] sm:grid-cols-[5rem_1fr_7rem_auto]"
      >
        <span className="font-data text-[14px] font-semibold tabular-nums text-fg">
          {patch.version}
          {patch.isLatest && (
            <span className="ml-1 text-[9px] font-normal text-accent">now</span>
          )}
          {patch.dataQuality !== "verified" && (
            <span className="ml-1 text-[8px] font-normal uppercase text-adjust">
              review
            </span>
          )}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {patch.highlights?.slice(0, 5).map((h) => (
              <span
                key={h.name}
                className="inline-flex items-center gap-1 text-[11px] text-fg/80"
              >
                <DirectionDot direction={h.direction} />
                {h.name}
              </span>
            ))}
            {(!patch.highlights || patch.highlights.length === 0) && (
              <span className="text-[11px] text-muted">
                {patch.championCount}c · {patch.itemCount}i
              </span>
            )}
          </div>
        </div>

        <span className="hidden font-data text-[11px] tabular-nums text-muted sm:block">
          <span className="text-buff">{patch.buffCount}</span>
          <span className="text-[var(--fg-faint)]">/</span>
          <span className="text-nerf">{patch.nerfCount}</span>
          <span className="text-[var(--fg-faint)]">/</span>
          <span className="text-adjust">{patch.adjustCount}</span>
        </span>

        <span className="font-data text-[10px] tabular-nums text-[var(--fg-faint)]">
          {patch.releaseDate && patch.releaseDate !== "1970-01-01"
            ? formatDate(patch.releaseDate)
            : ""}
        </span>
      </Link>
    </HoverCard>
  );
}
