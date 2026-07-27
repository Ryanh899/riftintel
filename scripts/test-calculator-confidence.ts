import assert from "node:assert/strict";
import {
  abilityConfidence,
  comparisonConfidence,
} from "../src/lib/calculator/confidence";
import type { AbilityResult } from "../src/lib/calculator/types";

const result = (kind: AbilityResult["primaryKind"], lines: number) =>
  ({
    key: "Q",
    name: "Test",
    rank: 1,
    lines: Array.from({ length: lines }, () => ({})),
    primaryPost: 100,
    primaryRaw: 120,
    primaryKind: kind,
  }) as AbilityResult;

assert.equal(abilityConfidence(result("magic", 1)), "modeled");
assert.equal(abilityConfidence(result("magic", 2)), "approximate");
assert.equal(abilityConfidence(result("unknown", 1)), "unsupported");
assert.equal(comparisonConfidence(4, 0), "modeled");
assert.equal(comparisonConfidence(4, 2), "approximate");
assert.equal(comparisonConfidence(0, 4), "unsupported");

console.log("OK — calculator confidence checks passed");

