'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{
  const a=src.indexOf(start);
  const b=src.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,label+' block missing');
  return src.slice(a,b);
};

const layers=[
  {
    id:'V108',
    path:'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js',
    active:['ensureStyle(rt)','bindControls(rt)','hookUiRender(rt)','enhanceActions(rt)']
  },
  {
    id:'V109',
    path:'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js',
    active:['ensureStyle(rt)','hookAdapterRanges(rt)','hookUi(rt)','bind(rt)','enhance(rt)']
  },
  {
    id:'V111',
    path:'assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js',
    active:['ensureStyle(rt)','hookAdapter(rt)','hookMultiDice(rt)','bindClicks(rt)','hookUiRender(rt)','maintain(rt)']
  },
  {
    id:'V112',
    path:'assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js',
    active:['ensureStyle(rt)','hookAdapter(rt)','hookResultDetails(rt)','bindDetail(rt)','maintain(rt)']
  },
  {
    id:'V113',
    path:'assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js',
    active:['ensureStyle(rt)','ensureDetectionHooks(rt)','bindBoardClicks(rt)','animateDiceOverlay(rt)']
  }
];

const result=[];
for(const layer of layers){
  const src=read(layer.path);
  assert.match(src,/function observe\(rt=R\)/,layer.id+' historical observe seam must exist before retirement');
  assert.match(src,/new (?:rt\?\.)?MutationObserver|new rt\.MutationObserver|new MutationObserver/,
    layer.id+' historical observe seam must still instantiate MutationObserver before retirement');

  const install=block(src,'function install(rt=R){','function installWithRetries',layer.id+' install');
  assert.doesNotMatch(install,/\bobserve\s*\(/,layer.id+' install must not activate historical observer seam');
  for(const call of layer.active){
    assert.ok(install.includes(call),layer.id+' active install responsibility drifted: '+call);
  }

  const api=block(src,'const api={','if(doc(R))',layer.id+' api');
  assert.doesNotMatch(api,/\bobserve\b/,layer.id+' public API must not expose historical observer seam');

  result.push({
    id:layer.id,
    observerSeamPresent:true,
    observerActiveFromInstall:false,
    observerPublic:false,
    activeInstallResponsibilities:layer.active
  });
}

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical legacy observer seam retirement characterization',
  layers:result,
  selectedSeam:'remove inactive observe/MutationObserver seams only',
  retriesChangeExpected:false,
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
