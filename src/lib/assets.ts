/**
 * Resolve champion/item images for the current Data Dragon patch.
 * Uses name maps so missing assetKey in ingested data still shows icons.
 */

import championKeys from "@/data/assets/champion-keys.json";
import itemIds from "@/data/assets/item-ids.json";
import ddragonVersion from "@/data/assets/ddragon-version.json";

export const DDRAGON_VERSION: string =
  (ddragonVersion as { version: string }).version || "16.14.1";

const CHAMP_KEYS = championKeys as Record<string, string>;
const ITEM_IDS = itemIds as Record<string, string>;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’.]/g, "")
    .replace(/\s+/g, " ");
}

function compactName(name: string): string {
  return normalizeName(name).replace(/[^a-z0-9]/g, "");
}

/** Data Dragon champion file key (e.g. MonkeyKing, Ahri) */
export function resolveChampionKey(
  name: string,
  assetKey?: string | null,
): string | null {
  if (assetKey && assetKey.length > 0 && !assetKey.includes(" ")) {
    // Prefer known key; still allow passthrough
    if (CHAMP_KEYS[assetKey.toLowerCase()] || /^[A-Za-z0-9]+$/.test(assetKey)) {
      return CHAMP_KEYS[assetKey.toLowerCase()] || assetKey;
    }
  }

  const n = normalizeName(name);
  if (CHAMP_KEYS[n]) return CHAMP_KEYS[n];
  if (CHAMP_KEYS[compactName(name)]) return CHAMP_KEYS[compactName(name)];

  // Partial: "Kled & Skaarl" → try first token
  const first = n.split(/[&/]/)[0]?.trim();
  if (first && CHAMP_KEYS[first]) return CHAMP_KEYS[first];
  if (first && CHAMP_KEYS[compactName(first)]) return CHAMP_KEYS[compactName(first)];

  // Mega Gnar → Gnar
  if (n.includes("gnar") && CHAMP_KEYS["gnar"]) return CHAMP_KEYS["gnar"];
  if (n.includes("kled") && CHAMP_KEYS["kled"]) return CHAMP_KEYS["kled"];

  return assetKey || null;
}

export function resolveItemId(
  name: string,
  assetKey?: string | null,
): string | null {
  if (assetKey && /^\d+$/.test(assetKey) && Number(assetKey) < 220000) {
    return assetKey;
  }
  const n = normalizeName(name);
  if (ITEM_IDS[n]) return ITEM_IDS[n];
  // fuzzy contains
  const compact = compactName(name);
  for (const [iname, id] of Object.entries(ITEM_IDS)) {
    if (compactName(iname) === compact) return id;
  }
  // partial match for renames (Navori Quickblades → Navori Flickerblade)
  const tokens = n.split(" ").filter((t) => t.length > 3);
  if (tokens.length) {
    let best: { id: string; score: number } | null = null;
    for (const [iname, id] of Object.entries(ITEM_IDS)) {
      const score = tokens.filter((t) => iname.includes(t)).length;
      if (score >= Math.min(2, tokens.length) && (!best || score > best.score)) {
        best = { id, score };
      }
    }
    if (best) return best.id;
  }
  return null;
}

export function championImageUrl(
  name: string,
  assetKey?: string | null,
  version = DDRAGON_VERSION,
): string | null {
  const key = resolveChampionKey(name, assetKey);
  if (!key) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${key}.png`;
}

/** Community Dragon fallback (by champion key or name slug) */
export function championImageFallback(
  name: string,
  assetKey?: string | null,
): string | null {
  const key = resolveChampionKey(name, assetKey);
  if (!key) return null;
  return `https://cdn.communitydragon.org/latest/champion/${key}/square`;
}

export function itemImageUrl(
  name: string,
  assetKey?: string | null,
  version = DDRAGON_VERSION,
): string | null {
  const id = resolveItemId(name, assetKey);
  if (!id) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`;
}

export function entityImageCandidates(
  type: string,
  name: string,
  assetKey?: string | null,
): string[] {
  const out: string[] = [];
  if (type === "champion") {
    const primary = championImageUrl(name, assetKey);
    const fallback = championImageFallback(name, assetKey);
    if (primary) out.push(primary);
    if (fallback && fallback !== primary) out.push(fallback);
  } else if (type === "item") {
    const primary = itemImageUrl(name, assetKey);
    if (primary) out.push(primary);
    // try raw assetKey as id even if high
    if (assetKey && /^\d+$/.test(assetKey)) {
      out.push(
        `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${assetKey}.png`,
      );
    }
  }
  return out;
}
