"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChampionIndexEntry, EntityChange } from "@/lib/types";
import { championImage, cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "riftintel.champion-pool.v1";

export function ChampionPool({
  champions,
  changed,
  patchVersion,
}: {
  champions: ChampionIndexEntry[];
  changed: EntityChange[];
  patchVersion: string;
}) {
  const [pool, setPool] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState("");

  /* Hydrate the browser-only preference after SSR. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setPool(stored.filter((id) => typeof id === "string").slice(0, 10));
    } catch {
      // A malformed local preference should simply reset.
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
    } catch {
      // Storage can be unavailable in strict privacy modes; keep the feature session-only.
    }
  }, [pool, ready]);

  const bySlug = useMemo(
    () => new Map(champions.map((champion) => [champion.slug, champion])),
    [champions],
  );
  const affected = changed.filter((change) => pool.includes(change.id));
  const available = champions.filter((champion) => !pool.includes(champion.slug));

  const add = () => {
    if (!selected || pool.length >= 10) return;
    setPool((current) => [...current, selected]);
    trackEvent("champion_pool_added", { champion: selected, size: pool.length + 1 });
    setSelected("");
  };

  return (
    <section className="border border-border bg-[var(--ink)]/35 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="label-micro">my champion pool</h2>
          <p className="mt-1 font-data text-[11px] text-[var(--fg-faint)]">
            Saved only on this device · see who changed every patch
          </p>
        </div>
        {pool.length > 0 && (
          <span className="font-data text-[11px] text-muted">
            <span className={affected.length ? "text-adjust" : "text-buff"}>{affected.length}</span>
            {" "}changed in {patchVersion}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {pool.map((slug) => {
          const champion = bySlug.get(slug);
          if (!champion) return null;
          const change = affected.find((entry) => entry.id === slug);
          return (
            <div
              key={slug}
              className={cn(
                "flex items-center gap-1 border bg-bg pr-1",
                change ? "border-adjust/50" : "border-border",
              )}
            >
              {championImage(champion.assetKey) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={championImage(champion.assetKey)!} alt="" width={28} height={28} />
              )}
              <Link
                href={
                  change
                    ? `#champion-${slug}`
                    : `/calculator?champ=${encodeURIComponent(champion.assetKey || champion.name)}`
                }
                className="font-data text-[11px] text-fg hover:text-accent"
              >
                {champion.name}
                {change ? ` · ${change.direction}` : ""}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPool((current) => current.filter((id) => id !== slug));
                  trackEvent("champion_pool_removed", { champion: slug });
                }}
                aria-label={`Remove ${champion.name} from champion pool`}
                className="px-1 text-[var(--fg-faint)] hover:text-nerf"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex max-w-md gap-1.5">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          disabled={pool.length >= 10}
          aria-label="Choose a champion to add"
          className="min-w-0 flex-1 border border-border bg-[var(--panel)] px-2 py-1.5 font-data text-[11px] text-fg"
        >
          <option value="">{pool.length ? "add another champion…" : "choose your first champion…"}</option>
          {available.map((champion) => (
            <option key={champion.slug} value={champion.slug}>{champion.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!selected || pool.length >= 10}
          className="border border-accent/50 bg-accent/10 px-3 py-1.5 font-data text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          add
        </button>
      </div>
    </section>
  );
}
