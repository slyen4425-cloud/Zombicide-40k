const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const v108=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678108.js'),'utf8');
const v113=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');

const install=(v108.match(/function install\(rt=R\)\{\n\s*[^\n]+/)||[''])[0];
assert.ok(install,'V108 install function missing');
assert.doesNotMatch(install,/hookDetection\(rt\)/,'V108 must no longer wrap dungeonMoveHero098 or own combat detection');
assert.match(v108,/function hookDetection\(rt=R\)/,'historical V108 detection seam remains inspectable during progressive cleanup');
assert.match(v108,/function scanImmediateDetection\(rt=R\)/,'historical V108 detection calculation remains available for characterization tests');
assert.match(v108,/scanImmediateDetection,hookDetection/,'historical V108 detection helpers remain exported for rollback characterization');

for(const required of ['patchDungeonMapHtml(rt)','hookDungeonRender(rt)','bindControls(rt)','hookUiRender(rt)','paintWalls(rt)','enhanceActions(rt)']){
  assert.ok(install.includes(required),`V108 detection retirement must preserve non-detection behavior: missing ${required}`);
}

assert.match(v113,/function ensureDetectionHooks\(rt=R\)\{hookMovement\(rt\);for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)hookEventFunction\(rt,name\);hookStart\(rt\);hookAdapter\(rt\);return true\}/,'V113 must remain the active movement/event/start detection authority');
assert.match(v113,/movement-detection-v113/,'V113 movement detection must remain active');
assert.match(v113,/board-cell-detection-v113/,'V113 board-cell detection must remain active');

console.log('GenSrpG V114.11: V108 detection authority retired; V113 remains sole final detection owner');
