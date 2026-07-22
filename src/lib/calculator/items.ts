import type { ItemCategory, ItemData, StatBlock } from "./types";
import { emptyStats } from "./formulas";

/** Data Dragon item stats → our StatBlock fields */
export function mapDdragonStats(
  stats: Record<string, number> | undefined,
): Partial<StatBlock> {
  if (!stats) return {};
  const out: Partial<StatBlock> = {};
  if (stats.FlatPhysicalDamageMod) out.ad = stats.FlatPhysicalDamageMod;
  if (stats.FlatMagicDamageMod) out.ap = stats.FlatMagicDamageMod;
  if (stats.FlatHPPoolMod) out.hp = stats.FlatHPPoolMod;
  if (stats.FlatMPPoolMod) out.mana = stats.FlatMPPoolMod;
  if (stats.FlatArmorMod) out.armor = stats.FlatArmorMod;
  if (stats.FlatSpellBlockMod) out.mr = stats.FlatSpellBlockMod;
  if (stats.FlatCritChanceMod) out.crit = stats.FlatCritChanceMod;
  if (stats.PercentAttackSpeedMod) out.attackSpeed = stats.PercentAttackSpeedMod;
  if (stats.FlatMovementSpeedMod) out.moveSpeed = stats.FlatMovementSpeedMod;
  if (stats.PercentMovementSpeedMod)
    out.moveSpeed = (out.moveSpeed ?? 0) + stats.PercentMovementSpeedMod * 100;
  if (stats.PercentLifeStealMod) out.lifeSteal = stats.PercentLifeStealMod;
  if (stats.rFlatMagicPenetrationMod)
    out.magicPenFlat = stats.rFlatMagicPenetrationMod;
  if (stats.FlatMagicPenetrationMod)
    out.magicPenFlat =
      (out.magicPenFlat ?? 0) + stats.FlatMagicPenetrationMod;
  if (stats.PercentMagicPenetrationMod)
    out.magicPenPct = stats.PercentMagicPenetrationMod;
  if (stats.rFlatArmorPenetrationMod)
    out.lethality = stats.rFlatArmorPenetrationMod;
  if (stats.PercentArmorPenetrationMod)
    out.armorPenPct = stats.PercentArmorPenetrationMod;
  const ah = (stats as Record<string, number>).FlatAbilityHasteMod;
  if (ah) out.abilityHaste = ah;
  return out;
}

/**
 * Penetration / special passives not always present in DDragon stats.
 * Includes mid-lane T3 boot upgrades.
 */
export const ITEM_PASSIVES: Record<
  string,
  { stats?: Partial<StatBlock>; note?: string }
> = {
  // Magic pen
  "3135": { stats: { magicPenPct: 0.4 }, note: "40% magic penetration" },
  "3137": { stats: { magicPenPct: 0.3 }, note: "30% magic penetration" },
  "3020": { stats: { magicPenFlat: 18 }, note: "18 flat magic pen" }, // Sorc
  "3175": { stats: { magicPenFlat: 22 }, note: "T3 · ≈22 flat magic pen" }, // Spellslinger's
  "3111": { stats: {}, note: "Mercury's — tenacity" },
  "3173": { stats: { mr: 5 }, note: "T3 Mercury's — extra tenacity/MR" },
  "4645": {
    stats: { magicPenFlat: 15 },
    note: "≈15 flat magic pen (Shadowflame simplified)",
  },
  // Armor pen / lethality
  "3036": { stats: { armorPenPct: 0.35 }, note: "35% armor penetration" },
  "3033": { stats: { armorPenPct: 0.35 }, note: "35% armor penetration" },
  "3035": { stats: { armorPenPct: 0.3 }, note: "30% armor penetration" },
  "6691": { stats: { lethality: 18 }, note: "Lethality" },
  "6692": { stats: { lethality: 18 }, note: "Lethality" },
  "6693": { stats: { lethality: 18 }, note: "Lethality" },
  "6694": { stats: { lethality: 18 }, note: "Lethality" },
  "6695": { stats: { lethality: 18 }, note: "Lethality" },
  "6696": { stats: { lethality: 18 }, note: "Lethality" },
  "6676": { stats: { lethality: 18 }, note: "Lethality" },
  "6701": { stats: { lethality: 18 }, note: "Lethality" },
  "6697": { stats: { lethality: 18 }, note: "Lethality" },
  "6698": { stats: { lethality: 18 }, note: "Lethality" },
  "6699": { stats: { lethality: 18 }, note: "Lethality" },
  // Boots haste
  "3158": { stats: { abilityHaste: 10 }, note: "Ionian · summoner + ability haste" },
  "3171": { stats: { abilityHaste: 15 }, note: "T3 Lucidity · extra haste" },
  // Deathcap
  "3089": { note: "30% increased AP (applied in builder)" },
};

/** Known mid-quest T3 boot upgrade IDs (always include) */
export const T3_BOOT_IDS = new Set([
  "3168", // Immortal Path
  "3170", // Swiftmarch
  "3171", // Crimson Lucidity
  "3172", // Gunmetal Greaves
  "3173", // Chainlaced Crushers
  "3174", // Armored Advance
  "3175", // Spellslinger's Shoes
]);

/**
 * Support shop / quest items supports actually buy.
 * Overlap with AP/tank/etc. is intentional.
 */
export const SUPPORT_ITEM_IDS = new Set([
  // Support quest line
  "3865", // World Atlas
  "3866", // Runic Compass
  "3867", // Bounty of Worlds
  "3869", // Celestial Opposition
  "3870", // Dream Maker
  "3871", // Zaz'Zak's Realmspike
  "3876", // Solstice Sleigh
  "3877", // Bloodsong
  // Enchanter / utility legendaries
  "2065", // Shurelya's Battlesong
  "3107", // Redemption
  "3222", // Mikael's Blessing
  "3504", // Ardent Censer
  "4005", // Imperial Mandate
  "6616", // Staff of Flowing Water
  "6617", // Moonstone Renewer
  "6620", // Echoes of Helia
  "6621", // Dawncore
  "3011", // Chemtech Putrifier
  // Tank / peel supports
  "3190", // Locket of the Iron Solari
  "3109", // Knight's Vow
  "3050", // Zeke's Convergence
  "3002", // Trailblazer
  // Common support components
  "1004", // Faerie Charm
  "3114", // Forbidden Idol
  "4642", // Bandleglass Mirror
  "3067", // Kindlegem
  "4641", // Stirring Wardstone
]);

/** GoldPer false-positives (not support items) */
const NOT_SUPPORT_IDS = new Set([
  "4646", // Stormsurge — mid AP, wrongly GoldPer-tagged in DDragon
]);

export function isDeathcap(id: string): boolean {
  return id === "3089" || id === "223089";
}

export function applyItems(
  items: (ItemData | null)[],
): { stats: StatBlock; notes: string[] } {
  const stats = emptyStats();
  const notes: string[] = [];
  let hasDeathcap = false;

  for (const item of items) {
    if (!item) continue;
    if (isDeathcap(item.id)) hasDeathcap = true;

    addPartial(stats, item.stats);

    const passive = ITEM_PASSIVES[item.id];
    if (passive?.stats) addPartial(stats, passive.stats);
    if (passive?.note) notes.push(`${item.name}: ${passive.note}`);
    if (item.passives)
      notes.push(...item.passives.map((p) => `${item.name}: ${p}`));
  }

  if (hasDeathcap) {
    stats.ap *= 1.3;
    notes.push("Rabadon's Deathcap: +30% AP");
  }

  return { stats, notes };
}

function addPartial(target: StatBlock, partial: Partial<StatBlock>) {
  for (const [k, v] of Object.entries(partial) as [keyof StatBlock, number][]) {
    if (typeof v === "number") {
      target[k] = (target[k] as number) + v;
    }
  }
}

type RawItem = {
  name: string;
  description: string;
  gold: { total: number; purchasable: boolean };
  stats?: Record<string, number>;
  tags?: string[];
  maps?: Record<string, boolean>;
  into?: string[];
  from?: string[];
  requiredAlly?: string;
  requiredChampion?: string;
  depth?: number;
};

function classifyItem(
  id: string,
  it: RawItem,
): ItemCategory | null {
  const tags = it.tags ?? [];
  if (tags.includes("Consumable") || tags.includes("Trinket")) return null;
  if (tags.includes("Jungle") && (it.gold?.total ?? 0) < 400) return null;

  const isT3Boot =
    T3_BOOT_IDS.has(id) ||
    (tags.includes("Boots") &&
      (it.from?.some((f) => {
        // from a finished boot that itself is not basic 1001 only
        return f !== "1001";
      }) ??
        false) &&
      (!it.into || it.into.length === 0) &&
      (it.gold?.total ?? 0) >= 900);

  // Gunmetal Greaves sometimes drops Boots tag
  if (T3_BOOT_IDS.has(id)) return "boots-t3";

  if (tags.includes("Boots") || isT3Boot) {
    if (T3_BOOT_IDS.has(id)) return "boots-t3";
    // T2 boots often still have into → T3
    if (it.into?.some((x) => T3_BOOT_IDS.has(x))) return "boots";
    if (!it.into || it.into.length === 0) {
      // finished boot that might be T2 without T3 in data
      return "boots";
    }
    return "boots";
  }

  const isFinished = !it.into || it.into.length === 0;
  if (isFinished) return "legendary";
  // Component / epic
  if ((it.gold?.total ?? 0) >= 300) return "component";
  return null;
}

/**
 * SR shop items: legendaries, components, boots, and mid T3 boot upgrades.
 */
export function filterShopItems(
  raw: Record<string, RawItem>,
  version: string,
): ItemData[] {
  const out: ItemData[] = [];

  for (const [id, it] of Object.entries(raw)) {
    if (Number(id) >= 220000) continue;
    // Quest-gated T3 boots / support line — still include for the calculator
    const forceInclude = T3_BOOT_IDS.has(id) || SUPPORT_ITEM_IDS.has(id);
    if (!forceInclude && !it.gold?.purchasable) continue;
    if (it.requiredAlly || it.requiredChampion) continue;
    if (it.maps && it.maps["11"] === false) continue;

    const category = classifyItem(id, it);
    if (!category) continue;

    // Skip pure starter junk under 300 unless boots or known support parts
    if (
      category === "component" &&
      it.gold.total < 300 &&
      !(it.tags ?? []).includes("Boots") &&
      !SUPPORT_ITEM_IDS.has(id)
    ) {
      continue;
    }

    const stats = mapDdragonStats(it.stats);
    const passive = ITEM_PASSIVES[id];
    if (passive?.stats) {
      for (const [k, v] of Object.entries(passive.stats) as [
        keyof StatBlock,
        number,
      ][]) {
        stats[k] = ((stats[k] as number | undefined) ?? 0) + v;
      }
    }

    const tags = [...(it.tags ?? [])];
    if (category === "boots-t3" && !tags.includes("Boots")) tags.push("Boots");
    if (category === "boots-t3") tags.push("BootsT3");

    out.push({
      id,
      name: it.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`,
      gold: it.gold.total,
      tags,
      stats,
      category,
      passives: passive?.note ? [passive.note] : undefined,
      description: stripHtml(it.description).slice(0, 280),
    });
  }

  // Dedupe by name keeping higher gold / prefer classic id
  const byName = new Map<string, ItemData>();
  for (const item of out) {
    const prev = byName.get(item.name);
    if (!prev || item.gold > prev.gold || (item.gold === prev.gold && item.id < prev.id)) {
      byName.set(item.name, item);
    }
  }

  return Array.from(byName.values()).sort((a, b) => {
    const catOrder = (c: ItemCategory) =>
      c === "boots-t3" ? 0 : c === "boots" ? 1 : c === "legendary" ? 2 : 3;
    const d = catOrder(a.category ?? "legendary") - catOrder(b.category ?? "legendary");
    if (d !== 0) return d;
    return a.name.localeCompare(b.name);
  });
}

export type ItemBrowseFilter =
  | "all"
  | "boots"
  | "boots-t3"
  | "legendary"
  | "component"
  | "sup"
  | "ap"
  | "ad"
  | "as"
  | "crit"
  | "tank"
  | "pen"
  | "haste";

export const ITEM_BROWSE_FILTERS: {
  id: ItemBrowseFilter;
  label: string;
  hint: string;
}[] = [
  { id: "all", label: "all", hint: "everything" },
  { id: "boots", label: "boots", hint: "T2 footwear" },
  { id: "boots-t3", label: "T3 boots", hint: "mid quest upgrades" },
  { id: "legendary", label: "full", hint: "completed items" },
  { id: "component", label: "parts", hint: "components / epics" },
  { id: "sup", label: "sup", hint: "support quest · enchanter · peel" },
  { id: "ap", label: "AP", hint: "ability power" },
  { id: "ad", label: "AD", hint: "attack damage" },
  { id: "as", label: "AS", hint: "attack speed" },
  { id: "crit", label: "crit", hint: "critical strike" },
  { id: "tank", label: "tank", hint: "HP · armor · MR" },
  { id: "pen", label: "pen", hint: "lethality · mpen" },
  { id: "haste", label: "haste", hint: "ability haste" },
];

function s(item: ItemData, key: keyof StatBlock): number {
  return (item.stats[key] as number | undefined) ?? 0;
}

function hasTag(item: ItemData, ...names: string[]): boolean {
  return names.some((n) => item.tags.includes(n));
}

/** True mage/AP item — flat AP or SpellDamage, not “haste/mana on an AD item”. */
function isApItem(item: ItemData): boolean {
  if (s(item, "ap") > 0) return true;
  if (hasTag(item, "SpellDamage")) return true;
  return false;
}

/** Physical damage item — flat AD or Damage tag without SpellDamage. */
function isAdItem(item: ItemData): boolean {
  if (s(item, "ad") > 0) return true;
  if (hasTag(item, "Damage") && !hasTag(item, "SpellDamage")) return true;
  return false;
}

/**
 * Defensive / frontline — armor, MR, or real HP budget.
 * Excludes pure damage items that only tag Health loosely.
 */
function isTankItem(item: ItemData): boolean {
  const armor = s(item, "armor");
  const mr = s(item, "mr");
  const hp = s(item, "hp");
  const ap = s(item, "ap");
  const ad = s(item, "ad");

  // Real resists always count (Zhonya armor, Spirit Visage MR, etc.)
  if (armor > 0 || mr > 0) return true;

  // Substantial HP without being a pure damage stick
  if (hp >= 250) {
    // Bruiser hybrids (Cleaver, Trinity) OK; pure lethality with tiny HP no
    if (ad >= 50 && armor === 0 && mr === 0 && hp < 300) return false;
    return true;
  }

  // Tagged tanks / supports with defensive kits
  if (
    hasTag(item, "Armor", "SpellBlock", "MagicResist") &&
    (hasTag(item, "Health") || armor > 0 || mr > 0)
  ) {
    return true;
  }

  // Aura tanks (Locket, etc.) with Health + resists tags
  if (
    hasTag(item, "Health") &&
    hasTag(item, "Aura", "Active") &&
    hasTag(item, "Armor", "SpellBlock", "MagicResist")
  ) {
    return true;
  }

  // Don't let pure AP/AD through on Health tag alone
  if (ap > 0 || ad > 0) return false;
  if (hasTag(item, "Health") && hp > 0) return true;

  return false;
}

function isPenItem(item: ItemData): boolean {
  if (s(item, "lethality") > 0) return true;
  if (s(item, "magicPenFlat") > 0) return true;
  if (s(item, "magicPenPct") > 0) return true;
  if (s(item, "armorPenPct") > 0) return true;
  if (hasTag(item, "ArmorPenetration", "MagicPenetration")) return true;
  return false;
}

function isHasteItem(item: ItemData): boolean {
  if (s(item, "abilityHaste") > 0) return true;
  if (hasTag(item, "AbilityHaste", "CooldownReduction")) return true;
  return false;
}

/**
 * Items supports buy: quest starters, enchanters, peel, common parts.
 * Overlap with AP/tank/haste is fine.
 */
export function isSupportItem(item: ItemData): boolean {
  if (NOT_SUPPORT_IDS.has(item.id)) return false;
  if (SUPPORT_ITEM_IDS.has(item.id)) return true;

  // Support quest / gold generation (exclude known false positives above)
  if (hasTag(item, "GoldPer") && hasTag(item, "Vision", "Lane")) return true;
  if (hasTag(item, "GoldPer") && hasTag(item, "ManaRegen") && !isAdItem(item))
    return true;

  // Vision tools that aren't trinkets or lethality ward clears
  if (
    hasTag(item, "Vision") &&
    !hasTag(item, "Trinket") &&
    !hasTag(item, "Damage") &&
    !hasTag(item, "ArmorPenetration")
  ) {
    return true;
  }

  // Enchanter core pattern: heal/shield AP + mana regen
  if (hasTag(item, "SpellDamage") && hasTag(item, "ManaRegen")) return true;

  // Peel supports by name (stable across patches)
  const n = item.name.toLowerCase();
  if (
    /locket|knight'?s vow|zeke|redemption|mikael|ardent|shurelya|moonstone|mandate|helia|dawncore|flowing water|putrifier|trailblazer|bandleglass|forbidden idol|world atlas|runic compass|bounty of worlds|celestial opposition|dream maker|realmspike|solstice sleigh|bloodsong|wardstone/i.test(
      n,
    )
  ) {
    return true;
  }

  // Classic support components
  if (
    (n === "faerie charm" || n === "kindlegem") &&
    item.category === "component"
  ) {
    return true;
  }

  return false;
}

export function filterItemsBrowse(
  items: ItemData[],
  filter: ItemBrowseFilter,
  query: string,
): ItemData[] {
  const q = query.trim().toLowerCase();
  let list = items;

  switch (filter) {
    case "boots":
      list = list.filter(
        (i) =>
          i.category === "boots" ||
          (i.tags.includes("Boots") && i.category !== "boots-t3"),
      );
      break;
    case "boots-t3":
      list = list.filter(
        (i) =>
          i.category === "boots-t3" ||
          i.tags.includes("BootsT3") ||
          T3_BOOT_IDS.has(i.id),
      );
      break;
    case "legendary":
      list = list.filter((i) => i.category === "legendary");
      break;
    case "component":
      list = list.filter((i) => i.category === "component");
      break;
    case "sup":
      list = list.filter(isSupportItem);
      break;
    case "ap":
      // Stats/tags only — no Mana/AbilityHaste (those polluted AD & tank)
      list = list.filter(isApItem);
      break;
    case "ad":
      list = list.filter(isAdItem);
      break;
    case "as":
      list = list.filter(
        (i) => s(i, "attackSpeed") > 0 || hasTag(i, "AttackSpeed"),
      );
      break;
    case "crit":
      list = list.filter(
        (i) => s(i, "crit") > 0 || hasTag(i, "CriticalStrike"),
      );
      break;
    case "tank":
      list = list.filter(isTankItem);
      break;
    case "pen":
      list = list.filter(isPenItem);
      break;
    case "haste":
      list = list.filter(isHasteItem);
      break;
    default:
      break;
  }

  if (q) {
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        (i.description?.toLowerCase().includes(q) ?? false),
    );
  }

  // Within role filters, sort damage-relevant first
  if (filter === "ap") {
    list = [...list].sort((a, b) => s(b, "ap") - s(a, "ap") || a.name.localeCompare(b.name));
  } else if (filter === "ad") {
    list = [...list].sort((a, b) => s(b, "ad") - s(a, "ad") || a.name.localeCompare(b.name));
  } else if (filter === "tank") {
    list = [...list].sort(
      (a, b) =>
        s(b, "hp") + s(b, "armor") * 5 + s(b, "mr") * 5 -
          (s(a, "hp") + s(a, "armor") * 5 + s(a, "mr") * 5) ||
        a.name.localeCompare(b.name),
    );
  } else if (filter === "sup") {
    // Quest items first, then legendaries by gold, then parts
    list = [...list].sort((a, b) => {
      const rank = (i: ItemData) =>
        SUPPORT_ITEM_IDS.has(i.id) && hasTag(i, "GoldPer")
          ? 0
          : SUPPORT_ITEM_IDS.has(i.id)
            ? 1
            : i.category === "component"
              ? 3
              : 2;
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return b.gold - a.gold || a.name.localeCompare(b.name);
    });
  }

  return list.slice(0, q ? 120 : 100);
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
