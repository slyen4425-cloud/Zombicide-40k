const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const block=(source,startSig,nextSig,label)=>{
  const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);
  const end=source.indexOf(nextSig,start);assert.ok(end>start,`${label}: missing boundary ${nextSig}`);
  return source.slice(start,end);
};

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v109=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const doc=read('docs/GENSRPG_VISUAL_AUTHORITY_INVENTORY.md');

assert.match(ui,/const WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/,'base Tactical UI must own the validated wall asset');
assert.match(ui,/function wallTileHtml\(\).*gtv2WallTile/,'base Tactical UI must emit a real wall image tile');
assert.match(ui,/function ensureWallTile\(el\)/,'base Tactical UI must own idempotent wall tile attachment');
const renderGrid=block(ui,'function renderGrid(){','function renderRosterGroup','base Tactical UI renderGrid');
assert.match(renderGrid,/blocked\.has\(k\)\?wallTileHtml\(\)/,'blocked Tactical cells must render their wall tile directly');
assert.match(ui,/function patchDungeonMapHtml\(\)/,'base Tactical UI must own Dungeon wall HTML patching');
assert.match(ui,/function paintLiveWalls\(\)/,'base Tactical UI must own live wall repair');
assert.match(ui,/function hookDungeonRender\(\)/,'base Tactical UI must own Dungeon render hookup');
const globalPolish=block(ui,'function installGlobalPolish(){','const api=','base Tactical UI installGlobalPolish');
for(const required of ['preloadWall()','patchDungeonMapHtml()','hookDungeonRender()','paintLiveWalls()'])assert.ok(globalPolish.includes(required),`base Tactical UI canonical wall pipeline missing ${required}`);

for(const sig of ['function paintWalls(rt=R)','function patchDungeonMapHtml(rt=R)','function hookDungeonRender(rt=R)'])assert.ok(v108.includes(sig),`V108 historical wall seam missing: ${sig}`);
const i108=block(v108,'function install(rt=R){','function installWithRetries','V108 install');
for(const retired of ['patchDungeonMapHtml(rt)','hookDungeonRender(rt)','paintWalls(rt)'])assert.ok(!i108.includes(retired),`V108 install still owns walls: ${retired}`);
for(const required of ['ensureStyle(rt)','bindControls(rt)','hookUiRender(rt)','enhanceActions(rt)'])assert.ok(i108.includes(required),`V108 non-wall behavior lost ${required}`);
const hookUi108=block(v108,'function hookUiRender(rt=R){','function observe(rt=R){','V108 hookUiRender');
assert.match(hookUi108,/enhanceActions\(rt\)/,'V108 render hook must preserve action enhancement');
assert.doesNotMatch(hookUi108,/paintWalls\(rt\)/,'V108 render hook must no longer repaint walls');

assert.match(v109,/function paintBuilderWalls\(rt=R\)/,'V109 historical wall painter must remain inspectable for rollback');
assert.match(v109,/function hookDungeonRender\(rt=R\)/,'V109 historical Dungeon wall hook must remain inspectable for rollback');
const i109=block(v109,'function install(rt=R){','function installWithRetries','V109 install');
assert.doesNotMatch(i109,/hookDungeonRender\(rt\)/,'V109 install must no longer hook Dungeon renders for walls');
assert.ok(i109.includes('enhance(rt)'),'V109 non-wall enhancement must remain active');
const enhance109=block(v109,'function enhance(rt=R){','function hookUi','V109 enhance');
assert.doesNotMatch(enhance109,/paintBuilderWalls\(rt\)/,'V109 enhance must no longer repaint walls');
for(const required of ['normalizeBattleRanges(battle)','renderTimeline(rt)','ensureUnarmedOption(rt)','ensureQuickAttack(rt)'])assert.ok(enhance109.includes(required),`V109 enhancement lost ${required}`);

assert.match(v111,/function paintWalls\(rt=R\)/,'V111 historical wall painter must remain inspectable for rollback');
const i111=block(v111,'function install(rt=R){','function installWithRetries','V111 install');
assert.ok(i111.includes('maintain(rt)'),'V111 maintenance must remain active');
const maintain111=block(v111,'function maintain(rt=R){','function queueMaintain','V111 maintain');
assert.doesNotMatch(maintain111,/paintWalls\(rt\)/,'V111 maintenance must no longer repaint walls');
for(const required of ['hideRuntimeTabs(rt)','ensureDock(rt)','paintDiceOverlay(rt)'])assert.ok(maintain111.includes(required),`V111 maintenance lost ${required}`);

assert.match(v112,/function markWallCells\(rt=R\)/,'V112 historical wall marker must remain inspectable for rollback');
const i112=block(v112,'function install(rt=R){','function installWithRetries','V112 install');
assert.ok(i112.includes('maintain(rt)'),'V112 maintenance must remain active for details/explanations');
const maintain112=block(v112,'function maintain(rt=R){','function queueMaintain','V112 maintain');
assert.doesNotMatch(maintain112,/markWallCells\(rt\)/,'V112 maintenance must no longer repaint walls');
assert.ok(maintain112.includes('patchDetail(rt)'),'V112 detail sheet maintenance must remain');
assert.ok(maintain112.includes('patchDice(rt)'),'V112 damage explanation maintenance must remain');

assert.match(v113,/function paintWalls\(rt=R\)/,'V113 historical wall painter must remain inspectable for rollback');
const maintain113=block(v113,'function maintain(rt=R){','function queueMaintain','V113 maintain');
const i113=block(v113,'function install(rt=R){','function installWithRetries','V113 install');
assert.doesNotMatch(maintain113,/paintWalls\(rt\)/,'V113 maintenance must no longer repaint walls');
assert.doesNotMatch(i113,/paintWalls\(rt\)/,'V113 install must no longer repaint walls');
assert.ok(i113.includes('ensureDetectionHooks(rt)'),'V113 detection authority must remain active');
assert.ok(i113.includes('bindBoardClicks(rt)'),'V113 board detection must remain active');

for(const name of ['V108','V109','V111','V112','V113']){
  assert.match(doc,new RegExp('\\| '+name+' \\| \\*\\*retiré\\*\\* \\| \\*\\*retiré\\*\\* \\|'),`visual authority inventory must mark ${name} JS and CSS wall authority retired`);
}
assert.match(doc,/Retrait CSS — terminé/,'inventory must record completed historical wall CSS retirement');
assert.match(doc,/aucune couche V108\/V109\/V111\/V112\/V113 ne peut reprendre de règle CSS murale/,'inventory must record the final CSS authority lock');
assert.match(doc,/GensRpgTacticalCombatV2Ui/,'visual authority inventory must name base Tactical UI as target authority');
console.log('GenSrpG V114.11 visual authority consolidated: Tactical UI owns JS+CSS wall pipeline; V108/V109/V111/V112/V113 historical wall authority retired');
