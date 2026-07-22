import type {
  AbilityData,
  AbilityResult,
  ChampionData,
  DamageKind,
  EvaluatedLine,
  StatBlock,
  TargetConfig,
} from "./types";
import { applyMitigation } from "./pen";

/** Level index for Meraki arrays: rank 1 → index 0 */
function rankIndex(rank: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(rank, 1), length) - 1;
}

/**
 * Evaluate one modifier unit against current stats/target.
 * Meraki convention: value 50 + unit "% AP" = 50% of AP.
 * Also handles ratio-style "AP" with small coefficients (0.4 AP).
 */
export function evalUnit(
  value: number,
  unit: string,
  stats: StatBlock,
  target: TargetConfig,
  // reserved for future level-scaled units
  champLevel = 18,
): { amount: number; label: string } {
  void champLevel;
  const u = (unit || "").trim();
  const v = Number(value);
  if (!Number.isFinite(v)) {
    return { amount: 0, label: "0" };
  }

  if (!u) {
    return { amount: v, label: `${round(v)} base` };
  }

  const lower = u.toLowerCase().replace(/\s+/g, " ").trim();

  // --- Percent of stat (most common Meraki form) ---
  const pct = (label: string, amount: number, ratio: number) => ({
    amount,
    label: `${ratio}% ${label} (${round(amount)})`,
  });

  if (lower === "% ap" || lower.includes("% ap") || lower === "% ability power") {
    const amt = (v / 100) * stats.ap;
    return pct("AP", amt, v);
  }
  if (lower === "ap") {
    // coefficient (0.5 AP) vs rare flat "50 AP" unit mistakes
    if (v <= 5) {
      const amt = v * stats.ap;
      return { amount: amt, label: `${v} × AP (${round(amt)})` };
    }
    const amt = (v / 100) * stats.ap;
    return pct("AP", amt, v);
  }

  if (lower.includes("% bonus ad") || lower.includes("% bonus attack damage")) {
    const amt = (v / 100) * stats.bonusAd;
    return pct("bAD", amt, v);
  }
  if (
    lower.includes("% total ad") ||
    lower.includes("% ad") ||
    lower.includes("% attack damage") ||
    (lower === "ad" && v > 5)
  ) {
    if (lower === "ad" && v <= 5) {
      const amt = v * stats.ad;
      return { amount: amt, label: `${v} × AD (${round(amt)})` };
    }
    const amt = (v / 100) * stats.ad;
    return pct("AD", amt, v);
  }
  if (lower.includes("% bonus health") || lower.includes("% bonus hp")) {
    const amt = (v / 100) * stats.bonusHp;
    return pct("bHP", amt, v);
  }
  if (
    lower.includes("% max health") ||
    lower.includes("% maximum health") ||
    lower.includes("% target's maximum health") ||
    lower.includes("% of target's max") ||
    (lower.includes("%") && lower.includes("max") && lower.includes("health"))
  ) {
    const amt = (v / 100) * target.hp;
    return pct("max HP", amt, v);
  }
  if (
    lower.includes("% current health") ||
    lower.includes("% current hp") ||
    lower.includes("% of target's current")
  ) {
    const amt = (v / 100) * target.hp * target.currentHpRatio;
    return pct("curr HP", amt, v);
  }
  if (lower.includes("% missing health") || lower.includes("% missing hp")) {
    const missing = target.hp * (1 - target.currentHpRatio);
    const amt = (v / 100) * missing;
    return pct("missing HP", amt, v);
  }
  if (
    lower.includes("% health") ||
    lower.includes("% hp") ||
    (lower.includes("%") && lower.includes("health"))
  ) {
    const amt = (v / 100) * stats.hp;
    return pct("HP", amt, v);
  }
  if (lower.includes("% armor") && !lower.includes("pen")) {
    const amt = (v / 100) * stats.armor;
    return pct("Armor", amt, v);
  }
  if (
    lower.includes("% mr") ||
    lower.includes("% magic resist") ||
    lower.includes("% magic resistance")
  ) {
    const amt = (v / 100) * stats.mr;
    return pct("MR", amt, v);
  }
  if (lower.includes("% mana")) {
    const amt = (v / 100) * stats.mana;
    return pct("Mana", amt, v);
  }
  if (lower.includes("% bonus armor")) {
    // approximate: treat as total armor for lack of base split
    const amt = (v / 100) * Math.max(0, stats.armor);
    return pct("Armor", amt, v);
  }

  // Coefficient forms: "0.4 AP", "AP" with small v
  if (lower === "ap" || lower.endsWith(" ap")) {
    const amt = v * stats.ap;
    return { amount: amt, label: `${v} × AP (${round(amt)})` };
  }
  if (lower === "ad" || lower.endsWith(" ad") || lower === "total ad") {
    const amt = v * stats.ad;
    return { amount: amt, label: `${v} × AD (${round(amt)})` };
  }
  if (lower.includes("bonus ad")) {
    const amt = v * stats.bonusAd;
    return { amount: amt, label: `${v} × bAD (${round(amt)})` };
  }

  // Level scaling sometimes encoded as unit "×" with values per level — treat as flat
  if (lower.includes("level") || lower === "×" || lower === "x") {
    return { amount: v, label: `${round(v)} (scaled)` };
  }

  // Unknown unit with a number: show flat, label unit
  return { amount: v, label: `${round(v)}${u ? ` ${u}` : ""}`.trim() };
}

/**
 * Infer mitigation kind from attribute label, ability damageType, and effect text.
 * Critical for Ahri Q: outbound magic + return true → magic_true for totals,
 * and per-pass lines split when description describes both.
 */
export function inferDamageKind(
  attribute: string,
  abilityDamageType?: string | null,
  effectDescription?: string | null,
): DamageKind {
  const a = attribute.toLowerCase();
  const t = (abilityDamageType || "").toLowerCase();
  const d = (effectDescription || "").toLowerCase();

  // Attribute-explicit wins
  if (a.includes("true") && !a.includes("mixed")) return "true";
  if (a.includes("physical") && !a.includes("mixed")) return "physical";
  if (a.includes("magic") && !a.includes("mixed") && !a.includes("true"))
    return "magic";

  const mentionsMagic = d.includes("magic damage") || d.includes("magical damage");
  const mentionsTrue = d.includes("true damage");
  const mentionsPhys =
    d.includes("physical damage") || d.includes("physical dmg");

  // Total / mixed totals with magic+true (Ahri Q both passes)
  if (
    (a.includes("total") || a.includes("mixed")) &&
    mentionsMagic &&
    mentionsTrue
  ) {
    return "magic_true";
  }
  if (
    (a.includes("total") || a.includes("mixed")) &&
    mentionsPhys &&
    mentionsTrue
  ) {
    return "phys_true";
  }
  if (
    (a.includes("mixed") || t.includes("mixed")) &&
    mentionsPhys &&
    mentionsMagic
  ) {
    return "mixed";
  }

  // Single "Damage Per Pass" without true/magic in attribute:
  // if effect says magic outbound and true return, callers may split lines;
  // default a lone per-pass line to magic when both mentioned (outbound first).
  if (a.includes("per pass") || a.includes("damage per")) {
    if (mentionsMagic && mentionsTrue) return "magic"; // outbound; true is separate pass
    if (mentionsTrue) return "true";
    if (mentionsMagic) return "magic";
    if (mentionsPhys) return "physical";
  }

  if (a.includes("mixed") || t.includes("mixed_damage") || t.includes("mixed")) {
    if (mentionsMagic && mentionsTrue) return "magic_true";
    if (mentionsPhys && mentionsTrue) return "phys_true";
    return "mixed";
  }

  if (t.includes("true")) return "true";
  if (t.includes("physical")) return "physical";
  if (t.includes("magic")) return "magic";

  if (a.includes("heal") || a.includes("shield")) return "unknown";
  if (a.includes("damage")) return "unknown";
  return "unknown";
}

/** Whether this effect describes magic outbound + true return (Ahri Q, etc.) */
export function isMagicThenTruePass(effectDescription: string | null | undefined): boolean {
  const d = (effectDescription || "").toLowerCase();
  return (
    (d.includes("magic damage") || d.includes("magical damage")) &&
    d.includes("true damage") &&
    (d.includes("return") || d.includes("returns") || d.includes("pass"))
  );
}

/** Prefer real damage lines over utility (cooldown, cost, range) */
export function isDamageAttribute(attribute: string): boolean {
  const a = attribute.toLowerCase();
  if (
    /cooldown|cost|mana|range|width|speed|duration|radius|recharge|cast time/.test(
      a,
    )
  ) {
    return false;
  }
  return /damage|heal|shield|total|smite|blast|bolt|strike|shot|pass/.test(a);
}

export function evaluateLevelingLine(
  attribute: string,
  modifiers: { values: number[]; units: string[] }[],
  rank: number,
  stats: StatBlock,
  target: TargetConfig,
  abilityDamageType?: string | null,
  champLevel = 18,
  effectDescription?: string | null,
  kindOverride?: DamageKind,
): EvaluatedLine {
  let raw = 0;
  const parts: string[] = [];

  for (const mod of modifiers) {
    if (!mod.values?.length) continue;
    const idx = rankIndex(rank, mod.values.length);
    const value = mod.values[idx] ?? mod.values[mod.values.length - 1] ?? 0;
    const unit = mod.units?.[idx] ?? mod.units?.[0] ?? "";
    const { amount, label } = evalUnit(
      value,
      unit,
      stats,
      target,
      champLevel,
    );
    raw += amount;
    parts.push(label);
  }

  const kind =
    kindOverride ??
    inferDamageKind(attribute, abilityDamageType, effectDescription);
  const { post, resist } = applyMitigation(
    raw,
    kind,
    stats,
    target,
    champLevel,
  );

  return {
    attribute,
    raw,
    kind,
    parts,
    postMitigation: post,
    resistUsed: resist,
  };
}

export function evaluateAbility(
  ability: AbilityData,
  rank: number,
  stats: StatBlock,
  target: TargetConfig,
  champLevel = 18,
): AbilityResult {
  const effectiveRank = Math.max(1, rank);
  const lines: EvaluatedLine[] = [];

  for (const effect of ability.effects) {
    const desc = effect.description || "";
    const magicTruePass = isMagicThenTruePass(desc);

    for (const leveling of effect.leveling) {
      if (!leveling.modifiers?.length) continue;
      const attr = leveling.attribute || "";

      // Ahri Q style: one "Damage Per Pass" number applies to magic outbound
      // and true return — emit both so totals and UI are correct.
      if (
        magicTruePass &&
        /per pass|damage per/i.test(attr) &&
        !/total/i.test(attr)
      ) {
        const base = evaluateLevelingLine(
          attr,
          leveling.modifiers,
          effectiveRank,
          stats,
          target,
          ability.damageType,
          champLevel,
          desc,
          "magic",
        );
        lines.push({
          ...base,
          attribute: `${attr} (magic out)`,
          kind: "magic",
        });
        const trueLine = applyMitigation(
          base.raw,
          "true",
          stats,
          target,
          champLevel,
        );
        lines.push({
          attribute: `${attr} (true return)`,
          raw: base.raw,
          kind: "true",
          parts: base.parts,
          postMitigation: trueLine.post,
          resistUsed: 0,
        });
        continue;
      }

      lines.push(
        evaluateLevelingLine(
          attr,
          leveling.modifiers,
          effectiveRank,
          stats,
          target,
          ability.damageType,
          champLevel,
          desc,
        ),
      );
    }
  }

  // Prefer correct total: Total Mixed (magic+true), else sum of both passes, else best line
  const damageLines = lines.filter(
    (l) => l.raw > 0 && isDamageAttribute(l.attribute),
  );

  const totalLine =
    damageLines.find(
      (l) =>
        /total/i.test(l.attribute) &&
        (l.kind === "magic_true" ||
          l.kind === "mixed" ||
          l.kind === "phys_true"),
    ) || damageLines.find((l) => /total/i.test(l.attribute));

  let primaryPost = 0;
  let primaryRaw = 0;
  let primaryKind: DamageKind = "unknown";

  if (totalLine) {
    primaryPost = totalLine.postMitigation;
    primaryRaw = totalLine.raw;
    primaryKind = totalLine.kind;
  } else {
    // Sum magic out + true return pair if present
    const magicPass = damageLines.find(
      (l) =>
        /magic out|per pass \(magic/i.test(l.attribute) ||
        (l.kind === "magic" && /per pass/i.test(l.attribute)),
    );
    const truePass = damageLines.find(
      (l) =>
        /true return|per pass \(true/i.test(l.attribute) ||
        (l.kind === "true" && /per pass|return/i.test(l.attribute)),
    );
    if (magicPass && truePass) {
      primaryPost = magicPass.postMitigation + truePass.postMitigation;
      primaryRaw = magicPass.raw + truePass.raw;
      primaryKind = "magic_true";
    } else {
      const preferred =
        damageLines.sort((a, b) => b.postMitigation - a.postMitigation)[0] ||
        lines.filter((l) => l.raw > 0).sort((a, b) => b.raw - a.raw)[0];
      if (preferred) {
        primaryPost = preferred.postMitigation;
        primaryRaw = preferred.raw;
        primaryKind = preferred.kind;
      }
    }
  }

  return {
    key: ability.key,
    name: ability.name,
    icon: ability.icon,
    rank: ability.key === "P" ? 1 : effectiveRank,
    lines,
    primaryPost,
    primaryRaw,
    primaryKind,
  };
}

export function evaluateAllAbilities(
  champ: ChampionData,
  ranks: Record<string, number>,
  stats: StatBlock,
  target: TargetConfig,
  champLevel = 18,
): AbilityResult[] {
  return champ.abilities.map((ab) => {
    const max = ab.maxRank || (ab.key === "R" ? 3 : ab.key === "P" ? 1 : 5);
    const rank = ab.key === "P" ? 1 : ranks[ab.key] ?? max;
    return evaluateAbility(ab, rank, stats, target, champLevel);
  });
}

export function emptyStats(): StatBlock {
  return {
    ad: 0,
    bonusAd: 0,
    ap: 0,
    hp: 0,
    bonusHp: 0,
    mana: 0,
    armor: 0,
    mr: 0,
    attackSpeed: 0,
    crit: 0,
    abilityHaste: 0,
    moveSpeed: 0,
    lethality: 0,
    armorPenPct: 0,
    magicPenFlat: 0,
    magicPenPct: 0,
    adaptive: 0,
    lifeSteal: 0,
    omnivamp: 0,
    healShield: 0,
  };
}

export function round(n: number, d = 1): number {
  const m = 10 ** d;
  return Math.round(n * m) / m;
}

/** Riot champion growth formula */
export function growthStat(base: number, perLevel: number, level: number): number {
  const lv = Math.min(18, Math.max(1, level));
  return base + perLevel * (lv - 1) * (0.7025 + 0.0175 * (lv - 1));
}

export function champStatsAtLevel(
  champ: ChampionData,
  level: number,
): { base: StatBlock; baseAd: number; baseHp: number } {
  const s = champ.stats;
  const hp = growthStat(s.health.flat, s.health.perLevel, level);
  const ad = growthStat(s.attackDamage.flat, s.attackDamage.perLevel, level);
  const armor = growthStat(s.armor.flat, s.armor.perLevel, level);
  const mr = growthStat(
    s.magicResistance.flat,
    s.magicResistance.perLevel,
    level,
  );
  const mana = s.mana
    ? growthStat(s.mana.flat, s.mana.perLevel, level)
    : 0;
  const ms = s.movespeed?.flat ?? 0;
  const asBase = s.attackSpeed?.flat ?? 0.625;

  const base = emptyStats();
  base.hp = hp;
  base.ad = ad;
  base.armor = armor;
  base.mr = mr;
  base.mana = mana;
  base.moveSpeed = ms;
  base.attackSpeed = asBase;

  return { base, baseAd: s.attackDamage.flat, baseHp: s.health.flat };
}
