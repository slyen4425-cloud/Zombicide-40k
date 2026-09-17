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
const oldManualCall="b.onclick=()=>startCombat(live.map(e=>String(e.id)),'manual')";
const bridgeManualCall="b.onclick=()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'manual',entry:'dc200ManualAction'})";

assert.equal((core200.match(/startCombat\(live\.map\(e=>String\(e\.id\)\),'manual'\)/g)||[]).length,0,
  'lot 4K must remove the Runtime 2.00 manual lexical startCombat callsite');
assert.equal((core200.match(/entry:'dc200ManualAction'/g)||[]).length,1,
  'lot 4K must expose exactly one canonical manual Bridge entry');
assert.ok(!core200.includes(oldManualCall),
  'the non-positional ENGAGER LE COMBAT button must not fall back to lexical startCombat');
assert.ok(core200.includes(bridgeManualCall),
  'the non-positional ENGAGER LE COMBAT button must call the canonical Tactical Bridge directly');
assert.match(core200,/if\(!positional&&live\.length\)\{[\s\S]*?if\(!combatEnabled200\(\)\)[\s\S]*?b\.textContent='⚔️ ENGAGER LE COMBAT · '[\s\S]*?GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:live\.map\(e=>String\(e\.id\)\),reason:'manual',entry:'dc200ManualAction'\}\)/,
  'manual Bridge entry must preserve non-positional mode, live enemies, combatEnabled200, enemyIds and reason');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'Runtime 2.00 historical startCombat body must remain available for compatibility after the active callsites have migrated');
const startBody=startMatch[1];
assert.match(startBody,/let chosen=liveEnemies\(\)\.filter\(e=>ids\.map\(String\)\.includes\(String\(e\.id\)\)\)/,
  'historical compatibility path must still re-filter requested ids through Runtime 2.00 liveEnemies');
assert.match(startBody,/const begin=\(\)=>launchCombat200\(x,chosen\)/,
  'historical compatibility path must still delegate selected enemies to launchCombat200');
assert.doesNotMatch(startBody,/reason==='cell'/,
  'after lot 4M, cell-specific reinforcement ownership must no longer live inside legacy startCombat');
assert.match(core200,/function startCellCombat\(target,x=rt\(\)\)\{[\s\S]*?nearbyInterveners\(chosen\[0\],x\)[\s\S]*?entry:'dc200CellAction'[\s\S]*?limitEnemyIdsToRequest:true/,
  'after lot 4M, cell-specific reinforcement behavior must remain explicit in the Dungeon-owned startCellCombat helper');
assert.match(startBody,/reason==='detection'\|\|reason==='stealth_fail'/,
  'historical detection popup behavior must remain explicit and outside lot 4K');
assert.doesNotMatch(startBody,/reason==='manual'/,
  'manual must not gain hidden reason-specific behavior inside legacy startCombat');

assert.match(core200,/function liveEnemies\(\)[\s\S]*?!e\.dc200Bypassed[\s\S]*?!e\.dc200BypassedBy\?\.\[hero\]/,
  'manual enemy source must preserve Runtime 2.00 bypass semantics fixed across V113 in lot 4J');

assert.equal(Bridge.isV113DetectionReason('manual'),false,
  'manual must not enter the V113 detection-only branch');
assert.equal(Bridge.isV113DetectionReason('ambush'),true,
  'ambush remains behaviorally distinct from manual even after its lot 4L migration');
assert.match(bridgeSource,/function requestCombat\(rt=R,options=\{\}\)[\s\S]*?scopedRequest\(rt,\{\.\.\.options,enemyIds,entry\}\)[\s\S]*?openCurrent\(rt,\{\.\.\.scoped\.options,entry\}\)/,
  'canonical requestCombat must preserve options while applying V113 scope before opening Tactical');
assert.match(bridgeSource,/function startDefault\(rt=R,enemyIds=\[\],reason="manual"\)[\s\S]*?requestCombat\(rt,\{enemyIds:arr\(enemyIds\)\.map\(str\),reason,entry:"dc200StartCombat"\}\)/,
  'Bridge must retain the characterized compatibility entry contract');

console.log('GenSrpG combat lot 4K permanent contract OK: Runtime 2.00 manual remains Bridge-backed; later lots 4L/4M keep their distinct owners without changing manual semantics');
