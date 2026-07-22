"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChampionIndexEntry } from "@/lib/types";
import { directionLabel } from "@/lib/utils";
import { ChampionPortrait } from "@/components/EntityIcon";
import { HoverCard } from "@/components/HoverCard";
import { DirectionDot } from "@/components/DirectionBadge";

export default function ChampionsClient({
  champs,
}: {
  champs: ChampionIndexEntry[];
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return champs;
    return champs.filter((c) => c.name.toLowerCase().includes(s));
  }, [champs, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="font-data text-2xl font-semibold tracking-tight text-fg">
            champs
          </h1>
          <p className="mt-1 font-data text-[11px] text-muted">
            {champs.length} with history · click for timeline
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="find…"
          className="w-40 border-0 border-b border-border bg-transparent py-1 font-data text-[12px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-accent"
        />
      </div>

      <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
        {filtered.map((c) => (
          <HoverCard
            key={c.slug}
            content={
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ChampionPortrait
                    name={c.name}
                    assetKey={c.assetKey}
                    size={28}
                    className="!rounded-none"
                  />
                  <span className="font-semibold text-fg">{c.name}</span>
                </div>
                <p className="font-data text-[11px] text-muted">
                  {c.changeCount} patches
                  {c.lastPatch && c.lastDirection
                    ? ` · last ${directionLabel(c.lastDirection)} ${c.lastPatch}`
                    : ""}
                </p>
              </div>
            }
          >
            <Link
              href={`/champions/${c.slug}`}
              className="mb-0 flex break-inside-avoid items-center gap-2 border-b border-border/80 py-1.5 hover:bg-[var(--ink)]"
            >
              <ChampionPortrait
                name={c.name}
                assetKey={c.assetKey}
                size={28}
                className="!rounded-none"
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                {c.name}
              </span>
              <span className="font-data text-[10px] tabular-nums text-[var(--fg-faint)]">
                {c.changeCount}
              </span>
              {c.lastDirection && (
                <DirectionDot direction={c.lastDirection} />
              )}
            </Link>
          </HoverCard>
        ))}
      </div>
    </div>
  );
}
