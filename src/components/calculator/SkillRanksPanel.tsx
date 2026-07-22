"use client";

import type { AbilityData } from "@/lib/calculator/types";
import {
  SKILL_KEYS,
  type SkillKey,
  maxRankForSkill,
  pointsAvailable,
  pointsUsed,
  maxRanksAtLevel,
  ranksForPriority,
  clampRanksToLevel,
} from "@/lib/calculator/skillRanks";
import { AbilityMark } from "@/components/AbilityMark";
import { cn } from "@/lib/utils";
import { round } from "@/lib/calculator/formulas";

export function SkillRanksPanel({
  level,
  ranks,
  onChange,
  abilities,
  /** post-mit primary damage by skill key at current ranks */
  damageByKey,
  /** post-mit if this skill were +1 rank (same build) */
  damageIfUp,
}: {
  level: number;
  ranks: Record<string, number>;
  onChange: (ranks: Record<string, number>) => void;
  abilities: AbilityData[];
  damageByKey: Record<string, number>;
  damageIfUp: Record<string, number | null>;
}) {
  const maxByKey: Partial<Record<SkillKey, number>> = {};
  for (const ab of abilities) {
    if (ab.key === "Q" || ab.key === "W" || ab.key === "E" || ab.key === "R") {
      maxByKey[ab.key] = ab.maxRank;
    }
  }

  const used = pointsUsed(ranks);
  const budget = pointsAvailable(level);
  const over = used > budget;

  const setRank = (key: SkillKey, value: number) => {
    const max = maxRankForSkill(key, level, maxByKey[key]);
    const next = {
      ...ranks,
      [key]: Math.min(max, Math.max(0, value)),
    };
    onChange(clampRanksToLevel(next, level, maxByKey));
  };

  const nameOf = (k: SkillKey) =>
    abilities.find((a) => a.key === k)?.name ?? k;

  // Best next rank-up by damage gain
  const gains = SKILL_KEYS.map((k) => {
    const cur = damageByKey[k] ?? 0;
    const up = damageIfUp[k];
    const max = maxRankForSkill(k, level, maxByKey[k]);
    const canUp =
      (ranks[k] ?? 0) < max && used < budget && up != null;
    const gain = canUp && up != null ? up - cur : null;
    return { key: k, gain, canUp };
  }).filter((g) => g.gain != null && g.gain > 0) as {
    key: SkillKey;
    gain: number;
    canUp: boolean;
  }[];
  gains.sort((a, b) => b.gain - a.gain);
  const best = gains[0];

  return (
    <div className="space-y-3 border border-border bg-[var(--panel)]/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label-micro">skill ranks</p>
          <p className="label-hint mt-0.5">
            set Q/W/E/R ranks for this build · compare rank-ups below
          </p>
        </div>
        <div
          className={cn(
            "font-data text-[12px] tabular-nums",
            over ? "text-nerf" : "text-muted",
          )}
        >
          points{" "}
          <span className={cn("font-semibold", over ? "text-nerf" : "text-fg")}>
            {used}
          </span>
          <span className="text-[var(--fg-faint)]">/{budget}</span>
          <span className="ml-1 text-[10px] text-[var(--fg-faint)]">
            (lv {level})
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {SKILL_KEYS.map((k) => {
          const max = maxRankForSkill(k, level, maxByKey[k]);
          const rank = ranks[k] ?? 0;
          const dmg = damageByKey[k] ?? 0;
          const up = damageIfUp[k];
          const gain =
            up != null && rank < max && used < budget ? up - dmg : null;
          const locked = max === 0;

          return (
            <div
              key={k}
              className={cn(
                "grid grid-cols-1 items-center gap-2 border-b border-border/70 pb-2.5 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto]",
                locked && "opacity-40",
              )}
            >
              <div className="min-w-0">
                <AbilityMark letter={k} name={nameOf(k)} />
                {locked && k === "R" && (
                  <p className="mt-0.5 font-data text-[10px] text-[var(--fg-faint)]">
                    unlocks lv 6
                  </p>
                )}
              </div>

              {/* Rank buttons 0..max */}
              <div className="flex flex-wrap items-center gap-1">
                {Array.from({ length: max + 1 }, (_, n) => n).map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={locked}
                    onClick={() => setRank(k, n)}
                    className={cn(
                      "min-w-[1.75rem] border px-1.5 py-1 font-data text-[12px] font-semibold tabular-nums transition",
                      rank === n
                        ? "border-accent bg-accent/15 text-fg"
                        : "border-border text-muted hover:border-[var(--line-strong)] hover:text-fg",
                    )}
                    title={`${k} rank ${n}`}
                  >
                    {n}
                  </button>
                ))}
                <span className="ml-1 font-data text-[10px] text-[var(--fg-faint)]">
                  /{max}
                </span>
              </div>

              <div className="text-right font-data text-[12px] tabular-nums">
                <div className="text-fg">
                  <span className="text-[var(--fg-faint)]">dmg </span>
                  <span className="font-semibold text-buff">
                    {rank === 0 ? "—" : round(dmg, 0)}
                  </span>
                </div>
                {gain != null && (
                  <div
                    className={cn(
                      "text-[11px]",
                      best?.key === k ? "text-buff" : "text-muted",
                    )}
                  >
                    +1 → +{round(gain, 0)}
                    {best?.key === k ? " ★" : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Presets for skill order analysis */}
      <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
        <span className="label-hint mr-1 self-center">presets</span>
        <PresetBtn
          label="max all"
          onClick={() => onChange(maxRanksAtLevel(level, maxByKey))}
        />
        <PresetBtn
          label="max Q"
          onClick={() =>
            onChange(ranksForPriority(level, ["Q", "R", "E", "W"], maxByKey))
          }
        />
        <PresetBtn
          label="max W"
          onClick={() =>
            onChange(ranksForPriority(level, ["W", "R", "Q", "E"], maxByKey))
          }
        />
        <PresetBtn
          label="max E"
          onClick={() =>
            onChange(ranksForPriority(level, ["E", "R", "Q", "W"], maxByKey))
          }
        />
        <PresetBtn
          label="clear"
          onClick={() => onChange({ Q: 0, W: 0, E: 0, R: 0 })}
        />
      </div>

      {best && (
        <p className="font-data text-[11px] text-muted">
          next point tip:{" "}
          <span className="text-fg">
            <AbilityMark letter={best.key} name={nameOf(best.key)} compact />{" "}
            (+{round(best.gain, 0)} post-mit on primary line)
          </span>
        </p>
      )}
    </div>
  );
}

function PresetBtn({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-border px-2 py-1 font-data text-[11px] text-muted hover:border-[var(--line-strong)] hover:text-fg"
    >
      {label}
    </button>
  );
}
