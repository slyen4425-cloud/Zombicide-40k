const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function scripts() {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, index = 0;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1] || `inline-${++index}`;
    out.push({ id, body: m[2] || '', start: m.index });
  }
  return out;
}

function compact(text, max = 720) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) + ' …' : s;
}

function context(body, needle, radius = 360) {
  const i = body.indexOf(needle);
  if (i < 0) return '';
  return compact(body.slice(Math.max(0, i - radius), Math.min(body.length, i + needle.length + radius)));
}

const all = scripts();
const exact = [
  'dungeonSyncProgressionForState',
  'dungeonRpgLevelFromXp',
  'dungeonHandleLevelUp071',
  'statPoints',
  'skillPoints'
];

const report = { exact: {}, candidateScripts: [], candidateFunctions: [] };
for (const needle of exact) {
  const hits = all.filter(s => s.body.includes(needle)).map(s => ({ id: s.id, context: context(s.body, needle) }));
  report.exact[needle] = hits;
}

const rewardWords = /(?:victory|victoire|reward|recomp|récomp|drop|loot|xp|level|niveau|progression)/i;
for (const s of all) {
  if (!rewardWords.test(s.body)) continue;
  const names = new Set();
  for (const m of s.body.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (rewardWords.test(m[1])) names.add(m[1]);
  }
  for (const m of s.body.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*(?:Xp|XP|Level|Victory|Reward|Drop|Loot|Progression)[A-Za-z0-9_$]*)\s*=/g)) {
    names.add(m[1]);
  }
  const interesting = [...names].sort();
  if (interesting.length || /dungeonSyncProgressionForState|dungeonHandleLevelUp071|statPoints|skillPoints/i.test(s.body)) {
    report.candidateScripts.push({ id: s.id, size: s.body.length, names: interesting.slice(0, 80) });
    for (const name of interesting.slice(0, 80)) report.candidateFunctions.push({ script: s.id, name, context: context(s.body, name, 260) });
  }
}

assert.ok(report.exact.dungeonSyncProgressionForState.length, 'canonical progression sync must exist in native runtime');
assert.ok(report.exact.dungeonRpgLevelFromXp.length, 'XP-to-level authority must exist in native runtime');
assert.ok(report.exact.dungeonHandleLevelUp071.length, 'level-up handler must exist in native runtime');
assert.ok(report.exact.statPoints.length, 'stat point state must exist in native runtime');
assert.ok(report.exact.skillPoints.length, 'skill point state must exist in native runtime');

console.log('=== GENSRPG PROGRESSION / VICTORY CHARACTERIZATION V114.11 ===');
console.log(JSON.stringify(report, null, 2));
console.log('=== END CHARACTERIZATION ===');
