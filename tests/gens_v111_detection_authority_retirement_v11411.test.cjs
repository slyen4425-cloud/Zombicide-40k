const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const v111=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');
const v113=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');

const install=(v111.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V111 install function missing');
assert.doesNotMatch(install,/hookDetection\(rt\)/,'V111 must no longer wrap Dungeon movement/events/render for combat detection');
assert.match(v111,/function hookDetection\(rt=R\)/,'historical V111 detection seam remains inspectable');
assert.match(v111,/function scanDetection\(rt=R,reason="detection-v111"\)/,'historical V111 detector remains available for characterization');
assert.match(v111,/scanDetection,hookDetection/,'historical V111 detection helpers remain exported');

for(const required of ['ensureStyle(rt)','hookAdapter(rt)','hookMultiDice(rt)','bindClicks(rt)','refreshBattleAttacks(rt,b)','maintain(rt)']){
  assert.ok(install.includes(required),`V111 detection retirement must preserve combat/UI behavior: missing ${required}`);
}

assert.match(v113,/function ensureDetectionHooks\(rt=R\)\{hookMovement\(rt\);for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)hookEventFunction\(rt,name\);hookStart\(rt\);hookAdapter\(rt\);return true\}/,'V113 must remain final movement/event/start detection authority');
assert.match(v113,/movement-detection-v113/);
assert.match(v113,/event-detection-v113/);

console.log('GenSrpG V114.11: V111 detection authority retired; V113 remains final detection owner');
