import type { RuneOption, RuneTree, StatBlock } from "./types";
import { emptyStats } from "./formulas";

/**
 * Damage / tempo runes for the calculator.
 * Approximations at mid–late game unless noted.
 * Combat runes appear when their tree's keystone is selected.
 */
export const RUNE_OPTIONS: RuneOption[] = [
  // ── Keystones ──────────────────────────────────────────
  {
    id: "electrocute",
    name: "Electrocute",
    tree: "Domination",
    slot: "keystone",
    effect: "burst 3-hit",
    description: "70–220 (+0.1 bAD)(+0.05 AP) adaptive after 3 hits",
    burst: true,
    order: 0,
  },
  {
    id: "dark-harvest",
    name: "Dark Harvest",
    tree: "Domination",
    slot: "keystone",
    effect: "execute proc",
    description: "20–80 (+5/soul)(+0.1 AP)(+0.2 bAD) — 0 souls baseline",
    burst: true,
    order: 1,
  },
  {
    id: "hail-of-blades",
    name: "Hail of Blades",
    tree: "Domination",
    slot: "keystone",
    effect: "+AS on hit",
    description: "Massive attack speed for first 3 attacks in combat",
    stats: { attackSpeed: 0.9 },
    order: 2,
  },
  {
    id: "conqueror",
    name: "Conqueror",
    tree: "Precision",
    slot: "keystone",
    effect: "full stacks",
    description: "Full stacks ≈ adaptive force mid-lane value",
    adaptive: 24,
    order: 0,
  },
  {
    id: "press-the-attack",
    name: "Press the Attack",
    tree: "Precision",
    slot: "keystone",
    effect: "+8% dmg",
    description: "After 3 hits, +8% damage for a short window",
    damageMult: 1.08,
    order: 1,
  },
  {
    id: "lethal-tempo",
    name: "Lethal Tempo",
    tree: "Precision",
    slot: "keystone",
    effect: "+AS stacks",
    description: "Attack speed stacking — mid stacks approx",
    stats: { attackSpeed: 0.4 },
    order: 2,
  },
  {
    id: "comet",
    name: "Arcane Comet",
    tree: "Sorcery",
    slot: "keystone",
    effect: "ability proc",
    description: "30–100 (+0.35 AP)(+0.2 bAD) magic on ability hit",
    burst: true,
    order: 0,
  },
  {
    id: "aery",
    name: "Summon Aery",
    tree: "Sorcery",
    slot: "keystone",
    effect: "shield/dmg",
    description: "10–40 (+0.1 AP) magic on offensive spell/AA",
    burst: true,
    order: 1,
  },
  {
    id: "phase-rush",
    name: "Phase Rush",
    tree: "Sorcery",
    slot: "keystone",
    effect: "+MS burst",
    description: "3 hits → burst of move speed (no direct damage)",
    stats: { moveSpeed: 45 },
    order: 2,
  },
  {
    id: "first-strike",
    name: "First Strike",
    tree: "Inspiration",
    slot: "keystone",
    effect: "+7% dmg",
    description: "+7% damage for 3s when attacking first",
    damageMult: 1.07,
    order: 0,
  },
  {
    id: "grasp",
    name: "Grasp of the Undying",
    tree: "Resolve",
    slot: "keystone",
    effect: "on-hit proc",
    description: "Bonus magic damage on combat pulse (HP-scaled approx)",
    burst: true,
    order: 0,
  },

  // ── Domination combat ──────────────────────────────────
  {
    id: "sudden-impact",
    name: "Sudden Impact",
    tree: "Domination",
    slot: "combat",
    effect: "+pen dash",
    description: "After dash/exit stealth: +lethality / magic pen",
    stats: { lethality: 9, magicPenFlat: 7 },
    order: 10,
  },
  {
    id: "cheap-shot",
    name: "Cheap Shot",
    tree: "Domination",
    slot: "combat",
    effect: "true dmg",
    description: "True damage on impaired targets (approx proc)",
    burst: true,
    order: 11,
  },
  {
    id: "eyeball-collection",
    name: "Eyeball Collection",
    tree: "Domination",
    slot: "combat",
    effect: "+adaptive",
    description: "Stacks adaptive force — mid stacks",
    adaptive: 18,
    order: 12,
  },
  {
    id: "treasure-hunter",
    name: "Treasure Hunter",
    tree: "Domination",
    slot: "combat",
    effect: "+adaptive",
    description: "Unique takedowns → adaptive force",
    adaptive: 20,
    order: 13,
  },
  {
    id: "ultimate-hunter",
    name: "Ultimate Hunter",
    tree: "Domination",
    slot: "combat",
    effect: "+ult AH",
    description: "Ultimate haste (modeled as ability haste)",
    stats: { abilityHaste: 16 },
    order: 14,
  },
  {
    id: "relentless-hunter",
    name: "Relentless Hunter",
    tree: "Domination",
    slot: "combat",
    effect: "+MS OOC",
    description: "Out-of-combat move speed stacks",
    stats: { moveSpeed: 25 },
    order: 15,
  },

  // ── Precision combat ───────────────────────────────────
  {
    id: "legend-alacrity",
    name: "Legend: Alacrity",
    tree: "Precision",
    slot: "combat",
    effect: "+AS",
    description: "Attack speed stacks (full-ish)",
    stats: { attackSpeed: 0.15 },
    order: 10,
  },
  {
    id: "legend-haste",
    name: "Legend: Haste",
    tree: "Precision",
    slot: "combat",
    effect: "+AH",
    description: "Ability haste stacks",
    stats: { abilityHaste: 15 },
    order: 11,
  },
  {
    id: "coup-de-grace",
    name: "Coup de Grace",
    tree: "Precision",
    slot: "combat",
    effect: "+8% low HP",
    description: "+8% damage vs targets below 40% HP",
    damageMult: 1.08,
    lowHpOnly: true,
    order: 12,
  },
  {
    id: "cut-down",
    name: "Cut Down",
    tree: "Precision",
    slot: "combat",
    effect: "+8% big HP",
    description: "+5–15% damage vs higher max HP (avg ≈8%)",
    damageMult: 1.08,
    order: 13,
  },
  {
    id: "last-stand",
    name: "Last Stand",
    tree: "Precision",
    slot: "combat",
    effect: "+5–11% low",
    description: "Deal more damage the lower your HP (mid ≈ +8%)",
    damageMult: 1.08,
    order: 14,
  },

  // ── Sorcery combat ─────────────────────────────────────
  {
    id: "nullifying-orb",
    name: "Nullifying Orb",
    tree: "Sorcery",
    slot: "combat",
    effect: "shield",
    description: "Shield when low MR — no damage stat",
    order: 10,
  },
  {
    id: "manaflow",
    name: "Manaflow Band",
    tree: "Sorcery",
    slot: "combat",
    effect: "+mana",
    description: "Permanent mana + restore",
    stats: { mana: 250 },
    order: 11,
  },
  {
    id: "nimbus-cloak",
    name: "Nimbus Cloak",
    tree: "Sorcery",
    slot: "combat",
    effect: "+MS after sum",
    description: "Move speed after summoner spell",
    stats: { moveSpeed: 20 },
    order: 12,
  },
  {
    id: "transcendence",
    name: "Transcendence",
    tree: "Sorcery",
    slot: "combat",
    effect: "+10 AH",
    description: "+10 ability haste at level 5+",
    stats: { abilityHaste: 10 },
    order: 13,
  },
  {
    id: "celerity",
    name: "Celerity",
    tree: "Sorcery",
    slot: "combat",
    effect: "+MS +force",
    description: "Move speed + adaptive from bonus MS",
    stats: { moveSpeed: 18 },
    adaptive: 9,
    order: 14,
  },
  {
    id: "absolute-focus",
    name: "Absolute Focus",
    tree: "Sorcery",
    slot: "combat",
    effect: "+adaptive >70%",
    description: "+adaptive force above 70% HP",
    adaptive: 18,
    order: 15,
  },
  {
    id: "scorch",
    name: "Scorch",
    tree: "Sorcery",
    slot: "combat",
    effect: "burn proc",
    description: "20–40 magic damage on ability (every 10s)",
    burst: true,
    order: 16,
  },
  {
    id: "waterwalking",
    name: "Waterwalking",
    tree: "Sorcery",
    slot: "combat",
    effect: "+MS river",
    description: "Move speed + adaptive in river",
    stats: { moveSpeed: 25 },
    adaptive: 12,
    order: 17,
  },
  {
    id: "gathering-storm",
    name: "Gathering Storm",
    tree: "Sorcery",
    slot: "combat",
    effect: "+adaptive time",
    description: "Adaptive every 10 min — mid-game ≈ +24 AP / +14 AD",
    adaptive: 24,
    order: 18,
  },

  // ── Inspiration combat ─────────────────────────────────
  {
    id: "cosmic-insight",
    name: "Cosmic Insight",
    tree: "Inspiration",
    slot: "combat",
    effect: "+AH +sum AH",
    description: "Summoner + item haste; modeled as ability haste",
    stats: { abilityHaste: 10 },
    order: 10,
  },
  {
    id: "approach-velocity",
    name: "Approach Velocity",
    tree: "Inspiration",
    slot: "combat",
    effect: "+MS toward",
    description: "Move speed toward impaired enemies",
    stats: { moveSpeed: 22 },
    order: 11,
  },
  {
    id: "jack-of-all-trades",
    name: "Jack of All Trades",
    tree: "Inspiration",
    slot: "combat",
    effect: "+adaptive",
    description: "Adaptive force from varied stats",
    adaptive: 15,
    order: 12,
  },
  {
    id: "triple-tonic",
    name: "Triple Tonic",
    tree: "Inspiration",
    slot: "combat",
    effect: "+stats lv",
    description: "Level-up elixirs — mid adaptive approx",
    adaptive: 12,
    order: 13,
  },

  // ── Resolve combat (limited dmg relevance) ─────────────
  {
    id: "shield-bash",
    name: "Shield Bash",
    tree: "Resolve",
    slot: "combat",
    effect: "on-shield dmg",
    description: "Bonus damage after gaining a shield",
    burst: true,
    order: 10,
  },
  {
    id: "conditionning",
    name: "Conditioning",
    tree: "Resolve",
    slot: "combat",
    effect: "+armor/MR",
    description: "Bonus resists after 12 min",
    stats: { armor: 8, mr: 8 },
    order: 11,
  },

  // ── Stat shards ────────────────────────────────────────
  {
    id: "shard-adaptive",
    name: "Adaptive Force",
    tree: "Shards",
    slot: "shard",
    effect: "+9 AP / +5.4 AD",
    description: "+5.4 AD or +9 AP",
    adaptive: 9,
    order: 0,
  },
  {
    id: "shard-as",
    name: "Attack Speed",
    tree: "Shards",
    slot: "shard",
    effect: "+10% AS",
    description: "+10% attack speed",
    stats: { attackSpeed: 0.1 },
    order: 1,
  },
  {
    id: "shard-ah",
    name: "Ability Haste",
    tree: "Shards",
    slot: "shard",
    effect: "+8 AH",
    description: "+8 ability haste",
    stats: { abilityHaste: 8 },
    order: 2,
  },
  {
    id: "shard-ms",
    name: "Move Speed",
    tree: "Shards",
    slot: "shard",
    effect: "+2% MS",
    description: "+2% move speed (≈ +7 flat mid)",
    stats: { moveSpeed: 7 },
    order: 3,
  },
  {
    id: "shard-hp",
    name: "Health",
    tree: "Shards",
    slot: "shard",
    effect: "+HP",
    description: "+10–90 HP (use +65 mid)",
    stats: { hp: 65 },
    order: 4,
  },
  {
    id: "shard-armor",
    name: "Armor",
    tree: "Shards",
    slot: "shard",
    effect: "+6 armor",
    description: "+6 armor",
    stats: { armor: 6 },
    order: 5,
  },
  {
    id: "shard-mr",
    name: "Magic Resist",
    tree: "Shards",
    slot: "shard",
    effect: "+8 MR",
    description: "+8 MR",
    stats: { mr: 8 },
    order: 6,
  },
];

export const KEYSTONES = RUNE_OPTIONS.filter((r) => r.slot === "keystone").sort(
  (a, b) =>
    a.tree.localeCompare(b.tree) || (a.order ?? 0) - (b.order ?? 0),
);

export const SHARDS = RUNE_OPTIONS.filter((r) => r.slot === "shard").sort(
  (a, b) => (a.order ?? 0) - (b.order ?? 0),
);

export function combatRunesForTree(tree: RuneTree): RuneOption[] {
  return RUNE_OPTIONS.filter((r) => r.slot === "combat" && r.tree === tree).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}

export function getRune(id: string): RuneOption | undefined {
  return RUNE_OPTIONS.find((r) => r.id === id);
}

export function keystoneOf(ids: string[]): RuneOption | null {
  for (const id of ids) {
    const r = getRune(id);
    if (r?.slot === "keystone") return r;
  }
  return null;
}

export function primaryTreeOf(ids: string[]): RuneTree | null {
  return keystoneOf(ids)?.tree ?? null;
}

/** Default shard picks */
export const DEFAULT_RUNE_IDS = [
  "comet",
  "transcendence",
  "scorch",
  "absolute-focus",
  "shard-adaptive",
  "shard-adaptive", // only one id — use two distinct if needed
  "shard-ah",
];

/** Clean defaults (unique ids) */
export const DEFAULT_RUNES = [
  "comet",
  "transcendence",
  "scorch",
  "absolute-focus",
  "shard-adaptive",
  "shard-as",
  "shard-ah",
];

export function applyRunes(
  selectedIds: string[],
  prefersAp: boolean,
  opts?: { targetLowHp?: boolean },
): {
  stats: StatBlock;
  notes: string[];
  keystoneId: string | null;
  damageMult: number;
  combatBursts: {
    name: string;
    raw: number;
    kind: "magic" | "physical" | "true" | "adaptive";
  }[];
} {
  const stats = emptyStats();
  const notes: string[] = [];
  const combatBursts: {
    name: string;
    raw: number;
    kind: "magic" | "physical" | "true" | "adaptive";
  }[] = [];
  let damageMult = 1;
  let keystoneId: string | null = null;
  const seen = new Set<string>();

  for (const id of selectedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const rune = getRune(id);
    if (!rune) continue;

    if (rune.slot === "keystone") {
      keystoneId = rune.id;
    }

    if (rune.stats) {
      for (const [k, v] of Object.entries(rune.stats) as [
        keyof StatBlock,
        number,
      ][]) {
        stats[k] = (stats[k] as number) + v;
      }
    }

    if (rune.adaptive) {
      if (prefersAp) stats.ap += rune.adaptive;
      else stats.ad += rune.adaptive;
      notes.push(
        `${rune.name}: +${rune.adaptive} ${prefersAp ? "AP" : "AD"}`,
      );
    }

    if (rune.damageMult && rune.damageMult !== 1) {
      if (rune.lowHpOnly) {
        if (opts?.targetLowHp) {
          damageMult *= rune.damageMult;
          notes.push(
            `${rune.name}: +${Math.round((rune.damageMult - 1) * 100)}% (low HP)`,
          );
        } else {
          notes.push(`${rune.name}: enable target <40% HP`);
        }
      } else {
        damageMult *= rune.damageMult;
        notes.push(
          `${rune.name}: +${Math.round((rune.damageMult - 1) * 100)}% dmg`,
        );
      }
    }

    // Non-keystone combat bursts (fixed mid values; refined later with stats)
    if (rune.burst && rune.slot === "combat") {
      if (rune.id === "scorch") {
        combatBursts.push({ name: "Scorch", raw: 30, kind: "magic" });
      } else if (rune.id === "cheap-shot") {
        combatBursts.push({ name: "Cheap Shot", raw: 25, kind: "true" });
      } else if (rune.id === "shield-bash") {
        combatBursts.push({
          name: "Shield Bash",
          raw: 40,
          kind: prefersAp ? "magic" : "physical",
        });
      }
    }

    // Stat notes for pen / tempo
    if (rune.stats) {
      const bits: string[] = [];
      if (rune.stats.abilityHaste)
        bits.push(`+${rune.stats.abilityHaste} AH`);
      if (rune.stats.attackSpeed)
        bits.push(`+${Math.round(rune.stats.attackSpeed * 100)}% AS`);
      if (rune.stats.moveSpeed) bits.push(`+${rune.stats.moveSpeed} MS`);
      if (rune.stats.lethality) bits.push(`+${rune.stats.lethality} leth`);
      if (rune.stats.magicPenFlat)
        bits.push(`+${rune.stats.magicPenFlat} mpen`);
      if (rune.stats.armorPenPct)
        bits.push(`+${Math.round(rune.stats.armorPenPct * 100)}% armor pen`);
      if (rune.stats.magicPenPct)
        bits.push(`+${Math.round(rune.stats.magicPenPct * 100)}% mpen`);
      if (bits.length) notes.push(`${rune.name}: ${bits.join(" · ")}`);
    }
  }

  return { stats, notes, keystoneId, damageMult, combatBursts };
}

export function keystoneBurst(
  keystoneId: string | null,
  stats: StatBlock,
  prefersAp: boolean,
): {
  name: string;
  raw: number;
  kind: "magic" | "physical" | "adaptive" | "true";
} | null {
  if (!keystoneId) return null;

  switch (keystoneId) {
    case "electrocute": {
      const raw = 180 + 0.1 * stats.bonusAd + 0.05 * stats.ap;
      return {
        name: "Electrocute",
        raw,
        kind: prefersAp ? "magic" : "physical",
      };
    }
    case "comet": {
      const raw = 100 + 0.35 * stats.ap + 0.2 * stats.bonusAd;
      return { name: "Arcane Comet", raw, kind: "magic" };
    }
    case "aery": {
      const raw = 40 + 0.1 * stats.ap;
      return { name: "Summon Aery", raw, kind: "magic" };
    }
    case "dark-harvest": {
      const raw = 80 + 0.1 * stats.ap + 0.2 * stats.bonusAd;
      return {
        name: "Dark Harvest (0 souls)",
        raw,
        kind: prefersAp ? "magic" : "physical",
      };
    }
    case "grasp": {
      const raw = 20 + 0.025 * stats.hp;
      return { name: "Grasp", raw, kind: "magic" };
    }
    default:
      return null;
  }
}

/** Tree accent for UI */
export function treeTone(tree: RuneTree): string {
  switch (tree) {
    case "Precision":
      return "text-adjust";
    case "Domination":
      return "text-nerf";
    case "Sorcery":
      return "text-accent";
    case "Resolve":
      return "text-buff";
    case "Inspiration":
      return "text-rework";
    default:
      return "text-muted";
  }
}

export function treeBorder(tree: RuneTree): string {
  switch (tree) {
    case "Precision":
      return "border-adjust/40";
    case "Domination":
      return "border-nerf/40";
    case "Sorcery":
      return "border-accent/40";
    case "Resolve":
      return "border-buff/40";
    case "Inspiration":
      return "border-rework/40";
    default:
      return "border-border";
  }
}
