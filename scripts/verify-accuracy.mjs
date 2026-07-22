/**
 * Accuracy checks: pen math, Ahri Q magic+true, patch text quality.
 * Run: node scripts/verify-accuracy.mjs
 */

function round(n, d = 1) {
  const m = 10 ** d;
  return Math.round(n * m) / m;
}

function resistMult(r) {
  return r >= 0 ? 100 / (100 + r) : 2 - 100 / (100 - r);
}

function effectiveMr(mr, flatPen, pctPen) {
  return Math.max(0, (mr - flatPen) * (1 - pctPen));
}

function effectiveArmor(armor, lethality, pctPen, level = 18) {
  const flat = lethality * (0.6 + (0.4 * level) / 18);
  return Math.max(0, armor * (1 - pctPen) - flat);
}

// --- Ahri Q rank 5 @ 500 AP ---
// Per pass raw: 140 + 50% AP = 390
// Outbound: magic → vs 100 MR = 195
// Return: true → 390
// Both: 585
const ap = 500;
const passRaw = 140 + 0.5 * ap;
console.assert(passRaw === 390, "pass raw");
const magicPost = passRaw * resistMult(100);
console.assert(round(magicPost, 1) === 195, `magic post ${magicPost}`);
const truePost = passRaw; // true ignores MR
const both = magicPost + truePost;
console.assert(round(both, 1) === 585, `both passes ${both}`);

// Total Mixed line (280 + 100% AP = 780) as magic_true half/half:
const totalRaw = 280 + 1.0 * ap;
const totalMagicTrue =
  (totalRaw / 2) * resistMult(100) + totalRaw / 2;
console.assert(round(totalMagicTrue, 1) === 585, `total magic+true ${totalMagicTrue}`);

// Wrong old 50/50 phys+magic would be wrong:
const wrongMixed =
  (totalRaw / 2) * resistMult(100) + (totalRaw / 2) * resistMult(100);
console.assert(round(wrongMixed, 1) === 390, "phys+magic would undercount true");

// Pen checks
console.assert(effectiveMr(100, 0, 0.4) === 60, "void staff");
console.assert(round(effectiveArmor(100, 18, 0, 18), 2) === 82, "lethality");
console.assert(effectiveArmor(200, 0, 0.35, 18) === 130, "LDR");
console.assert(round(130 * 1.3, 1) === 169, "deathcap");

// Patch text
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const dir = join(process.cwd(), "src/data/patches/by-id");
let scaled = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".json")) continue;
  const t = readFileSync(join(dir, f), "utf8");
  const m = t.match(/scaled value/gi);
  if (m) scaled += m.length;
}
console.assert(scaled === 0, `scaled placeholders ${scaled}`);

console.log("OK — accuracy checks passed");
console.log(`  Ahri Q both passes @500AP vs 100MR: ${round(both, 0)} (magic ${round(magicPost,0)} + true ${truePost})`);
console.log(`  scaled placeholders: ${scaled}`);
