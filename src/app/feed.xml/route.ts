import { getPatchIndex } from "@/data/patches";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const items = getPatchIndex().slice(0, 25).map((patch) => `
    <item>
      <title>League of Legends Patch ${escapeXml(patch.version)}</title>
      <link>${SITE_URL}/patches/${encodeURIComponent(patch.id)}</link>
      <guid isPermaLink="true">${SITE_URL}/patches/${encodeURIComponent(patch.id)}</guid>
      <pubDate>${new Date(`${patch.releaseDate}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(`${patch.championCount} champions and ${patch.itemCount} items tracked. ${patch.buffCount} buffs, ${patch.nerfCount} nerfs, ${patch.adjustCount} adjustments.`)}</description>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME} patch feed</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
