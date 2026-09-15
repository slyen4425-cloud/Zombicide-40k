const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

assert.match(source,/function observe\(rt=R\)/,'historical V112 observer seam should remain inspectable during progressive cleanup');
assert.match(source,/observer\.observe\(D\.body,\{childList:true,subtree:true\}\)/,'characterization must keep identifying the old V112 body observer');

const install=(source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V112 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V112 must no longer activate a document.body MutationObserver');
for(const required of ['ensureStyle(rt)','hookAdapter(rt)','hookResultDetails(rt)','hookDetection(rt)','bindDetail(rt)','maintain(rt)','scheduleDetection(rt,"install-vision-v112",true)']){
  assert.ok(install.includes(required),`observer retirement must preserve V112 behavior: missing ${required}`);
}
assert.doesNotMatch(install,/hookStart\(rt\)/,'V112 must remain retired from global combat-start ownership');

assert.match(integration,/target===D\.body\|\|target===D\.documentElement/,'V114.11 chain observer guard must remain until the whole legacy chain is cleaned');
assert.match(integration,/installWithoutGlobalObserver\(R\.GensRpgTacticalCombatCoherence1678112,"V112 combat coherence"\)/,'V112 must still install through the transition guard');

console.log('GenSrpG V114.11: V112 global observer retired; spatial selection, explanations and detection remain active');
