const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const block=(source,startSig,nextSig,label)=>{const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);const end=source.indexOf(nextSig,start);assert.ok(end>start,`${label}: missing ${nextSig}`);return source.slice(start,end)};
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');

// Keep rollback/reference code, remove active V113 wall ownership only.
assert.match(v113,/function paintWalls\(rt=R\)/,'V113 historical painter must stay inspectable during progressive cleanup');
const maintain=block(v113,'function maintain(rt=R){','function queueMaintain','V113 maintain');
const install=block(v113,'function install(rt=R){','function installWithRetries','V113 install');
assert.doesNotMatch(maintain,/paintWalls\(rt\)/,'V113 maintain must not repaint walls');
assert.doesNotMatch(install,/paintWalls\(rt\)/,'V113 install must not repaint walls');

// Detection/scope authority must remain untouched by this visual-only retirement.
for(const required of ['ensureStyle(rt)','ensureDetectionHooks(rt)'])assert.ok(maintain.includes(required),`V113 maintain lost ${required}`);
for(const required of ['ensureStyle(rt)','ensureDetectionHooks(rt)','bindBoardClicks(rt)','animateDiceOverlay(rt)'])assert.ok(install.includes(required),`V113 install lost ${required}`);
assert.match(v113,/function selectCombatants\(/,'V113 combatant scope must remain');
assert.match(v113,/function ensureDetectionHooks\(rt=R\)/,'V113 detection authority must remain');
assert.match(v113,/function bindBoardClicks\(rt=R\)/,'V113 board detection must remain');

// Canonical Tactical UI remains responsible for every wall surface.
for(const required of [/function wallTileHtml\(/,/function ensureWallTile\(el\)/,/function paintLiveWalls\(\)/,/function patchDungeonMapHtml\(\)/,/function hookDungeonRender\(\)/])assert.match(ui,required,'canonical Tactical wall pipeline must remain intact');
const globalPolish=block(ui,'function installGlobalPolish(){','const api=','Tactical UI installGlobalPolish');
assert.match(globalPolish,/paintLiveWalls\(\)/,'canonical UI must continue repairing live walls');

console.log('GenSrpG V114.11: V113 active wall painting retired; scope/detection preserved; Tactical UI owns wall rendering');
