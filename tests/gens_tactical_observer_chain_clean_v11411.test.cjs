const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const layers=[
  ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
  ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
  ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
  ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
  ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js']
];

for(const [label,file] of layers){
  const source=read(file);
  assert.match(source,/function observe\(rt=R\)/,`${label}: historical observer seam should remain inspectable during progressive cleanup`);
  const install=(source.match(/function install\(rt=R\)\{[^\n]*/)||[''])[0];
  assert.ok(install,`${label}: install function missing`);
  assert.doesNotMatch(install,/observe\(rt\)/,`${label}: install must not activate its historical global observer`);
}

const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.doesNotMatch(v110,/MutationObserver/,'V110 canonical stats must not introduce DOM observation');
assert.doesNotMatch(v11411,/MutationObserver/,'V114.11 final Tactical layer must remain free of MutationObserver authority');

const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
assert.doesNotMatch(integration,/installWithoutGlobalObserver/,'integration must not need a scoped observer shim once every active layer is clean');
assert.doesNotMatch(integration,/beginChainObserverGuard|endChainObserverGuard|chainObserverGuard/,'the legacy whole-chain observer guard must be retired');
assert.doesNotMatch(integration,/R\.MutationObserver\s*=/,'integration must never replace the browser MutationObserver constructor');

for(const globalName of [
  'GensRpgTacticalPolish1678108',
  'GensRpgTacticalPolish1678109',
  'GensRpgTacticalRuntimeFixes1678111',
  'GensRpgTacticalCombatCoherence1678112',
  'GensRpgTacticalRuntimeAuthority1678113'
]){
  assert.match(integration,new RegExp(globalName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?\\.installWithRetries\\?\\.\\(R\\)'),`${globalName}: integration must install the cleaned layer directly`);
}

console.log('GenSrpG V114.11 Tactical chain clean: no active global observer and no MutationObserver constructor guard required');
