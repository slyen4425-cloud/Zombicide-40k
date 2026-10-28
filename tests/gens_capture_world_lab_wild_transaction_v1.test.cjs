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
  import('../assets/gensrpg/capture/capture-lab-hub-battle-command-v1.mjs'),
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
 ]).then(async ([world,hub,author,loader,provider,creature,skill,skillDraft,rules,exporter,adapter,portable,complex,presets])=>{
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
  return {make:world.createCaptureWorldLabWildTransactionV1,makeHubCommand:hub.createCaptureLabHubBattleCommandV1,source,
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

function clockHub(){
 let time=0,seq=0;
 const tasks=new Map();
 return {
  now:()=>time,
  setTimer(fn,ms){const id=++seq;tasks.set(id,{fn,time:time+ms});return id},
  clearTimer(id){tasks.delete(id)},
  advance(ms){const stop=time+ms;let budget=5000;
   for(;;){const first=[...tasks].sort((a,b)=>a[1].time-b[1].time)[0];
    if(!first||first[1].time>stop)break;
    assert.ok(--budget>0,'Lab timer cannot loop forever');
    tasks.delete(first[0]);time=first[1].time;first[1].fn();
   }time=stop;
  },
  count:()=>tasks.size
 };
}
async function hubSetup({transactionOverrides={},legacy={},mountBattle=()=>({dispose(){}}),factory}={}){
 const s=await setup(transactionOverrides,legacy),context={};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/gensrpg/capture/lab-ownership-port-v1.js'),'utf8'),context);
 const port=context.GensCaptureLabOwnershipPortV1,clock=clockHub();
 const returns=[],errors=[];
 const command=s.a.makeHubCommand({
  transaction:s.transaction,combatPort:port,engine:s.a.engine,
  createProvider:factory??s.a.provider,clock,mountBattle,
  onReturn:event=>returns.push(event),
  onError:event=>errors.push(event)
 });
 return {...s,port,clock,returns,errors,command};
}
test('Hub command: the original World encounter → single official Combat Core port → flee → hero save → World resolved → new encounter',async()=>{
 const s=await hubSetup();
 const before=s.owner.profile();
 const launched=s.command.startWildBattle('crea_voltik');
 assert.equal(launched.ready,true);
 assert.equal(s.port.status().battleActive,true);
 assert.equal(s.command.status().phase,'running');
 assert.equal(s.owner.writes().hero,0);
 assert.throws(()=>s.command.startWildBattle('crea_voltik'),/active|pending/);
 assert.equal(launched.session.state().fighters.player.hp,150);
 assert.equal(launched.session.state().fighters.opponent.maxHp,120);
 assert.equal(launched.session.flee(),true);
 await settle();
 assert.equal(s.returns.length,1);
 assert.equal(s.returns[0].outcome,'flee');
 assert.equal(s.returns[0].applied,true);
 assert.equal(s.returns[0].worldResolved,true);
 assert.equal(s.owner.world().last.type,'resolved');
 assert.equal(s.owner.writes().hero,1);
 assert.equal(s.port.status().installed,false);
 assert.equal(s.clock.count(),0);
 assert.deepEqual(s.owner.profile().inventory,before.inventory);
 assert.deepEqual(s.owner.profile().profileCustom,before.profileCustom);
 assert.equal(s.command.status().phase,'idle');
 s.owner.replaceWorld({...s.owner.world(),last:{type:'wild',creatureId:'crea_voltik',text:'Another authored forest wild'}});
 const second=s.command.startWildBattle('crea_voltik');
 assert.equal(second.ready,true);
 second.session.flee();await settle();
 assert.equal(s.returns.length,2);
 assert.equal(s.owner.writes().hero,2);
 assert.equal(s.port.status().installed,false);
 assert.equal(s.command.dispose(),true);
});
test('Hub command: historical profile and externally installed provider are rejected before any world/hero write',async()=>{
 const old=await hubSetup({legacy:{hp:17,maxHp:17}});
 assert.throws(()=>old.command.startWildBattle('crea_voltik'),/HP|authored|incompatible/i);
 assert.equal(old.owner.writes().world,old.owner.baseline);
 assert.equal(old.owner.writes().hero,0);
 assert.equal(old.port.status().installed,false);
 assert.equal(old.command.dispose(),true);
 const separate=await hubSetup();
 const occupier=separate.a.provider({engine:separate.a.engine,
  resolveBattle:()=>{throw Error('unused')},mountBattle:()=>({dispose(){}})});
 separate.port.install(occupier);
 assert.throws(()=>separate.command.startWildBattle('crea_voltik'),/installed|port|owner/i);
 assert.equal(separate.owner.writes().world,separate.owner.baseline);
 assert.equal(separate.owner.writes().hero,0);
 separate.port.uninstall(occupier);separate.command.dispose();
});
test('Hub command: exit during official cast releases one battle view, clocks and port without consuming the wild',async()=>{
 let views=0;
 const s=await hubSetup({mountBattle:()=>({dispose(){views++}})});
 const launched=s.command.startWildBattle('crea_voltik');
 launched.session.useSkill('fireball');
 s.clock.advance(70);
 assert.equal(s.command.cancel(),true);
 assert.equal(s.command.cancel(),false);
 await settle();
 s.clock.advance(10000);
 assert.equal(views,1);
 assert.equal(s.owner.writes().hero,0);
 assert.equal(s.owner.world().last.type,'wild');
 assert.equal(s.owner.world().last.encounterId,launched.encounterId,'world identity survives browser reentry');
 assert.equal(s.port.status().installed,false);
 assert.equal(s.clock.count(),0);
 assert.equal(s.returns.length,1);
 assert.equal(s.returns[0].cancelled,true);
 assert.equal(s.command.dispose(),true);
});
test('Hub command: a failing official view mount cannot leave an installed provider or mutate saved hero',async()=>{
 const s=await hubSetup({mountBattle:()=>{throw Error('view unable to mount')}});
 assert.throws(()=>s.command.startWildBattle('crea_voltik'),/view unable to mount/);
 assert.equal(s.port.status().installed,false);
 assert.equal(s.owner.writes().hero,0);
 assert.equal(s.owner.world().last.type,'wild');
 assert.equal(s.clock.count(),0);
 assert.equal(s.command.status().phase,'idle');
});
test('Hub command: failed World consumption preserves the single hero commit and offers explicit retry without replaying Combat',async()=>{
 let fail=true;
 const s=await hubSetup({transactionOverrides:{
  consumeWildEncounter:reason=>{
   if(fail){fail=false;throw Error('World commit deferred');}
   return s.owner.ctx.captureConsumeWildEncounter(reason);
  }
 }});
 const b=s.command.startWildBattle('crea_voltik');
 b.session.flee();await settle();
 assert.equal(s.errors.length,1);
 assert.match(s.errors[0].error.message,/World commit deferred/);
 assert.equal(s.command.status().phase,'commit-pending');
 assert.equal(s.port.status().installed,false);
 assert.equal(s.clock.count(),0);
 assert.equal(s.owner.writes().hero,1);
 assert.equal(s.owner.world().last.type,'wild');
 assert.throws(()=>s.command.startWildBattle('crea_voltik'),/pending/);
 assert.throws(()=>s.command.dispose(),/pending|commit/);
 const result=s.command.retryCommit();
 assert.equal(result.applied,true);
 assert.equal(result.worldResolved,true);
 assert.equal(s.owner.writes().hero,1);
 assert.equal(s.owner.world().last.type,'resolved');
 assert.equal(s.returns.length,1);
 assert.equal(s.errors.length,1);
 assert.equal(s.command.dispose(),true);
});
test('Hub command: a stale Capture hero blocks result persistence; no forged victory or overwrite is reported',async()=>{
 const s=await hubSetup();
 const b=s.command.startWildBattle('crea_voltik');
 const changed=s.owner.profile();changed.creatureTeam[0].hp=34;
 s.owner.replaceHero(changed);
 b.session.flee();await settle();
 assert.equal(s.owner.writes().hero,0);
 assert.equal(s.owner.profile().creatureTeam[0].hp,34);
 assert.equal(s.owner.world().last.type,'wild');
 assert.equal(s.returns.length,0);
 assert.equal(s.errors.length,1);
 assert.match(s.errors[0].error.message,/Stale Capture profile/);
 assert.equal(s.port.status().installed,false);
 assert.equal(s.clock.count(),0);
 assert.equal(s.command.status().phase,'commit-pending');
 assert.throws(()=>s.command.retryCommit(),/Stale Capture profile/);
});


// Consent-driven migration contract: always execute against the ACTUAL
// Capture World and roster owner functions and the immutable official Lab
// author exporter, never a synthetic combat calculation or parallel save.
async function migrationSetup(legacy={}){
 const s=await setup({},legacy);
 const {createCaptureSavedProfileLabMigrationV1}=await import(
  '../assets/gensrpg/capture/saved-profile-lab-migration-v1.mjs');
 const make=()=>createCaptureSavedProfileLabMigrationV1({
  activeHeroId:()=>s.owner.ctx.captureActiveHeroId(),
  loadHeroState:id=>s.owner.ctx.loadState(id),
  saveHeroState:(id,state)=>s.owner.ctx.saveHeroCreatureState(id,state),
  readEncounter:()=>s.owner.ctx.captureWorldState().last,
  authoredSource:s.a.source,readBattleSettings:()=>battle,combatSha:PIN
 });
 return {...s,migration:make(),makeMigration:make};
}

test('migration: real historical 17 HP Capture save is READ ONLY until exact informed consent; Lab result and World then work',async()=>{
 const s=await migrationSetup({hp:17,maxHp:17,abilities:['old-leaf']});
 const before=s.owner.profile(),worldBefore=s.owner.world(),writes=s.owner.writes();
 assert.throws(()=>s.transaction.prepareWild('crea_voltik'),/HP|skill|loadout/i);
 const plan=s.migration.prepare();
 assert.equal(plan.status,'migration-required');
 assert.equal(plan.previous.hp,17);
 assert.equal(plan.previous.maxHp,17);
 assert.equal(plan.next.maxHp,150);
 assert.equal(plan.next.hp,150);
 assert.ok(plan.consentText.includes('17'));
 assert.ok(plan.consentText.includes('150'));
 assert.ok(plan.previous.activeAbilityIds.includes('old-leaf'));
 assert.ok(plan.next.activeAbilityIds.includes('fireball'));
 assert.deepEqual(s.owner.profile(),before);
 assert.deepEqual(s.owner.world(),worldBefore);
 assert.deepEqual(s.owner.writes(),writes);
 assert.throws(()=>s.migration.commit(plan,{}),/consent|confirmation|accord/i);
 assert.throws(()=>s.migration.commit(plan,{acknowledged:'Oui'}),/consent|confirmation|accord/i);
 assert.deepEqual(s.owner.profile(),before);
 const accepted=s.migration.commit(plan,{acknowledged:plan.consentText});
 assert.equal(accepted.migrated,true);
 assert.equal(s.owner.writes().hero,1,'exactly one write by canonical roster');
 assert.equal(s.owner.writes().world,writes.world,'migration never creates a World event');
 const after=s.owner.profile();
 assert.equal(after.creatureTeam[0].uid,before.creatureTeam[0].uid);
 assert.equal(after.creatureTeam[0].entityId,before.creatureTeam[0].entityId);
 assert.equal(after.creatureTeam[0].hp,150);
 assert.equal(after.creatureTeam[0].maxHp,150);
 assert.deepEqual(after.creatureTeam[0].activeAbilityIds,plan.next.activeAbilityIds);
 assert.deepEqual(after.creatureTeam[0].knownAbilityIds,plan.next.activeAbilityIds);
 assert.deepEqual(after.inventory,before.inventory);
 assert.deepEqual(after.profileCustom,before.profileCustom);
 assert.equal(after.gold,before.gold);
 assert.equal(after.captureLabProfileMigrationV1.version,1);
 assert.equal(after.captureLabProfileMigrationV1.combatSha,PIN);
 assert.deepEqual(after.captureLabProfileMigrationV1.originalMember,before.creatureTeam[0]);
 assert.equal(s.transaction.prepareWild('crea_voltik').snapshot.sides[0].creatures[0].hp,150);
 const ticket=s.transaction.status();
 assert.equal(ticket.pending,true);
 // No second migration or write can happen after the original consent.
 assert.throws(()=>s.migration.commit(plan,{acknowledged:plan.consentText}),/used|stale|already|plan/i);
 assert.equal(s.owner.writes().hero,1);
});

test('migration: current canonical save or outside user changes abort before either owner writes',async()=>{
 const s=await migrationSetup({hp:17,maxHp:17});
 const plan=s.migration.prepare();
 const stale=s.owner.profile();stale.gold+=10;s.owner.replaceHero(stale);
 assert.throws(()=>s.migration.commit(plan,{acknowledged:plan.consentText}),/stale|changed|modified/i);
 assert.equal(s.owner.writes().hero,0);
 assert.equal(s.owner.profile().gold,stale.gold);
 const fresh=s.migration.prepare();
 s.owner.replaceWorld({...s.owner.world(),last:{type:'wild',creatureId:'crea-loup',text:'Different encounter'}});
 assert.throws(()=>s.migration.commit(fresh,{acknowledged:fresh.consentText}),/stale|encounter|changed/i);
 assert.equal(s.owner.writes().hero,0);
});

test('migration: never silently alter unknown official creatures, reserves, teams or allocated custom stats',async()=>{
 for(const legacy of [{reserve:true},{hp:0,maxHp:17}]){
  const s=await migrationSetup(legacy);
  assert.throws(()=>s.migration.prepare(),/1v1|team|reserve|KO|HP|health/i);
  assert.equal(s.owner.writes().hero,0);
  assert.equal(s.owner.writes().world,s.owner.baseline);
 }
 const s=await migrationSetup({hp:17,maxHp:17});
 const x=s.owner.profile();x.creatureTeam[0].entityId='user-custom-not-in-author-export';
 s.owner.replaceHero(x);
 assert.throws(()=>s.migration.prepare(),/unknown|authored|catalog|creature/i);
 assert.equal(s.owner.writes().hero,0);
 const y=await migrationSetup({hp:17,maxHp:17});
 const modified=y.owner.profile();modified.creatureTeam[0].statAlloc.power=5;
 y.owner.replaceHero(modified);
 assert.throws(()=>y.migration.prepare(),/allocation|stat|unsupported|personal/i);
 assert.equal(y.owner.writes().hero,0);
});

test('migration: proportional HP is documented and the exact authored loadout replaces stale active skills only after consent',async()=>{
 const s=await migrationSetup({hp:9,maxHp:18,abilities:['legacy-skill']});
 const plan=s.migration.prepare();
 assert.equal(plan.previous.hp,9);
 assert.equal(plan.previous.maxHp,18);
 assert.equal(plan.next.hp,75);
 assert.equal(plan.next.maxHp,150);
 assert.notDeepEqual(plan.previous.activeAbilityIds,plan.next.activeAbilityIds);
 assert.equal(s.owner.writes().hero,0);
 s.migration.commit(plan,{acknowledged:plan.consentText});
 assert.equal(s.owner.profile().creatureTeam[0].hp,75);
 assert.deepEqual(s.owner.profile().creatureTeam[0].activeAbilityIds,plan.next.activeAbilityIds);
 assert.equal(s.transaction.prepareWild('crea_voltik').snapshot.sides[0].creatures[0].hp,75);
});

test('migration: exact single-owner rollback is available before combat, refuses changed creature or world and preserves newer inventory',async()=>{
 const s=await migrationSetup({hp:17,maxHp:17,abilities:['old-leaf']});
 const before=s.owner.profile(),plan=s.migration.prepare();
 s.migration.commit(plan,{acknowledged:plan.consentText});
 const restoredSession=s.makeMigration(),offer=restoredSession.inspectRollback();
 assert.equal(offer.available,true);
 assert.equal(s.owner.writes().hero,1);
 const changed=s.owner.profile();changed.inventory.push({itemId:'berries',qty:2});
 s.owner.replaceHero(changed);
 assert.throws(()=>restoredSession.rollback({acknowledged:'not-approved'}),/consent|confirmation/i);
 const done=restoredSession.rollback({acknowledged:offer.consentText});
 assert.equal(done.restored,true);
 assert.equal(s.owner.writes().hero,2);
 const hero=s.owner.profile();
 assert.deepEqual(hero.creatureTeam[0],before.creatureTeam[0]);
 assert.equal(hero.captureLabProfileMigrationV1,undefined);
 assert.equal(hero.inventory.length,before.inventory.length+1);
 assert.equal(restoredSession.inspectRollback().available,false);
 assert.throws(()=>restoredSession.rollback({acknowledged:offer.consentText}),/rollback|migration|available/i);
});

test('migration: a subsequent real wild result forbids reverting the creature to a pre-combat snapshot',async()=>{
 const s=await migrationSetup({hp:17,maxHp:17});
 const plan=s.migration.prepare();
 s.migration.commit(plan,{acknowledged:plan.consentText});
 const offer=s.makeMigration().inspectRollback();
 const ticket=s.transaction.prepareWild('crea_voltik');
 const before=s.owner.writes().hero;
 const raw={outcome:'flee',creatures:ticket.snapshot.sides.flatMap(side=>side.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))};
 assert.equal(ticket.applyResult(raw).worldResolved,true);
 assert.equal(s.owner.writes().hero,before+1);
 assert.equal(s.owner.world().last.type,'resolved');
 assert.throws(()=>s.makeMigration().rollback({acknowledged:offer.consentText}),/battle|encounter|stale|changed/i);
 assert.equal(s.owner.profile().creatureTeam[0].maxHp,150);
 assert.equal(s.owner.world().last.type,'resolved');
 assert.equal(s.owner.writes().hero,before+1);
});

test('migration: compatible official saved member requires zero writes and no consent modal',async()=>{
 const s=await migrationSetup();
 const plan=s.migration.prepare();
 assert.equal(plan.status,'compatible');
 assert.equal(s.owner.writes().hero,0);
 assert.throws(()=>s.migration.commit(plan,{acknowledged:plan.consentText}),/compatible|migration|required/i);
 assert.equal(s.owner.writes().hero,0);
});
