const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const v112=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'),'utf8');
const v113=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');

const install=(v112.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V112 install function missing');
assert.doesNotMatch(install,/hookDetection\(rt\)/,'V112 must no longer wrap Dungeon movement/events/spawn/render for combat detection');
assert.doesNotMatch(install,/scheduleDetection\(rt,"install-vision-v112",true\)/,'V112 must no longer trigger an install-time combat detection scan');
assert.doesNotMatch(install,/hookStart\(rt\)/,'V112 must remain retired from global combat-start ownership');

for(const required of ['ensureStyle(rt)','hookAdapter(rt)','hookResultDetails(rt)','bindDetail(rt)','maintain(rt)']){
  assert.ok(install.includes(required),`V112 detection retirement must preserve spatial/UI behavior: missing ${required}`);
}

for(const seam of ['function scanDetection(rt=R,reason="vision-v112",force=false)','function scheduleDetection(rt=R,reason="vision-v112",force=false)','function hookDetection(rt=R)']){
  assert.ok(v112.includes(seam),`historical V112 detection seam must remain inspectable: ${seam}`);
}
assert.match(v112,/detectionPairs,detectionEnemyIds,scanDetection,selectCombatants/,'V112 characterization/spatial helpers must remain exported');
assert.match(v112,/hookAdapter,hookStart,hookResultDetails/,'V112 historical wrappers must remain inspectable during progressive cleanup');

assert.match(v113,/function ensureDetectionHooks\(rt=R\)\{hookMovement\(rt\);for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)hookEventFunction\(rt,name\);hookStart\(rt\);hookAdapter\(rt\);return true\}/,'V113 must remain the final movement/event/start detection authority');
assert.doesNotMatch(v113,/board-cell-detection-v113/,'V113 must not retain board click/pointer movement detection');
assert.match(v113,/movement-detection-v113/,'V113 movement detection must remain active');
assert.match(v113,/if\(out!==false\)scanDetection\(rt,"movement-detection-v113",true\)/,'V113 legacy movement hook must scan synchronously after successful movement');

console.log('GenSrpG V114.11: V112 detection authority retired; V113 owns LOS/detection without board-click movement duplication');
