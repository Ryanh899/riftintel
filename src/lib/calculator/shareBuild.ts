import type { ItemData } from "./types";

export function itemIds(slots: (ItemData | null)[]): string[] {
  return slots.map((item) => item?.id ?? "").filter(Boolean);
}

export function slotsFromParam(
  value: string | null | undefined,
  items: ItemData[],
  slotCount = 6,
): (ItemData | null)[] {
  const ids = (value ?? "").split(",").filter(Boolean).slice(0, slotCount);
  const byId = new Map(items.map((item) => [item.id, item]));
  return Array.from(
    { length: slotCount },
    (_, index) => byId.get(ids[index] ?? "") ?? null,
  );
}

export function buildComparisonParams(input: {
  championId: string;
  level: number;
  buildA: (ItemData | null)[];
  buildB: (ItemData | null)[];
  runeIds: string[];
  ranks: Record<string, number>;
  target: { armor: number; mr: number; hp: number };
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("champ", input.championId);
  params.set("level", String(input.level));
  params.set("a", itemIds(input.buildA).join(","));
  params.set("b", itemIds(input.buildB).join(","));
  if (input.runeIds.length) params.set("runes", input.runeIds.join(","));
  params.set(
    "ranks",
    ["Q", "W", "E", "R"].map((key) => input.ranks[key] ?? 0).join(","),
  );
  params.set("armor", String(Math.round(input.target.armor)));
  params.set("mr", String(Math.round(input.target.mr)));
  params.set("hp", String(Math.round(input.target.hp)));
  return params;
}
