import type { DataQuality } from "./types";

export const VERIFIED_PATCH_IDS = new Set(["26.07", "26.15"]);

export const EXCLUDED_ALTERNATE_MODE_IDS = new Set([
  "aram",
  "arena",
  "howling-abyss",
  "swiftplay",
]);

export function patchDataQuality(
  patchId: string,
  declared?: DataQuality,
): DataQuality {
  if (declared === "verified" || VERIFIED_PATCH_IDS.has(patchId)) {
    return "verified";
  }
  return "archive-review";
}
