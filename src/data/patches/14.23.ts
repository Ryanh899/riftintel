import type { Patch } from "@/lib/types";

export const patch_14_23: Patch = {
  id: "14.23",
  version: "14.23",
  title: "Marksman & Mage Tuning",
  releaseDate: "2024-11-20",
  season: "2024",
  summary:
    "A mid-size balance patch focused on bot-lane agency and a handful of mid mages who were either unplayable or oppressive in solo queue.",
  themes: [
    {
      title: "Bot lane agency",
      description: "ADCs and supports get tools to contest river without relying only on jungle.",
    },
    {
      title: "Mage clarity",
      description: "Control mages get mana/sustain; burst mages lose raw all-in when they miss skillshots.",
    },
  ],
  champions: [
    {
      id: "jinx",
      name: "Jinx",
      type: "champion",
      assetKey: "Jinx",
      roles: ["bot"],
      direction: "buff",
      severity: 2,
      tldr: "Attack speed growth and passive move speed up — better mid-game fights.",
      gameplayImpact:
        "She ramps into teamfights faster after first item. Good patch for hypercarries that were stuck in weak early-mid states.",
      tags: ["marksman", "scaling"],
      changes: [
        {
          ability: "Base stats",
          direction: "buff",
          lines: [
            {
              label: "Attack speed growth",
              before: "1%",
              after: "1.4%",
              delta: "+0.4%",
            },
          ],
        },
        {
          ability: "P",
          title: "Get Excited!",
          direction: "buff",
          lines: [
            {
              label: "Movement speed",
              before: "175% decaying",
              after: "175% + 15% decaying",
              delta: "+flat bonus MS",
            },
          ],
        },
      ],
    },
    {
      id: "ahri",
      name: "Ahri",
      type: "champion",
      assetKey: "Ahri",
      roles: ["mid"],
      direction: "nerf",
      severity: 1,
      tldr: "Ultimate cooldown increased at early ranks — fewer free multi-dash skirmishes.",
      gameplayImpact:
        "She commits harder when she uses R early. Roam-heavy Ahri slightly less oppressive.",
      tags: ["mage", "mobility"],
      changes: [
        {
          ability: "R",
          title: "Spirit Rush",
          direction: "nerf",
          lines: [
            {
              label: "Cooldown",
              before: "130/105/80",
              after: "140/110/80",
              delta: "+10/+5/0",
            },
          ],
        },
      ],
    },
    {
      id: "azir",
      name: "Azir",
      type: "champion",
      assetKey: "Azir",
      roles: ["mid"],
      direction: "nerf",
      severity: 2,
      tldr: "Soldier range and R cooldown nerfed — less safe dps and less free disengage.",
      gameplayImpact:
        "Pro play power reduced; solo queue high-skill players still viable but less forgiving.",
      tags: ["mage", "pro"],
      changes: [
        {
          ability: "W",
          title: "Arise!",
          direction: "nerf",
          lines: [
            {
              label: "Soldier attack range",
              before: "525",
              after: "500",
              delta: "−25",
            },
          ],
        },
        {
          ability: "R",
          title: "Emperor's Divide",
          direction: "nerf",
          lines: [
            {
              label: "Cooldown",
              before: "120/105/90",
              after: "130/110/90",
              delta: "+10/+5/0",
            },
          ],
        },
      ],
    },
    {
      id: "thresh",
      name: "Thresh",
      type: "champion",
      assetKey: "Thresh",
      roles: ["support"],
      direction: "buff",
      severity: 1,
      tldr: "Hook hitbox slightly larger and base mana regen up.",
      gameplayImpact:
        "More consistent hooks in chaotic bot lanes; better mana for long lanes.",
      tags: ["support"],
      changes: [
        {
          ability: "Q",
          title: "Death Sentence",
          direction: "buff",
          lines: [
            {
              label: "Missile width",
              before: "70",
              after: "75",
              delta: "+5",
            },
          ],
        },
        {
          ability: "Base stats",
          direction: "buff",
          lines: [
            {
              label: "Mana regen",
              before: "6",
              after: "7",
              delta: "+1",
            },
          ],
        },
      ],
    },
    {
      id: "lee-sin",
      name: "Lee Sin",
      type: "champion",
      assetKey: "LeeSin",
      roles: ["jungle"],
      direction: "adjust",
      severity: 1,
      tldr: "Early Q damage down, late Q damage up — less level 3 cheesing, better late skirmishes.",
      gameplayImpact:
        "Punishes free early invades slightly less; rewards games that go longer.",
      tags: ["fighter", "jungle"],
      changes: [
        {
          ability: "Q",
          title: "Sonic Wave",
          direction: "adjust",
          lines: [
            {
              label: "Damage",
              before: "55/80/105/130/155",
              after: "50/80/110/140/170",
              delta: "−5 / 0 / +5 / +10 / +15",
            },
          ],
        },
      ],
    },
  ],
  items: [
    {
      id: "immortal-shieldbow",
      name: "Immortal Shieldbow",
      type: "item",
      assetKey: "6673",
      direction: "buff",
      severity: 1,
      tldr: "Shield amount increased — better second-item survivability for crit ADCs.",
      gameplayImpact:
        "ADCs survive burst windows more often when stacking crit.",
      changes: [
        {
          ability: "Passive",
          title: "Lifeline",
          direction: "buff",
          lines: [
            {
              label: "Shield",
              before: "300–650",
              after: "350–700",
              delta: "+50",
            },
          ],
        },
      ],
    },
  ],
  systems: [],
};
