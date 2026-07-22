import type { DamageKind, StatBlock, TargetConfig } from "./types";

/**
 * Effective resistances after penetration.
 *
 * Armor (standard calculator order):
 *   1. % armor penetration (total armor)
 *   2. Lethality as flat armor pen (scales with level)
 *
 * Magic:
 *   1. Flat magic pen
 *   2. % magic pen
 */
export function effectiveArmor(
  targetArmor: number,
  stats: StatBlock,
  attackerLevel = 18,
): number {
  // Lethality → armor pen: lethality * (0.6 + 0.4 * level/18)
  const lethalityAsPen =
    stats.lethality * (0.6 + (0.4 * attackerLevel) / 18);
  let armor = targetArmor * (1 - clamp01(stats.armorPenPct));
  armor -= lethalityAsPen;
  return Math.max(0, armor);
}

export function effectiveMr(targetMr: number, stats: StatBlock): number {
  let mr = targetMr - stats.magicPenFlat;
  mr *= 1 - clamp01(stats.magicPenPct);
  return Math.max(0, mr);
}

/** Damage multiplier vs a resistance value */
export function resistMultiplier(resist: number): number {
  if (resist >= 0) return 100 / (100 + resist);
  return 2 - 100 / (100 - resist);
}

export function applyMitigation(
  raw: number,
  kind: DamageKind,
  stats: StatBlock,
  target: TargetConfig,
  attackerLevel = 18,
): { post: number; resist: number; multiplier: number } {
  if (raw <= 0) return { post: 0, resist: 0, multiplier: 1 };

  if (kind === "true") {
    return { post: raw, resist: 0, multiplier: 1 };
  }

  if (kind === "physical") {
    const armor = effectiveArmor(target.armor, stats, attackerLevel);
    const mult = resistMultiplier(armor);
    return { post: raw * mult, resist: armor, multiplier: mult };
  }

  if (kind === "magic") {
    const mr = effectiveMr(target.mr, stats);
    const mult = resistMultiplier(mr);
    return { post: raw * mult, resist: mr, multiplier: mult };
  }

  // Generic dual-type: half/half of each component, recombined
  if (kind === "mixed") {
    return splitMitigate(raw, "physical", "magic", stats, target, attackerLevel);
  }
  if (kind === "magic_true") {
    return splitMitigate(raw, "magic", "true", stats, target, attackerLevel);
  }
  if (kind === "phys_true") {
    return splitMitigate(raw, "physical", "true", stats, target, attackerLevel);
  }

  // unknown — show raw (no silent wrong mit)
  return { post: raw, resist: 0, multiplier: 1 };
}

function splitMitigate(
  raw: number,
  a: DamageKind,
  b: DamageKind,
  stats: StatBlock,
  target: TargetConfig,
  attackerLevel: number,
): { post: number; resist: number; multiplier: number } {
  const half = raw / 2;
  const left = applyMitigation(half, a, stats, target, attackerLevel);
  const right = applyMitigation(half, b, stats, target, attackerLevel);
  const post = left.post + right.post;
  return {
    post,
    resist: (left.resist + right.resist) / 2,
    multiplier: raw > 0 ? post / raw : 1,
  };
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function formatPenSummary(stats: StatBlock, level: number): string {
  const parts: string[] = [];
  if (stats.magicPenFlat)
    parts.push(`${Math.round(stats.magicPenFlat)} flat MPen`);
  if (stats.magicPenPct)
    parts.push(`${Math.round(stats.magicPenPct * 100)}% MPen`);
  if (stats.lethality) {
    const eff = stats.lethality * (0.6 + (0.4 * level) / 18);
    parts.push(`${stats.lethality} Leth (≈${eff.toFixed(0)} flat)`);
  }
  if (stats.armorPenPct)
    parts.push(`${Math.round(stats.armorPenPct * 100)}% APen`);
  return parts.length ? parts.join(" · ") : "No pen";
}

export function damageKindLabel(kind: DamageKind): string {
  switch (kind) {
    case "physical":
      return "phys";
    case "magic":
      return "magic";
    case "true":
      return "true";
    case "mixed":
      return "phys+magic";
    case "magic_true":
      return "magic+true";
    case "phys_true":
      return "phys+true";
    default:
      return "raw";
  }
}
