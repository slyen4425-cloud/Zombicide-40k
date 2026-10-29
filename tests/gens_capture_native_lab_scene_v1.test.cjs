'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
const load=()=>import(pathToFileURL(path.join(root,'assets/gensrpg/capture/capture-native-lab-provider-v1.mjs')));
const ids=['player','ally','opponent','opponent-b'];
const uids=['trainer-a','trainer-b','wild-a','wild-b'];
const actors=ids.map((actorId,i)=>({actorId,teamId:i<2?'trainer':'wild',creatureId:'creature-'+i}));
const format={actors,localActorId:'player',teamOf(id){return actors.find(a=>a.actorId===id)?.teamId;}};
const native={battleFormat:format,
 fighters:ids.map((id,i)=>({id,maxHp:100+i})),
 roster:{teams:Object.fromEntries(ids.map((id,i)=>[id,{activeMemberId:uids[i],members:[{creatureId:'creature-'+i}]}]))}};
const snapshot={sides:[
 {active:uids.slice(0,2),creatures:uids.slice(0,2).map((id,i)=>({instanceId:id,creatureId:'creature-'+i,hp:75+i,maxHp:100+i}))},
 {active:uids.slice(2),creatures:uids.slice(2).map((id,j)=>({instanceId:id,creatureId:'creature-'+(j+2),hp:44+j,maxHp:102+j}))}
]};
const result={nativeCombatSource:native,actorIds:ids,exported:{battleFormat:'signed-Lab-author'}};
test('native scene receives authentic author and saved PV, and alone returns four HP',async()=>{
 const {createCaptureNativeLabProviderV1}=await load();
 let mounted=0,disposed=0,resolveNative,record=null;
 const provider=createCaptureNativeLabProviderV1({
  resolveBattle:()=>result,
  async mountBattle(ctx,source,hp){
   mounted++;record={ctx,source,hp};
   const completion=new Promise(resolve=>{resolveNative=resolve;});
   return {combat:{completion,flee(){resolveNative({outcome:'flee',
    state:{fighters:Object.fromEntries(ids.map((id,i)=>[id,{hp:i===0?64:hp[id]}]))}});return true;}},
    dispose(){disposed++;}};
  }
 });
 const handle=provider.createBattle({encounterId:'wild-native-lab',snapshot});
 provider.startBattle(handle);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(mounted,1);
 assert.equal(record.source,result);
 assert.deepEqual(record.hp,{player:75,ally:76,opponent:44,'opponent-b':45});
 assert.equal(handle.flee(),true);
 const completed=await handle.completion;
 assert.equal(completed.outcome,'flee');
 assert.deepEqual(completed.creatures.map(c=>c.instanceId),uids);
 assert.deepEqual(completed.creatures.map(c=>c.hp),[64,76,44,45]);
 provider.stopBattle(handle);
 provider.disposeBattle(handle);
 assert.equal(disposed>=1,true);
});
test('wrong owner or invalid HP never starts a second fallback runtime',async()=>{
 const {createCaptureNativeLabProviderV1}=await load();
 const provider=createCaptureNativeLabProviderV1({resolveBattle:()=>result,mountBattle:async()=>{throw Error('should never mount')}});
 assert.throws(()=>provider.createBattle({snapshot:{sides:[{active:['x'],creatures:[]},{}]}}),/balanced/);
 const broken=structuredClone(snapshot);broken.sides[0].creatures[0].hp=100000;
 assert.throws(()=>provider.createBattle({snapshot:broken}),/balanced/);
});
test('World original entry uses only native Lab scene, not the static portrait adapter',()=>{
 const source=fs.readFileSync(path.join(root,'assets/gensrpg/capture/capture-official-wild-entry-v1.mjs'),'utf8');
 assert.match(source,/createCaptureNativeLabSceneV1/);
 assert.match(source,/createCaptureNativeLabProviderV1/);
 assert.doesNotMatch(source,/createCaptureOfficialBattleViewV1/);
});


test('native FX metadata is resolved by the pinned Lab owner, never a GenSrpg copy',()=>{
 const scene=fs.readFileSync(path.join(root,'assets/gensrpg/capture/capture-native-lab-scene-v1.mjs'),'utf8');
 assert.match(scene,/import\(uri\('src\/assets\/global-presentation-asset-resolver-v1\\.js'\)\)/,
  'the Lab canonical media resolver must be loaded with the pinned author modules');
 assert.match(scene,/createGlobalPresentationAssetResolverV1\(\{/,
  'Lab alone must preserve headingRad, frame timing, stretch and display scales');
 assert.doesNotMatch(scene,/const mediaForId=id=>\{/,
  'never duplicate the Lab metadata mapping in GenSrpg');
});
