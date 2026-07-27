import assert from "node:assert/strict";
import {
  buildComparisonParams,
  itemIds,
  slotsFromParam,
} from "../src/lib/calculator/shareBuild";
import type { ItemData } from "../src/lib/calculator/types";

const item = (id: string): ItemData => ({
  id,
  name: id,
  icon: "",
  gold: 1000,
  tags: [],
  stats: {},
});
const items = [item("1"), item("2"), item("3")];

assert.deepEqual(itemIds([items[0]!, null, items[2]!]), ["1", "3"]);
assert.deepEqual(
  slotsFromParam("1,3,missing", items, 4).map((entry) => entry?.id ?? null),
  ["1", "3", null, null],
);

const params = buildComparisonParams({
  championId: "Ahri",
  level: 11,
  buildA: [items[0]!, null],
  buildB: [items[1]!, items[2]!],
  runeIds: ["electrocute"],
  ranks: { Q: 5, W: 5, E: 1, R: 2 },
  target: { armor: 50, mr: 45, hp: 1500 },
});
assert.equal(params.get("champ"), "Ahri");
assert.equal(params.get("a"), "1");
assert.equal(params.get("b"), "2,3");
assert.equal(params.get("level"), "11");
assert.equal(params.get("mr"), "45");
assert.equal(params.get("ranks"), "5,5,1,2");

console.log("OK — build comparison sharing checks passed");
