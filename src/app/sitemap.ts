import type { MetadataRoute } from "next";
import { getChampionIndex, getPatchIndex } from "@/data/patches";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
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
  ];

  const patches = getPatchIndex().map((p) => ({
    url: `${SITE_URL}/patches/${p.id}`,
    lastModified: p.releaseDate ? new Date(p.releaseDate) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const champs = getChampionIndex().map((c) => ({
    url: `${SITE_URL}/champions/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...patches, ...champs];
}
