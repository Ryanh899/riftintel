import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "src", "data", "champions");
const manifestPath = path.join(root, "src", "data", "patches", "manifest.json");
const outputDir = path.join(root, "public", "generated", "champions");
const kitOutputDir = path.join(root, "public", "generated", "kits");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const verified = new Set(
  manifest.patches
    .filter((patch) => patch.dataQuality === "verified")
    .map((patch) => patch.id),
);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await rm(kitOutputDir, { recursive: true, force: true });
await mkdir(kitOutputDir, { recursive: true });

let published = 0;
for (const filename of await readdir(sourceDir)) {
  if (!filename.endsWith(".json") || filename === "index.json") continue;
  const source = JSON.parse(await readFile(path.join(sourceDir, filename), "utf8"));
  const entries = (source.entries ?? [])
    .filter((entry) => verified.has(entry.patchId))
    .map((entry) => ({ ...entry, dataQuality: "verified" }));
  if (!entries.length) continue;

  await writeFile(
    path.join(outputDir, filename),
    `${JSON.stringify({ ...source, entries })}\n`,
    "utf8",
  );
  published += 1;
}

console.log(`Published static verified calculator history for ${published} champions.`);

const [versionsResponse, merakiResponse] = await Promise.all([
  fetch("https://ddragon.leagueoflegends.com/api/versions.json"),
  fetch("https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json"),
]);
if (!versionsResponse.ok || !merakiResponse.ok) {
  throw new Error("Unable to download public calculator kit inputs.");
}

const versions = await versionsResponse.json();
const ddragonVersion = versions[0];
const ddragonResponse = await fetch(
  `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/champion.json`,
);
if (!ddragonResponse.ok) throw new Error("Unable to download the champion index.");

const ddragon = await ddragonResponse.json();
const meraki = await merakiResponse.json();
const kitIndex = [];

for (const champion of Object.values(ddragon.data)) {
  const raw = meraki[champion.id];
  if (!raw) continue;
  const kit = normalizeMerakiChampion(raw);
  await writeFile(
    path.join(kitOutputDir, `${champion.id}.json`),
    `${JSON.stringify(kit)}\n`,
    "utf8",
  );
  kitIndex.push({
    id: champion.id,
    key: champion.key,
    name: champion.name,
    icon: `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.id}.png`,
  });
}

kitIndex.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(
  path.join(kitOutputDir, "index.json"),
  `${JSON.stringify(kitIndex)}\n`,
  "utf8",
);
console.log(`Published ${kitIndex.length} static current champion kits.`);

function normalizeMerakiChampion(raw) {
  const abilities = [];
  for (const key of ["P", "Q", "W", "E", "R"]) {
    const ability = raw.abilities?.[key]?.[0];
    if (!ability) continue;
    abilities.push({
      key,
      name: String(ability.name || key),
      icon: secureUrl(ability.icon),
      damageType: ability.damageType ? String(ability.damageType) : null,
      maxRank: key === "R" ? 3 : key === "P" ? 1 : 5,
      effects: (ability.effects || []).map((effect) => ({
        description: String(effect.description || ""),
        leveling: (effect.leveling || []).map((leveling) => ({
          attribute: String(leveling.attribute || "Effect"),
          modifiers: (leveling.modifiers || []).map((modifier) => ({
            values: modifier.values || [0],
            units: modifier.units || [""],
          })),
        })),
      })),
    });
  }

  return {
    id: String(raw.key || raw.id || raw.name),
    key: String(raw.key || ""),
    name: String(raw.name),
    title: String(raw.title || ""),
    icon: secureUrl(raw.icon) || "",
    attackType: raw.attackType ? String(raw.attackType) : undefined,
    adaptiveType: raw.adaptiveType ? String(raw.adaptiveType) : undefined,
    stats: {
      health: statPair(raw.stats?.health),
      mana: raw.stats?.mana ? statPair(raw.stats.mana) : undefined,
      armor: statPair(raw.stats?.armor),
      magicResistance: statPair(raw.stats?.magicResistance),
      attackDamage: statPair(raw.stats?.attackDamage),
      attackSpeed: raw.stats?.attackSpeed ? statPair(raw.stats.attackSpeed) : undefined,
      movespeed: raw.stats?.movespeed
        ? { flat: Number(raw.stats.movespeed.flat) || 0, perLevel: 0 }
        : undefined,
    },
    abilities,
  };
}

function statPair(stat) {
  return { flat: Number(stat?.flat) || 0, perLevel: Number(stat?.perLevel) || 0 };
}

function secureUrl(value) {
  return value ? String(value).replace(/^http:\/\//, "https://") : undefined;
}
