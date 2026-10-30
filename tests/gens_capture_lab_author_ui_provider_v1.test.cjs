'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(path.resolve(__dirname,'../assets/gensrpg/capture/lab-ownership-port-v1.js'),'utf8');
const providerPath=path.resolve(__dirname,'../assets/gensrpg/capture/capture-lab-author-ui-provider-v1.mjs');
const base='https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/';
function port(){let root={};vm.runInNewContext(source,{globalThis:root});return root.GensCaptureLabOwnershipPortV1;}
test('canonical Lab author adapter uses its ONE published editor/bestiary, no copied UI or storage',async()=>{
 const {createCaptureLabAuthorUiProviderV1}=await import(pathToFileURL(providerPath).href);
 const recorded=[],disposed=[];
 const mountLabPage=info=>{recorded.push(info);return {dispose(){disposed.push(info.kind);}}};
 const p=createCaptureLabAuthorUiProviderV1({labBaseUrl:base,hostOrigin:'https://slyen4425-cloud.github.io',mountLabPage});
 assert.equal(p.createBattle,undefined,'no fake combat engine is allowed in author-only provider');
 const one=port();one.install(p);
 for(const [kind,tab,ending] of [
  ['creature','creature','capture-editor-v2.html'],['skill','skills','capture-editor-v2.html'],
  ['rules','combat','capture-editor-v2.html'],['bestiary',null,'bestiary.html']
 ]){
  const h=one.openAuthoring(kind,{profileId:'profile-123'});
  assert.ok(h);
  assert.equal(one.status().editorKind,kind);
  assert.equal(one.startEncounter({encounterId:'battle'}),null);
  assert.equal(one.closeEditor(),true);
  const entry=recorded.at(-1);
  assert.equal(new URL(entry.url).pathname.endsWith('/'+ending),true);
  assert.equal(new URL(entry.url).searchParams.get('tab'),tab);
  assert.equal(entry.context.profileId,'profile-123');
 }
 assert.deepEqual(disposed,['creature','skill','rules','bestiary']);
 one.uninstall(p);
});
test('canonical author adapter refuses any cross-origin or alternative editor URL',async()=>{
 const {createCaptureLabAuthorUiProviderV1}=await import(pathToFileURL(providerPath).href);
 for(const url of ['https://evil.example/GenSrpg_labo_combat_dynamique/','http://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/','https://slyen4425-cloud.github.io/other-lab/']){
  assert.throws(()=>createCaptureLabAuthorUiProviderV1({labBaseUrl:url,hostOrigin:'https://slyen4425-cloud.github.io',mountLabPage(){}}),/same-origin/);
 }
});
