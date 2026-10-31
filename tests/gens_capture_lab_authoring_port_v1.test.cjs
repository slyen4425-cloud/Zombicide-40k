'use strict';
// The existing Capture ownership port (not a second port) must be the ONLY
// route to the official Lab's creature, skill, rules and bestiary author UI.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/gensrpg/capture/lab-ownership-port-v1.js'),'utf8');

function fresh(){
 const root={};
 vm.runInNewContext(source,{globalThis:root});
 return root.GensCaptureLabOwnershipPortV1;
}
function provider(caps,events){
 return {
  protocol:1,version:'1.2.0',capabilities:['battle-trigger',...caps],
  createBattle(){events.push('battle-created');return {id:'b'};},
  startBattle(){events.push('battle-started');},
  stopBattle(){events.push('battle-stopped');},
  disposeBattle(){events.push('battle-disposed');},
  openCreatureEditor(){events.push('old-editor');return {id:'old'};},
  closeCreatureEditor(){events.push('old-editor-closed');},
  openAuthoring(kind,context){events.push('open:'+kind+':'+context.origin);return {kind};},
  closeAuthoring(handle){events.push('close:'+handle.kind);}
 };
}
test('one existing port opens the real Lab-authoring domains using one provider lifecycle',()=>{
 const events=[],port=fresh();
 const p=provider(['creature-editor','skill-editor','combat-rules-editor','bestiary'],events);
 assert.equal(port.install(p),true);
 for(const [kind,cap] of [['creature','creature-editor'],['skill','skill-editor'],['rules','combat-rules-editor'],['bestiary','bestiary']]){
  assert.equal(port.has(cap),true);
  const handle=port.openAuthoring(kind,{origin:'Capture'});
  assert.equal(handle.kind,kind);
  assert.equal(port.status().editorActive,true);
  assert.equal(port.status().editorKind,kind);
  assert.equal(port.openAuthoring(kind,{origin:'Capture'}),null,'no overlapping editor sessions');
  assert.equal(port.startEncounter({encounterId:'one'}),null,'cannot start combat while editing');
  assert.equal(port.closeEditor(),true);
  assert.equal(port.status().editorActive,false);
 }
 assert.deepEqual(events,[
  'open:creature:Capture','close:creature','open:skill:Capture','close:skill',
  'open:rules:Capture','close:rules','open:bestiary:Capture','close:bestiary'
 ]);
 assert.equal(port.uninstall(p),true);
});
test('battle and editing are mutually exclusive in the SAME Lab port',()=>{
 const events=[],port=fresh(),p=provider(['skill-editor'],events);
 port.install(p);
 assert.ok(port.startEncounter({encounterId:'battle'}));
 assert.equal(port.openAuthoring('skill',{origin:'Capture'}),null);
 assert.throws(()=>port.uninstall(p),/active provider/);
 assert.equal(port.stopEncounter(),true);
 assert.equal(port.openAuthoring('skill',{origin:'Capture'}).kind,'skill');
 assert.equal(port.closeEditor(),true);
 assert.equal(port.uninstall(p),true);
 assert.deepEqual(events,['battle-created','battle-started','battle-stopped','battle-disposed','open:skill:Capture','close:skill']);
});
test('unsigned/mismatched/unsupported authoring is rejected without a fallback',()=>{
 const port=fresh(),events=[];
 const broken=provider(['bestiary'],events);delete broken.openAuthoring;
 assert.throws(()=>port.install(broken),/openAuthoring/);
 const p=provider(['bestiary'],events);port.install(p);
 assert.equal(port.openAuthoring('creature',{origin:'Capture'}),null);
 assert.throws(()=>port.openAuthoring('invented',{origin:'Capture'}),/Unsupported/);
 assert.throws(()=>port.openAuthoring('bestiary',null),/context/);
 assert.deepEqual(events,[]);
});
