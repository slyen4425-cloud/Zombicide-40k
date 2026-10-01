'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,label+' block missing');
  return src.slice(a,b);
};

const layers=[
  {
    id:'V108',
    path:'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js',
    active:['ensureStyle(rt)','bindControls(rt)','hookUiRender(rt)','enhanceActions(rt)'],
    retries:'[80,220,600,1200,2500]'
  },
  {
    id:'V109',
    path:'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js',
    active:['ensureStyle(rt)','hookAdapterRanges(rt)','hookUi(rt)','bind(rt)','enhance(rt)'],
    retries:'[80,220,600,1200,2500]'
  },
  {
    id:'V111',
    path:'assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js',
    active:['ensureStyle(rt)','hookAdapter(rt)','hookMultiDice(rt)','bindClicks(rt)','hookUiRender(rt)','maintain(rt)'],
    retries:'[80,220,600,1200,2500,5000]'
  },
  {
    id:'V112',
    path:'assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js',
    active:['ensureStyle(rt)','hookAdapter(rt)','hookResultDetails(rt)','bindDetail(rt)','maintain(rt)'],
    retries:'[80,220,600,1200,2500,5000]'
  },
  {
    id:'V113',
    path:'assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js',
    active:['ensureStyle(rt)','ensureDetectionHooks(rt)','bindBoardClicks(rt)','animateDiceOverlay(rt)'],
    retries:'[80,220,600,1200,2500,5000,7500,10000]'
  }
];

for(const layer of layers){
  const src=read(layer.path);
  assert.doesNotMatch(src,/function observe\(rt=R\)/,layer.id+' inactive observe seam must be physically retired');
  assert.doesNotMatch(src,/MutationObserver/,layer.id+' must no longer contain MutationObserver authority');
  assert.doesNotMatch(src,/\bobserver\s*=\s*null\b/,layer.id+' dead observer state must be retired');

  const install=block(src,'function install(rt=R){','function installWithRetries',layer.id+' install');
  for(const call of layer.active)assert.ok(install.includes(call),layer.id+' active install responsibility drifted: '+call);
  assert.doesNotMatch(install,/\bobserve\s*\(/,layer.id+' install must stay observer-free');

  const retry=block(src,'function installWithRetries(rt=R){','const api={',layer.id+' retries');
  assert.ok(retry.includes(layer.retries),layer.id+' installWithRetries cadence drifted');
}

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical legacy observer seam retirement',
  retired:['V108','V109','V111','V112','V113'],
  mutationObserversRemainingInTargetLayers:0,
  activeInstallResponsibilitiesPreserved:true,
  retriesPreserved:true
},null,2));
