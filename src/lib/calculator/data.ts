import type { AbilityData, ChampionData, ItemData } from "./types";
import { filterShopItems } from "./items";

const DDRAGON_VERSIONS = "https://ddragon.leagueoflegends.com/api/versions.json";
const MERAKI_CHAMP = (name: string) =>
  `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/${encodeURIComponent(name)}.json`;
const MERAKI_LIST =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json";

export async function getLatestDdragonVersion(): Promise<string> {
  const res = await fetch(DDRAGON_VERSIONS, { next: { revalidate: 3600 } });
  const versions: string[] = await res.json();
  return versions[0];
}

export interface ChampionListEntry {
  id: string;
  key: string;
  name: string;
  icon: string;
}

/** Lightweight champion list for picker — uses Meraki index keys */
export async function fetchChampionList(
  version: string,
): Promise<ChampionListEntry[]> {
  // Prefer Data Dragon champion.json for icons/keys (smaller than full Meraki dump)
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { next: { revalidate: 3600 } },
  );
  const data = await res.json();
  return Object.values(data.data as Record<string, { id: string; key: string; name: string }>)
    .map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchItems(version: string): Promise<ItemData[]> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
    { next: { revalidate: 3600 } },
  );
  const data = await res.json();
  return filterShopItems(data.data, version);
}

/** Full champion kit from Meraki (current patch ability formulas) */
export async function fetchChampionKit(nameOrId: string): Promise<ChampionData> {
  // Meraki uses proper names: "Ahri", "JarvanIV" might be "Jarvan IV" — try id first
  const candidates = [nameOrId, nameOrId.replace(/([a-z])([A-Z])/g, "$1 $2")];
  // Known Meraki name fixes
  const map: Record<string, string> = {
    MonkeyKing: "Wukong",
    Belveth: "Bel'Veth",
    Chogath: "Cho'Gath",
    Kaisa: "Kai'Sa",
    Khazix: "Kha'Zix",
    KogMaw: "Kog'Maw",
    Leblanc: "LeBlanc",
    LeeSin: "Lee Sin",
    MasterYi: "Master Yi",
    MissFortune: "Miss Fortune",
    Nunu: "Nunu & Willump",
    RekSai: "Rek'Sai",
    Renata: "Renata Glasc",
    TahmKench: "Tahm Kench",
    TwistedFate: "Twisted Fate",
    Velkoz: "Vel'Koz",
    XinZhao: "Xin Zhao",
    JarvanIV: "Jarvan IV",
    DrMundo: "Dr. Mundo",
  };
  if (map[nameOrId]) candidates.unshift(map[nameOrId]);

  let lastErr: unknown;
  for (const name of candidates) {
    try {
      const res = await fetch(MERAKI_CHAMP(name), {
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const raw = await res.json();
      return normalizeMerakiChampion(raw);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error(`Champion not found: ${nameOrId}`);
}

function normalizeMerakiChampion(raw: Record<string, unknown>): ChampionData {
  const stats = raw.stats as ChampionData["stats"];
  const abilitiesRaw = raw.abilities as Record<
    string,
    Array<Record<string, unknown>>
  >;

  const abilities: AbilityData[] = [];
  for (const key of ["P", "Q", "W", "E", "R"] as const) {
    const list = abilitiesRaw?.[key];
    if (!list?.length) continue;
    // Prefer first form / base ability
    const ab = list[0];
    const effects = (ab.effects as Array<Record<string, unknown>>) || [];
    abilities.push({
      key,
      name: String(ab.name || key),
      icon: ab.icon ? String(ab.icon) : undefined,
      damageType: ab.damageType ? String(ab.damageType) : null,
      maxRank: key === "R" ? 3 : key === "P" ? 1 : 5,
      effects: effects.map((ef) => ({
        description: String(ef.description || ""),
        leveling: ((ef.leveling as Array<Record<string, unknown>>) || []).map(
          (lv) => ({
            attribute: String(lv.attribute || "Effect"),
            modifiers: (
              (lv.modifiers as Array<{ values: number[]; units: string[] }>) ||
              []
            ).map((m) => ({
              values: m.values || [0],
              units: m.units || [""],
            })),
          }),
        ),
      })),
    });
  }

  return {
    id: String(raw.key || raw.id || raw.name),
    key: String(raw.key || ""),
    name: String(raw.name),
    title: String(raw.title || ""),
    icon: String(raw.icon || ""),
    attackType: raw.attackType ? String(raw.attackType) : undefined,
    adaptiveType: raw.adaptiveType ? String(raw.adaptiveType) : undefined,
    stats: {
      health: statPair(stats?.health),
      mana: stats?.mana ? statPair(stats.mana) : undefined,
      armor: statPair(stats?.armor),
      magicResistance: statPair(stats?.magicResistance),
      attackDamage: statPair(stats?.attackDamage),
      attackSpeed: stats?.attackSpeed
        ? statPair(stats.attackSpeed)
        : undefined,
      movespeed: stats?.movespeed
        ? { flat: Number(stats.movespeed.flat) || 0, perLevel: 0 }
        : undefined,
    },
    abilities,
  };
}

function statPair(s: { flat?: number; perLevel?: number } | undefined) {
  return {
    flat: Number(s?.flat) || 0,
    perLevel: Number(s?.perLevel) || 0,
  };
}

// silence unused
void MERAKI_LIST;
