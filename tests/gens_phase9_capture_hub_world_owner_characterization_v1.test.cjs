'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const activeBytes=fs.readFileSync(path.join(root,'index.html'));
const active=activeBytes.toString('utf8');
const indexBlob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
assert.equal(activeBytes.length,8165438);
assert.equal(indexBlob(activeBytes),'1a61147d5a32889fa85e6a09e846049103b9f0bf');
const oldLoad="<script src=\"assets/gensrpg/capture/screen-return-v1.js?v=1\"></script>";
const newLoad="<script src=\"assets/gensrpg/capture/screen-return-v1.js?v=1\"></script>\n<script src=\"assets/gensrpg/capture/hub-entry-v1.js?v=1\"></script>";
const oldMethod="window.captureEnterWorld139=function(){\n  try{closeTurnPopup(false)}catch(e){}\n  [\"pregameSetup\",\"sessionHeroSetup\",\"sessionObjectSetup\",\"sessionWaveSetup\",\"sessionDungeonSetup\",\"sheet\",\"setup\"].forEach(id=>{\n    const e=document.getElementById(id);if(e)e.style.setProperty(\"display\",\"none\",\"important\");\n  });\n  const menu=document.getElementById(\"menu\");\n  if(menu)menu.style.setProperty(\"display\",\"block\",\"important\");\n  try{renderMenuStatuses()}catch(e){}\n  try{renderCaptureWorldHub()}catch(e){}\n  const hub=document.getElementById(\"captureGameHub\");\n  if(hub){\n    hub.style.setProperty(\"display\",\"block\",\"important\");\n    requestAnimationFrame(()=>hub.scrollIntoView({block:\"start\",behavior:\"auto\"}));\n  }\n};";
const newInstall="window.GensCaptureHubEntryV1.install({\n  closeTurnPopup:()=>closeTurnPopup(false),\n  renderMenuStatuses:()=>renderMenuStatuses(),\n  renderCaptureWorldHub:()=>renderCaptureWorldHub()\n});";
const oldBind="enterWorld:()=>captureEnterWorld139()";
const newBind="enterWorld:()=>window.GensCaptureHubEntryV1.enterWorld()";
assert.equal(active.split(newLoad).length-1,1);
assert.equal(active.split(newInstall).length-1,1);
assert.equal(active.split(newBind).length-1,2);
const restored=active.replace('      if(!isCaptureContext138())return;\n','').replace(newBind,oldBind).replace(newBind,oldBind)
  .replace(newInstall,oldMethod).replace(newLoad,oldLoad);
const bytes=Buffer.from(restored,'utf8');
const source=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');

// Rule 26: characterize only the exact runtime supplied for this preaudit.
assert.equal(bytes.length,8165823,'preaudit requires the exact Phase 9 screen-return runtime');
assert.equal(blob,'26421e0347305437fe2b1dc149b3e4fb8b3761bd','unexpected runtime drift');

function block(id){
  const m=source.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline owner '+id);
  return m[1];
}
const legacy=block('captureFix139');
const legacy138=block('captureFix138');
const legacy151=block('gensStability151');
const match=legacy.match(/window\.captureEnterWorld139=function\(\)\{[\s\S]*?^\};/m);
assert.ok(match,'Capture139 must still own the exact hub-entry visual transition');
assert.equal((source.match(/window\.captureEnterWorld139\s*=/g)||[]).length,1,
  'only one hub transition owner in full runtime');
assert.equal((source.match(/captureEnterWorld139\s*\(/g)||[]).length,2,
  'only the two dedicated Capture owner bindings invoke the legacy transition');
assert.match(legacy,/GensCaptureSessionStartV1\.install\s*\(\s*\{/);
assert.match(legacy,/GensCaptureScreenReturnV1\.install\s*\(\s*\{/);
assert.match(legacy,/enterWorld:\(\)=>captureEnterWorld139\(\)/);
assert.doesNotMatch(legacy,/GensShellScreenReturnV1\s*\??\.\s*register/,
  'Capture139 must not regain Shell screen-return authority');
assert.doesNotMatch(legacy,/window\.goMenu\s*=/,'Capture139 must not regain global navigation authority');

// Historical secondary UI path exists; characterize it without assuming it is redundant.
assert.match(legacy138,/const start138=window\.startConfiguredGame/);
assert.match(legacy138,/window\.startConfiguredGame=async function\(\)/);
assert.match(legacy138,/setTimeout\(\(\)=>\{/);
assert.match(legacy138,/renderCaptureWorldHub\(\)/);

// The world renderer is not a pure view and is still guarded by V151.
const worldBody=(source.match(/function renderCaptureWorldHub\(\)\s*\{([\s\S]*?)\n\}\s*\nfunction captureOpenExplore\(/)||[])[1];
assert.ok(worldBody,'world renderer function boundary must remain recognizable');
for(const n of ['captureEnsureStarterKitsForParticipants','captureEnsureDefaultLocations',
  'captureWorldState','captureRenderTurnDay','captureActiveHeroState',
  'captureTeamEntityRoster','renderCaptureCurrentEncounter']){
  assert.ok(worldBody.includes(n),'world renderer requires '+n);
}
assert.match(worldBody,/document\.body\.classList\.toggle\("gens-pure-capture",on\)/);
assert.match(legacy151,/const hub151=window\.renderCaptureWorldHub/);
assert.match(legacy151,/if\(gensMode151\(\)!=="capture"\)/);
assert.match(legacy151,/return hub151\.apply\(this,arguments\)/);

// Execute the unmodified historical function in isolation, not a mocked reimplementation.
function scenario({missingIds=[],failClose=false,failStatuses=false,failWorld=false}={}){
  const events=[],raf=[];
  const missing=new Set(missingIds);
  const ids=['pregameSetup','sessionHeroSetup','sessionObjectSetup','sessionWaveSetup',
    'sessionDungeonSetup','sheet','setup','menu','captureGameHub'];
  const elements=new Map();
  for(const id of ids){
    if(missing.has(id))continue;
    elements.set(id,{
      style:{setProperty:(k,v,p)=>events.push('display:'+id+':'+k+':'+v+':'+p)},
      scrollIntoView:opts=>events.push('scroll:'+id+':'+opts.block+':'+opts.behavior)
    });
  }
  const ctx={
    window:{},document:{getElementById:id=>elements.get(id)||null},
    closeTurnPopup:v=>{events.push('closeTurn:'+v);if(failClose)throw Error('close failed')},
    renderMenuStatuses:()=>{events.push('statuses');if(failStatuses)throw Error('statuses failed')},
    renderCaptureWorldHub:()=>{events.push('renderWorld');if(failWorld)throw Error('world failed')},
    requestAnimationFrame:cb=>{events.push('rafScheduled');raf.push(cb)}
  };
  vm.runInNewContext(match[0],ctx,{timeout:1500,filename:'captureFix139 hub entry'});
  assert.equal(ctx.window.captureEnterWorld139(),undefined,'legacy transition remains UI-only');
  raf.splice(0).forEach(fn=>fn());
  return events;
}
const normal=scenario();
assert.equal(normal[0],'closeTurn:false');
for(const id of ['pregameSetup','sessionHeroSetup','sessionObjectSetup',
  'sessionWaveSetup','sessionDungeonSetup','sheet','setup']){
  assert.equal(normal.filter(s=>s==='display:'+id+':display:none:important').length,1,
    'close '+id+' once');
}
assert.equal(normal.filter(s=>s==='display:menu:display:block:important').length,1);
assert.equal(normal.filter(s=>s==='renderWorld').length,1);
assert.ok(normal.indexOf('statuses')<normal.indexOf('renderWorld'));
assert.equal(normal.filter(s=>s==='display:captureGameHub:display:block:important').length,1);
assert.ok(normal.includes('rafScheduled'));
assert.equal(normal.at(-1),'scroll:captureGameHub:start:auto');
const unavailable=scenario({missingIds:['sheet','setup','captureGameHub'],
  failClose:true,failStatuses:true,failWorld:true});
assert.ok(unavailable.includes('renderWorld'));
assert.equal(unavailable.some(s=>s.startsWith('scroll:')),false);
assert.equal(unavailable.includes('rafScheduled'),false);
const degraded=scenario({failWorld:true});
assert.ok(degraded.includes('display:captureGameHub:display:block:important'));

console.log(JSON.stringify({
  scenario:'Phase 9 Capture Hub/World exact owner and VM characterization',
  source:{bytes:bytes.length,blob},
  ownership:{hubTransition:'captureFix139',worldRenderer:'historical core + V151 gate',
    startOwner:'GensCaptureSessionStartV1',screenReturnOwner:'GensCaptureScreenReturnV1'},
  observation:{normalSteps:normal.length,resilientMissingElements:true,
    caughtLegacyHelperFailures:true,worldHasSideEffects:true,otherLegacyStartTimer:true},
  runtimeChanged:false
},null,2));
