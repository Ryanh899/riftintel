import { clsx, type ClassValue } from "clsx";
import type {
  ChangeDirection,
  EntityChange,
  FilterDirection,
  FilterRole,
  FilterType,
  Patch,
  Severity,
} from "./types";
import { championImageUrl, itemImageUrl, DDRAGON_VERSION } from "./assets";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function directionLabel(d: ChangeDirection): string {
  switch (d) {
    case "buff":
      return "Buff";
    case "nerf":
      return "Nerf";
    case "adjust":
      return "Adjust";
    case "rework":
      return "Rework";
    case "new":
      return "New";
    case "remove":
      return "Removed";
  }
}

export function directionColor(d: ChangeDirection): string {
  switch (d) {
    case "buff":
      return "text-buff border-buff/40 bg-buff/10";
    case "nerf":
      return "text-nerf border-nerf/40 bg-nerf/10";
    case "adjust":
      return "text-adjust border-adjust/40 bg-adjust/10";
    case "rework":
      return "text-rework border-rework/40 bg-rework/10";
    case "new":
      return "text-new border-new/40 bg-new/10";
    case "remove":
      return "text-muted border-border bg-surface-2";
  }
}

export function directionSolid(d: ChangeDirection): string {
  switch (d) {
    case "buff":
      return "bg-buff text-black";
    case "nerf":
      return "bg-nerf text-white";
    case "adjust":
      return "bg-adjust text-black";
    case "rework":
      return "bg-rework text-white";
    case "new":
      return "bg-new text-black";
    case "remove":
      return "bg-muted text-white";
  }
}

export function severityLabel(s: Severity): string {
  return s === 1 ? "Minor" : s === 2 ? "Notable" : "Major";
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    top: "Top",
    jungle: "Jungle",
    mid: "Mid",
    bot: "Bot",
    support: "Support",
  };
  return map[role] ?? role;
}

export function championImage(
  assetKey: string | null | undefined,
  version = DDRAGON_VERSION,
): string | null {
  // assetKey may be ddragon key; also allow using it as name fallback
  if (!assetKey) return null;
  return (
    championImageUrl(assetKey, assetKey, version) ||
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${assetKey}.png`
  );
}

export function itemImage(
  itemId: string | null | undefined,
  version = DDRAGON_VERSION,
): string | null {
  if (!itemId) return null;
  return (
    itemImageUrl(itemId, itemId, version) ||
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`
  );
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function countByDirection(entities: EntityChange[]) {
  return entities.reduce(
    (acc, e) => {
      acc[e.direction] = (acc[e.direction] ?? 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );
}

export function allEntities(patch: Patch): EntityChange[] {
  return [...patch.champions, ...patch.items, ...patch.systems];
}

export function filterEntities(
  entities: EntityChange[],
  opts: {
    direction?: FilterDirection;
    role?: FilterRole;
    type?: FilterType;
    query?: string;
  },
): EntityChange[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  return entities.filter((e) => {
    if (opts.direction && opts.direction !== "all" && e.direction !== opts.direction)
      return false;
    if (opts.type && opts.type !== "all" && e.type !== opts.type) return false;
    if (
      opts.role &&
      opts.role !== "all" &&
      e.type === "champion" &&
      !(e.roles ?? []).includes(opts.role)
    )
      return false;
    if (q) {
      const hay = [
        e.name,
        e.tldr,
        e.gameplayImpact,
        ...(e.tags ?? []),
        ...(e.roles ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function entityAnchorId(entity: EntityChange): string {
  return `${entity.type}-${slugify(entity.name)}`;
}
