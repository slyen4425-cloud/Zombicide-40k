const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678109.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

assert.match(source,/function observe\(rt=R\)/,'historical V109 observer seam should remain inspectable during progressive cleanup');
assert.match(source,/observer\.observe\(D\.body\|\|D\.documentElement,\{childList:true,subtree:true\}\)/,'characterization must keep identifying the old V109 body/html observer');
const install=(source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V109 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V109 must no longer activate a body/html MutationObserver');
assert.doesNotMatch(install,/hookDungeonRender\(rt\)/,'V109 wall render hook must remain retired');
for(const required of ['ensureStyle(rt)','hookAdapterRanges(rt)','hookUi(rt)','bind(rt)','enhance(rt)'])assert.ok(install.includes(required),`V109 cleanup must preserve non-wall behavior: missing ${required}`);
const enhance=(source.match(/function enhance\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(enhance,'V109 enhance function missing');
assert.doesNotMatch(enhance,/paintBuilderWalls\(rt\)/,'V109 enhance must no longer repaint walls');
for(const required of ['normalizeBattleRanges(battle)','renderTimeline(rt)','ensureUnarmedOption(rt)','ensureQuickAttack(rt)'])assert.ok(enhance.includes(required),`V109 enhancement lost ${required}`);

assert.match(integration,/GensRpgTacticalPolish1678109\?\.installWithRetries\?\.\(R\)/,'clean V109 must install directly');
assert.doesNotMatch(integration,/installWithoutGlobalObserver|R\.MutationObserver\s*=/,'V109 must no longer require or trigger a global observer shim');
console.log('GenSrpG V114.11: V109 observer and wall authorities retired; timeline/range/unarmed/quick attack preserved');
