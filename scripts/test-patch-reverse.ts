import assert from "node:assert/strict";
import { kitAsOfPatch } from "../src/lib/calculator/patchReverse";
import type { ChampionData } from "../src/lib/calculator/types";
import type { ChampionHistory } from "../src/lib/types";

const liveKit: ChampionData = {
  id: "Test",
  key: "1",
  name: "Test",
  title: "Test",
  icon: "",
  stats: {
    health: { flat: 600, perLevel: 100 },
    armor: { flat: 30, perLevel: 4 },
    magicResistance: { flat: 30, perLevel: 1.3 },
    attackDamage: { flat: 60, perLevel: 3 },
  },
  abilities: [
    {
      key: "Q",
      name: "Test Bolt",
      damageType: "magic",
      maxRank: 5,
      effects: [
        {
          description: "Damage",
          leveling: [
            {
              attribute: "Base damage",
              modifiers: [{ values: [100, 100, 100, 100, 100], units: [""] }],
            },
          ],
        },
      ],
    },
  ],
};

const history: ChampionHistory = {
  slug: "test",
  name: "Test",
  entries: [
    {
      patchId: "25.10",
      version: "25.10",
      releaseDate: "2025-05-14",
      change: {
        id: "test",
        name: "Test",
        type: "champion",
        direction: "buff",
        severity: 1,
        tldr: "",
        gameplayImpact: "",
        changes: [
          {
            ability: "Q",
            title: "Test Bolt",
            direction: "buff",
            lines: [{ label: "Base damage", before: "80", after: "90" }],
          },
        ],
      },
    },
    {
      patchId: "25.20",
      version: "25.20",
      releaseDate: "2025-10-08",
      change: {
        id: "test",
        name: "Test",
        type: "champion",
        direction: "buff",
        severity: 1,
        tldr: "",
        gameplayImpact: "",
        changes: [
          {
            ability: "Q",
            title: "Test Bolt",
            direction: "buff",
            lines: [{ label: "Base damage", before: "90", after: "100" }],
          },
        ],
      },
    },
  ],
};

const old = kitAsOfPatch(liveKit, history, "25.10");
assert.equal(
  old.kit.abilities[0]?.effects[0]?.leveling[0]?.modifiers[0]?.values[0],
  90,
);
assert.ok(old.applied > 0);

const current = kitAsOfPatch(liveKit, history, "25.20");
assert.equal(
  current.kit.abilities[0]?.effects[0]?.leveling[0]?.modifiers[0]?.values[0],
  100,
);

const missing = kitAsOfPatch(liveKit, history, "99.99");
assert.equal(missing.applied, 0);
assert.deepEqual(missing.notes, ["patch not in this champion's history"]);

console.log("OK — historical kit reconstruction checks passed");

