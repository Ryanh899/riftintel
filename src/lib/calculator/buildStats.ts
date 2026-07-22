import type { ItemData, StatBlock, TargetConfig } from "./types";
import type { ChampionData } from "./types";
import { champStatsAtLevel } from "./formulas";
import { applyItems } from "./items";
import { applyRunes, keystoneBurst } from "./runes";
import { applyMitigation } from "./pen";

export interface BuildInput {
  champ: ChampionData;
  level: number;
  items: (ItemData | null)[];
  runeIds: string[];
  target: TargetConfig;
  /** Coup de Grace / low-HP rune gates */
  targetLowHp?: boolean;
}

export interface BuildOutput {
  stats: StatBlock;
  notes: string[];
  damageMult: number;
  keystone: {
    name: string;
    raw: number;
    post: number;
    kind: string;
  } | null;
  /** Extra combat rune procs (Scorch, Cheap Shot, …) */
  procs: {
    name: string;
    raw: number;
    post: number;
    kind: string;
  }[];
}

/** Champ base at level + items + runes */
export function computeBuildFixed(input: BuildInput): BuildOutput {
  const useAp = (input.champ.adaptiveType || "")
    .toUpperCase()
    .includes("MAGIC");

  const { base } = champStatsAtLevel(input.champ, input.level);
  const { stats: itemStats, notes: itemNotes } = applyItems(input.items);
  const {
    stats: runeStats,
    notes: runeNotes,
    keystoneId,
    damageMult: runeMult,
    combatBursts,
  } = applyRunes(input.runeIds, useAp, { targetLowHp: input.targetLowHp });

  const stats: StatBlock = {
    ad: base.ad + itemStats.ad + runeStats.ad,
    bonusAd: itemStats.ad + runeStats.ad,
    ap: base.ap + itemStats.ap + runeStats.ap,
    hp: base.hp + itemStats.hp + runeStats.hp,
    bonusHp: itemStats.hp + runeStats.hp,
    mana: base.mana + itemStats.mana + runeStats.mana,
    armor: base.armor + itemStats.armor + runeStats.armor,
    mr: base.mr + itemStats.mr + runeStats.mr,
    attackSpeed: base.attackSpeed + itemStats.attackSpeed + runeStats.attackSpeed,
    crit: itemStats.crit + runeStats.crit,
    abilityHaste: itemStats.abilityHaste + runeStats.abilityHaste,
    moveSpeed: base.moveSpeed + itemStats.moveSpeed + runeStats.moveSpeed,
    lethality: itemStats.lethality + runeStats.lethality,
    armorPenPct: Math.min(
      1,
      itemStats.armorPenPct + runeStats.armorPenPct,
    ),
    magicPenFlat: itemStats.magicPenFlat + runeStats.magicPenFlat,
    magicPenPct: Math.min(
      1,
      itemStats.magicPenPct + runeStats.magicPenPct,
    ),
    adaptive: 0,
    lifeSteal: itemStats.lifeSteal + runeStats.lifeSteal,
    omnivamp: itemStats.omnivamp + runeStats.omnivamp,
    healShield: itemStats.healShield + runeStats.healShield,
  };

  const damageMult = runeMult;

  const burst = keystoneBurst(keystoneId, stats, useAp);
  let keystone: BuildOutput["keystone"] = null;
  if (burst) {
    const kind = (
      burst.kind === "adaptive" ? (useAp ? "magic" : "physical") : burst.kind
    ) as "magic" | "physical" | "true";
    const { post } = applyMitigation(
      burst.raw,
      kind === "true" ? "true" : kind,
      stats,
      input.target,
      input.level,
    );
    keystone = { name: burst.name, raw: burst.raw, post, kind };
  }

  const procs: BuildOutput["procs"] = [];
  for (const p of combatBursts) {
    const kind = (
      p.kind === "adaptive" ? (useAp ? "magic" : "physical") : p.kind
    ) as "magic" | "physical" | "true";
    const { post } = applyMitigation(
      p.raw,
      kind,
      stats,
      input.target,
      input.level,
    );
    procs.push({ name: p.name, raw: p.raw, post, kind });
  }

  return {
    stats,
    notes: [...itemNotes, ...runeNotes],
    damageMult,
    keystone,
    procs,
  };
}
