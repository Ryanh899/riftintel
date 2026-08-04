import type { ItemData } from "./types";
import { filterShopItems } from "./items";
import { readFileSync } from "fs";
import path from "path";

const DDRAGON_VERSIONS = "https://ddragon.leagueoflegends.com/api/versions.json";
export async function getLatestDdragonVersion(): Promise<string> {
  const res = await fetch(DDRAGON_VERSIONS, { cache: "force-cache" });
  const versions: string[] = await res.json();
  return versions[0];
}

export interface ChampionListEntry {
  id: string;
  key: string;
  name: string;
  icon: string;
}

export function readGeneratedChampionList(): ChampionListEntry[] {
  const file = path.join(
    process.cwd(),
    "public",
    "generated",
    "kits",
    "index.json",
  );
  return JSON.parse(readFileSync(file, "utf8")) as ChampionListEntry[];
}

export async function fetchItems(version: string): Promise<ItemData[]> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
    { cache: "force-cache" },
  );
  const data = await res.json();
  return filterShopItems(data.data, version);
}
