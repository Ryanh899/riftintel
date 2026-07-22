import type { TargetConfig } from "./types";

export type TargetPresetId = "squishy" | "bruiser" | "tank";

/**
 * Archetype growth curves — approximate SR champion + light build
 * resists/HP at the examined champion's level (not a fixed mid-game snapshot).
 */
const ARCHETYPES: Record<
  TargetPresetId,
  {
    label: string;
    hint: string;
    armor: { base: number; perLevel: number };
    mr: { base: number; perLevel: number };
    hp: { base: number; perLevel: number };
  }
> = {
  squishy: {
    label: "squishy",
    hint: "mage / adc · light resists",
    armor: { base: 32, perLevel: 3.2 },
    mr: { base: 30, perLevel: 1.3 },
    hp: { base: 580, perLevel: 95 },
  },
  bruiser: {
    label: "bruiser",
    hint: "fighter · mid resists + HP",
    armor: { base: 38, perLevel: 4.8 },
    mr: { base: 32, perLevel: 2.1 },
    hp: { base: 650, perLevel: 120 },
  },
  tank: {
    label: "tank",
    hint: "frontline · high resists",
    armor: { base: 42, perLevel: 7.5 },
    mr: { base: 32, perLevel: 3.2 },
    hp: { base: 700, perLevel: 155 },
  },
};

export const TARGET_PRESETS = (
  Object.keys(ARCHETYPES) as TargetPresetId[]
).map((id) => ({
  id,
  label: ARCHETYPES[id].label,
  hint: ARCHETYPES[id].hint,
}));

function grow(
  base: number,
  perLevel: number,
  level: number,
  roundTo = 1,
): number {
  const lv = Math.min(18, Math.max(1, level));
  const v = base + perLevel * (lv - 1);
  return Math.round(v / roundTo) * roundTo;
}

/** Target armor / MR / HP for a preset at the given champion level. */
export function targetForPreset(
  id: TargetPresetId,
  level: number,
): TargetConfig {
  const a = ARCHETYPES[id];
  return {
    armor: grow(a.armor.base, a.armor.perLevel, level),
    mr: grow(a.mr.base, a.mr.perLevel, level),
    hp: grow(a.hp.base, a.hp.perLevel, level, 25),
    currentHpRatio: 1,
  };
}

export function nearestPreset(
  target: TargetConfig,
  level: number,
): TargetPresetId | null {
  let best: TargetPresetId | null = null;
  let bestScore = Infinity;
  for (const id of Object.keys(ARCHETYPES) as TargetPresetId[]) {
    const p = targetForPreset(id, level);
    const score =
      Math.abs(p.armor - target.armor) +
      Math.abs(p.mr - target.mr) +
      Math.abs(p.hp - target.hp) / 20;
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  // Only treat as match if close
  return bestScore < 25 ? best : null;
}
