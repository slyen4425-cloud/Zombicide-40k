const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

assert.doesNotMatch(source,/function observe\(rt=R\)/,'inactive V111 observer seam must stay retired');
assert.doesNotMatch(source,/MutationObserver/,'V111 must stay free of MutationObserver authority');
const install=(source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V111 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V111 must no longer activate a document.body MutationObserver');
assert.doesNotMatch(install,/hookDetection\(rt\)/,'V111 detection authority must remain retired');
for(const required of ['ensureStyle(rt)','hookAdapter(rt)','hookMultiDice(rt)','bindClicks(rt)','refreshBattleAttacks(rt,b)','maintain(rt)'])assert.ok(install.includes(required),`V111 cleanup must preserve combat/UI behavior: missing ${required}`);

assert.match(integration,/GensRpgTacticalRuntimeFixes1678111\?\.installWithRetries\?\.\(R\)/,'clean V111 must install directly');
assert.doesNotMatch(integration,/installWithoutGlobalObserver|R\.MutationObserver\s*=/,'V111 must no longer require or trigger a global observer shim');
console.log('GenSrpG V114.11: V111 observer and detection authorities retired; multi-dice/dock/refresh preserved');
