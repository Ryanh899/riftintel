import { NextRequest, NextResponse } from "next/server";
import { fetchChampionKit } from "@/lib/calculator/data";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const kit = await fetchChampionKit(id);
    return NextResponse.json(kit);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load champion";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
