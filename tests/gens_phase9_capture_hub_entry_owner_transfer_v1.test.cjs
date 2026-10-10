'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes(root).toString('utf8');
const owner=read('assets/gensrpg/capture/hub-entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const blob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
const before={bytes:8165823,blob:'26421e0347305437fe2b1dc149b3e4fb8b3761bd'};
const after={bytes:8165438,blob:'1a61147d5a32889fa85e6a09e846049103b9f0bf'};

assert.equal(bytes.length,after.bytes,'exact Hub owner extraction must be applied');
assert.equal(blob(bytes),after.blob,'Hub owner runtime fingerprint drifted');
const oldLoad='<script src="assets/gensrpg/capture/screen-return-v1.js?v=1"></script>';
const load=oldLoad+'\n<script src="assets/gensrpg/capture/hub-entry-v1.js?v=1"></script>';
assert.equal(index.split(load).length-1,1,'Hub entry loaded once after screen-return');
assert.ok(index.indexOf(load)<index.indexOf('id="captureFix139"'));
const capture=(index.match(/<script id="captureFix139">([\s\S]*?)<\/script>/)||[])[1]||'';
assert.ok(capture);
assert.equal((index.match(/window\.captureEnterWorld139\s*=/g)||[]).length,0,'old global Hub owner retired');
assert.equal((capture.match(/window\.GensCaptureHubEntryV1\.install\(\{/g)||[]).length,1);
const bind='enterWorld:()=>window.GensCaptureHubEntryV1.enterWorld()';
assert.equal(capture.split(bind).length-1,2,'both SessionStart and ScreenReturn delegate one Hub authority');
assert.ok(capture.includes('GensCaptureSessionStartV1.install({'));
assert.ok(capture.includes('GensCaptureScreenReturnV1.install({'));
assert.doesNotMatch(capture,/window\.goMenu\s*=|GensShellScreenReturnV1\.register/);
assert.doesNotMatch(owner,/DungeonCore|GensDungeon|GensTactical|localStorage|sessionStorage|indexedDB|MutationObserver|setInterval|setTimeout|window\.goMenu\s*=/);

const oldBody=`window.captureEnterWorld139=function(){
  try{closeTurnPopup(false)}catch(e){}
  ["pregameSetup","sessionHeroSetup","sessionObjectSetup","sessionWaveSetup","sessionDungeonSetup","sheet","setup"].forEach(id=>{
    const e=document.getElementById(id);if(e)e.style.setProperty("display","none","important");
  });
  const menu=document.getElementById("menu");
  if(menu)menu.style.setProperty("display","block","important");
  try{renderMenuStatuses()}catch(e){}
  try{renderCaptureWorldHub()}catch(e){}
  const hub=document.getElementById("captureGameHub");
  if(hub){
    hub.style.setProperty("display","block","important");
    requestAnimationFrame(()=>hub.scrollIntoView({block:"start",behavior:"auto"}));
  }
};`;
const init=`window.GensCaptureHubEntryV1.install({
  closeTurnPopup:()=>closeTurnPopup(false),
  renderMenuStatuses:()=>renderMenuStatuses(),
  renderCaptureWorldHub:()=>renderCaptureWorldHub()
});`;
assert.equal(index.split(init).length-1,1);
const restored=index.replace('      if(!isCaptureContext138())return;\n','').replace(bind,'enterWorld:()=>captureEnterWorld139()')
 .replace(bind,'enterWorld:()=>captureEnterWorld139()')
 .replace(init,oldBody).replace(load,oldLoad);
const oldBytes=Buffer.from(restored,'utf8');
assert.equal(oldBytes.length,before.bytes,'rollback size');
assert.equal(blob(oldBytes),before.blob,'rollback must be byte-exact');

function scenario(useNew,flags={}){
  const events=[],frames=[];
  const dom=new Map();
  for(const id of ['pregameSetup','sessionHeroSetup','sessionObjectSetup','sessionWaveSetup',
    'sessionDungeonSetup','sheet','setup','menu','captureGameHub']){
    if(flags.missing?.includes(id))continue;
    dom.set(id,{style:{setProperty:(...p)=>events.push('set:'+id+':'+p.join(':'))},
      scrollIntoView:o=>events.push('scroll:'+id+':'+o.block+':'+o.behavior)});
  }
  const raf=cb=>{events.push('raf');frames.push(cb);return frames.length};
  const hooks={
    closeTurnPopup:()=>{events.push('close');if(flags.failClose)throw Error('close')},
    renderMenuStatuses:()=>{events.push('statuses');if(flags.failStatuses)throw Error('statuses')},
    renderCaptureWorldHub:()=>{events.push('world');if(flags.failWorld)throw Error('world')}
  };
  let call,api;
  if(useNew){
    const window={document:{getElementById:id=>dom.get(id)||null},requestAnimationFrame:raf,
      cancelAnimationFrame:id=>events.push('cancel:'+id)};
    vm.runInNewContext(owner,{window},{timeout:1500});
    api=window.GensCaptureHubEntryV1;
    assert.equal(api.enterWorld(),false,'before install owner must be inert');
    assert.throws(()=>api.install({}),/missing binding/);
    assert.equal(api.install(hooks),true);
    assert.equal(api.install(hooks),true);
    assert.throws(()=>api.install({...hooks}),/already installed/);
    call=()=>api.enterWorld();
  }else{
    const ctx={window:{},document:{getElementById:id=>dom.get(id)||null},
      requestAnimationFrame:raf,closeTurnPopup:hooks.closeTurnPopup,
      renderMenuStatuses:hooks.renderMenuStatuses,renderCaptureWorldHub:hooks.renderCaptureWorldHub};
    vm.runInNewContext(oldBody,ctx,{timeout:1500});
    call=()=>ctx.window.captureEnterWorld139();
  }
  assert.equal(call(),undefined,'return parity');
  frames.forEach(f=>f());
  const result=events.slice();
  if(api){api.dispose();assert.equal(api.status().installed,false);assert.equal(api.enterWorld(),false);}
  return result;
}
for(const opts of [{},{missing:['sheet','setup','captureGameHub']},
  {failClose:true,failStatuses:true,failWorld:true},{failWorld:true}]){
  assert.deepEqual(scenario(true,opts),scenario(false,opts),'legacy/new UI behavior parity');
}
console.log(JSON.stringify({scenario:'Capture Hub entry transfer',source:after,parityScenarios:4,rollback:before,oldHubAuthorityRetired:true}));
