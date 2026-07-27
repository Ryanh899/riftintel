import assert from "node:assert/strict";
import {
  resolveChampionLink,
  resolveCompareLink,
} from "../src/lib/calculator/deepLinks";

const champions = [
  { id: "Ahri", name: "Ahri" },
  { id: "LeeSin", name: "Lee Sin" },
  { id: "DrMundo", name: "Dr. Mundo" },
];

assert.equal(resolveChampionLink("Lee Sin", champions), "LeeSin");
assert.equal(resolveChampionLink("lee-sin", champions), "LeeSin");
assert.equal(resolveChampionLink("Dr. Mundo", champions), "DrMundo");
assert.equal(
  resolveChampionLink("not-a-champion", champions),
  "not-a-champion",
);
assert.equal(resolveChampionLink(null, champions), "Ahri");

const history = [
  { patchId: "25.12", version: "25.12" },
  { patchId: "25.19", version: "25.19" },
  { patchId: "26.03", version: "26.03" },
];

assert.deepEqual(resolveCompareLink("last", null, history), {
  patchId: "26.03",
  error: null,
});
assert.deepEqual(resolveCompareLink("before", "26.03", history), {
  patchId: "25.19",
  error: null,
});
assert.deepEqual(resolveCompareLink("25.12", null, history), {
  patchId: "25.12",
  error: null,
});
assert.equal(resolveCompareLink("before", "25.12", history).patchId, null);
assert.equal(resolveCompareLink("before", "99.99", history).patchId, null);
assert.equal(resolveCompareLink("99.99", null, history).patchId, null);

console.log("OK — calculator deep-link resolution checks passed");
