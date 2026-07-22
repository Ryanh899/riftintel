/**
 * LoL skill rank helpers for the damage calculator.
 * Basics Q/W/E: ranks 1–5 (no rank 0 in UI).
 * Ultimate R: 1–3 when unlocked (lv 6/11/16); hidden/locked before 6.
 * Total skill points available = champion level.
 */

export type SkillKey = "Q" | "W" | "E" | "R";

export const SKILL_KEYS: SkillKey[] = ["Q", "W", "E", "R"];

export function maxBasicRank(): number {
  return 5;
}

/** Ult ranks unlocked by level (standard SR) */
export function maxUltRankForLevel(level: number): number {
  if (level >= 16) return 3;
  if (level >= 11) return 2;
  if (level >= 6) return 1;
  return 0;
}

export function maxRankForSkill(
  key: SkillKey,
  level: number,
  abilityMax?: number,
): number {
  if (key === "R") {
    const byLevel = maxUltRankForLevel(level);
    const cap = abilityMax && abilityMax > 0 ? abilityMax : 3;
    return Math.min(byLevel, cap);
  }
  const cap = abilityMax && abilityMax > 0 ? abilityMax : 5;
  return Math.min(maxBasicRank(), cap);
}

/**
 * Minimum selectable rank.
 * Basics: min 1 from level 3+ (enough points for Q/W/E each once).
 * Below 3, 0 is allowed so a single point can sit on one skill.
 * R: 0 until unlocked, then min 1.
 */
export function minRankForSkill(key: SkillKey, level: number): number {
  if (key === "R") {
    return maxUltRankForLevel(level) >= 1 ? 1 : 0;
  }
  return level >= 3 ? 1 : 0;
}

export function pointsUsed(ranks: Record<string, number>): number {
  return SKILL_KEYS.reduce((s, k) => s + (ranks[k] ?? 0), 0);
}

export function pointsAvailable(level: number): number {
  return Math.min(18, Math.max(1, level));
}

/**
 * Clamp ranks to legal values for a given level.
 * Basics never drop below 1 (when max allows). Ult 0 only if locked.
 */
export function clampRanksToLevel(
  ranks: Record<string, number>,
  level: number,
  maxByKey?: Partial<Record<SkillKey, number>>,
): Record<string, number> {
  const next: Record<string, number> = { Q: 1, W: 1, E: 1, R: 0 };
  for (const k of SKILL_KEYS) {
    const max = maxRankForSkill(k, level, maxByKey?.[k]);
    const min = minRankForSkill(k, level);
    if (max < min) {
      next[k] = 0;
      continue;
    }
    const raw = Math.floor(ranks[k] ?? min);
    next[k] = Math.min(max, Math.max(min, raw));
  }

  // If over point budget, trim highest basics first (floor at min), then R
  const used = pointsUsed(next);
  const budget = pointsAvailable(level);
  if (used > budget) {
    let over = used - budget;
    const basics: SkillKey[] = ["Q", "W", "E"];
    while (over > 0) {
      const ordered = [...basics].sort((a, b) => next[b] - next[a]);
      let trimmed = false;
      for (const k of ordered) {
        const min = minRankForSkill(k, level);
        if (next[k] > min && over > 0) {
          next[k]--;
          over--;
          trimmed = true;
          break;
        }
      }
      if (!trimmed && next.R > minRankForSkill("R", level) && over > 0) {
        next.R--;
        over--;
        trimmed = true;
      }
      if (!trimmed) break;
    }
  }
  return next;
}

/** One point in each available skill (Q/W/E at 1, R if unlocked) — default experiment start */
export function startingRanksAtLevel(
  level: number,
  maxByKey?: Partial<Record<SkillKey, number>>,
): Record<string, number> {
  const ranks: Record<string, number> = {
    Q: minRankForSkill("Q", level),
    W: minRankForSkill("W", level),
    E: minRankForSkill("E", level),
    R: minRankForSkill("R", level),
  };
  // Ensure we don't exceed budget (lv 1 = only 1 point)
  return clampRanksToLevel(ranks, level, maxByKey);
}

/** Max everything legal at this level */
export function maxRanksAtLevel(
  level: number,
  maxByKey?: Partial<Record<SkillKey, number>>,
): Record<string, number> {
  const ranks: Record<string, number> = {
    Q: maxRankForSkill("Q", level, maxByKey?.Q),
    W: maxRankForSkill("W", level, maxByKey?.W),
    E: maxRankForSkill("E", level, maxByKey?.E),
    R: maxRankForSkill("R", level, maxByKey?.R),
  };
  return clampRanksToLevel(ranks, level, maxByKey);
}

/**
 * Max one ability first (skill order priority), keep others at minimum 1.
 */
export function ranksForPriority(
  level: number,
  priority: SkillKey[],
  maxByKey?: Partial<Record<SkillKey, number>>,
): Record<string, number> {
  const ranks = startingRanksAtLevel(level, maxByKey);
  let points = pointsAvailable(level) - pointsUsed(ranks);
  const order = [...priority];
  for (const k of SKILL_KEYS) {
    if (!order.includes(k)) order.push(k);
  }

  while (points > 0) {
    let placed = false;
    for (const k of order) {
      const max = maxRankForSkill(k, level, maxByKey?.[k]);
      if (ranks[k] < max && points > 0) {
        ranks[k]++;
        points--;
        placed = true;
        break;
      }
    }
    if (!placed) break;
  }
  return ranks;
}
