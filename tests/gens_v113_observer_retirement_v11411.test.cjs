const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

assert.match(source,/function observe\(rt=R\)/,'historical V113 observer seam should remain inspectable during progressive cleanup');
assert.match(source,/observer\.observe\(D\.body,\{childList:true,subtree:true\}\)/,'characterization must keep identifying the old V113 body observer');

const install=(source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V113 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V113 must no longer activate a document.body MutationObserver');
for(const required of ['ensureStyle(rt)','ensureDetectionHooks(rt)','bindBoardClicks(rt)','paintWalls(rt)','animateDiceOverlay(rt)']){
  assert.ok(install.includes(required),`observer retirement must preserve V113 behavior: missing ${required}`);
}
assert.match(source,/function animateDiceOverlay\(rt=R\)\{return false\}/,'V113 must remain non-authoritative for dice animation');
assert.match(source,/for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)/,'V113 event detection hooks must remain explicit');
assert.match(source,/D\.addEventListener\("click",onBoard,false\);D\.addEventListener\("pointerup",onBoard,false\)/,'V113 board detection events must remain explicit');

assert.match(integration,/target===D\.body\|\|target===D\.documentElement/,'V114.11 chain guard remains until all legacy global observer risks are audited');
assert.match(integration,/installWithoutGlobalObserver\(R\.GensRpgTacticalRuntimeAuthority1678113,"V113 runtime authority"\)/,'V113 must still install through the transition guard');

console.log('GenSrpG V114.11: V113 global observer retired; final scope, detection hooks, board clicks and wall authority remain active');
