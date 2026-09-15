const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

const requiredDocs = [
  'docs/GENSRPG_CHARTE.md',
  'docs/GENSRPG_RESTRUCTURATION_ROADMAP.md',
  'assets/gensrpg/STRUCTURE.md',
  'assets/ASSET_STRUCTURE.md',
];

for (const rel of requiredDocs) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing architecture reference: ${rel}`);
}

const targetRuntimeDirs = [
  'assets/gensrpg/core',
  'assets/gensrpg/shell',
  'assets/gensrpg/survival',
  'assets/gensrpg/dungeon',
  'assets/gensrpg/tactical',
  'assets/gensrpg/capture',
  'assets/gensrpg/pvp',
  'assets/gensrpg/builders',
];

const forbidden = [
  { re: /\.observe\s*\(\s*(?:document\.)?(?:body|documentElement)\b/, why: 'global body/html MutationObserver' },
  { re: /addEventListener\s*\([^,]+,[\s\S]{0,500}?\btrue\s*\)\s*;?/, why: 'capture-phase listener; must be explicitly justified/scoped' },
  { re: /\blocation\.reload\s*\(/, why: 'location.reload navigation fallback' },
  { re: /\bsetInterval\s*\(/, why: 'permanent/global heartbeat risk' },
  { re: /\bstopImmediatePropagation\s*\(/, why: 'global event-authority risk' },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(?:js|cjs|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const relDir of targetRuntimeDirs) {
  for (const file of walk(path.join(root, relDir))) {
    const src = fs.readFileSync(file, 'utf8');
    for (const rule of forbidden) {
      if (rule.re.test(src)) {
        violations.push(`${path.relative(root, file)}: ${rule.why}`);
      }
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `new modular runtime violates GenSrpG Charter:\n${violations.join('\n')}`
);

console.log('GenSrpG architecture charter guard OK');
