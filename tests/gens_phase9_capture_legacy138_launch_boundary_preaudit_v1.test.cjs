'use strict';

// Phase 9 preaudit: public Capture launch boundary, without interpreting index.html.
// The legacy captureFix138 body must be characterized separately under Rule 26.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const entry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const session=fs.readFileSync(path.join(root,'assets/gensrpg/capture/session-start-v1.js'),'utf8');
const screen=fs.readFileSync(path.join(root,'assets/gensrpg/capture/screen-return-v1.js'),'utf8');
const hub=fs.readFileSync(path.join(root,'assets/gensrpg/capture/hub-entry-v1.js'),'utf8');
const contract=JSON.parse(fs.readFileSync(path.join(root,'assets/gensrpg/capture/module-contract-v1.json'),'utf8'));

assert.equal(contract.module,'capture');
assert.equal(contract.publicRuntimeApi,'GensCaptureV1');
assert.equal(contract.publicEntries.moduleLaunch.status,'loaded-public-provider');
assert.equal(contract.publicEntries.moduleScreenReturn.status,'loaded-public-provider');
assert.ok(contract.consumes.includes('Capture session-start owner public API'));
assert.ok(contract.consumes.includes('Capture Hub entry owner public API'));

for(const [label,code] of [['entry',entry],['session-start',session],['screen-return',screen],['hub-entry',hub]]){
  assert.doesNotMatch(code,/captureFix138|startConfiguredGame|legacyStartConfiguredGame|isDungeonMode\s*\(/,
    label+' must not grow a second Capture138/Dungeon launch authority');
}
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);
assert.match(entry,/await sessionStartOwner\.start\(\)/);
assert.match(session,/bindings\.enterWorld\(\)/);
assert.match(screen,/bindings\.enterWorld\(\)/);
assert.match(hub,/bindings\.renderCaptureWorldHub\(\)/);

(async()=>{
  let active='dungeon', ownerStarts=0, legacyStarts=0, registrations=0;
  const registered=new Map();
  const shell={
    activeModule:()=>active,
    register:(id,fn)=>{registrations++;assert.equal(registered.has(id),false);registered.set(id,fn);return true;}
  };
  const window={
    GensShellModuleLaunchV1:shell,
    startConfiguredGame:()=>{legacyStarts++;throw new Error('legacy global launch must not be used by public Capture provider');}
  };
  vm.runInNewContext(entry,{window,console},{filename:'capture/entry-v1.js',timeout:2000});
  const api=window.GensCaptureV1;
  assert.ok(api);
  assert.equal(api.status().installed,false);
  assert.equal(api.isProfile({rpgUniverse:{gameplay:{profile:'creature'}}}),true);
  assert.equal(api.isProfile({rpgUniverse:{gameplay:{modules:{capture:true,controllableCreatures:true}}}}),true);
  assert.equal(api.isProfile({rpgUniverse:{gameplay:{profile:'dungeon'}}}),false);
  assert.equal(api.isProfile(null),false);
  const owner={start:async()=>{ownerStarts++;return true;}};
  assert.equal(api.install(owner),true);
  assert.equal(api.install(owner),true,'same owner idempotence');
  assert.equal(registrations,1,'unique capture public launch provider');
  assert.equal(api.status().sessionStartBound,true);
  assert.throws(()=>api.install({start:async()=>true}),/already bound/,'no alternate session owner');
  assert.equal(await registered.get('capture')(),false,'Dungeon active => no Capture start');
  assert.equal(ownerStarts,0);
  active='survival';
  assert.equal(await registered.get('capture')(),false,'Survie active => no Capture start');
  assert.equal(ownerStarts,0);
  active='capture';
  assert.equal(await registered.get('capture')(),true,'Capture active => existing owner starts');
  assert.equal(ownerStarts,1,'one start per public invocation');
  assert.equal(legacyStarts,0,'public provider must not invoke historical global');
  assert.equal(registrations,1,'no duplicate Capture provider');
  console.log(JSON.stringify({scenario:'Phase 9 Capture138 launch boundary preaudit',publicOwner:'GensCaptureV1',legacyGlobalInvocations:legacyStarts,registrationCount:registrations,realIndexInspected:false,rule26Gate:'pending'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
