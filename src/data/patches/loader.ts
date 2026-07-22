import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import type {
  ChampionHistory,
  ChampionIndexEntry,
  Patch,
  PatchIndexEntry,
  PatchManifest,
} from "@/lib/types";

const DATA_ROOT = path.join(process.cwd(), "src", "data");
const BY_ID = path.join(DATA_ROOT, "patches", "by-id");
const MANIFEST = path.join(DATA_ROOT, "patches", "manifest.json");
const CHAMP_DIR = path.join(DATA_ROOT, "champions");
const CHAMP_INDEX = path.join(CHAMP_DIR, "index.json");

function readJson<T>(file: string): T | null {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}

/** Sample patches kept as fallback if ingest has not been run yet */
import { patch_15_1 } from "./15.1";
import { patch_14_24 } from "./14.24";
import { patch_14_23 } from "./14.23";

const FALLBACK: Patch[] = [patch_15_1, patch_14_24, patch_14_23];

export function getManifest(): PatchManifest {
  const m = readJson<PatchManifest>(MANIFEST);
  if (m?.patches?.length) return m;

  return {
    generatedAt: new Date().toISOString(),
    patches: FALLBACK.map((p) => ({
      id: p.id,
      version: p.version,
      title: p.title,
      releaseDate: p.releaseDate,
      championCount: p.champions.length,
      itemCount: p.items.length,
      buffCount: p.champions.filter((c) => c.direction === "buff").length,
      nerfCount: p.champions.filter((c) => c.direction === "nerf").length,
      adjustCount: p.champions.filter((c) =>
        ["adjust", "rework"].includes(c.direction),
      ).length,
    })),
  };
}

export function getPatchIndex(): PatchIndexEntry[] {
  return getManifest().patches;
}

export function getLatestPatch(): Patch {
  const index = getPatchIndex();
  if (index.length) {
    const p = getPatch(index[0].id);
    if (p) return p;
  }
  return FALLBACK[0];
}

export function getPatch(id: string): Patch | undefined {
  const file = path.join(BY_ID, `${id}.json`);
  const fromDisk = readJson<Patch>(file);
  if (fromDisk) return fromDisk;
  return FALLBACK.find((p) => p.id === id || p.version === id);
}

export function getAllPatches(): Patch[] {
  if (existsSync(BY_ID)) {
    const files = readdirSync(BY_ID).filter((f) => f.endsWith(".json"));
    if (files.length) {
      const patches = files
        .map((f) => readJson<Patch>(path.join(BY_ID, f)))
        .filter((p): p is Patch => Boolean(p));
      return patches.sort((a, b) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );
    }
  }
  return FALLBACK;
}

export function getAllPatchIds(): string[] {
  return getPatchIndex().map((p) => p.id);
}

export function getChampionIndex(): ChampionIndexEntry[] {
  const idx = readJson<ChampionIndexEntry[]>(CHAMP_INDEX);
  if (idx?.length) return idx;

  // Fallback: derive from sample patches
  const map = new Map<string, ChampionIndexEntry>();
  for (const p of FALLBACK) {
    for (const ch of p.champions) {
      const slug = ch.id;
      const prev = map.get(slug);
      if (!prev) {
        map.set(slug, {
          slug,
          name: ch.name,
          assetKey: ch.assetKey,
          changeCount: 1,
          lastPatch: p.version,
          lastDirection: ch.direction,
        });
      } else {
        prev.changeCount += 1;
        prev.lastPatch = p.version;
        prev.lastDirection = ch.direction;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getChampionHistory(slug: string): ChampionHistory | null {
  const file = path.join(CHAMP_DIR, `${slug}.json`);
  const fromDisk = readJson<ChampionHistory>(file);
  if (fromDisk) return fromDisk;

  // Fallback from sample patches
  const entries = [];
  let name = "";
  let assetKey: string | undefined;
  for (const p of [...FALLBACK].reverse()) {
    for (const ch of p.champions) {
      if (ch.id === slug) {
        name = ch.name;
        assetKey = ch.assetKey ?? undefined;
        entries.push({
          patchId: p.id,
          version: p.version,
          releaseDate: p.releaseDate,
          change: ch,
        });
      }
    }
  }
  if (!name) return null;
  return { slug, name, assetKey, entries };
}

export function getItemHistory(slug: string): ChampionHistory | null {
  const entries = [];
  let name = "";
  let assetKey: string | undefined | null;
  for (const p of [...getAllPatches()].reverse()) {
    for (const item of p.items) {
      if (item.id === slug) {
        name = item.name;
        assetKey = item.assetKey;
        entries.push({
          patchId: p.id,
          version: p.version,
          releaseDate: p.releaseDate,
          change: item,
        });
      }
    }
  }
  if (!name) return null;
  return { slug, name, assetKey, entries };
}
