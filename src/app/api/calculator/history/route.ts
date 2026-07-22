import { NextRequest, NextResponse } from "next/server";
import { getChampionHistory } from "@/data/patches";
import { slugify } from "@/lib/utils";

export const revalidate = 3600;

/**
 * Balance history for a champion (patch-note numbers).
 * Used by the damage calculator's "vs patch" compare strip.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const name = req.nextUrl.searchParams.get("name");
  if (!id && !name) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
  }

  const candidates = [
    id ? slugify(id) : "",
    name ? slugify(name) : "",
    id?.toLowerCase() ?? "",
  ].filter(Boolean);

  let history = null;
  for (const slug of candidates) {
    history = getChampionHistory(slug);
    if (history?.entries?.length) break;
  }

  if (!history) {
    return NextResponse.json(
      { slug: candidates[0], name: name || id, entries: [] },
      { status: 200 },
    );
  }

  return NextResponse.json(history);
}
