import type { AbilityResult } from "./types";

export type ConfidenceLevel =
  | "exact"
  | "modeled"
  | "approximate"
  | "unsupported";

export function abilityConfidence(result: AbilityResult): ConfidenceLevel {
  if (result.primaryKind === "unknown" || !result.lines.length) {
    return "unsupported";
  }
  if (result.lines.length === 1) return "modeled";
  return "approximate";
}

export function comparisonConfidence(
  applied: number | undefined,
  skipped: number | undefined,
): ConfidenceLevel {
  if (!applied) return "unsupported";
  if ((skipped ?? 0) > 0) return "approximate";
  return "modeled";
}

export function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "exact":
      return "Exact";
    case "modeled":
      return "Modeled";
    case "approximate":
      return "Approximate";
    case "unsupported":
      return "Unsupported";
  }
}

