const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const block=(source,startSig,nextSig,label)=>{const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);const end=source.indexOf(nextSig,start);assert.ok(end>start,`${label}: missing ${nextSig}`);return source.slice(start,end)};
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');

// Historical marker stays available for rollback/reference, but active maintenance no longer owns walls.
assert.match(v112,/function markWallCells\(rt=R\)/,'V112 historical wall marker must stay inspectable');
const maintain=block(v112,'function maintain(rt=R){','function queueMaintain','V112 maintain');
const install=block(v112,'function install(rt=R){','function installWithRetries','V112 install');
assert.doesNotMatch(maintain,/markWallCells\(rt\)/,'V112 maintain must not repaint walls');
assert.doesNotMatch(install,/markWallCells\(rt\)/,'V112 install must not repaint walls directly');

// V112 still owns its non-wall responsibilities.
for(const required of ['ensureStyle(rt)','patchDetail(rt)','patchDice(rt)'])assert.ok(maintain.includes(required),`V112 maintain lost ${required}`);
for(const required of ['hookAdapter(rt)','hookResultDetails(rt)','bindDetail(rt)','maintain(rt)'])assert.ok(install.includes(required),`V112 install lost ${required}`);
assert.match(v112,/function selectCombatants\(/,'V112 spatial selector must remain');
assert.match(v112,/function explainAttack\(/,'V112 damage explanation must remain');
assert.match(v112,/function patchDetail\(/,'V112 tactical details must remain');

// The disabled historical detection hook may still reference markWallCells, but install must not reactivate it.
assert.match(v112,/function hookDetection\(rt=R\)/,'historical V112 detection hook stays inspectable');
assert.doesNotMatch(install,/hookDetection\(rt\)/,'V112 detection authority must remain retired');

// Canonical Tactical UI remains the active wall renderer.
for(const required of [/function wallTileHtml\(/,/function ensureWallTile\(el\)/,/function paintLiveWalls\(\)/,/function patchDungeonMapHtml\(\)/,/function hookDungeonRender\(\)/])assert.match(ui,required,'canonical Tactical wall pipeline must remain intact');

console.log('GenSrpG V114.11: V112 active wall marking retired; spatial/details/explanations preserved; Tactical UI owns walls');
