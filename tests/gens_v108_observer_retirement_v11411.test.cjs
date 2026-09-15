const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678108.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

assert.match(source,/function observe\(rt=R\)/,'historical V108 observer seam should remain inspectable during progressive cleanup');
assert.match(source,/observer\.observe\(D\.body\|\|D\.documentElement,\{childList:true,subtree:true\}\)/,'characterization must keep identifying the old global V108 observer');
const install=(source.match(/function install\(rt=R\)\{\n\s*[^\n]+/)||[''])[0];
assert.ok(install,'V108 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V108 must no longer activate a body/html MutationObserver');
assert.doesNotMatch(install,/hookDetection\(rt\)/,'V108 detection authority must remain retired');
for(const required of ['ensureStyle(rt)','bindControls(rt)','hookUiRender(rt)','enhanceActions(rt)'])assert.ok(install.includes(required),`V108 cleanup must preserve UI/equipment behavior: missing ${required}`);
for(const retired of ['patchDungeonMapHtml(rt)','hookDungeonRender(rt)','paintWalls(rt)'])assert.ok(!install.includes(retired),`V108 install must no longer own walls: found ${retired}`);

const hookUiStart=source.indexOf('function hookUiRender(rt=R){');
const hookUiEnd=source.indexOf('function observe(rt=R){',hookUiStart);
assert.ok(hookUiStart>=0&&hookUiEnd>hookUiStart,'V108 hookUiRender block missing');
const hookUi=source.slice(hookUiStart,hookUiEnd);
assert.match(hookUi,/enhanceActions\(rt\)/,'V108 UI render hook must still restore tactical actions');
assert.doesNotMatch(hookUi,/paintWalls\(rt\)/,'V108 UI render hook must no longer repaint walls');

assert.match(integration,/GensRpgTacticalPolish1678108\?\.installWithRetries\?\.\(R\)/,'clean V108 must install directly');
assert.doesNotMatch(integration,/installWithoutGlobalObserver|R\.MutationObserver\s*=/,'V108 must no longer require or trigger a global observer shim');
console.log('GenSrpG V114.11: V108 observer/detection/wall authorities retired; action and equipment UI preserved');
