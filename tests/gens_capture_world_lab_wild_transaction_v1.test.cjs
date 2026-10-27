'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const lab=process.env.COMBAT_LAB_ROOT;
const PIN='65e21792ff74aea9862e528c8dbfdb22797b6693';
assert.ok(lab,'Pinned official Combat Lab checkout is required');
assert.equal(execFileSync('git',['-C',lab,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),PIN);
const read=rel=>JSON.parse(fs.readFileSync(path.join(lab,rel),'utf8'));
const fromLab=rel=>import(pathToFileURL(path.join(lab,rel)).href);
const clone=x=>JSON.parse(JSON.stringify(x));
let apiPromise;
async function api(){
 if(!apiPromise)apiPromise=Promise.all([
  import('../assets/gensrpg/capture/capture-world-lab-wild-transaction-v1.mjs'),
  import('../assets/gensrpg/capture/combat-lab-authored-source-v1.mjs'),
  import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs'),
  import('../assets/gensrpg/capture/combat-lab-provider-v1.mjs'),
  fromLab('src/contracts/capture-creature-transfer-v1.js'),
  fromLab('src/contracts/capture-skill-transfer-v1.js'),
  fromLab('src/contracts/capture-skill-editor-draft-v1.js'),
  fromLab('src/adapters/input/capture/capture-combat-rules-overlay-v1.js'),
  fromLab('src/adapters/input/capture/capture-editor-exporter-v3.js'),
  fromLab('src/adapters/input/capture/capture-export-adapter-stack-v1.js'),
  fromLab('src/catalogs/capture-portable-native-skill-catalog-v1.js'),
  fromLab('src/catalogs/capture-complex-native-skill-catalog-v1.js'),
  fromLab('src/catalogs/capture-showcase-skill-presets-v1.js')
 ]).then(async ([world,author,loader,provider,creature,skill,skillDraft,rules,exporter,adapter,portable,complex,presets])=>{
  const byId=new Map();
  for(const row of read('data/combat/skills/catalog.v1.json').entries){
   const draft=skillDraft.normalizeCaptureSkillEditorDraftV1({
    schema:'capture-skill-editor-draft-v1',id:row.id,
    description:row.label||row.id,requiredLevel:1,
    usageScopes:['capture','combat'],definition:row.definition,presentation:null
   });
   byId.set(draft.id,draft);
  }
  for(const entry of [...portable.capturePortableNativeSkillDraftsV1(),...complex.captureComplexNativeSkillDraftsV1()]){
   byId.set(entry.id,entry);
  }
  for(const file of presets.CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1){
   const t=skill.normalizeCaptureSkillTransferV1(read(file));
   byId.set(t.draft.id,t.draft);
  }
  const transfers=[
   read('data/capture/showcase/crea-loup.capture-creature-transfer-v1.json'),
   read('data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json')
  ];
  const source=author.createCaptureLabAuthoredSourceV1({
   normalizeCreatureTransfer:creature.normalizeCaptureCreatureTransferV1,
   normalizeSkillDraft:skillDraft.normalizeCaptureSkillEditorDraftV1,
   overlayCombatRules:rules.applyCaptureCombatRulesToCreatureDraftV1,
   exportEditorDrafts:exporter.exportCaptureEditorDraftsToCombatExportV3,
   adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
   statRegistry:read('data/capture/monster-capture-stat-registry.v1.json'),
   configuredSkillDrafts:[...byId.values()],creatureTransfers:transfers
  });
  const context={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/gensrpg/capture/battle-bridge-contract-v1.js'),'utf8'),context);
  return {make:world.createCaptureWorldLabWildTransactionV1,source,
   adapt:adapter.adaptCaptureCombatExportStackV1,
   validate:context.GensCaptureBattleBridgeContractV1.result,
   engine:await loader.loadCombatLabEngineV1(pathToFileURL(path.resolve(lab)+path.sep)),
   provider:provider.createCombatLabProviderV1,
   transfers
  };
 });
 return apiPromise;
}
const rules={schema:'capture-combat-rules-editor-draft-v1',maxEnergy:10,initialEnergy:10,
 energyChargeAmount:1,energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0};
const battle={arenaId:'forest',skillSpeedMultiplier:0.5,combatRules:rules};
function realWorldAndRoster({hp,enemy='crea_voltik',reserve=false,abilities,maxHp}={}){
 let worldId='my_saved_world';const heroId='my_real_trainer';
 const store=new Map();let worldWrites=0,heroWrites=0,renderCalls=0;
 const entityCatalog=new Map([['crea-loup',{id:'crea-loup',name:'Loup volcanique',hp:150,
  abilityIds:['claw','fireball','cap_fire_special_1','lib_flame_bite','cap_fire_atk_6']}],
  ['crea_voltik',{id:'crea_voltik',name:'Voltige',hp:120,abilityIds:[]}]]);
 const ctx=vm.createContext({
  current:heroId,state:null,
  activeGameProfileId:()=>worldId,
  normalizeGameParticipants:()=>[heroId],
  loadSharedEntities:()=>[...entityCatalog.values()],
  key:id=>'realhero:'+id,
  loadState:id=>JSON.parse(store.get('realhero:'+id)),
  localStorage:{getItem:key=>store.get(key)??null,setItem(key,value){
    store.set(key,String(value));
    if(key.startsWith('realhero:'))heroWrites++;
    if(key.startsWith('gensrpg_capture_world_v1_'))worldWrites++;
  }}
 });
 const worldSource=fs.readFileSync(path.join(root,'assets/gensrpg/capture/world-exploration-v1.js'),'utf8');
 vm.runInContext(worldSource,ctx);
 const rosterSource=fs.readFileSync(path.join(root,'assets/gensrpg/capture/team-roster-v1.js'),'utf8');
 for(const part of [3,1]){
  const re=new RegExp('// BEGIN_CAPTURE_TEAM_SECTION_'+part+'\\n([\\s\\S]*?)// END_CAPTURE_TEAM_SECTION_'+part);
  const match=rosterSource.match(re);
  assert.ok(match,'unchanged canonical Capture team owner source');
  vm.runInContext(match[1],ctx);
 }
 ctx.renderCaptureWorldHub=()=>{renderCalls++};
 ctx.renderCaptureExploreResult=()=>{renderCalls++};
 const selected=ctx.creatureInstance('crea-loup');
 selected.hp=hp??150;selected.maxHp=maxHp??150;
 selected.activeAbilityIds=abilities??[...entityCatalog.get('crea-loup').abilityIds];
 const hero={creatureTeam:[selected],creatureReserve:reserve?[{...selected,uid:'reserve-1'}]:[],
  gold:73,profileCustom:{fav:'forest'},inventory:[{itemId:'potion',qty:4}]};
 store.set('realhero:'+heroId,JSON.stringify(hero));
 const original={locationId:'cap_forest',locationName:'Ma forêt',
  last:{type:'wild',creatureId:enemy,text:'Une vraie rencontre sauvage'},
  playMode:'turns',day:9,turnIndex:2};
 ctx.saveCaptureWorldState(original);
 const baseline=worldWrites;
 return {ctx,selected,heroId,worldId,store,baseline,
  profile:()=>JSON.parse(store.get('realhero:'+heroId)),world:()=>clone(ctx.captureWorldState()),
  writes:()=>({world:worldWrites,hero:heroWrites}),renders:()=>renderCalls,
  replaceHero:x=>store.set('realhero:'+heroId,JSON.stringify(x)),
  replaceWorld:x=>ctx.saveCaptureWorldState(x),
  changeWorld:id=>{worldId=id;}
 };
}
let sequence=0;
async function setup(extra={},legacy={}){
 const a=await api(),owner=realWorldAndRoster(legacy);
 const make=()=>a.make({
  activeHeroId:()=>owner.ctx.captureActiveHeroId(),
  loadHeroState:id=>owner.ctx.loadState(id),
  saveHeroState:(id,state)=>owner.ctx.saveHeroCreatureState(id,state),
  readWorldState:()=>owner.ctx.captureWorldState(),
  saveWorldState:state=>owner.ctx.saveCaptureWorldState(state),
  consumeWildEncounter:reason=>owner.ctx.captureConsumeWildEncounter(reason),
  worldStorageKey:()=>owner.ctx.captureWorldKey(),
  nextEncounterId:()=> 'wc-real-'+(++sequence),
  authoredSource:a.source,adaptCombatExport:a.adapt,
  validateBattleResult:a.validate,
  readBattleSettings:()=>battle,...extra
 });
 return {a,owner,transaction:make(),make};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('real canonical Capture wild state receives one stable ID; real authored Lab 1v1 flees and commits once',async()=>{
 const {a,owner,transaction}=await setup();
 const before=owner.profile(),worldBefore=owner.world();
 assert.equal(worldBefore.last.encounterId,undefined,'canonical legacy encounter has no identity');
 const t=transaction.prepareWild('crea_voltik');
 assert.equal(owner.world().last.encounterId,t.encounterId);
 assert.equal(t.snapshot.sides[0].creatures[0].instanceId,before.creatureTeam[0].uid);
 assert.equal(t.snapshot.sides[0].creatures[0].maxHp,150);
 assert.equal(t.snapshot.sides[1].creatures[0].creatureId,'crea_voltik');
 assert.deepEqual([...t.snapshot.sides[0].creatures[0].abilityIds],before.creatureTeam[0].activeAbilityIds);
 assert.equal(owner.writes().world,owner.baseline+1);
 assert.equal(owner.writes().hero,0);
 assert.equal(owner.world().locationName,'Ma forêt');
 assert.equal(owner.world().day,9);
 const provider=a.provider({
  engine:a.engine,resolveBattle:t.resolveBattle,
  mountBattle:()=>({dispose(){}}),
  clock:{now:()=>0,setTimer:()=>123,clearTimer:()=>{}}
 });
 const session=provider.createBattle({encounterId:t.encounterId,snapshot:t.snapshot});
 provider.startBattle(session);
 assert.equal(session.state().fighters.player.hp,150);
 assert.equal(session.state().fighters.opponent.maxHp,120);
 assert.equal(session.flee(),true);
 const result=await session.completion;provider.disposeBattle(session);
 const saved=t.applyResult(result);
 assert.equal(saved.applied,true);
 assert.equal(saved.outcome,'flee');
 assert.equal(saved.worldResolved,true);
 assert.equal(t.applyResult(result),false,'same ticket result is applied only once');
 assert.equal(owner.writes().hero,1);
 assert.equal(owner.writes().world,owner.baseline+2);
 assert.equal(owner.world().last.type,'resolved');
 assert.equal(owner.profile().creatureTeam[0].uid,before.creatureTeam[0].uid);
 assert.equal(owner.profile().creatureTeam[0].xp,before.creatureTeam[0].xp);
 assert.deepEqual(owner.profile().inventory,before.inventory);
 assert.deepEqual(owner.profile().profileCustom,before.profileCustom);
 assert.equal(transaction.status().pending,false);
});

test('cancelled battle never consumes wild encounter or saves hero; retry keeps the same canonical world ID',async()=>{
 const {owner,transaction}=await setup();
 const t=transaction.prepareWild('crea_voltik');
 const id=t.encounterId;
 const invalidated=t.cancel();
 assert.equal(invalidated,true);
 assert.equal(transaction.status().pending,false);
 assert.equal(owner.world().last.type,'wild');
 assert.equal(owner.writes().hero,0);
 const re=transaction.prepareWild('crea_voltik');
 assert.equal(re.encounterId,id);
 assert.equal(owner.writes().world,owner.baseline+1,'no second stamping');
 assert.equal(re.cancel(),true);
});

test('profile ability/HP/reserve incompatibilities fail closed before writing world identity',async()=>{
 for(const legacy of [
  {hp:17,maxHp:17},
  {abilities:['old-not-authorized']},
  {reserve:true},
  {hp:0}
 ]){
  const {owner,transaction}=await setup({},legacy);
  assert.throws(()=>transaction.prepareWild('crea_voltik'),/1v1|team|HP|loadout|skill|ability|catalog/i);
  assert.equal(owner.writes().hero,0);
  assert.equal(owner.writes().world,owner.baseline);
  assert.equal(owner.world().last.encounterId,undefined);
 }
});

test('wrong or unknown encounter species is never silently replaced by preview fixture',async()=>{
 const {owner,transaction}=await setup();
 assert.throws(()=>transaction.prepareWild('crea-loup'),/creature|world|encounter|mismatch/i);
 assert.equal(owner.writes().world,owner.baseline);
 const unknown=await setup({}, {enemy:'wild-not-in-lab'});
 assert.throws(()=>unknown.transaction.prepareWild('wild-not-in-lab'),/catalog|unknown|creature/i);
 assert.equal(unknown.owner.writes().world,unknown.owner.baseline);
});

test('stale world or changed active saved profile refuses late result and leaves both untouched',async()=>{
 const {owner,transaction}=await setup();
 const t=transaction.prepareWild('crea_voltik');
 owner.replaceWorld({...owner.world(),last:{type:'wild',creatureId:'crea-loup',text:'Another real encounter'}});
 const original=owner.profile();
 assert.throws(()=>t.applyResult({outcome:'flee',creatures:t.snapshot.sides.flatMap(s=>s.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))}),/stale|encounter/i);
 assert.equal(owner.writes().hero,0);
 assert.equal(owner.profile().creatureTeam[0].hp,original.creatureTeam[0].hp);
 assert.equal(owner.world().last.creatureId,'crea-loup');
 t.cancel();
 const second=await setup();
 const t2=second.transaction.prepareWild('crea_voltik');
 const mutated=second.owner.profile();mutated.creatureTeam[0].hp=62;mutated.gold=999;
 second.owner.replaceHero(mutated);
 assert.throws(()=>t2.applyResult({outcome:'flee',creatures:t2.snapshot.sides.flatMap(s=>s.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))}),/stale|profile/i);
 assert.equal(second.owner.writes().hero,0);
 assert.equal(second.owner.profile().gold,999);
 t2.cancel();
});

test('concurrent start is refused, valid world fields are unchanged, and abandoned result is never applied',async()=>{
 const {owner,transaction}=await setup();
 const t=transaction.prepareWild('crea_voltik');
 assert.throws(()=>transaction.prepareWild('crea_voltik'),/pending|active|already/i);
 const ctx={encounterId:t.encounterId,snapshot:clone(t.snapshot)};
 assert.deepEqual(t.resolveBattle(ctx).actorIds,['player','opponent']);
 const altered=clone(t.snapshot);altered.sides[0].creatures[0].hp=99;
 assert.throws(()=>t.resolveBattle({encounterId:t.encounterId,snapshot:altered}),/snapshot/i);
 const old=owner.writes();
 assert.equal(t.cancel(),true);
 assert.equal(t.cancel(),false);
 assert.throws(()=>t.resolveBattle(ctx),/closed|cancel|pending/i);
 assert.equal(owner.writes().hero,old.hero);
 assert.equal(owner.writes().world,old.world);
});

test('world owner commit failure is retryable without a second hero save',async()=>{
 let failOnce=true;
 const {owner,transaction}=await setup({
  consumeWildEncounter:reason=>{
   if(failOnce){failOnce=false;throw Error('world UI temporarily unavailable');}
   return owner.ctx.captureConsumeWildEncounter(reason);
  }
 });
 const t=transaction.prepareWild('crea_voltik');
 const raw={outcome:'flee',creatures:t.snapshot.sides.flatMap(s=>s.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))};
 assert.throws(()=>t.applyResult(raw),/temporarily unavailable/);
 assert.equal(owner.writes().hero,1);
 assert.equal(owner.world().last.type,'wild');
 assert.equal(t.applyResult(raw).applied,true);
 assert.equal(owner.writes().hero,1,'saved hero remains once');
 assert.equal(owner.world().last.type,'resolved');
});

test('world owner preserves creator-specific profile worlds with a stable ID scoped to active world',async()=>{
 const {owner,transaction}=await setup();
 const original=owner.world(),first=transaction.prepareWild('crea_voltik');
 assert.equal(original.locationId,'cap_forest');
 assert.equal(original.locationName,owner.world().locationName);
 assert.equal(owner.world().day,9);
 assert.equal(owner.world().turnIndex,2);
 assert.equal(owner.world().playMode,'turns');
 assert.equal(first.cancel(),true);
 const a=owner.store.get('gensrpg_capture_world_v1_'+owner.worldId);
 assert.ok(a);
 assert.equal([...owner.store.keys()].filter(k=>k.startsWith('gensrpg_capture_world_v1_')).length,1);
 assert.deepEqual(owner.world().last.text,'Une vraie rencontre sauvage');
});

test('switching active World profile before result never consumes another save with identical encounter details',async()=>{
 const {owner,transaction}=await setup();
 const t=transaction.prepareWild('crea_voltik');
 const savedWorld=owner.world();
 owner.changeWorld('another_profile_owner');
 owner.replaceWorld(savedWorld); // deliberately same encounter token, species and location
 const raw={outcome:'flee',creatures:t.snapshot.sides.flatMap(s=>s.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))};
 assert.throws(()=>t.applyResult(raw),/world|encounter|stale/i);
 assert.equal(owner.writes().hero,0);
 assert.equal(owner.world().last.type,'wild');
 assert.equal(owner.world().last.encounterId,t.encounterId);
 owner.changeWorld('my_saved_world');
 assert.equal(t.cancel(),true);
 assert.equal(owner.world().last.type,'wild');
});

test('a World owner render error after successful consume is not masked and cannot cause double hero save',async()=>{
 const {owner,transaction}=await setup({
  consumeWildEncounter:reason=>{
   owner.ctx.captureConsumeWildEncounter(reason);
   throw Error('World renderer failed after owned commit');
  }
 });
 const t=transaction.prepareWild('crea_voltik');
 const raw={outcome:'flee',creatures:t.snapshot.sides.flatMap(s=>s.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))};
 assert.throws(()=>t.applyResult(raw),/World renderer failed/);
 assert.equal(owner.world().last.type,'resolved');
 assert.equal(owner.writes().hero,1);
 assert.equal(transaction.status().pending,false);
 assert.equal(t.applyResult(raw),false);
 assert.equal(owner.writes().hero,1);
});
