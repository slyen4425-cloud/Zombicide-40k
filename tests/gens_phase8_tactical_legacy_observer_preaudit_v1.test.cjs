'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(source,startSig,nextSig,label)=>{
  const start=source.indexOf(startSig);
  assert.ok(start>=0,label+': missing '+startSig);
  const end=source.indexOf(nextSig,start);
  assert.ok(end>start,label+': missing '+nextSig);
  return source.slice(start,end);
};

const layers=[
  ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js',
    ['ensureStyle(rt)','bindControls(rt)','hookUiRender(rt)','enhanceActions(rt)']],
  ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js',
    ['ensureStyle(rt)','hookAdapterRanges(rt)','hookUi(rt)','bind(rt)','enhance(rt)']],
  ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js',
    ['ensureStyle(rt)','hookAdapter(rt)','hookMultiDice(rt)','bindClicks(rt)','hookUiRender(rt)','maintain(rt)']],
  ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js',
    ['ensureStyle(rt)','hookAdapter(rt)','hookResultDetails(rt)','bindDetail(rt)','maintain(rt)']],
  ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js',
    ['ensureStyle(rt)','ensureDetectionHooks(rt)','bindBoardClicks(rt)','animateDiceOverlay(rt)']]
];

for(const [label,file,activeCalls] of layers){
  const source=read(file);
  assert.match(source,/function observe\(rt=R\)/,label+': historical observer seam must still exist at preaudit baseline');
  assert.match(source,/MutationObserver/,label+': observer implementation must remain inspectable before retirement');
  const install=block(source,'function install(rt=R){','function installWithRetries',label+' install');
  assert.doesNotMatch(install,/observe\(rt\)/,label+': observer must already be inactive before retirement');
  for(const call of activeCalls){
    assert.ok(install.includes(call),label+': active responsibility must remain present before observer cleanup: '+call);
  }
}

const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.doesNotMatch(v110,/MutationObserver/,'V110 canonical stats already has no observer seam');
assert.doesNotMatch(v11411,/MutationObserver/,'V114.11 final layer already has no observer seam');

const cleanGuard=read('tests/gens_tactical_observer_chain_clean_v11411.test.cjs');
assert.match(cleanGuard,/historical observer seam should remain inspectable during progressive cleanup/,
  'existing guard must explicitly characterize the observer seam as historical');
assert.match(cleanGuard,/install must not activate its historical global observer/,
  'existing guard must prove observers are inactive before deletion');

const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
assert.doesNotMatch(integration,/installWithoutGlobalObserver|beginChainObserverGuard|endChainObserverGuard/,
  'integration must not rely on observer suppression shims');

console.log(JSON.stringify({
  scenario:'Phase 8 legacy Tactical observer-seam preaudit',
  layers:['V108','V109','V111','V112','V113'],
  activeGlobalObservers:0,
  historicalObserverSeamsPresent:5,
  selectedNextMicroLot:'remove inactive MutationObserver seams only',
  protectedActiveResponsibilities:true,
  gameplayChangeExpected:false,
  indexChangeRequired:false,
  ready:true
},null,2));
