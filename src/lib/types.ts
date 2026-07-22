export type ChangeDirection =
  | "buff"
  | "nerf"
  | "adjust"
  | "rework"
  | "new"
  | "remove";

export type Role = "top" | "jungle" | "mid" | "bot" | "support";

export type EntityType = "champion" | "item" | "system" | "rune";

export type Severity = 1 | 2 | 3;

export interface StatLine {
  label: string;
  before?: string;
  after?: string;
  delta?: string;
  note?: string;
}

export interface AbilityChange {
  ability: string;
  title?: string | null;
  direction: ChangeDirection;
  lines: StatLine[];
}

export interface EntityChange {
  id: string;
  name: string;
  type: EntityType;
  assetKey?: string | null;
  roles?: Role[];
  direction: ChangeDirection;
  severity: Severity;
  tldr: string;
  gameplayImpact: string;
  context?: string | null;
  changes: AbilityChange[];
  tags?: string[];
}

export interface PatchTheme {
  title: string;
  description: string;
}

export interface Patch {
  id: string;
  version: string;
  title: string;
  releaseDate: string;
  season?: string;
  themes: PatchTheme[];
  summary: string;
  champions: EntityChange[];
  items: EntityChange[];
  systems: EntityChange[];
  sourceUrl?: string;
  source?: string;
  wikiPage?: string;
}

export interface PatchIndexEntry {
  id: string;
  version: string;
  title: string;
  releaseDate: string;
  championCount: number;
  itemCount: number;
  buffCount: number;
  nerfCount: number;
  adjustCount: number;
}

export interface PatchManifest {
  generatedAt: string;
  patches: PatchIndexEntry[];
}

export interface ChampionIndexEntry {
  slug: string;
  name: string;
  assetKey?: string | null;
  changeCount: number;
  lastPatch?: string | null;
  lastDirection?: ChangeDirection | null;
}

export interface ChampionHistoryEntry {
  patchId: string;
  version: string;
  releaseDate: string;
  change: EntityChange;
}

export interface ChampionHistory {
  slug: string;
  name: string;
  assetKey?: string | null;
  entries: ChampionHistoryEntry[];
}

export type FilterDirection = ChangeDirection | "all";
export type FilterRole = Role | "all";
export type FilterType = EntityType | "all";
