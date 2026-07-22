"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  AbilityResult,
  ChampionData,
  ItemData,
  TargetConfig,
} from "@/lib/calculator/types";
import type { ChampionListEntry } from "@/lib/calculator/data";
import { computeBuildFixed } from "@/lib/calculator/buildStats";
import {
  evaluateAbility,
  evaluateAllAbilities,
  round,
} from "@/lib/calculator/formulas";
import {
  effectiveArmor,
  effectiveMr,
  formatPenSummary,
  resistMultiplier,
} from "@/lib/calculator/pen";
import {
  ITEM_BROWSE_FILTERS,
  filterItemsBrowse,
  type ItemBrowseFilter,
} from "@/lib/calculator/items";
import {
  DEFAULT_RUNES,
  KEYSTONES,
  SHARDS,
  combatRunesForTree,
  getRune,
  primaryTreeOf,
  treeBorder,
  treeTone,
} from "@/lib/calculator/runes";
import {
  TARGET_PRESETS,
  targetForPreset,
  type TargetPresetId,
} from "@/lib/calculator/targets";
import type { RuneOption, RuneTree, StatBlock } from "@/lib/calculator/types";
import {
  SKILL_KEYS,
  type SkillKey,
  clampRanksToLevel,
  maxRankForSkill,
  maxRanksAtLevel,
  minRankForSkill,
  pointsAvailable,
  pointsUsed,
  ranksForPriority,
  startingRanksAtLevel,
} from "@/lib/calculator/skillRanks";
import { damageKindLabel } from "@/lib/calculator/pen";
import { cn } from "@/lib/utils";
import { AbilityMark } from "@/components/AbilityMark";
import type { AbilitySlot } from "@/lib/abilities";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import {
  AbilityCompareNotes,
  ComparePatchNotes,
  PatchCompareControls,
  liveKitLabel,
  otherKitLabel,
} from "@/components/calculator/PatchComparePanel";
import {
  kitAsOfPatch,
  noteLinesAfterPatch,
  patchesForChampion,
} from "@/lib/calculator/patchReverse";
import type { ChampionHistory } from "@/lib/types";
import { resolveAbilityLabel } from "@/lib/abilities";

type ListEntry = ChampionListEntry;

const POPULAR = [
  "Ahri",
  "Zed",
  "Jinx",
  "LeeSin",
  "Thresh",
  "Yasuo",
  "Lux",
  "Darius",
  "Ezreal",
  "Jhin",
  "Syndra",
  "Vi",
];

export function DamageCalculator({
  version,
  champions,
  items,
}: {
  version: string;
  champions: ListEntry[];
  items: ItemData[];
  /** @deprecated compare patches come from champ history */
  patches?: { id: string; version: string }[];
}) {
  const searchParams = useSearchParams();
  const urlChamp = searchParams.get("champ") || searchParams.get("id");
  const urlCompare = searchParams.get("compare"); // last | before | patchId
  const urlFrom = searchParams.get("from"); // patch id when compare=before

  const initialChampId = useMemo(() => {
    if (!urlChamp) return "Ahri";
    const q = urlChamp.trim().toLowerCase();
    const match = champions.find(
      (c) =>
        c.id.toLowerCase() === q ||
        c.name.toLowerCase() === q ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          q.replace(/[^a-z0-9]/g, ""),
    );
    return match?.id ?? urlChamp;
  }, [urlChamp, champions]);

  const [champId, setChampId] = useState(initialChampId);
  const [kit, setKit] = useState<ChampionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChampionHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [comparePatchId, setComparePatchId] = useState<string | null>(null);
  const urlCompareApplied = useRef(false);
  const [level, setLevel] = useState(3);
  const [ranks, setRanks] = useState<Record<string, number>>({
    Q: 1,
    W: 1,
    E: 1,
    R: 0,
  });
  const [adcSeventh, setAdcSeventh] = useState(false);
  const [slots, setSlots] = useState<(ItemData | null)[]>(Array(6).fill(null));
  const [itemQuery, setItemQuery] = useState("");
  const [itemFilter, setItemFilter] = useState<ItemBrowseFilter>("all");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [runeIds, setRuneIds] = useState<string[]>([...DEFAULT_RUNES]);
  const [targetPreset, setTargetPreset] = useState<TargetPresetId | null>(
    "squishy",
  );
  const [target, setTarget] = useState<TargetConfig>(() =>
    targetForPreset("squishy", 3),
  );
  const [targetLowHp, setTargetLowHp] = useState(false);
  const [champOpen, setChampOpen] = useState(false);
  const [champQuery, setChampQuery] = useState("");
  /** Visible on load so values are clear; picking a preset collapses. */
  const [showTargetSliders, setShowTargetSliders] = useState(true);
  const champSearchRef = useRef<HTMLInputElement>(null);
  const slotCount = adcSeventh ? 7 : 6;

  const primaryTree = useMemo(() => primaryTreeOf(runeIds), [runeIds]);
  const treeCombat = useMemo(
    () => (primaryTree ? combatRunesForTree(primaryTree) : []),
    [primaryTree],
  );

  const abilityMaxByKey = useMemo(() => {
    const m: Partial<Record<SkillKey, number>> = {};
    if (!kit) return m;
    for (const ab of kit.abilities) {
      if (ab.key === "Q" || ab.key === "W" || ab.key === "E" || ab.key === "R") {
        m[ab.key] = ab.maxRank;
      }
    }
    return m;
  }, [kit]);

  const loadKit = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/calculator/champion?id=${encodeURIComponent(id)}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const data: ChampionData = await res.json();
      setKit(data);
      const maxBy: Partial<Record<SkillKey, number>> = {};
      for (const ab of data.abilities) {
        if (
          ab.key === "Q" ||
          ab.key === "W" ||
          ab.key === "E" ||
          ab.key === "R"
        ) {
          maxBy[ab.key] = ab.maxRank;
        }
      }
      // Fresh champ: keep current level, start with 1 point in each available skill
      setRanks(startingRanksAtLevel(level, maxBy));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load champion");
      setKit(null);
    } finally {
      setLoading(false);
    }
  }, [level]);

  /* Data loading + rank clamping: setState in effects is intentional here */
  /* eslint-disable react-hooks/set-state-in-effect */
  // Deep-link: ?champ=Corki
  useEffect(() => {
    if (initialChampId && initialChampId !== champId) {
      setChampId(initialChampId);
      urlCompareApplied.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when URL champ changes
  }, [initialChampId]);

  useEffect(() => {
    void loadKit(champId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- champ change only
  }, [champId]);

  // Load balance history for this champ (patches they were on)
  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    if (!urlCompare) setComparePatchId(null);
    setHistory(null);
    const name =
      champions.find((c) => c.id === champId)?.name ?? champId;
    void fetch(
      `/api/calculator/history?id=${encodeURIComponent(champId)}&name=${encodeURIComponent(name)}`,
    )
      .then((r) => r.json())
      .then((data: ChampionHistory) => {
        if (!cancelled) setHistory(data?.entries ? data : null);
      })
      .catch(() => {
        if (!cancelled) setHistory(null);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [champId, champions, urlCompare]);

  // Deep-link compare: ?compare=last | before&from=26.14 | 26.01
  useEffect(() => {
    if (!urlCompare || !history?.entries?.length) return;
    if (urlCompareApplied.current) return;

    const entries = history.entries; // oldest → newest
    const newest = entries[entries.length - 1];
    let targetId: string | null = null;

    if (urlCompare === "last") {
      targetId = newest?.patchId ?? null;
    } else if (urlCompare === "before") {
      const from = urlFrom || newest?.patchId;
      const idx = entries.findIndex(
        (e) => e.patchId === from || e.version === from,
      );
      if (idx > 0) {
        targetId = entries[idx - 1]!.patchId;
      } else if (entries.length >= 2) {
        // from is newest or missing — use second-newest
        targetId = entries[entries.length - 2]!.patchId;
      } else {
        targetId = newest?.patchId ?? null;
      }
    } else {
      // raw patch id
      const hit = entries.find(
        (e) => e.patchId === urlCompare || e.version === urlCompare,
      );
      targetId = hit?.patchId ?? urlCompare;
    }

    if (targetId) {
      setComparePatchId(targetId);
      urlCompareApplied.current = true;
    }
  }, [urlCompare, urlFrom, history]);

  useEffect(() => {
    setRanks((r) => clampRanksToLevel(r, level, abilityMaxByKey));
  }, [level, abilityMaxByKey]);

  // Target preset stats track champion level
  useEffect(() => {
    if (!targetPreset) return;
    setTarget((t) => ({
      ...targetForPreset(targetPreset, level),
      currentHpRatio: t.currentHpRatio,
    }));
  }, [level, targetPreset]);

  // Grow/shrink inventory when ADC 7th toggles
  useEffect(() => {
    setSlots((s) => {
      if (adcSeventh && s.length < 7) return [...s, null];
      if (!adcSeventh && s.length > 6) return s.slice(0, 6);
      return s;
    });
  }, [adcSeventh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!champOpen) return;
    const t = window.setTimeout(() => champSearchRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [champOpen]);

  const build = useMemo(() => {
    if (!kit) return null;
    return computeBuildFixed({
      champ: kit,
      level,
      items: slots,
      runeIds,
      target,
      targetLowHp,
    });
  }, [kit, level, slots, runeIds, target, targetLowHp]);

  const champPatches = useMemo(
    () => patchesForChampion(history),
    [history],
  );

  const reverse = useMemo(() => {
    if (!kit || !comparePatchId || !history) return null;
    return kitAsOfPatch(kit, history, comparePatchId);
  }, [kit, comparePatchId, history]);

  const compareBuild = useMemo(() => {
    if (!reverse || !comparePatchId) return null;
    return computeBuildFixed({
      champ: reverse.kit,
      level,
      items: slots,
      runeIds,
      target,
      targetLowHp,
    });
  }, [reverse, comparePatchId, level, slots, runeIds, target, targetLowHp]);

  const abilityResults: AbilityResult[] = useMemo(() => {
    if (!kit || !build) return [];
    return evaluateAllAbilities(kit, ranks, build.stats, target, level).map(
      (r) => ({
        ...r,
        primaryPost: r.primaryPost * build.damageMult,
        primaryRaw: r.primaryRaw,
        lines: r.lines.map((l) => ({
          ...l,
          postMitigation: l.postMitigation * build.damageMult,
        })),
      }),
    );
  }, [kit, ranks, build, target, level]);

  const compareAbilityResults: AbilityResult[] = useMemo(() => {
    if (!reverse || !compareBuild) return [];
    return evaluateAllAbilities(
      reverse.kit,
      ranks,
      compareBuild.stats,
      target,
      level,
    ).map((r) => ({
      ...r,
      primaryPost: r.primaryPost * compareBuild.damageMult,
      primaryRaw: r.primaryRaw,
      lines: r.lines.map((l) => ({
        ...l,
        postMitigation: l.postMitigation * compareBuild.damageMult,
      })),
    }));
  }, [reverse, compareBuild, ranks, target, level]);

  const comparePatchMeta =
    champPatches.find((p) => p.id === comparePatchId) ?? null;
  const compareVersion = comparePatchMeta?.version ?? comparePatchId;
  const lastOnId = champPatches[0]?.id ?? null;
  const liveLabel = liveKitLabel(version);
  const otherLabel = otherKitLabel(comparePatchMeta, lastOnId);
  const comparing = Boolean(comparePatchId && compareBuild);

  const compareNoteLines = useMemo(() => {
    if (!comparePatchId || !history) return [];
    const lines = noteLinesAfterPatch(history, comparePatchId);
    // Resolve ability keys (Q/W/E/R) from names for chips under skill cards
    return lines.map((line) => {
      if (line.abilityKey !== "?") return line;
      const resolved = resolveAbilityLabel(line.abilityName, line.abilityName);
      const key = resolved.key;
      if (["P", "Q", "W", "E", "R"].includes(key)) {
        return { ...line, abilityKey: key };
      }
      return line;
    });
  }, [comparePatchId, history]);

  const damageByKey = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of abilityResults) {
      if (r.key !== "P") m[r.key] = r.primaryPost;
    }
    return m;
  }, [abilityResults]);

  const damageIfUp = useMemo(() => {
    const m: Record<string, number | null> = {};
    if (!kit || !build) return m;
    for (const k of SKILL_KEYS) {
      const ab = kit.abilities.find((a) => a.key === k);
      if (!ab) {
        m[k] = null;
        continue;
      }
      const max = maxRankForSkill(k, level, ab.maxRank);
      const cur = ranks[k] ?? 0;
      if (cur >= max) {
        m[k] = null;
        continue;
      }
      const up = evaluateAbility(ab, cur + 1, build.stats, target, level);
      m[k] = up.primaryPost * build.damageMult;
    }
    return m;
  }, [kit, build, ranks, target, level]);

  const filteredChamps = useMemo(() => {
    const q = champQuery.trim().toLowerCase();
    if (!q) return champions;
    return champions.filter((c) => c.name.toLowerCase().includes(q));
  }, [champions, champQuery]);

  const popularChamps = useMemo(
    () =>
      POPULAR.map((id) => champions.find((c) => c.id === id)).filter(
        Boolean,
      ) as ListEntry[],
    [champions],
  );

  const filteredItems = useMemo(
    () => filterItemsBrowse(items, itemFilter, itemQuery),
    [items, itemFilter, itemQuery],
  );

  const pickTargetPreset = (id: TargetPresetId) => {
    setTargetPreset(id);
    setTarget((t) => ({
      ...targetForPreset(id, level),
      currentHpRatio: t.currentHpRatio,
    }));
    setShowTargetSliders(false);
  };

  const onTargetSlider = (
    key: "armor" | "mr" | "hp",
    value: number,
  ) => {
    setTargetPreset(null);
    setTarget((t) => ({ ...t, [key]: value }));
    setShowTargetSliders(true);
  };

  const selectedChamp = champions.find((c) => c.id === champId);
  const comboPost = abilityResults
    .filter((a) => a.key !== "P" && (ranks[a.key] ?? 0) > 0)
    .reduce((s, a) => s + a.primaryPost, 0);
  const keystonePost = build?.keystone?.post
    ? build.keystone.post * (build.damageMult || 1)
    : 0;
  const procsPost = (build?.procs ?? []).reduce(
    (s, p) => s + p.post * (build?.damageMult || 1),
    0,
  );
  const totalBurst = comboPost + keystonePost + procsPost;

  const compareComboPost = compareAbilityResults
    .filter((a) => a.key !== "P" && (ranks[a.key] ?? 0) > 0)
    .reduce((s, a) => s + a.primaryPost, 0);
  const compareKeystonePost = compareBuild?.keystone?.post
    ? compareBuild.keystone.post * (compareBuild.damageMult || 1)
    : 0;
  const compareProcsPost = (compareBuild?.procs ?? []).reduce(
    (s, p) => s + p.post * (compareBuild?.damageMult || 1),
    0,
  );
  const compareTotalBurst =
    compareComboPost + compareKeystonePost + compareProcsPost;

  const pickKeystone = (rune: RuneOption) => {
    setRuneIds((ids) => {
      const on = ids.includes(rune.id);
      // strip other keystones + combat from other trees
      const kept = ids.filter((id) => {
        const r = getRune(id);
        if (!r) return false;
        if (r.slot === "keystone") return false;
        if (r.slot === "combat" && r.tree !== rune.tree) return false;
        return true;
      });
      if (on) return kept; // deselect keystone
      return [...kept, rune.id];
    });
  };

  const toggleCombatOrShard = (rune: RuneOption) => {
    setRuneIds((ids) => {
      const on = ids.includes(rune.id);
      if (on) return ids.filter((id) => id !== rune.id);
      return [...ids, rune.id];
    });
  };

  const usedPts = pointsUsed(ranks);
  const budgetPts = pointsAvailable(level);

  const pickChamp = (id: string) => {
    setChampId(id);
    setChampOpen(false);
    setChampQuery("");
  };

  const setRank = (key: SkillKey, n: number) => {
    setRanks((r) =>
      clampRanksToLevel({ ...r, [key]: n }, level, abilityMaxByKey),
    );
  };

  // Best next rank tip
  const nextTip = useMemo(() => {
    let best: { key: SkillKey; gain: number } | null = null;
    for (const k of SKILL_KEYS) {
      const cur = damageByKey[k] ?? 0;
      const up = damageIfUp[k];
      const max = maxRankForSkill(k, level, abilityMaxByKey[k]);
      if (up == null || (ranks[k] ?? 0) >= max || usedPts >= budgetPts) continue;
      const gain = up - cur;
      if (gain > 0 && (!best || gain > best.gain)) best = { key: k, gain };
    }
    return best;
  }, [damageByKey, damageIfUp, ranks, level, abilityMaxByKey, usedPts, budgetPts]);

  return (
    <div className="space-y-0">
      {/* ── Top identity bar ── */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-data text-xl font-semibold tracking-tight text-fg">
            dmg
          </h1>
          <span className="font-data text-[11px] text-muted">{version}</span>
        </div>
        <div className="font-data text-right">
          <span className="label-hint">
            full kit
            {comparing ? ` · ${liveLabel}` : ""}
          </span>
          <div className="text-2xl font-bold tabular-nums text-buff">
            {loading ? "…" : round(totalBurst, 0)}
          </div>
          {comparing && (
            <div className="mt-0.5 font-data text-[11px] tabular-nums text-muted">
              <span className="text-accent">{otherLabel}</span>
              {": "}
              <span className="font-semibold text-fg">
                {round(compareTotalBurst, 0)}
              </span>
              <span
                className={cn(
                  "ml-1 text-[10px]",
                  totalBurst - compareTotalBurst > 1
                    ? "text-buff"
                    : totalBurst - compareTotalBurst < -1
                      ? "text-nerf"
                      : "text-[var(--fg-faint)]",
                )}
              >
                {totalBurst - compareTotalBurst > 0 ? "+" : ""}
                {round(totalBurst - compareTotalBurst, 0)} Live
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Champion — primary control, full roster via search ── */}
      <div className="relative border-b border-border py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setChampOpen((o) => !o)}
            className={cn(
              "flex min-w-[12rem] items-center gap-2 border border-border bg-[var(--ink)] px-2 py-1.5 transition hover:border-accent",
              champOpen && "border-accent",
            )}
          >
            {selectedChamp && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedChamp.icon}
                alt=""
                width={36}
                height={36}
                className="ring-1 ring-border"
              />
            )}
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[14px] font-semibold text-fg">
                {kit?.name ?? selectedChamp?.name ?? "Champion"}
              </div>
              <div className="flex items-center gap-1 font-data text-[11px] text-accent">
                <Search className="h-3 w-3" />
                search all {champions.length} champs
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </button>

          <div className="flex flex-1 flex-col gap-1">
            <span className="label-hint">quick picks · open search for full list</span>
            <div className="flex flex-wrap items-center gap-1">
              {popularChamps.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickChamp(c.id)}
                  title={c.name}
                  className={cn(
                    "ring-1 transition",
                    c.id === champId
                      ? "ring-accent"
                      : "ring-border opacity-70 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.icon} alt={c.name} width={32} height={32} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setChampOpen(true)}
                className="flex h-8 items-center gap-1 border border-dashed border-border px-2 font-data text-[11px] text-muted hover:border-accent hover:text-fg"
              >
                <Search className="h-3 w-3" />
                all
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 font-data text-[12px] text-muted">
            lv
            <input
              type="range"
              min={1}
              max={18}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-24"
            />
            <span className="w-5 font-semibold text-fg">{level}</span>
          </label>
        </div>

        {champOpen && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 border border-[var(--line-strong)] bg-[var(--panel)] p-2 shadow-2xl shadow-black/50">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-data text-[11px] text-muted">
                all champions ({filteredChamps.length}
                {champQuery ? ` matching “${champQuery}”` : ""})
              </span>
              <button
                type="button"
                onClick={() => setChampOpen(false)}
                className="text-muted hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                ref={champSearchRef}
                value={champQuery}
                onChange={(e) => setChampQuery(e.target.value)}
                placeholder="Type any champion name…"
                className="w-full border border-border bg-[var(--ink)] py-2 pl-8 pr-3 font-data text-[13px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-accent"
              />
            </div>
            <div className="grid max-h-64 grid-cols-3 gap-0.5 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
              {filteredChamps.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickChamp(c.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-1 text-left text-[12px] hover:bg-[var(--ink)]",
                    c.id === champId && "bg-accent/10 text-fg",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.icon} alt="" width={24} height={24} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="border-b border-nerf/40 py-2 font-data text-[12px] text-nerf">
          {error}
        </p>
      )}

      {/* ── Main workspace: controls | damage ── */}
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* LEFT: build inputs */}
        <div className="space-y-0 border-border lg:border-r lg:pr-4">
          {/* Items */}
          <section className="border-b border-border py-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="label-micro">items</span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 font-data text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={adcSeventh}
                    onChange={(e) => setAdcSeventh(e.target.checked)}
                  />
                  <span className={cn(adcSeventh && "text-accent")}>
                    ADC 7th slot
                  </span>
                </label>
                <span className="label-hint">tap slot · browse</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: slotCount }, (_, i) => {
                const item = slots[i] ?? null;
                const isExtra = i === 6;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setActiveSlot(activeSlot === i ? null : i)
                    }
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center border bg-[var(--ink)] transition",
                      activeSlot === i
                        ? "border-accent"
                        : isExtra
                          ? "border-accent/40 hover:border-accent"
                          : "border-border hover:border-[var(--line-strong)]",
                    )}
                    title={
                      item?.name ??
                      (isExtra ? "ADC 7th item" : `slot ${i + 1}`)
                    }
                  >
                    {item ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.icon}
                          alt={item.name}
                          width={44}
                          height={44}
                        />
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlots((s) => {
                              const n = [...s];
                              n[i] = null;
                              return n;
                            });
                          }}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-nerf text-[9px] text-white"
                        >
                          ×
                        </span>
                      </>
                    ) : (
                      <span className="font-data text-[10px] text-[var(--fg-faint)]">
                        {isExtra ? "7" : "+"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {activeSlot !== null && (
              <div className="mt-2 border border-border bg-[var(--ink)] p-2">
                <input
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  placeholder="search name or tag…"
                  autoFocus
                  className="mb-2 w-full border-0 border-b border-border bg-transparent py-1.5 font-data text-[12px] text-fg outline-none focus:border-accent"
                />
                <div className="mb-2 flex flex-wrap gap-0.5">
                  {ITEM_BROWSE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      title={f.hint}
                      onClick={() => setItemFilter(f.id)}
                      className={cn(
                        "border px-1.5 py-0.5 font-data text-[10px] transition",
                        itemFilter === f.id
                          ? "border-accent/50 bg-accent/10 text-fg"
                          : "border-border text-muted hover:text-fg",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="mb-1 font-data text-[10px] text-[var(--fg-faint)]">
                  {filteredItems.length} items
                  {itemFilter === "boots-t3" && " · mid quest upgrades"}
                  {itemFilter === "component" && " · parts & epics"}
                </p>
                <div className="grid max-h-52 grid-cols-1 gap-0.5 overflow-y-auto sm:grid-cols-2">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.description || item.name}
                      onClick={() => {
                        setSlots((s) => {
                          const n = [...s];
                          while (n.length < slotCount) n.push(null);
                          n[activeSlot] = item;
                          return n;
                        });
                        setActiveSlot(null);
                        setItemQuery("");
                      }}
                      className="flex items-center gap-1.5 px-1 py-1 text-left text-[11px] hover:bg-[var(--panel)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.icon} alt="" width={22} height={22} />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 font-data text-[9px] text-[var(--fg-faint)]">
                        {item.category === "boots-t3"
                          ? "T3"
                          : item.category === "boots"
                            ? "boot"
                            : item.category === "component"
                              ? "part"
                              : item.gold}
                      </span>
                    </button>
                  ))}
                  {filteredItems.length === 0 && (
                    <p className="col-span-full py-4 text-center font-data text-[11px] text-muted">
                      no items match
                    </p>
                  )}
                </div>
              </div>
            )}
            {build && <StatsAnalysis stats={build.stats} level={level} />}
          </section>

          {/* Skill ranks — compact, interactive */}
          <section className="border-b border-border py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="label-micro">ranks</span>
              <span
                className={cn(
                  "font-data text-[11px] tabular-nums",
                  usedPts > budgetPts ? "text-nerf" : "text-muted",
                )}
              >
                {usedPts}/{budgetPts} pts
              </span>
            </div>
            <div className="space-y-2">
              {SKILL_KEYS.map((k) => {
                const max = maxRankForSkill(k, level, abilityMaxByKey[k]);
                const rank = ranks[k] ?? 0;
                const dmg = damageByKey[k] ?? 0;
                const up = damageIfUp[k];
                const gain =
                  up != null && rank < max && usedPts < budgetPts
                    ? up - dmg
                    : null;
                const name =
                  kit?.abilities.find((a) => a.key === k)?.name ?? k;
                return (
                  <div
                    key={k}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1"
                  >
                    <AbilityMark letter={k} name={name} className="min-w-[7rem]" />
                    <div className="flex gap-0.5">
                      {max === 0 ? (
                        <span className="font-data text-[10px] text-[var(--fg-faint)]">
                          locked
                        </span>
                      ) : (
                        Array.from(
                          { length: max - minRankForSkill(k, level) + 1 },
                          (_, i) => minRankForSkill(k, level) + i,
                        ).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRank(k, n)}
                            className={cn(
                              "min-w-[1.6rem] border px-1 py-0.5 font-data text-[11px] font-semibold",
                              rank === n
                                ? "border-accent bg-accent/15 text-fg"
                                : "border-border text-muted hover:text-fg",
                            )}
                          >
                            {n}
                          </button>
                        ))
                      )}
                    </div>
                    <span className="ml-auto font-data text-[12px] tabular-nums text-buff">
                      {round(dmg, 0)}
                      {gain != null && (
                        <span className="ml-1 text-[10px] text-muted">
                          (+{round(gain, 0)})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {nextTip && (
              <p className="mt-2 font-data text-[11px] text-muted">
                next point →{" "}
                <span className="text-fg">
                  {nextTip.key} +{round(nextTip.gain, 0)}
                </span>
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                  setRanks(maxRanksAtLevel(level, abilityMaxByKey))
                }
                className="border border-border px-1.5 py-0.5 font-data text-[10px] text-muted hover:text-fg"
              >
                max all
              </button>
              {(
                [
                  ["max Q", ["Q", "R", "E", "W"] as SkillKey[]],
                  ["max W", ["W", "R", "Q", "E"] as SkillKey[]],
                  ["max E", ["E", "R", "Q", "W"] as SkillKey[]],
                ] as const
              ).map(([label, pri]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setRanks(ranksForPriority(level, [...pri], abilityMaxByKey))
                  }
                  className="border border-border px-1.5 py-0.5 font-data text-[10px] text-muted hover:text-fg"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setRanks(startingRanksAtLevel(level, abilityMaxByKey))
                }
                className="border border-border px-1.5 py-0.5 font-data text-[10px] text-muted hover:text-fg"
              >
                reset 1s
              </button>
            </div>
          </section>

          {/* Runes — always open, keystone → tree combat → shards */}
          <section className="border-b border-border py-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="label-micro">runes</span>
              <span className="label-hint">
                keystone → tree combat · toggle for live dmg
              </span>
            </div>

            {/* Keystones grouped by tree */}
            <div className="space-y-2">
              {(
                [
                  "Precision",
                  "Domination",
                  "Sorcery",
                  "Inspiration",
                  "Resolve",
                ] as RuneTree[]
              ).map((tree) => {
                const keys = KEYSTONES.filter((k) => k.tree === tree);
                if (!keys.length) return null;
                const treeActive = primaryTree === tree;
                return (
                  <div key={tree}>
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "font-data text-[10px] font-semibold uppercase tracking-wider",
                          treeTone(tree),
                        )}
                      >
                        {tree}
                      </span>
                      {treeActive && (
                        <span className="font-data text-[10px] text-[var(--fg-faint)]">
                          primary
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {keys.map((r) => {
                        const on = runeIds.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            title={r.description}
                            onClick={() => pickKeystone(r)}
                            className={cn(
                              "border px-2 py-1 text-left transition",
                              on
                                ? cn(
                                    "bg-accent/10 text-fg",
                                    treeBorder(tree),
                                  )
                                : "border-border text-muted hover:border-[var(--line-strong)] hover:text-fg",
                            )}
                          >
                            <span className="block font-data text-[11px] font-semibold leading-tight">
                              {r.name}
                            </span>
                            <span className="block font-data text-[9px] text-[var(--fg-faint)]">
                              {r.effect}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Combat runes for selected tree */}
            {primaryTree && treeCombat.length > 0 && (
              <div className="mt-3 border border-border bg-[var(--ink)]/50 p-2">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="font-data text-[10px] uppercase tracking-wider text-muted">
                    <span className={treeTone(primaryTree)}>{primaryTree}</span>
                    {" · "}combat (dmg · haste · speed · pen)
                  </span>
                  <span className="font-data text-[10px] text-[var(--fg-faint)]">
                    {treeCombat.filter((r) => runeIds.includes(r.id)).length}/
                    {treeCombat.length} on
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {treeCombat.map((r) => {
                    const on = runeIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        title={r.description}
                        onClick={() => toggleCombatOrShard(r)}
                        className={cn(
                          "border px-2 py-1 text-left transition",
                          on
                            ? "border-accent/50 bg-accent/10 text-fg"
                            : "border-border text-muted hover:text-fg",
                        )}
                      >
                        <span className="block font-data text-[11px] font-medium leading-tight">
                          {r.name}
                        </span>
                        <span
                          className={cn(
                            "block font-data text-[9px]",
                            on ? "text-accent" : "text-[var(--fg-faint)]",
                          )}
                        >
                          {r.effect}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!primaryTree && (
              <p className="mt-2 font-data text-[11px] text-[var(--fg-faint)]">
                pick a keystone to unlock that tree&apos;s combat runes
              </p>
            )}

            {/* Shards */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="font-data text-[10px] uppercase tracking-wider text-muted">
                  shards
                </span>
                <span className="label-hint">adaptive · AS · AH · MS · def</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {SHARDS.map((r) => {
                  const on = runeIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      title={r.description}
                      onClick={() => toggleCombatOrShard(r)}
                      className={cn(
                        "border px-2 py-1 text-left transition",
                        on
                          ? "border-accent/50 bg-accent/10 text-fg"
                          : "border-border text-muted hover:text-fg",
                      )}
                    >
                      <span className="block font-data text-[11px] font-medium leading-tight">
                        {r.name}
                      </span>
                      <span
                        className={cn(
                          "block font-data text-[9px]",
                          on ? "text-accent" : "text-[var(--fg-faint)]",
                        )}
                      >
                        {r.effect}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {build && build.notes.filter((n) => !n.includes("Deathcap")).length > 0 && (
              <p className="mt-2 font-data text-[10px] leading-relaxed text-[var(--fg-faint)]">
                {build.notes
                  .filter((n) =>
                    /AH|AS|MS|leth|mpen|% dmg|adaptive|Comet|Electrocute|Scorch|Strike|Focus|Storm|Hunter|Impact|Grace|Cut|Stand|Tempo|Blades|Phase/i.test(
                      n,
                    ),
                  )
                  .slice(0, 6)
                  .join(" · ")}
              </p>
            )}
          </section>

          {/* Target */}
          <section className="border-b border-border py-3 lg:border-b-0">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="label-micro">target</span>
              <span className="label-hint">
                scales with champ lv {level}
                {targetPreset ? ` · ${targetPreset}` : " · custom"}
              </span>
            </div>

            <p className="mb-1.5 font-data text-[10px] text-[var(--fg-faint)]">
              pick a body type — stats update with your level
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TARGET_PRESETS.map((p) => {
                const active = targetPreset === p.id;
                const preview = targetForPreset(p.id, level);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickTargetPreset(p.id)}
                    className={cn(
                      "border px-2 py-2 text-left transition",
                      active
                        ? "border-accent bg-accent/10 text-fg"
                        : "border-border bg-[var(--ink)]/40 text-muted hover:border-[var(--line-strong)] hover:text-fg",
                    )}
                  >
                    <span className="block font-data text-[12px] font-semibold capitalize leading-tight">
                      {p.label}
                    </span>
                    <span className="mt-0.5 block font-data text-[9px] leading-snug text-[var(--fg-faint)]">
                      {p.hint}
                    </span>
                    <span className="mt-1 block font-data text-[10px] tabular-nums text-fg/80">
                      {preview.armor}/{preview.mr} · {preview.hp} hp
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-data text-[12px]">
                <span className="text-muted">
                  armor{" "}
                  <span className="font-semibold tabular-nums text-fg">
                    {target.armor}
                  </span>
                </span>
                <span className="text-muted">
                  mr{" "}
                  <span className="font-semibold tabular-nums text-fg">
                    {target.mr}
                  </span>
                </span>
                <span className="text-muted">
                  hp{" "}
                  <span className="font-semibold tabular-nums text-fg">
                    {target.hp}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 font-data text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={targetLowHp}
                    onChange={(e) => setTargetLowHp(e.target.checked)}
                  />
                  &lt;40% hp
                </label>
                <button
                  type="button"
                  onClick={() => setShowTargetSliders((v) => !v)}
                  className="border border-border px-1.5 py-0.5 font-data text-[10px] text-muted hover:text-fg"
                >
                  {showTargetSliders ? "hide sliders" : "fine-tune"}
                </button>
              </div>
            </div>

            {showTargetSliders && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(
                  [
                    ["armor", target.armor, 0, 400, 1],
                    ["mr", target.mr, 0, 400, 1],
                    ["hp", target.hp, 400, 7000, 25],
                  ] as const
                ).map(([label, val, min, max, step]) => (
                  <label
                    key={label}
                    className="font-data text-[11px] text-muted"
                  >
                    {label}{" "}
                    <span className="font-semibold tabular-nums text-fg">
                      {val}
                    </span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={val}
                      onChange={(e) =>
                        onTargetSlider(label, Number(e.target.value))
                      }
                      className="mt-0.5 w-full"
                    />
                  </label>
                ))}
              </div>
            )}

            {build && (
              <p className="mt-2 font-data text-[10px] text-[var(--fg-faint)]">
                after pen · armor{" "}
                {round(
                  effectiveArmor(target.armor, build.stats, level),
                  0,
                )}{" "}
                (×
                {resistMultiplier(
                  effectiveArmor(target.armor, build.stats, level),
                ).toFixed(2)}
                ) · mr {round(effectiveMr(target.mr, build.stats), 0)} (×
                {resistMultiplier(
                  effectiveMr(target.mr, build.stats),
                ).toFixed(2)}
                )
                {!targetPreset ? " · custom" : ""}
              </p>
            )}
          </section>
        </div>

        {/* RIGHT: damage output — the payoff, always visible */}
        <div className="min-w-0 py-3 lg:pl-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="label-micro">ability damage</span>
            {loading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
            )}
          </div>

          {!kit && !loading && (
            <p className="py-12 text-center font-data text-[13px] text-muted">
              pick a champion to start
            </p>
          )}

          {kit && !loading && (
            <div>
              {/* Quiet line when off; full compare chrome when a patch is selected */}
              <PatchCompareControls
                patches={champPatches}
                value={comparePatchId}
                onChange={setComparePatchId}
                liveVersion={version}
                champName={kit.name}
                loading={historyLoading}
                applied={reverse?.applied}
                skipped={reverse?.skipped}
              />

              {/* Big skill damage strip — dual when compare on */}
              <div
                className={cn(
                  "mb-3 grid gap-px bg-border",
                  comparing
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-4",
                )}
              >
                {SKILL_KEYS.map((k) => {
                  const r = abilityResults.find((a) => a.key === k);
                  const cr = compareAbilityResults.find((a) => a.key === k);
                  const rank = ranks[k] ?? 0;
                  const max = maxRankForSkill(k, level, abilityMaxByKey[k]);
                  const min = minRankForSkill(k, level);
                  const name =
                    kit.abilities.find((a) => a.key === k)?.name ?? k;
                  const live = r?.primaryPost ?? 0;
                  const past = cr?.primaryPost ?? 0;
                  const delta = live - past;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (max === 0) return;
                        const next = rank >= max ? min : rank + 1;
                        setRank(k, next);
                      }}
                      className="bg-bg px-2 py-2.5 text-left transition hover:bg-[var(--ink)]"
                      title={
                        max === 0
                          ? `${k} locked`
                          : `click to cycle ${k} rank (${min}–${max})`
                      }
                    >
                      <AbilityMark letter={k} name={name} compact />
                      <div className="mt-1 font-data text-[10px] text-muted">
                        {max === 0 ? "locked" : `r${rank}`}
                        {r?.primaryKind && r.primaryKind !== "unknown" && (
                          <span className="ml-1 text-[var(--fg-faint)]">
                            {damageKindLabel(r.primaryKind)}
                          </span>
                        )}
                      </div>
                      {comparing ? (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate font-data text-[9px] text-buff">
                              {liveLabel}
                            </span>
                            <span className="shrink-0 font-data text-lg font-bold tabular-nums text-buff">
                              {max === 0 || rank === 0 ? "—" : round(live, 0)}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate font-data text-[9px] text-accent">
                              {otherLabel}
                            </span>
                            <span className="shrink-0 font-data text-sm font-semibold tabular-nums text-fg">
                              {max === 0 || rank === 0 ? "—" : round(past, 0)}
                            </span>
                          </div>
                          {max > 0 && rank > 0 && Math.abs(delta) >= 0.5 && (
                            <div
                              className={cn(
                                "font-data text-[10px] tabular-nums",
                                delta > 0 ? "text-buff" : "text-nerf",
                              )}
                            >
                              {delta > 0 ? "+" : ""}
                              {round(delta, 0)} on Live
                            </div>
                          )}
                          {max > 0 && rank > 0 && Math.abs(delta) < 0.5 && (
                            <div className="font-data text-[10px] text-[var(--fg-faint)]">
                              no difference
                            </div>
                          )}
                          <AbilityCompareNotes
                            abilityKey={k}
                            lines={compareNoteLines}
                          />
                        </div>
                      ) : (
                        <div className="font-data text-xl font-bold tabular-nums text-buff">
                          {max === 0 || rank === 0
                            ? "—"
                            : round(r?.primaryPost ?? 0, 0)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {comparing && build && compareBuild && (
                <>
                  <div className="mb-3 border border-border">
                    <div className="border-b border-border px-2.5 py-1.5">
                      <div className="font-data text-[12px] font-semibold text-fg">
                        <span className="text-buff">{liveLabel}</span>
                        <span className="mx-1 text-[var(--fg-faint)]">vs</span>
                        <span className="text-accent">{otherLabel}</span>
                      </div>
                      <p className="mt-0.5 font-data text-[10px] text-[var(--fg-faint)]">
                        Build stats · same items & runes · only champ kit / base
                        growth differs
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                      {(
                        [
                          ["AP", build.stats.ap, compareBuild.stats.ap],
                          ["AD", build.stats.ad, compareBuild.stats.ad],
                          [
                            "AH",
                            build.stats.abilityHaste,
                            compareBuild.stats.abilityHaste,
                          ],
                          [
                            "AS",
                            build.stats.attackSpeed,
                            compareBuild.stats.attackSpeed,
                          ],
                        ] as const
                      ).map(([label, liveStat, pastStat]) => {
                        const d = liveStat - pastStat;
                        return (
                          <div key={label} className="bg-bg px-2 py-1.5">
                            <div className="font-data text-[9px] uppercase text-[var(--fg-faint)]">
                              {label}
                            </div>
                            <div className="font-data text-[11px] tabular-nums leading-snug">
                              <div>
                                <span className="text-[9px] text-buff">
                                  Live{" "}
                                </span>
                                <span className="font-semibold text-buff">
                                  {label === "AS"
                                    ? liveStat.toFixed(2)
                                    : round(liveStat, 0)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-accent">
                                  {compareVersion}{" "}
                                </span>
                                <span className="font-semibold text-fg">
                                  {label === "AS"
                                    ? pastStat.toFixed(2)
                                    : round(pastStat, 0)}
                                </span>
                              </div>
                            </div>
                            {Math.abs(d) > 0.05 && (
                              <div
                                className={cn(
                                  "mt-0.5 font-data text-[10px] tabular-nums",
                                  d > 0 ? "text-buff" : "text-nerf",
                                )}
                              >
                                {d > 0 ? "+" : ""}
                                {label === "AS"
                                  ? d.toFixed(2)
                                  : round(d, 0)}{" "}
                                on Live
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <ComparePatchNotes
                    lines={compareNoteLines}
                    liveLabel={liveLabel}
                    otherLabel={otherLabel}
                    baselineVersion={String(compareVersion)}
                  />
                </>
              )}

              {(build?.keystone || (build?.procs?.length ?? 0) > 0) && (
                <div className="mb-3 space-y-1 border-b border-border pb-2 font-data text-[12px]">
                  {build?.keystone && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted">{build.keystone.name}</span>
                      <span className="font-semibold tabular-nums text-rework">
                        {round(build.keystone.post * build.damageMult, 0)}
                      </span>
                    </div>
                  )}
                  {build?.procs?.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-baseline justify-between"
                    >
                      <span className="text-muted">{p.name}</span>
                      <span className="font-semibold tabular-nums text-adjust">
                        {round(p.post * build.damageMult, 0)}
                      </span>
                    </div>
                  ))}
                  {build && build.damageMult !== 1 && (
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[var(--fg-faint)]">dmg mult</span>
                      <span className="tabular-nums text-accent">
                        ×{build.damageMult.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Detail lines */}
              <div className="space-y-0">
                {abilityResults.map((ab) => (
                  <AbilityDetail
                    key={ab.key}
                    result={ab}
                    level={level}
                    maxRank={
                      ab.key === "P"
                        ? 1
                        : maxRankForSkill(
                            ab.key as SkillKey,
                            level,
                            abilityMaxByKey[ab.key as SkillKey],
                          )
                    }
                    onRankChange={
                      ab.key === "P"
                        ? undefined
                        : (n) => setRank(ab.key as SkillKey, n)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Live build stats — pen, haste, AS, MS front and center */
function StatsAnalysis({
  stats,
  level,
}: {
  stats: StatBlock;
  level: number;
}) {
  const rows: { label: string; value: string; hint?: string }[] = [
    { label: "AP", value: `${round(stats.ap, 0)}` },
    { label: "AD", value: `${round(stats.ad, 0)}` },
    {
      label: "AH",
      value: `${round(stats.abilityHaste, 0)}`,
      hint: stats.abilityHaste
        ? `~${Math.round((stats.abilityHaste / (100 + stats.abilityHaste)) * 100)}% CDR`
        : "0% CDR",
    },
    {
      label: "AS",
      value: stats.attackSpeed.toFixed(2),
      hint: "attacks / sec (approx)",
    },
    {
      label: "MS",
      value: `${round(stats.moveSpeed, 0)}`,
      hint: "move speed",
    },
    {
      label: "pen",
      value: formatPenSummary(stats, level),
      hint: "vs target resists",
    },
  ];

  return (
    <div className="mt-2.5 border border-border bg-[var(--ink)]/40">
      <div className="border-b border-border/60 px-2 py-1">
        <span className="font-data text-[10px] uppercase tracking-wider text-muted">
          build stats
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="bg-bg px-2 py-1.5">
            <div className="font-data text-[9px] uppercase tracking-wider text-[var(--fg-faint)]">
              {r.label}
            </div>
            <div className="font-data text-[12px] font-semibold tabular-nums text-fg">
              {r.value}
            </div>
            {r.hint && (
              <div className="font-data text-[9px] text-[var(--fg-faint)]">
                {r.hint}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AbilityDetail({
  result,
  onRankChange,
  maxRank,
  level,
}: {
  result: AbilityResult;
  onRankChange?: (n: number) => void;
  maxRank: number;
  level: number;
}) {
  const [open, setOpen] = useState(result.key !== "P");
  const kindColor: Record<string, string> = {
    magic: "text-accent",
    physical: "text-nerf",
    true: "text-adjust",
    mixed: "text-rework",
    magic_true: "text-buff",
    phys_true: "text-buff",
    unknown: "text-muted",
  };

  const min =
    result.key === "P" ? 1 : minRankForSkill(result.key as SkillKey, level);

  if (result.key !== "P" && maxRank === 0) {
    return (
      <div className="flex items-center gap-2 border-b border-border/60 py-2 opacity-50">
        <AbilityMark letter={result.key as AbilitySlot} name={result.name} />
        <span className="font-data text-[11px] text-muted">
          locked at this level
        </span>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {result.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.icon} alt="" width={28} height={28} />
        )}
        <AbilityMark letter={result.key as AbilitySlot} name={result.name} />
        {result.key !== "P" && onRankChange && maxRank >= min && (
          <div className="flex gap-0.5">
            {Array.from({ length: maxRank - min + 1 }, (_, i) => min + i).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onRankChange(n)}
                  className={cn(
                    "min-w-[1.35rem] border px-0.5 py-0.5 font-data text-[10px] font-semibold",
                    result.rank === n
                      ? "border-accent bg-accent/15 text-fg"
                      : "border-border text-muted hover:text-fg",
                  )}
                >
                  {n}
                </button>
              ),
            )}
          </div>
        )}
        {result.key === "P" && (
          <span className="font-data text-[11px] text-muted">passive</span>
        )}
        {result.primaryKind && result.primaryKind !== "unknown" && (
          <span className="font-data text-[10px] text-[var(--fg-faint)]">
            {damageKindLabel(result.primaryKind)}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto font-data text-[11px] text-muted hover:text-fg"
        >
          {open ? "hide" : "breakdown"}
        </button>
        {result.primaryPost > 0 && (
          <span className="font-data text-[15px] font-bold tabular-nums text-buff">
            {round(result.primaryPost, 0)}
          </span>
        )}
      </div>

      {open && result.lines.length > 0 && (
        <ul className="mt-1.5 space-y-1 pl-1">
          {result.lines.map((line, i) => (
            <li
              key={i}
              className="flex justify-between gap-2 font-data text-[11px]"
            >
              <span className="min-w-0 text-muted">
                <AbilityMark
                  letter={result.key as AbilitySlot}
                  compact
                  className="mr-1"
                />
                {line.attribute}
                <span className="ml-1 text-[var(--fg-faint)]">
                  {line.parts.join(" + ")}
                </span>
                <span
                  className={cn("ml-1", kindColor[line.kind] ?? "text-muted")}
                >
                  · {damageKindLabel(line.kind)}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 tabular-nums font-semibold",
                  kindColor[line.kind] ?? "text-muted",
                )}
              >
                {round(line.postMitigation, 0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
