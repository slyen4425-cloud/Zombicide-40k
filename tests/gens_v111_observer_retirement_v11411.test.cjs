const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

// The old implementation remains readable/exportable as rollback documentation, but
// V114.11 already suppresses its body observer during the guarded legacy-chain install.
assert.match(source,/function observe\(rt=R\)/,'historical V111 observer seam should remain inspectable during progressive cleanup');
assert.match(source,/observer\.observe\(D\.body,\{childList:true,subtree:true\}\)/,'characterization must still identify the historical global body observer');

const install=(source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V111 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V111 must no longer activate a document.body MutationObserver');
for(const required of ['ensureStyle(rt)','hookAdapter(rt)','hookMultiDice(rt)','hookDetection(rt)','bindClicks(rt)','maintain(rt)']){
  assert.ok(install.includes(required),`observer retirement must preserve V111 behavior: missing ${required}`);
}

// V114.11 still guards the remaining historical layers while their observers are retired
// one by one, so this cleanup must not weaken the chain protection prematurely.
assert.match(integration,/target===D\.body\|\|target===D\.documentElement/,'legacy chain body/html observer guard must remain active');
assert.match(integration,/R\.MutationObserver=NativeMutationObserver/,'native MutationObserver must still be restored after guarded installation');
assert.match(integration,/installWithoutGlobalObserver\(R\.GensRpgTacticalRuntimeFixes1678111,"V111 tactical runtime"\)/,'V111 must still install through the V114.11 observer guard during transition');

console.log('GenSrpG V114.11: V111 global body observer retired; multi-dice, detection, dock and maintenance remain active');
