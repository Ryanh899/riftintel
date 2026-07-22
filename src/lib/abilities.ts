/**
 * Normalize ability slots to P / Q / W / E / R (and BASE / GEN for non-skills).
 */
import abilityLetters from "@/data/assets/ability-letters.json";

const BY_NAME = (abilityLetters as { byName: Record<string, string> }).byName;

export type AbilityLetter = "P" | "Q" | "W" | "E" | "R";
export type AbilitySlot = AbilityLetter | "BASE" | "GEN" | "SYS" | "OTHER";

export interface AbilityLabel {
  /** Short key for tight UI */
  letter: AbilitySlot;
  /** Display letter (always single token) */
  key: string;
  /** Human name when known */
  name: string;
  /** "Q · Charm" or "Q" compact */
  full: string;
  compact: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse ability field from patch notes or calculator */
export function resolveAbilityLabel(
  ability: string | null | undefined,
  title?: string | null,
): AbilityLabel {
  const raw = (ability || title || "").trim();
  const titleName = (title || "").trim();

  // Explicit letter already
  const explicit = raw.toUpperCase();
  if (/^[PQWER]$/.test(explicit)) {
    const name = titleName && !/^[PQWER]$/i.test(titleName) ? titleName : raw;
    return make(explicit as AbilityLetter, name === explicit ? "" : name);
  }

  // "Q - Name" / "Q: Name" / "(Q) Name"
  const prefixed = raw.match(/^\(?([PQWERpqwer])\)?\s*[-:–.]\s*(.+)$/);
  if (prefixed) {
    return make(prefixed[1].toUpperCase() as AbilityLetter, prefixed[2].trim());
  }

  const low = normalize(raw);

  // Structural slots from wiki
  if (
    low === "base stats" ||
    low === "stats" ||
    low === "base" ||
    low.startsWith("base stat")
  ) {
    return make("BASE", "Base stats");
  }
  if (low === "general" || low === "misc") {
    return make("GEN", titleName || "General");
  }
  if (low === "system" || low === "map" || low === "passive" && !titleName) {
    if (low === "system" || low === "map") return make("SYS", raw || "System");
  }
  if (low === "passive" || low === "innate") {
    return make("P", titleName && titleName.toLowerCase() !== "passive" ? titleName : "Passive");
  }

  // Lookup by ability name in Meraki map
  const fromMap =
    BY_NAME[low] ||
    BY_NAME[low.replace(/[^a-z0-9 ]/g, "").trim()] ||
    (titleName ? BY_NAME[normalize(titleName)] : undefined);

  if (fromMap && /^[PQWER]$/.test(fromMap)) {
    const name = titleName && !/^[PQWER]$/i.test(titleName) ? titleName : raw;
    return make(fromMap as AbilityLetter, name);
  }

  // title might be the spell name while ability is something else
  if (titleName) {
    const tMap = BY_NAME[normalize(titleName)];
    if (tMap && /^[PQWER]$/.test(tMap)) {
      return make(tMap as AbilityLetter, titleName);
    }
  }

  // Fallback: use name only, OTHER key
  return make("OTHER", raw || titleName || "Ability");
}

function make(letter: AbilitySlot, name: string): AbilityLabel {
  const key =
    letter === "BASE"
      ? "BASE"
      : letter === "GEN"
        ? "GEN"
        : letter === "SYS"
          ? "SYS"
          : letter === "OTHER"
            ? "·"
            : letter;
  const cleanName = name && name !== key ? name : "";
  return {
    letter,
    key,
    name: cleanName || (letter === "BASE" ? "Base stats" : letter === "P" ? "Passive" : ""),
    full: cleanName ? `${key} · ${cleanName}` : key,
    compact: key,
  };
}

export function abilityKeyClass(letter: AbilitySlot | string): string {
  switch (letter) {
    case "P":
      return "text-adjust";
    case "Q":
      return "text-buff";
    case "W":
      return "text-accent";
    case "E":
      return "text-rework";
    case "R":
      return "text-nerf";
    case "BASE":
      return "text-muted";
    default:
      return "text-[var(--fg-dim)]";
  }
}
