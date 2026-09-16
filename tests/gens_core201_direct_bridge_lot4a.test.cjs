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

assert.match(core,/GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:ids,reason:["']manual["'],entry:["']dc200StartCombat["']\}\)/,
  'Core 2.01 same-room ENGAGER LE COMBAT must call the canonical Bridge directly with the existing enemy ids and manual reason');
assert.match(core,/GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:\[String\(on\.id\)\],reason:["']cell["'],entry:["']dc200StartCombat["']\}\)/,
  'Core 2.01 ATTAQUER must call the canonical Bridge directly with the targeted enemy id and cell reason');
assert.doesNotMatch(core,/\bdc200StartCombat\s*\(/,
  'Core 2.01 must no longer depend on the historical dc200StartCombat adapter');

assert.match(core,/const positional=movementEnabled201\(\)/,
  'Core 2.01 positional movement gate must remain intact');
assert.match(core,/const on=live\.find\(e=>Number\(x\.enemyCells\?\.\[e\.id\]\)===pos\)/,
  'Core 2.01 must still target only the enemy on the active hero cell in positional mode');

console.log('GenSrpG combat migration lot 4A OK: Core 2.01 encounter buttons -> Bridge.requestCombat');
