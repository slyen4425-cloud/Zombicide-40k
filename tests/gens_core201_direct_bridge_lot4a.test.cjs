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
assert.match(core,/GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:Array\.isArray\(enemyIds\)\?enemyIds\.map\(String\):\[\],reason:reason,entry:["']dc200StartCombat["']\}\)/,
  'Core 2.01 local helper must forward only enemyIds and reason to the canonical Bridge while preserving the historical diagnostic entry');
assert.match(core,/requestCombat201\([^\n]*JSON\.stringify\(ids\)[^\n]*manual/,
  'same-room ENGAGER LE COMBAT must preserve its full enemy id list and manual reason');
assert.match(core,/requestCombat201\([^\n]*String\(on\.id\)[^\n]*cell/,
  'positional ATTAQUER must preserve the enemy on the active hero cell and cell reason');
assert.doesNotMatch(core,/\bdc200StartCombat\s*\(/,
  'Core 2.01 must no longer depend on the historical dc200StartCombat adapter');

assert.match(core,/const positional=movementEnabled201\(\)/,
  'Core 2.01 positional movement gate must remain intact');
assert.match(core,/const on=live\.find\(e=>Number\(x\.enemyCells\?\.\[e\.id\]\)===pos\)/,
  'Core 2.01 must still target only the enemy on the active hero cell in positional mode');

console.log('GenSrpG combat migration lot 4A OK: Core 2.01 encounter buttons -> canonical Bridge');
