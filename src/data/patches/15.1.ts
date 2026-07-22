import type { Patch } from "@/lib/types";

/** Illustrative sample data modeled on a real early-season balance patch shape. */
export const patch_15_1: Patch = {
  id: "15.1",
  version: "15.1",
  title: "Season Start Balance",
  releaseDate: "2025-01-09",
  season: "2025",
  sourceUrl: "https://www.leagueoflegends.com/en-us/news/game-updates/",
  summary:
    "Season openers usually hit the strongest preseason outliers and hand small tools to weak roles. This patch trims mid-lane burst mages, stabilizes a few jungle clear outliers, and gives bot lane ADCs slightly more laning agency without restoring old hypercarry spikes.",
  themes: [
    {
      title: "Mid burst down a notch",
      description:
        "Several AP mid laners lose early and mid-game damage so skirmishes last longer and assassins have a clearer window.",
    },
    {
      title: "Jungle tempo parity",
      description:
        "Clear speed and early gank power are leveled so pathing skill matters more than free tempo from stats.",
    },
    {
      title: "ADC laning tools",
      description:
        "Marksmen get modest early durability/damage so they can contest waves without hard-winning every all-in.",
    },
  ],
  champions: [
    {
      id: "ahri",
      name: "Ahri",
      type: "champion",
      assetKey: "Ahri",
      roles: ["mid"],
      direction: "nerf",
      severity: 2,
      tldr: "Charm damage and base armor down — safer roamers punish her harder.",
      gameplayImpact:
        "She still one-shots poorly positioned carries in the mid game, but early trades and post-roam recalls are weaker. Expect slightly lower pick rate in high elo where early river fights matter.",
      context:
        "She was winning too many early skirmishes with Charm + Q without needing perfect charm timing.",
      tags: ["mage", "mobility", "burst"],
      changes: [
        {
          ability: "Base stats",
          direction: "nerf",
          lines: [
            { label: "Armor", before: "21", after: "19", delta: "−2" },
          ],
        },
        {
          ability: "E",
          title: "Charm",
          direction: "nerf",
          lines: [
            {
              label: "Damage",
              before: "60/90/120/150/180 (+40% AP)",
              after: "60/85/110/135/160 (+35% AP)",
              delta: "−0/5/10/15/20 (−5% AP)",
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
      direction: "buff",
      severity: 1,
      tldr: "Soldier attack speed and W mana cost improved — cleaner wave control.",
      gameplayImpact:
        "Helps him hold side waves and stack Conqueror/Lethal Tempo more reliably. Small solo-queue win-rate bump expected; still high skill floor.",
      context: "Below-target performance outside of pros who already abuse soldiers perfectly.",
      tags: ["mage", "dps"],
      changes: [
        {
          ability: "W",
          title: "Arise!",
          direction: "buff",
          lines: [
            {
              label: "Mana cost",
              before: "40/45/50/55/60",
              after: "35/40/45/50/55",
              delta: "−5",
            },
            {
              label: "Soldier attack speed ratio",
              before: "60%",
              after: "65%",
              delta: "+5%",
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
      direction: "nerf",
      severity: 2,
      tldr: "Q damage and early armor growth cut — less free early game snowball.",
      gameplayImpact:
        "First clear and level 3 ganks hit softer. High-skill players still excel, but the free power for average pathing drops. Junglers who out-duel him early gain space.",
      context: "Dominant early tempo and multi-region pick/ban pressure.",
      tags: ["fighter", "mobility", "early"],
      changes: [
        {
          ability: "Base stats",
          direction: "nerf",
          lines: [
            {
              label: "Armor growth",
              before: "4.5",
              after: "4.0",
              delta: "−0.5",
            },
          ],
        },
        {
          ability: "Q",
          title: "Sonic Wave / Resonating Strike",
          direction: "nerf",
          lines: [
            {
              label: "Resonating Strike base damage",
              before: "55/80/105/130/155",
              after: "50/75/100/125/150",
              delta: "−5",
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
      direction: "buff",
      severity: 1,
      tldr: "Base AD and Q rocket cost tweaked for smoother early last-hitting.",
      gameplayImpact:
        "Slightly healthier laning into poke supports. Doesn't restore old hypercarry mid-game spikes — mainly quality-of-life and early CS consistency.",
      tags: ["marksman", "scaling"],
      changes: [
        {
          ability: "Base stats",
          direction: "buff",
          lines: [
            { label: "Attack damage", before: "59", after: "61", delta: "+2" },
          ],
        },
        {
          ability: "Q",
          title: "Switcheroo!",
          direction: "buff",
          lines: [
            {
              label: "Rocket mana cost",
              before: "20",
              after: "16",
              delta: "−4",
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
      direction: "adjust",
      severity: 2,
      tldr: "Hook base damage down, lantern shield up — less pick threat, more peel.",
      gameplayImpact:
        "Fewer free kills from random hooks; better at saving allies in chaotic fights. Engage supports who relied on Thresh for early kills may look elsewhere; peel-focused play is stronger.",
      context: "Hook success rate was converting into too much early gold swing.",
      tags: ["support", "engage", "peel"],
      changes: [
        {
          ability: "Q",
          title: "Death Sentence",
          direction: "nerf",
          lines: [
            {
              label: "Damage",
              before: "100/140/180/220/260 (+90% AP)",
              after: "80/120/160/200/240 (+90% AP)",
              delta: "−20",
            },
          ],
        },
        {
          ability: "W",
          title: "Dark Passage",
          direction: "buff",
          lines: [
            {
              label: "Shield",
              before: "50/70/90/110/130 (+20% AP)",
              after: "60/90/120/150/180 (+25% AP)",
              delta: "+10/20/30/40/50 (+5% AP)",
            },
          ],
        },
      ],
    },
    {
      id: "smolder",
      name: "Smolder",
      type: "champion",
      assetKey: "Smolder",
      roles: ["bot", "mid"],
      direction: "nerf",
      severity: 3,
      tldr: "Stack rate and Q execute damage significantly reduced — slower power spikes.",
      gameplayImpact:
        "He reaches scary mid-game later and executes tanks less freely. Still scales if the game goes long, but drafting him as a free win-condition is weaker. Expect large win-rate correction.",
      context: "Stacks and damage were both above the intended curve across ranks.",
      tags: ["marksman", "scaling", "poke"],
      changes: [
        {
          ability: "P",
          title: "Dragon Practice",
          direction: "nerf",
          lines: [
            {
              label: "Stacks on champion damage",
              before: "2",
              after: "1",
              delta: "−1",
            },
          ],
        },
        {
          ability: "Q",
          title: "Super Scorcher Breath",
          direction: "nerf",
          lines: [
            {
              label: "Execute threshold",
              before: "6.5% max HP",
              after: "5% max HP",
              delta: "−1.5%",
            },
            {
              label: "Damage per stack",
              before: "0.8%",
              after: "0.65%",
              delta: "−0.15%",
            },
          ],
        },
      ],
    },
    {
      id: "ambessa",
      name: "Ambessa",
      type: "champion",
      assetKey: "Ambessa",
      roles: ["top", "jungle"],
      direction: "buff",
      severity: 2,
      tldr: "Energy costs and dash damage improved — more continuous pressure.",
      gameplayImpact:
        "Better extended trades and side-lane threat. Opens more aggressive top builds; jungle clear feels less starved if energy-gated.",
      tags: ["fighter", "mobility"],
      changes: [
        {
          ability: "Q",
          title: "Cunning Sweep / Sundering Slam",
          direction: "buff",
          lines: [
            {
              label: "Energy cost",
              before: "50",
              after: "40",
              delta: "−10",
            },
            {
              label: "Damage",
              before: "40/65/90/115/140",
              after: "45/70/95/120/145",
              delta: "+5",
            },
          ],
        },
      ],
    },
    {
      id: "rakan",
      name: "Rakan",
      type: "champion",
      assetKey: "Rakan",
      roles: ["support"],
      direction: "buff",
      severity: 1,
      tldr: "W knock-up duration and shield strength up — stronger engage value.",
      gameplayImpact:
        "Engage windows are more rewarding if he lands W. Small boost for enchanter-engage hybrids; watch duo-queue win rates.",
      tags: ["support", "engage"],
      changes: [
        {
          ability: "W",
          title: "Grand Entrance",
          direction: "buff",
          lines: [
            {
              label: "Knock up duration",
              before: "1.0s",
              after: "1.1s",
              delta: "+0.1s",
            },
          ],
        },
        {
          ability: "E",
          title: "Battle Dance",
          direction: "buff",
          lines: [
            {
              label: "Shield",
              before: "40/65/90/115/140 (+50% AP)",
              after: "50/75/100/125/150 (+55% AP)",
              delta: "+10 (+5% AP)",
            },
          ],
        },
      ],
    },
  ],
  items: [
    {
      id: "liandrys-torment",
      name: "Liandry's Torment",
      type: "item",
      assetKey: "6653",
      direction: "nerf",
      severity: 2,
      tldr: "Burn damage ratio reduced — less free damage vs tanks for mages.",
      gameplayImpact:
        "AP bruisers and burn mages lose some vs-tank DPS. Expect more Visage / MR stacking value and slightly longer siege timers.",
      changes: [
        {
          ability: "Passive",
          title: "Torment",
          direction: "nerf",
          lines: [
            {
              label: "Burn",
              before: "2% max HP per second",
              after: "1.5% max HP per second",
              delta: "−0.5%",
            },
          ],
        },
      ],
    },
    {
      id: "yun-tal-wildarrows",
      name: "Yun Tal Wildarrows",
      type: "item",
      assetKey: "3031",
      direction: "buff",
      severity: 1,
      tldr: "Cheaper and slightly more AD — better second-item spike for crit ADCs.",
      gameplayImpact:
        "Crit ADCs hit their mid-game damage spike earlier. Synergizes with the modest ADC laning buffs this patch.",
      changes: [
        {
          ability: "Base stats",
          direction: "buff",
          lines: [
            { label: "Cost", before: "3000", after: "2900", delta: "−100" },
            { label: "Attack damage", before: "50", after: "55", delta: "+5" },
          ],
        },
      ],
    },
  ],
  systems: [
    {
      id: "tower-plates",
      name: "Tower Plates",
      type: "system",
      direction: "adjust",
      severity: 1,
      tldr: "Plate gold slightly reduced after 4 minutes — less snowball from pure plate taking.",
      gameplayImpact:
        "Winning lane still matters, but pure plate greed is worth a bit less. Comebacks from equal CS + kills are slightly easier.",
      changes: [
        {
          ability: "Map",
          title: "Turret plating",
          direction: "nerf",
          lines: [
            {
              label: "Gold per plate (post 4:00)",
              before: "160",
              after: "145",
              delta: "−15",
            },
          ],
        },
      ],
    },
  ],
};
