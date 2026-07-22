/**
 * Damage kinds for mitigation:
 * - mixed = 50% physical + 50% magic (generic dual-type)
 * - magic_true = 50% magic + 50% true (e.g. Ahri Q both passes)
 * - phys_true = 50% physical + 50% true
 */
export type DamageKind =
  | "physical"
  | "magic"
  | "true"
  | "mixed"
  | "magic_true"
  | "phys_true"
  | "unknown";

export interface StatBlock {
  ad: number;
  /** Bonus AD only (items + runes + level growth beyond base@1 is treated as part of total AD; we track bonus separately for ratios) */
  bonusAd: number;
  ap: number;
  hp: number;
  bonusHp: number;
  mana: number;
  armor: number;
  mr: number;
  attackSpeed: number;
  crit: number;
  abilityHaste: number;
  moveSpeed: number;
  lethality: number;
  /** 0–1 */
  armorPenPct: number;
  magicPenFlat: number;
  /** 0–1 */
  magicPenPct: number;
  /** Adaptive force applied as AP or AD */
  adaptive: number;
  lifeSteal: number;
  omnivamp: number;
  healShield: number;
}

/** Shop browse grouping for the calculator picker */
export type ItemCategory = "legendary" | "component" | "boots" | "boots-t3";

export interface ItemData {
  id: string;
  name: string;
  icon: string;
  gold: number;
  tags: string[];
  stats: Partial<StatBlock>;
  /** legendary | component | boots | boots-t3 (mid quest) */
  category?: ItemCategory;
  /** Extra passive notes for display */
  passives?: string[];
  description?: string;
}

export type RuneTree =
  | "Precision"
  | "Domination"
  | "Sorcery"
  | "Resolve"
  | "Inspiration"
  | "Shards"
  | "None";

export type RuneSlot = "keystone" | "combat" | "shard";

/**
 * combat = tree runes that matter for damage / AH / AS / MS / pen
 * (shown when that tree's keystone is selected)
 */
export interface RuneOption {
  id: string;
  name: string;
  tree: RuneTree;
  slot: RuneSlot;
  /** Short effect label shown on the toggle chip */
  effect: string;
  description: string;
  /** Flat/stat contributions when enabled */
  stats?: Partial<StatBlock>;
  /** Adaptive force amount */
  adaptive?: number;
  /** Multiplicative damage (1.08 = +8%) */
  damageMult?: number;
  /** Proc / keystone burst handled separately */
  burst?: boolean;
  /** Only apply damage mult when target is low HP */
  lowHpOnly?: boolean;
  /** Sort order within tree */
  order?: number;
}

export interface AbilityModifier {
  values: number[];
  units: string[];
}

export interface AbilityLeveling {
  attribute: string;
  modifiers: AbilityModifier[];
}

export interface AbilityEffect {
  description: string;
  leveling: AbilityLeveling[];
}

export interface AbilityData {
  key: "P" | "Q" | "W" | "E" | "R";
  name: string;
  icon?: string;
  damageType?: string | null;
  effects: AbilityEffect[];
  maxRank: number;
}

export interface ChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  icon: string;
  attackType?: string;
  adaptiveType?: string;
  stats: {
    health: { flat: number; perLevel: number };
    mana?: { flat: number; perLevel: number };
    armor: { flat: number; perLevel: number };
    magicResistance: { flat: number; perLevel: number };
    attackDamage: { flat: number; perLevel: number };
    attackSpeed?: { flat: number; perLevel: number };
    movespeed?: { flat: number; perLevel?: number };
  };
  abilities: AbilityData[];
}

export interface TargetConfig {
  armor: number;
  mr: number;
  hp: number;
  /** Target current HP fraction 0–1 for current-HP ratios */
  currentHpRatio: number;
}

export interface EvaluatedLine {
  attribute: string;
  raw: number;
  kind: DamageKind;
  parts: string[];
  postMitigation: number;
  resistUsed: number;
}

export interface AbilityResult {
  key: string;
  name: string;
  icon?: string;
  rank: number;
  lines: EvaluatedLine[];
  /** Best single damaging line post-mit (for totals) */
  primaryPost: number;
  primaryRaw: number;
  primaryKind: DamageKind;
}
