import type { Patch } from "@/lib/types";

export const patch_14_24: Patch = {
  id: "14.24",
  version: "14.24",
  title: "Preseason Cleanup",
  releaseDate: "2024-12-11",
  season: "2024",
  summary:
    "A cleanup patch before the new season: systems settle, a few overperforming new items get trimmed, and champions who adapted too well to the preseason kit get pulled back.",
  themes: [
    {
      title: "Item outliers",
      description: "New mythic-replacements that warped builds get cost or passive nerfs.",
    },
    {
      title: "Skirmish-heavy champions",
      description: "Fighters who thrived in the faster preseason map lose a bit of free damage.",
    },
  ],
  champions: [
    {
      id: "smolder",
      name: "Smolder",
      type: "champion",
      assetKey: "Smolder",
      roles: ["bot", "mid"],
      direction: "buff",
      severity: 2,
      tldr: "Stack generation and Q damage up — recovery after prior over-nerfs.",
      gameplayImpact:
        "Made him a viable scaling pick again. Combined with 15.1 nerfs, this is the start of a seesaw balance period on stack rate.",
      tags: ["marksman", "scaling"],
      changes: [
        {
          ability: "Q",
          title: "Super Scorcher Breath",
          direction: "buff",
          lines: [
            {
              label: "Base damage",
              before: "60/75/90/105/120",
              after: "70/85/100/115/130",
              delta: "+10",
            },
          ],
        },
        {
          ability: "P",
          title: "Dragon Practice",
          direction: "buff",
          lines: [
            {
              label: "Stacks on minion last hit",
              before: "1 every 2nd",
              after: "1 every minion",
              delta: "faster stacks",
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
      direction: "buff",
      severity: 1,
      tldr: "Q damage restored slightly after a previous overcorrection.",
      gameplayImpact:
        "Better waveclear and poke. Set her up as a strong mid option heading into 15.1.",
      tags: ["mage"],
      changes: [
        {
          ability: "Q",
          title: "Orb of Deception",
          direction: "buff",
          lines: [
            {
              label: "Damage",
              before: "40/65/90/115/140 (+45% AP)",
              after: "40/65/90/115/140 (+50% AP)",
              delta: "+5% AP",
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
      direction: "buff",
      severity: 1,
      tldr: "W shield and energy refund improved for healthier early clears.",
      gameplayImpact:
        "Slightly safer first clear; contributed to the strong early-game presence later nerfed in 15.1.",
      tags: ["fighter", "jungle"],
      changes: [
        {
          ability: "W",
          title: "Safeguard / Iron Will",
          direction: "buff",
          lines: [
            {
              label: "Shield",
              before: "55/100/145/190/235",
              after: "65/110/155/200/245",
              delta: "+10",
            },
          ],
        },
      ],
    },
    {
      id: "jinx",
      name: "Jinx",
      type: "champion",
      assetKey: "Jinx",
      roles: ["bot"],
      direction: "nerf",
      severity: 1,
      tldr: "Rocket splash falloff reduced at max range — weaker free wave clear from afar.",
      gameplayImpact:
        "Slightly worse at safely sieging without committing. Still strong when ahead.",
      tags: ["marksman"],
      changes: [
        {
          ability: "Q",
          title: "Switcheroo!",
          direction: "nerf",
          lines: [
            {
              label: "Min splash damage",
              before: "25%",
              after: "20%",
              delta: "−5%",
            },
          ],
        },
      ],
    },
    {
      id: "vi",
      name: "Vi",
      type: "champion",
      assetKey: "Vi",
      roles: ["jungle"],
      direction: "buff",
      severity: 2,
      tldr: "Q charge damage and R knockup reliability improved.",
      gameplayImpact:
        "Better gank threat and engage consistency. Solid alternative when Lee Sin is contested.",
      tags: ["fighter", "engage"],
      changes: [
        {
          ability: "Q",
          title: "Vault Breaker",
          direction: "buff",
          lines: [
            {
              label: "Max charge damage",
              before: "45/70/95/120/145",
              after: "55/80/105/130/155",
              delta: "+10",
            },
          ],
        },
      ],
    },
  ],
  items: [
    {
      id: "hubris",
      name: "Hubris",
      type: "item",
      assetKey: "6697",
      direction: "nerf",
      severity: 2,
      tldr: "Kill stack duration and bonus AD reduced — less infinite snowball.",
      gameplayImpact:
        "Assassins still like it for early spikes, but the 20-minute free AD balloon is smaller.",
      changes: [
        {
          ability: "Passive",
          title: "Eminence",
          direction: "nerf",
          lines: [
            {
              label: "Stack duration",
              before: "90s",
              after: "60s",
              delta: "−30s",
            },
            {
              label: "AD per stack",
              before: "15 (+2 per legendary)",
              after: "10 (+2 per legendary)",
              delta: "−5 base",
            },
          ],
        },
      ],
    },
  ],
  systems: [
    {
      id: "feats-of-strength",
      name: "Feats of Strength",
      type: "system",
      direction: "adjust",
      severity: 1,
      tldr: "Quest reward timing tweaked so losing teams get a cleaner catch-up path.",
      gameplayImpact:
        "Slightly less oppressive when one team completes feats much earlier.",
      changes: [
        {
          ability: "System",
          direction: "adjust",
          lines: [
            {
              label: "Feat reward pacing",
              note: "Losing team milestone XP/gold bump increased by ~8%.",
            },
          ],
        },
      ],
    },
  ],
};
