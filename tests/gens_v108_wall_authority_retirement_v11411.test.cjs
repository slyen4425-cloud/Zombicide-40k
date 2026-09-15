const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678108.js'),'utf8');

const block=(startSig,nextSig,label)=>{
  const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);
  const end=source.indexOf(nextSig,start);assert.ok(end>start,`${label}: missing ${nextSig}`);
  return source.slice(start,end);
};

for(const sig of ['function paintWalls(rt=R)','function patchDungeonMapHtml(rt=R)','function hookDungeonRender(rt=R)'])assert.ok(source.includes(sig),`historical V108 wall seam must remain inspectable: ${sig}`);

const install=block('function install(rt=R){','function installWithRetries','V108 install');
for(const retired of ['paintWalls(rt)','patchDungeonMapHtml(rt)','hookDungeonRender(rt)'])assert.ok(!install.includes(retired),`V108 install must not reactivate wall authority: ${retired}`);
for(const required of ['ensureStyle(rt)','bindControls(rt)','hookUiRender(rt)','enhanceActions(rt)'])assert.ok(install.includes(required),`V108 install lost non-wall behavior: ${required}`);

const hookUi=block('function hookUiRender(rt=R){','function observe(rt=R){','V108 hookUiRender');
assert.match(hookUi,/enhanceActions\(rt\)/,'V108 render hook must preserve tactical action panel enhancement');
assert.doesNotMatch(hookUi,/paintWalls\(rt\)/,'V108 render hook must not repaint walls');

assert.match(source,/function actionPanelHtml\(rt=R,actor=null\)/,'V108 tactical action panel must remain');
assert.match(source,/function equipWeapon\(rt=R,heroId="",inventoryIndex=-1\)/,'V108 equipment behavior must remain');
assert.match(source,/function reloadWeapon\(rt=R,heroId="",inventoryIndex=-1\)/,'V108 reload behavior must remain');
assert.match(source,/async function useConsumable\(rt=R,heroId="",itemId="",qty=1\)/,'V108 consumable behavior must remain');
assert.match(source,/object-fit:contain!important/,'V108 pawn framing must remain');

console.log('GenSrpG V114.11: V108 active JS wall authority retired; action/equipment/reload/consumable UI preserved');
