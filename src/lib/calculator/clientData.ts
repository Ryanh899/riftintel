import type { ChampionData } from "./types";
import type { ChampionHistory } from "@/lib/types";
import { slugify } from "@/lib/utils";

const MERAKI_NAME_FIXES: Record<string, string> = {
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

export async function fetchChampionKitDirect(
  nameOrId: string,
): Promise<ChampionData> {
  const candidates = [
    MERAKI_NAME_FIXES[nameOrId],
    nameOrId,
    nameOrId.replace(/([a-z])([A-Z])/g, "$1 $2"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const name of [...new Set(candidates)]) {
    const response = await fetch(`/generated/kits/${encodeURIComponent(name)}.json`);
    if (!response.ok) continue;
    return (await response.json()) as ChampionData;
  }
  throw new Error(`Current static kit data is unavailable for ${nameOrId}.`);
}

export async function fetchVerifiedChampionHistory(
  id: string,
  name: string,
): Promise<ChampionHistory | null> {
  const candidates = [...new Set([slugify(id), slugify(name), id.toLowerCase()])];
  for (const slug of candidates) {
    const response = await fetch(`/generated/champions/${encodeURIComponent(slug)}.json`);
    if (!response.ok) continue;
    const history = (await response.json()) as ChampionHistory;
    if (history.entries?.length) return history;
  }
  return null;
}
