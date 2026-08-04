import type { MetadataRoute } from "next";
import { getAllPatches, getChampionIndex, getPatchIndex } from "@/data/patches";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const patchesIndex = getPatchIndex();
  const patchDate = new Map(patchesIndex.map((patch) => [patch.id, patch.releaseDate]));
  const allPatches = getAllPatches();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/patches`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/champions`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/calculator`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/worlds`,
      lastModified: new Date("2026-08-04T12:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date("2026-08-04T12:00:00Z"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date("2026-08-04T12:00:00Z"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const patches = patchesIndex.map((p) => ({
    url: `${SITE_URL}/patches/${p.id}`,
    lastModified: p.releaseDate ? new Date(p.releaseDate) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const champs = getChampionIndex().map((c) => ({
    url: `${SITE_URL}/champions/${c.slug}`,
    lastModified: c.lastPatch && patchDate.get(c.lastPatch)
      ? new Date(patchDate.get(c.lastPatch)!)
      : now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  const itemLatest = new Map<string, string>();
  for (const patch of [...allPatches].reverse()) {
    for (const item of patch.items) itemLatest.set(item.id, patch.releaseDate);
  }
  const items = [...itemLatest].map(([slug, releaseDate]) => ({
    url: `${SITE_URL}/items/${slug}`,
    lastModified: new Date(releaseDate),
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  return [...staticRoutes, ...patches, ...champs, ...items];
}
