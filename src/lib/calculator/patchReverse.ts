import type {
  AbilityChange,
  ChampionHistory,
  ChampionHistoryEntry,
  StatLine,
} from "@/lib/types";
import type { AbilityData, ChampionData, StatBlock } from "./types";
import { emptyStats } from "./formulas";

/**
 * Reconstruct champion kit as of a past balance patch from patch notes.
 *
 * "As of patch P" = after P’s notes shipped (state during that patch cycle):
 * for every (ability, stat label) we take the **latest** note at or before P
 * and force its **after** values onto the live Meraki kit.
 *
 * Lines only changed after P are reversed (after → before) from live.
 * This keeps chronological consistency (25.19 Q == 26.01 Q if Q wasn’t
 * touched between them).
 */

export interface ReverseResult {
  kit: ChampionData;
  baseStatDelta: Partial<StatBlock>;
  notes: string[];
  applied: number;
  skipped: number;
}

type LineKey = string;

function cloneKit(kit: ChampionData): ChampionData {
  return JSON.parse(JSON.stringify(kit)) as ChampionData;
}

function lineKey(abilityName: string, label: string): LineKey {
  return `${normalizeName(abilityName)}::${normalizeName(label || "change")}`;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

/** Parse patch-note number blobs into rank series. */
export function parseNumericSeries(raw: string | undefined | null): {
  values: number[];
  kind: "range" | "slash" | "single" | "percent";
  unitHint?: "ap" | "ad" | "bad" | "other";
} | null {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/\([^)]*\)/g, " ").trim();
  s = s.replace(/,/g, "");

  const pct = s.match(
    /^([\d.]+)\s*%?\s*(?:\|)?\s*(AP|AD|bAD|bonus\s*AD|total\s*AD|armor|MR)?/i,
  );
  if (
    pct &&
    (s.includes("%") || /ap|ad/i.test(pct[2] || "")) &&
    !/[–—-]/.test(s.replace(/^-/, "")) &&
    !s.includes("/")
  ) {
    // avoid treating "70-250" as percent
    if (!/^\d+[–—-]\d+/.test(s)) {
      const unit = (pct[2] || "").toLowerCase();
      let unitHint: "ap" | "ad" | "bad" | "other" = "other";
      if (unit.includes("ap")) unitHint = "ap";
      else if (unit.includes("bonus")) unitHint = "bad";
      else if (unit.includes("ad")) unitHint = "ad";
      if (s.includes("%") || unitHint !== "other") {
        return {
          values: [Number(pct[1])],
          kind: "percent",
          unitHint,
        };
      }
    }
  }

  if (/to/i.test(s) && s.includes("/")) {
    const sides = s.split(/\s+to\s+/i);
    if (sides.length === 2) {
      const left = Number(sides[0]!.split("/")[0]);
      const right = Number(sides[1]!.split("/")[0]);
      if (Number.isFinite(left) && Number.isFinite(right)) {
        return { values: [left, right], kind: "range" };
      }
    }
  }

  if (s.includes("/")) {
    const parts = s
      .split("/")
      .map((p) => Number(p.trim().replace(/[^\d.-]/g, "")));
    if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
      return { values: parts, kind: "slash" };
    }
  }

  const range = s.match(/^([\d.]+)\s*[–—-]\s*([\d.]+)/);
  if (range) {
    return {
      values: [Number(range[1]), Number(range[2])],
      kind: "range",
    };
  }

  const single = s.match(/^([\d.]+)\s*%?\s*[a-z%|]*$/i);
  if (single) {
    return { values: [Number(single[1])], kind: "single" };
  }

  return null;
}

function expandToLength(series: number[], len: number): number[] {
  if (len <= 0) return [];
  if (series.length === len) return [...series];
  if (series.length === 1) return Array(len).fill(series[0]);
  if (series.length === 2 && len > 2) {
    const [a, b] = series;
    return Array.from(
      { length: len },
      (_, i) => a! + ((b! - a!) * i) / (len - 1),
    );
  }
  if (series.length > len) return series.slice(0, len);
  const out = [...series];
  while (out.length < len) out.push(series[series.length - 1]!);
  return out;
}

function attrMatches(attribute: string, label: string): boolean {
  const a = attribute.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();
  const l = label.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();
  if (!a || !l) return false;
  if (a === l) return true;
  // Substring only when label is specific enough (avoid "damage" alone)
  if (l.length >= 10 && (a.includes(l) || l.includes(a))) return true;

  // Structural flags must agree when present on the label
  if (/\btotal\b/.test(l) && !/\btotal\b/.test(a)) return false;
  if (/\btick\b/.test(l) && !/\btick\b/.test(a)) return false;
  if (/\bratio\b/.test(l) && !/\bratio|%|ap|ad\b/.test(a) && !a.includes("%")) {
    // ratio labels often attach to plain "Magic Damage" — allow if no tick/total mismatch
    if (/\btick\b|\btotal\b/.test(a)) return false;
  }
  if (/\btick\b/.test(a) && /\btotal\b/.test(l)) return false;
  if (/\btotal\b/.test(a) && /\btick\b/.test(l)) return false;

  const stop = new Set(["the", "per", "and", "for", "with", "from", "of"]);
  const at = a.split(" ").filter((t) => t.length > 2 && !stop.has(t));
  const lt = l.split(" ").filter((t) => t.length > 2 && !stop.has(t));
  if (!lt.length) return false;
  const hit = lt.filter((t) => at.some((x) => x === t || x.includes(t) || t.includes(x)));
  // Require real overlap — never match on a lone generic "damage"
  const meaningful = hit.filter((t) => t !== "damage" && t !== "magic" && t !== "physical");
  if (meaningful.length >= 1 && hit.length >= 2) return true;
  if (meaningful.length >= 2) return true;
  // "base damage" ↔ "magic damage" style: damage + base/total/tick agreement already checked
  if (hit.includes("damage") && (lt.includes("base") || lt.includes("total") || lt.includes("tick"))) {
    if (lt.includes("tick") && at.includes("tick")) return true;
    if (lt.includes("total") && at.includes("total")) return true;
    if (lt.includes("base") && !lt.includes("total") && !at.includes("total") && !lt.includes("tick")) {
      return at.includes("damage") && !at.includes("tick");
    }
  }
  return false;
}

function unitIsRatio(units: string[] | undefined): boolean {
  const u = (units?.[0] || "").toLowerCase();
  return u.includes("%") || u.includes("ap") || u.includes("ad");
}

function unitIsFlat(units: string[] | undefined): boolean {
  const u = (units?.[0] || "").trim();
  return !u || u === "";
}

function findAbility(
  kit: ChampionData,
  abilityName: string,
): AbilityData | null {
  const name = normalizeName(abilityName);
  if (!name || isBaseStatsName(name)) return null;

  if (/^[pqwer]$/i.test(abilityName.trim())) {
    const letter = abilityName.trim().toUpperCase();
    return kit.abilities.find((a) => a.key === letter) ?? null;
  }

  const exact = kit.abilities.find((a) => normalizeName(a.name) === name);
  if (exact) return exact;

  const partial = kit.abilities.find((a) => {
    const an = normalizeName(a.name);
    return an.includes(name) || name.includes(an);
  });
  if (partial) return partial;

  const tokens = name.split(" ").filter((t) => t.length > 3);
  if (tokens.length) {
    return (
      kit.abilities.find((a) => {
        const an = normalizeName(a.name);
        return tokens.every((t) => an.includes(t));
      }) ?? null
    );
  }
  return null;
}

function isBaseStatsName(n: string): boolean {
  const x = normalizeName(n);
  return (
    x.includes("base stat") ||
    x === "base" ||
    x === "stats" ||
    x === "general" ||
    x.startsWith("base health") ||
    x.startsWith("base armor") ||
    x.startsWith("base attack") ||
    x.startsWith("base movement")
  );
}

function isBaseStatsChange(change: AbilityChange): boolean {
  return isBaseStatsName(change.ability || change.title || "");
}

function labelWantsRatio(label: string, targetKind: string): boolean {
  // NOTE: do not use bare /ad/ — it matches inside "damage"
  return (
    targetKind === "percent" ||
    /\bratio\b|%\s*ap|%\s*ad|\bap ratio\b|\bad ratio\b|bonus ad|total ad/i.test(
      label,
    )
  );
}

function applySeriesToAbility(
  ability: AbilityData,
  line: StatLine,
  valueRaw: string,
): boolean {
  const targetP = parseNumericSeries(valueRaw);
  if (!targetP) return false;

  const label = line.label || "";
  const wantRatio = labelWantsRatio(label, targetP.kind);
  let applied = false;
  const touched: { old: number[]; next: number[] }[] = [];

  const writeMod = (
    mod: { values: number[]; units?: string[] },
    series: number[],
  ) => {
    const prev = [...mod.values];
    mod.values = series.map((v) => Number(v.toFixed(4)));
    touched.push({ old: prev, next: [...mod.values] });
    applied = true;
  };

  for (const effect of ability.effects) {
    for (const leveling of effect.leveling) {
      if (!attrMatches(leveling.attribute, label)) continue;

      for (const mod of leveling.modifiers) {
        if (!mod.values?.length) continue;

        if (
          wantRatio &&
          !unitIsRatio(mod.units) &&
          unitIsFlat(mod.units) &&
          leveling.modifiers.length > 1 &&
          leveling.modifiers.some((m) => unitIsRatio(m.units))
        ) {
          continue;
        }
        if (
          !wantRatio &&
          unitIsRatio(mod.units) &&
          leveling.modifiers.some((m) => unitIsFlat(m.units))
        ) {
          continue;
        }

        writeMod(mod, expandToLength(targetP.values, mod.values.length));
      }
    }
  }

  // Ratios often sit under a generic "Magic Damage" attribute — match by unit
  if (!applied && wantRatio) {
    const preferBonus = /bonus/i.test(label);
    const preferAp = /\bap\b/i.test(label);
    for (const effect of ability.effects) {
      for (const leveling of effect.leveling) {
        if (/cooldown|mana|cost|range/i.test(leveling.attribute)) continue;
        for (const mod of leveling.modifiers) {
          if (!mod.values?.length || !unitIsRatio(mod.units)) continue;
          const u = (mod.units?.[0] || "").toLowerCase();
          if (preferAp && !u.includes("ap")) continue;
          if (preferBonus && !u.includes("bonus") && !u.includes("ad")) {
            // still allow plain % AD if no bonus-tagged mod
          }
          if (preferBonus && u.includes("ap")) continue;
          writeMod(mod, expandToLength(targetP.values, mod.values.length));
          // prefer first matching ratio (usually primary damage ratio)
          break;
        }
        if (applied) break;
      }
      if (applied) break;
    }
  }

  if (!applied && /damage/i.test(label) && !wantRatio) {
    for (const effect of ability.effects) {
      for (const leveling of effect.leveling) {
        if (!/damage/i.test(leveling.attribute)) continue;
        const preferTotal = /total/i.test(label);
        const isTotal = /total/i.test(leveling.attribute);
        if (preferTotal !== isTotal && effect.leveling.length > 1) continue;

        for (const mod of leveling.modifiers) {
          if (!mod.values?.length) continue;
          if (unitIsRatio(mod.units)) continue;
          writeMod(mod, expandToLength(targetP.values, mod.values.length));
          break;
        }
        if (applied) break;
      }
      if (applied) break;
    }
  }

  // Scale Total damage when per-tick/base damage changes
  if (
    applied &&
    touched.length &&
    /damage/i.test(label) &&
    !/total/i.test(label) &&
    targetP.kind !== "percent"
  ) {
    const sample = touched[0]!;
    const old0 = sample.old[0] || 1;
    const oldN = sample.old[sample.old.length - 1] || old0;
    const new0 = sample.next[0] || 1;
    const newN = sample.next[sample.next.length - 1] || new0;
    const r0 = new0 / old0;
    const r1 = newN / oldN;

    for (const effect of ability.effects) {
      for (const leveling of effect.leveling) {
        if (!/total/i.test(leveling.attribute)) continue;
        if (!/damage/i.test(leveling.attribute)) continue;
        for (const mod of leveling.modifiers) {
          if (!mod.values?.length || unitIsRatio(mod.units)) continue;
          const n = mod.values.length;
          mod.values = mod.values.map((v, i) => {
            const t = n <= 1 ? 0 : i / (n - 1);
            const ratio = r0 + (r1 - r0) * t;
            return Number((v * ratio).toFixed(4));
          });
        }
      }
    }
  }

  return applied;
}

function applyBaseStatValue(
  kit: ChampionData,
  line: StatLine,
  valueRaw: string,
): boolean {
  const targetP = parseNumericSeries(valueRaw);
  if (!targetP) return false;
  const target = targetP.values[0]!;
  const label = (line.label || "").toLowerCase();

  const setGrowth = (
    field: { flat: number; perLevel: number },
    growth: boolean,
  ) => {
    if (growth) field.perLevel = target;
    else field.flat = target;
  };

  if (label.includes("health growth") || label.includes("hp growth")) {
    setGrowth(kit.stats.health, true);
    return true;
  }
  if (
    (label.includes("base health") ||
      ((label === "health" || label === "hp") && !label.includes("regen"))) &&
    !label.includes("growth")
  ) {
    setGrowth(kit.stats.health, false);
    return true;
  }
  if (label.includes("health") && label.includes("growth")) {
    setGrowth(kit.stats.health, true);
    return true;
  }
  if (label.includes("armor growth")) {
    setGrowth(kit.stats.armor, true);
    return true;
  }
  if (
    label.includes("base armor") ||
    (label.includes("armor") &&
      !label.includes("pen") &&
      !label.includes("growth"))
  ) {
    setGrowth(kit.stats.armor, false);
    return true;
  }
  if (label.includes("magic resist") || label.includes("mr growth")) {
    setGrowth(kit.stats.magicResistance, label.includes("growth"));
    return true;
  }
  if (label.includes("attack damage growth") || label.includes("ad growth")) {
    setGrowth(kit.stats.attackDamage, true);
    return true;
  }
  if (
    label.includes("base attack damage") ||
    (label.includes("attack damage") && !label.includes("growth"))
  ) {
    setGrowth(kit.stats.attackDamage, false);
    return true;
  }
  if (label.includes("attack speed growth") && kit.stats.attackSpeed) {
    kit.stats.attackSpeed.perLevel = target > 1 ? target / 100 : target;
    return true;
  }
  if (label.includes("base attack speed") && kit.stats.attackSpeed) {
    kit.stats.attackSpeed.flat = target;
    return true;
  }
  if (label.includes("mana growth") && kit.stats.mana) {
    setGrowth(kit.stats.mana, true);
    return true;
  }
  if (
    label.includes("base mana") &&
    kit.stats.mana &&
    !label.includes("regen")
  ) {
    setGrowth(kit.stats.mana, false);
    return true;
  }
  if (label.includes("move") && kit.stats.movespeed) {
    kit.stats.movespeed.flat = target;
    return true;
  }
  return false;
}

function abilityNameOf(change: AbilityChange): string {
  return (change.title || change.ability || "").trim() || "General";
}

interface NoteHit {
  entry: ChampionHistoryEntry;
  abilityName: string;
  line: StatLine;
  isBase: boolean;
}

function collectNotes(history: ChampionHistory): NoteHit[] {
  const out: NoteHit[] = [];
  for (const entry of history.entries) {
    for (const ch of entry.change.changes ?? []) {
      const isBase = isBaseStatsChange(ch);
      const abilityName = abilityNameOf(ch);
      for (const line of ch.lines ?? []) {
        if (!line.before && !line.after) continue;
        out.push({ entry, abilityName, line, isBase });
      }
    }
  }
  return out;
}

/**
 * Kit as of the end of `patchId` (after that patch’s notes).
 * Uses latest note ≤ P per (ability, label), not just lines from P itself.
 */
export function kitAsOfPatch(
  liveKit: ChampionData,
  history: ChampionHistory | null | undefined,
  patchId: string,
): ReverseResult {
  const kit = cloneKit(liveKit);
  const baseStatDelta: Partial<StatBlock> = {};
  const notes: string[] = [];
  let applied = 0;
  let skipped = 0;

  if (!history?.entries?.length) {
    return { kit, baseStatDelta, notes: ["no history"], applied: 0, skipped: 0 };
  }

  const idx = history.entries.findIndex(
    (e) => e.patchId === patchId || e.version === patchId,
  );
  if (idx < 0) {
    return {
      kit,
      baseStatDelta,
      notes: ["patch not in this champion's history"],
      applied: 0,
      skipped: 0,
    };
  }

  const all = collectNotes(history);
  const keysThroughP = new Set<LineKey>();
  const afterPByKey = new Map<LineKey, NoteHit[]>();

  for (const hit of all) {
    const eIdx = history.entries.findIndex(
      (e) =>
        e.patchId === hit.entry.patchId && e.version === hit.entry.version,
    );
    const key = lineKey(
      hit.isBase ? "base stats" : hit.abilityName,
      hit.line.label || "",
    );
    if (eIdx < 0) continue;
    if (eIdx <= idx) {
      keysThroughP.add(key);
    } else {
      const list = afterPByKey.get(key) ?? [];
      list.push(hit);
      afterPByKey.set(key, list);
    }
  }

  // 1) Chronological apply of every after-value through P.
  //    Order matters: tick then total, then a later tick re-scales total.
  for (let i = 0; i <= idx; i++) {
    const entry = history.entries[i]!;
    for (const ch of entry.change.changes ?? []) {
      const isBase = isBaseStatsChange(ch);
      const abilityName = abilityNameOf(ch);
      for (const line of ch.lines ?? []) {
        if (!line.after) {
          if (line.before || line.after) skipped++;
          continue;
        }
        if (isBase) {
          if (applyBaseStatValue(kit, line, line.after)) {
            applied++;
            notes.push(
              `${entry.version}: base ${line.label} = ${line.after}`,
            );
          } else skipped++;
          continue;
        }
        const ability = findAbility(kit, abilityName);
        if (!ability) {
          skipped++;
          continue;
        }
        if (applySeriesToAbility(ability, line, line.after)) {
          applied++;
          notes.push(
            `${entry.version}: ${ability.key} ${line.label} = ${line.after}`,
          );
        } else skipped++;
      }
    }
  }

  // 2) Lines only changed after P: reverse live after→before (newest first)
  for (const [key, hits] of afterPByKey) {
    if (keysThroughP.has(key)) continue;
    for (const hit of [...hits].reverse()) {
      const before = hit.line.before;
      if (!before) {
        skipped++;
        continue;
      }
      if (hit.isBase) {
        if (applyBaseStatValue(kit, hit.line, before)) {
          applied++;
          notes.push(
            `undo ${hit.entry.version}: base ${hit.line.label} → ${before}`,
          );
        } else skipped++;
        continue;
      }
      const ability = findAbility(kit, hit.abilityName);
      if (!ability) {
        skipped++;
        continue;
      }
      if (applySeriesToAbility(ability, hit.line, before)) {
        applied++;
        notes.push(
          `undo ${hit.entry.version}: ${ability.key} ${hit.line.label} → ${before}`,
        );
      } else skipped++;
    }
  }

  return { kit, baseStatDelta, notes, applied, skipped };
}

/** Patches where this champion was balance-touched (newest first). */
export function patchesForChampion(
  history: ChampionHistory | null | undefined,
): { id: string; version: string; direction: string; releaseDate: string }[] {
  if (!history?.entries?.length) return [];
  return [...history.entries]
    .map((e) => ({
      id: e.patchId,
      version: e.version,
      direction: e.change.direction,
      releaseDate: e.releaseDate,
    }))
    .reverse();
}

/** One visible balance line for the compare UI */
export interface CompareNoteLine {
  patchId: string;
  patchVersion: string;
  direction: string;
  abilityName: string;
  /** P/Q/W/E/R/BASE when known */
  abilityKey: string;
  label: string;
  before?: string;
  after?: string;
}

/**
 * Patch-note lines that land after the selected baseline (why Live differs).
 * Chronological oldest → newest.
 */
export function noteLinesAfterPatch(
  history: ChampionHistory | null | undefined,
  patchId: string,
): CompareNoteLine[] {
  if (!history?.entries?.length) return [];
  const idx = history.entries.findIndex(
    (e) => e.patchId === patchId || e.version === patchId,
  );
  if (idx < 0) return [];

  const out: CompareNoteLine[] = [];
  for (const entry of history.entries.slice(idx + 1)) {
    for (const ch of entry.change.changes ?? []) {
      const abilityName = (ch.title || ch.ability || "General").trim();
      const isBase = isBaseStatsName(abilityName);
      let abilityKey = isBase ? "BASE" : "?";
      if (!isBase) {
        const letter = abilityName.match(/^[PQWER]$/i)?.[0]?.toUpperCase();
        abilityKey = letter || abilityName.slice(0, 12);
      }
      for (const line of ch.lines ?? []) {
        if (!line.before && !line.after && !line.note) continue;
        out.push({
          patchId: entry.patchId,
          patchVersion: entry.version,
          direction: ch.direction || entry.change.direction,
          abilityName,
          abilityKey,
          label: line.label && line.label !== "Change" ? line.label : abilityName,
          before: line.before,
          after: line.after,
        });
      }
    }
  }
  return out;
}

export function emptyDelta(): Partial<StatBlock> {
  return emptyStats();
}
