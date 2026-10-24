const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678108.js'),'utf8');

const start=source.indexOf('function ensureStyle(rt=R){');
const end=source.indexOf('function paintWalls(rt=R){',start);
assert.ok(start>=0&&end>start,'V108 ensureStyle block missing');
const style=source.slice(start,end);

for(const forbidden of [/WALL_ASSET/,/gtv2Cell\.blocked/,/drc100Grid/,/dav167870WallCell/]){
  assert.doesNotMatch(style,forbidden,`V108 ensureStyle must no longer own wall CSS: ${forbidden}`);
}
for(const required of [/gtv2Pawn img/,/gtv2108Panel/,/gtv2108Row/,/gtv2108LegacyAttack/,/data-v108-reload/,/data-v108-use/,/@media\(max-width:540px\)/]){
  assert.match(style,required,`V108 non-wall presentation must remain intact: ${required}`);
}
assert.match(source,/function paintWalls\(rt=R\)/,'historical V108 wall painter must remain inspectable');
assert.match(source,/function patchDungeonMapHtml\(rt=R\)/,'historical V108 wall HTML patch must remain inspectable');
assert.match(source,/function actionPanelHtml\(rt=R,actor=null\)/,'V108 tactical action panel must remain');
assert.match(source,/function equipWeapon\(rt=R,heroId="",inventoryIndex=-1\)/,'V108 equipment behavior must remain');
assert.match(source,/function reloadWeapon\(rt=R,heroId="",inventoryIndex=-1\)/,'V108 reload behavior must remain');
assert.match(source,/async function useConsumable\(rt=R,heroId="",itemId="",qty=1\)/,'V108 consumable behavior must remain');

console.log('GenSrpG V114.11: V108 residual wall CSS retired; pawn/action/equipment/reload/consumable presentation preserved');
