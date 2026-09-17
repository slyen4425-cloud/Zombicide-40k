const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core200=scriptBody('dungeonCore200Rebuild');
const manualCall="b.onclick=()=>startCombat(live.map(e=>String(e.id)),'manual')";

assert.equal((core200.match(/startCombat\(live\.map\(e=>String\(e\.id\)\),'manual'\)/g)||[]).length,1,
  'lot 4K must start from exactly one Runtime 2.00 manual lexical startCombat callsite');
assert.ok(core200.includes(manualCall),
  'the non-positional ENGAGER LE COMBAT button must still use the characterized lexical manual call before migration');
assert.match(core200,/if\(!positional&&live\.length\)\{[\s\S]*?if\(!combatEnabled200\(\)\)[\s\S]*?b\.textContent='⚔️ ENGAGER LE COMBAT · '[\s\S]*?startCombat\(live\.map\(e=>String\(e\.id\)\),'manual'\)/,
  'manual entry must remain guarded by non-positional mode, live enemies, and combatEnabled200');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'Runtime 2.00 startCombat body must remain characterizable');
const startBody=startMatch[1];
assert.match(startBody,/let chosen=liveEnemies\(\)\.filter\(e=>ids\.map\(String\)\.includes\(String\(e\.id\)\)\)/,
  'legacy manual path re-filters requested ids through the authoritative Runtime 2.00 liveEnemies set');
assert.match(startBody,/const begin=\(\)=>launchCombat200\(x,chosen\)/,
  'legacy manual path ultimately delegates the selected enemies to launchCombat200');
assert.match(startBody,/reason==='cell'/,
  'cell-specific reinforcement behavior must remain explicit and outside lot 4K');
assert.match(startBody,/reason==='detection'\|\|reason==='stealth_fail'/,
  'detection popup behavior must remain explicit and outside lot 4K');
assert.doesNotMatch(startBody,/reason==='manual'/,
  'manual must have no hidden reason-specific behavior inside legacy startCombat');

assert.match(core200,/function liveEnemies\(\)[\s\S]*?!e\.dc200Bypassed[\s\S]*?!e\.dc200BypassedBy\?\.\[hero\]/,
  'manual enemy source must preserve Runtime 2.00 bypass semantics fixed across V113 in lot 4J');

assert.equal(Bridge.isV113DetectionReason('manual'),false,
  'manual must not enter the V113 detection-only branch');
assert.equal(Bridge.isV113DetectionReason('ambush'),true,
  'ambush remains behaviorally distinct and must stay outside lot 4K');
assert.match(bridgeSource,/function requestCombat\(rt=R,options=\{\}\)[\s\S]*?scopedRequest\(rt,\{\.\.\.options,enemyIds,entry\}\)[\s\S]*?openCurrent\(rt,\{\.\.\.scoped\.options,entry\}\)/,
  'canonical requestCombat must preserve options while applying V113 scope before opening Tactical');
assert.match(bridgeSource,/function startDefault\(rt=R,enemyIds=\[\],reason="manual"\)[\s\S]*?requestCombat\(rt,\{enemyIds:arr\(enemyIds\)\.map\(str\),reason,entry:"dc200StartCombat"\}\)/,
  'Bridge already defines the canonical manual-compatible Dungeon entry contract');

console.log('GenSrpG combat lot 4K characterization OK: Runtime 2.00 manual is a single guarded lexical call with no manual-specific legacy behavior; Bridge keeps reason/enemy ids and V113 scope');
