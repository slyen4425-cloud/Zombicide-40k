const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core=scriptBody('dungeonCore201Stability');

assert.match(core,/function\s+requestCombat201\s*\(enemyIds,reason\)/,
  'Core 2.01 must use one local stateless helper for its two encounter buttons');
assert.ok(core.includes('GensRpgTacticalCombatV2Bridge.requestCombat(window'),
  'Core 2.01 helper must call the canonical Bridge');
assert.ok(core.includes('enemyIds:Array.isArray(enemyIds)?enemyIds.map(String):[]'),
  'Core 2.01 helper must preserve the explicit enemy id list');
assert.ok(core.includes('reason:reason'),
  'Core 2.01 helper must preserve the existing manual/cell reason');
assert.ok(core.includes('entry:"dc201EncounterPanel"'),
  'Core 2.01 must use its own diagnostic entry instead of retaining the historical adapter name');
assert.equal((core.match(/requestCombat201\s*\(/g)||[]).length,3,
  'Core 2.01 must contain one helper definition and exactly two encounter button calls');
assert.doesNotMatch(core,/\bdc200StartCombat\b/,
  'Core 2.01 must contain no remaining reference to the historical dc200StartCombat adapter');

assert.match(core,/const positional=typeof window\.dc305PositionalGameplay===["']function["']&&window\.dc305PositionalGameplay\(\)/,
  'Core 2.01 canonical positional-gameplay gate must remain intact');
assert.match(core,/const on=live\.find\(e=>Number\(x\.enemyCells\?\.\[e\.id\]\)===pos\)/,
  'Core 2.01 must still target only the enemy on the active hero cell in positional mode');
assert.ok(core.includes('JSON.stringify(ids)'),
  'same-room ENGAGER LE COMBAT must keep the full encounter enemy list');
assert.ok(core.includes('String(on.id)'),
  'positional ATTAQUER must keep the enemy on the hero cell');

console.log('GenSrpG combat migration lot 4A OK: Core 2.01 encounter buttons -> canonical Bridge');
