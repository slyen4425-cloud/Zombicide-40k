const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const LAB_PIN = '92e2f75ff6e9b3e03d460115d53b5604adf0e718';
const labRoot = process.env.COMBAT_LAB_ROOT;
assert.ok(labRoot, 'The official pinned Combat Lab checkout is mandatory');
assert.equal(execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), LAB_PIN);
const bridgeUrl = pathToFileURL(path.join(root, 'assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs')).href;
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/capture-lab-1v1-export-v1.json'),'utf8'));
let enginePromise;
async function lab(){
  if(!enginePromise) enginePromise = Promise.all([
    import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs'),
    import('../assets/gensrpg/capture/combat-lab-provider-v1.mjs'),
    import(bridgeUrl)
  ]).then(async ([loader,provider,bridge])=>({
    engine:await loader.loadCombatLabEngineV1(pathToFileURL(path.resolve(labRoot)+path.sep)),
    makeProvider:provider.createCombatLabProviderV1,
    makeBridge:bridge.createCaptureSavedProfileBattleBridgeV1
  }));
  return enginePromise;
}
function clock(){
  let now=0,id=0;const timers=new Map();
  return {
    now:()=>now,setTimer(fn,ms){const token=++id;timers.set(token,{fn,at:now+ms});return token;},
    clearTimer(token){timers.delete(token);},
    advance(ms){const stop=now+ms;let count=0;for(;;){
      const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next||next[1].at>stop)break;
      assert.ok(++count<10000,'native combat timer must terminate');
      now=next[1].at;timers.delete(next[0]);next[1].fn();
    }now=stop;},
    count:()=>timers.size
  };
}
function persistedCaptureOwner(overrides={}){
  const storage=new Map(),heroId='trainer-profile-1';
  const initial={
    creatureTeam:[{uid:'ci_existing_player',entityId:'preview-player',hp:overrides.hp??24,maxHp:24,
      activeAbilityIds:['preview-strike'],knownAbilityIds:['preview-strike'],level:4,xp:17,
      statAlloc:{power:2},customUserValue:'keep'}],
    creatureReserve:[],unrelated:{inventory:[{id:'item',quantity:3}],gold:71}
  };
  Object.assign(initial,overrides);
  storage.set('save:'+heroId,JSON.stringify(initial));
  let writes=0;
  const ctx=vm.createContext({
    current:heroId,state:null,
    key:id=>'save:'+id,
    localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,value);writes++;}},
    loadState:id=>JSON.parse(storage.get('save:'+id)),
    normalizeGameParticipants:()=>[heroId],
    loadSharedEntities:()=>fixture.creatures.map(c=>({id:c.id,name:c.displayName,hp:c.combat.maxHp,abilityIds:c.skillIds}))
  });
  const code=fs.readFileSync(path.join(root,'assets/gensrpg/capture/team-roster-v1.js'),'utf8');
  for(const part of [3,1]){
    const match=code.match(new RegExp('// BEGIN_CAPTURE_TEAM_SECTION_'+part+'\\n([\\s\\S]*?)// END_CAPTURE_TEAM_SECTION_'+part));
    assert.ok(match,'read the physical canonical Capture roster owner section '+part);
    vm.runInContext(match[1],ctx);
  }
  assert.equal(ctx.captureTeamEntityRoster().length,1,'real roster owner reads the saved team');
  return {heroId,ctx,get:()=>JSON.parse(storage.get('save:'+heroId)),getRaw:()=>storage.get('save:'+heroId),
    writes:()=>writes,replace:next=>storage.set('save:'+heroId,JSON.stringify(next)),
    load:id=>ctx.loadState(id),save:(id,state)=>ctx.saveHeroCreatureState(id,state)};
}
function resultGuard(){
  const ctx={};vm.runInNewContext(fs.readFileSync(
    path.join(root,'assets/gensrpg/capture/battle-bridge-contract-v1.js'),'utf8'),ctx);
  return ctx.GensCaptureBattleBridgeContractV1.result;
}
async function setup({hp=24,aiEnabled=false,mutate=()=>{},encounter}={}){
  const {engine,makeProvider,makeBridge}=await lab();
  const owner=persistedCaptureOwner({hp});
  const exportData=structuredClone(fixture);
  mutate({owner,exportData});
  const readEncounter=()=>encounter??{type:'wild',encounterId:'real-wild-001',creatureId:'preview-enemy'};
  const bridge=makeBridge({
    activeHeroId:()=>owner.ctx.captureActiveHeroId(),
    loadHeroState:owner.load,saveHeroState:owner.save,readEncounter,
    exported:exportData,adaptCombatExport:engine.adaptCaptureCombatExportStackV1,
    validateBattleResult:resultGuard()
  });
  const ticket=bridge.prepareEncounter();
  const time=clock(),events=[];
  let battle;
  const provider=makeProvider({
    engine,clock:time,
    resolveBattle:context=>ticket.resolveBattle(context),
    mountBattle:handle=>{battle=handle;return {dispose(){}};}
  });
  const ctx={};
  for(const name of ['battle-bridge-contract-v1.js','lab-ownership-port-v1.js',
    'manual-battle-trigger-v1.js','temporary-encounter-source-v1.js',
    'temporary-zone-controller-v1.js','temporary-zone-session-v1.js']){
    vm.runInNewContext(fs.readFileSync(path.join(root,'assets/gensrpg/capture',name),'utf8'),ctx);
  }
  const port=ctx.GensCaptureLabOwnershipPortV1;port.install(provider);
  const trigger=ctx.GensCaptureManualBattleTriggerV1.create(port,ctx.GensCaptureBattleBridgeContractV1);
  const session=ctx.GensCaptureTemporaryZoneSessionV1.create({
    trigger,width:3,height:2,encounterAt:(x,y)=>x===1&&y===0?'wild':null,
    resolveEncounter:()=>({encounterId:ticket.encounterId,snapshot:ticket.snapshot}),
    onBattleReturn:event=>{events.push(event);if(event.result)ticket.applyResult(event.result);}
  });
  return {owner,ticket,provider,port,session,events,time,battle:()=>battle,
    stop(){session.stop();port.uninstall(provider);}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('real saved Capture owner → official Core defeat → single save and complete reload',async()=>{
  const s=await setup({hp:3,aiEnabled:true});
  const before=s.owner.get();
  assert.equal(s.ticket.snapshot.sides[0].creatures[0].instanceId,'ci_existing_player');
  assert.equal(s.session.move(1,0).encounter.ready,true);
  assert.equal(s.battle().state().fighters.player.hp,3);
  s.time.advance(1800);await flush();
  assert.equal(s.events.length,1);assert.equal(s.events[0].result.outcome,'defeat');
  assert.equal(s.owner.get().creatureTeam[0].hp,0);
  assert.equal(s.owner.get().creatureTeam[0].uid,before.creatureTeam[0].uid);
  assert.equal(s.owner.get().creatureTeam[0].xp,17);
  assert.deepEqual(s.owner.get().unrelated,before.unrelated);
  assert.equal(s.owner.writes(),1);
  assert.equal(s.ticket.applyResult(s.events[0].result),false,'same result cannot be applied twice');
  assert.equal(s.owner.writes(),1);
  assert.equal(s.session.state().zone.locked,false);
  assert.equal(s.time.count(),0);
  s.stop();
});

test('real native impact and second strike give victory, profile identity remains intact',async()=>{
  const s=await setup({hp:20});
  const rawBefore=s.owner.getRaw();
  s.session.move(1,0);
  assert.equal(s.battle().useSkill('preview-strike').ok,true);
  assert.equal(s.owner.getRaw(),rawBefore,'no save before combat resolution');
  s.time.advance(550);
  assert.equal(s.battle().state().fighters.opponent.hp,12);
  assert.equal(s.battle().useSkill('preview-strike').ok,true);
  s.time.advance(550);await flush();
  assert.equal(s.events[0].result.outcome,'victory');
  assert.equal(s.owner.get().creatureTeam[0].hp,20);
  assert.equal(s.owner.writes(),1);
  assert.equal(s.ticket.applyResult(s.events[0].result),false);
  s.stop();
});

test('flee commits damaged current HP only; cancelled exit does not save',async()=>{
  const s=await setup({hp:20,aiEnabled:true});s.session.move(1,0);
  s.time.advance(1800);
  assert.ok(s.battle().state().fighters.player.hp<20);
  const hp=s.battle().state().fighters.player.hp;
  s.battle().flee();await flush();
  assert.equal(s.events[0].result.outcome,'flee');
  assert.equal(s.owner.get().creatureTeam[0].hp,hp);
  assert.equal(s.owner.writes(),1);
  s.stop();
  const c=await setup({hp:20});c.session.move(1,0);c.session.stop();await flush();
  assert.equal(c.owner.writes(),0);
  c.port.uninstall(c.provider);
});

test('a concurrent external save must never be overwritten by a stale combat result',async()=>{
  const s=await setup({hp:20});s.session.move(1,0);
  const changed=s.owner.get();changed.creatureTeam[0].hp=13;changed.unrelated.gold=95;
  s.owner.replace(changed);
  const untouched=s.ticket.snapshot.sides.flatMap(side=>side.creatures)
    .map(creature=>({instanceId:creature.instanceId,hp:creature.hp}));
  assert.throws(()=>s.ticket.applyResult({outcome:'flee',creatures:untouched}),/Stale Capture profile/);
  assert.equal(s.owner.get().creatureTeam[0].hp,13);
  assert.equal(s.owner.get().unrelated.gold,95);
  assert.equal(s.owner.writes(),0);
  s.stop();
});

test('official resolver refuses altered HP, abilities or opposing identity before Core starts',async()=>{
  const s=await setup({hp:18});
  const original=structuredClone(s.ticket.snapshot);
  assert.deepEqual(s.ticket.resolveBattle({encounterId:s.ticket.encounterId,snapshot:original}).actorIds,
    ['player','opponent']);
  for(const change of [
    x=>x.sides[0].creatures[0].hp=1,
    x=>x.sides[0].creatures[0].abilityIds=['altered'],
    x=>x.sides[1].creatures[0].instanceId='replacement',
    x=>x.sides[1].creatures[0].maxHp=999
  ]){
    const forged=structuredClone(original);change(forged);
    assert.throws(()=>s.ticket.resolveBattle({encounterId:s.ticket.encounterId,snapshot:forged}),/snapshot/);
  }
  assert.equal(s.owner.writes(),0);
  s.stop();
});

test('profile or authored mismatches are rejected, never mapped by guesswork',async()=>{
  const {engine,makeBridge}=await lab();const owner=persistedCaptureOwner();
  const opts={activeHeroId:()=>owner.heroId,loadHeroState:owner.load,saveHeroState:owner.save,
    readEncounter:()=>({type:'wild',encounterId:'wild',creatureId:'preview-enemy'}),
    adaptCombatExport:engine.adaptCaptureCombatExportStackV1,validateBattleResult:resultGuard()};
  const bridge=exported=>makeBridge({...opts,exported});
  const unknown=owner.get();unknown.creatureTeam[0].entityId='missing';
  owner.replace(unknown);
  assert.throws(()=>bridge(structuredClone(fixture)).prepareEncounter(),/authored|creature|catalog/i);
  owner.replace(persistedCaptureOwner().get());
  const two=owner.get();two.creatureTeam.push({...two.creatureTeam[0],uid:'second'});owner.replace(two);
  assert.throws(()=>bridge(structuredClone(fixture)).prepareEncounter(),/1v1|roster|team/i);
  owner.replace(persistedCaptureOwner().get());
  const badLoadout=owner.get();badLoadout.creatureTeam[0].activeAbilityIds=['unknown'];owner.replace(badLoadout);
  assert.throws(()=>bridge(structuredClone(fixture)).prepareEncounter(),/skill|loadout|ability/i);
  assert.equal(owner.writes(),0);
});


// Native 2v2 regression: real authored Lab exporter -> canonical Capture owner
// -> only Combat Lab Core/provider -> validation -> one saved profile write.
// This must fail RED while the saved-profile bridge remains 1v1-only.
let officialTwoTeamFixturePromise;
async function officialTwoTeamFixture(){
 if(!officialTwoTeamFixturePromise) officialTwoTeamFixturePromise=(async()=>{
  const read=rel=>JSON.parse(fs.readFileSync(path.join(labRoot,rel),'utf8'));
  const fromLab=rel=>import(pathToFileURL(path.join(labRoot,rel)).href);
  const [author,creature,skill,skillDraft,rules,exporter,adapter,portable,complex]=await Promise.all([
   import('../assets/gensrpg/capture/combat-lab-authored-source-v1.mjs'),
   fromLab('src/contracts/capture-creature-transfer-v1.js'),
   fromLab('src/contracts/capture-skill-transfer-v1.js'),
   fromLab('src/contracts/capture-skill-editor-draft-v1.js'),
   fromLab('src/adapters/input/capture/capture-combat-rules-overlay-v1.js'),
   fromLab('src/adapters/input/capture/capture-editor-exporter-v3.js'),
   fromLab('src/adapters/input/capture/capture-export-adapter-stack-v1.js'),
   fromLab('src/catalogs/capture-portable-native-skill-catalog-v1.js'),
   fromLab('src/catalogs/capture-complex-native-skill-catalog-v1.js')
  ]);
  const data=read('data/combat/skills/catalog.v1.json');
  const manifest=fs.readFileSync(path.join(labRoot,'src/catalogs/capture-showcase-skill-presets-v1.js'),'utf8');
  const listed=[...manifest.matchAll(/"((?:data\/capture\/showcase\/)[^"]+\.capture-skill-transfer-v1\.json)"/g)]
   .map(m=>m[1]);
  assert.ok(listed.length>40,'real pinned official skill catalog needed');
  const skills=new Map();
  for(const row of data.entries){
   const draft=skillDraft.normalizeCaptureSkillEditorDraftV1({
    schema:'capture-skill-editor-draft-v1',id:row.id,
    description:row.label||row.id,requiredLevel:1,
    usageScopes:['capture','combat'],definition:row.definition,presentation:null
   });
   skills.set(draft.id,draft);
  }
  for(const draft of [...portable.capturePortableNativeSkillDraftsV1(),
    ...complex.captureComplexNativeSkillDraftsV1()])skills.set(draft.id,draft);
  for(const file of listed){
   const record=skill.normalizeCaptureSkillTransferV1(read(file));
   skills.set(record.draft.id,record.draft);
  }
  const ids=['crea-loup','crea_mossback','crea_voltik','kitsune_lunaire'];
  const available=read('data/capture/monster-capture-stat-registry.v1.json');
  const all=JSON.parse(fs.readFileSync(path.join(root,
   'tests/fixtures/capture-lab-authored-preview-settings-v1.json'),'utf8')).authoredCreatureFiles;
  const transfers=all.map(read).filter(x=>ids.includes(x.draft.id));
  assert.deepEqual(transfers.map(x=>x.draft.id).sort(),[...ids].sort());
  const factory=author.createCaptureLabAuthoredSourceV1({
   normalizeCreatureTransfer:creature.normalizeCaptureCreatureTransferV1,
   normalizeSkillDraft:skillDraft.normalizeCaptureSkillEditorDraftV1,
   overlayCombatRules:rules.applyCaptureCombatRulesToCreatureDraftV1,
   exportEditorDrafts:exporter.exportCaptureEditorDraftsToCombatExportV3,
   adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
   statRegistry:available,configuredSkillDrafts:[...skills.values()],
   creatureTransfers:transfers
  });
  const actorInput={
   encounterId:'ci-two-actor-wild-001',
   playerTeam:[{instanceId:'ci-wolf',creatureId:'crea-loup'},
    {instanceId:'ci-golem',creatureId:'crea_mossback'}],
   opponentTeam:[{instanceId:'wild:ci-two-actor-wild-001',creatureId:'crea_voltik'},
    {instanceId:'wild:ci-two-actor-wild-001:2',creatureId:'kitsune_lunaire'}],
   arenaId:'forest',skillSpeedMultiplier:0.5,
   combatRules:{schema:'capture-combat-rules-editor-draft-v1',
    maxEnergy:10,initialEnergy:10,energyChargeAmount:1,
    energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0}
  };
  const built=factory.buildEncounter(actorInput);
  return {built};
 })();
 return officialTwoTeamFixturePromise;
}
function native2v2CaptureOwner(built){
 const owner=persistedCaptureOwner();
 const source=built.nativeCombatSource;
 const player=source.battleFormat.actors.filter(a=>source.battleFormat.teamOf(a.actorId)==='capture-team');
 assert.deepEqual(player.map(x=>x.actorId),['player','ally']);
 const next=owner.get();
 next.creatureTeam=player.map((actor,i)=>({
  uid:built.instanceIds[actor.actorId],entityId:actor.creatureId,
  hp:source.fighterConfigs[actor.creatureId].maxHp,
  maxHp:source.fighterConfigs[actor.creatureId].maxHp,
  activeAbilityIds:[...source.skillIdsByActor[actor.actorId]],
  knownAbilityIds:[...source.skillIdsByActor[actor.actorId]],
  xp:70+i,level:3+i,userMemo:'preserve member '+i
 }));
 owner.replace(next);
 return owner;
}
function native2v2Encounter(){
 return {type:'wild',encounterId:'ci-two-actor-wild-001',creatureId:'crea_voltik',
  creatureIds:['crea_voltik','kitsune_lunaire'],locationId:'cap_forest'};
}
async function native2v2SavedBridge(){
 const {engine,makeBridge}=await lab();
 const {built}=await officialTwoTeamFixture();
 const owner=native2v2CaptureOwner(built),encounter=native2v2Encounter();
 const create=()=>makeBridge({
  activeHeroId:()=>owner.ctx.captureActiveHeroId(),
  loadHeroState:owner.load,saveHeroState:owner.save,
  readEncounter:()=>encounter,exported:built.exported,
  adaptCombatExport:engine.adaptCaptureCombatExportStackV1,
  validateBattleResult:resultGuard()
 });
 return {engine,owner,encounter,built,create};
}
test('RED then GREEN: two saved active members cross the genuine four-actor Combat provider and persist HP once',async()=>{
 const {engine,owner,built,create}=await native2v2SavedBridge();
 const first=owner.get(),ticket=create().prepareEncounter();
 assert.deepEqual(ticket.snapshot.sides.map(x=>x.creatures.length),[2,2]);
 assert.deepEqual(ticket.snapshot.sides[0].active,['ci-wolf','ci-golem']);
 assert.deepEqual(ticket.snapshot.sides[1].active,
  ['wild:ci-two-actor-wild-001','wild:ci-two-actor-wild-001:2']);
 assert.deepEqual(ticket.snapshot.sides[0].creatures.map(x=>x.abilityIds),
  [first.creatureTeam[0].activeAbilityIds,first.creatureTeam[1].activeAbilityIds]);
 const {makeProvider}=await lab();
 const provider=makeProvider({engine,mountBattle:()=>({dispose(){}}),
  resolveBattle:ctx=>({...ticket.resolveBattle(ctx),aiEnabled:false})});
 const handle=provider.createBattle({encounterId:ticket.encounterId,snapshot:ticket.snapshot});
 provider.startBattle(handle);
 assert.deepEqual(built.actorIds,['player','ally','opponent','opponent-b']);
 for(const actorId of built.actorIds)assert.ok(handle.state().fighters[actorId].hp>0);
 assert.equal(handle.flee(),true);
 const result=await handle.completion;
 provider.disposeBattle(handle);
 assert.equal(result.creatures.length,4);
 const before=owner.get();
 const persisted=ticket.applyResult(result);
 assert.equal(persisted.applied,true);
 assert.equal(persisted.outcome,'flee');
 assert.equal(owner.writes(),1,'only the canonical Capture save owner writes');
 const saved=owner.get();
 for(const member of saved.creatureTeam){
  assert.equal(member.hp,result.creatures.find(x=>x.instanceId===member.uid).hp);
 }
 assert.deepEqual(saved.creatureTeam.map(x=>x.userMemo),before.creatureTeam.map(x=>x.userMemo));
 assert.deepEqual(saved.unrelated,before.unrelated);
 assert.equal(ticket.applyResult(result),false,'a battle result cannot be saved twice');
 assert.equal(owner.writes(),1);
});
test('saved 2v2 rejects changed teammate, missing encounter, duplicate identity, reserve and incomplete results',async()=>{
 const input=await native2v2SavedBridge();
 const ticket=input.create().prepareEncounter();
 const result={outcome:'flee',creatures:ticket.snapshot.sides.flatMap(side=>
  side.creatures.map(c=>({instanceId:c.instanceId,hp:c.hp})))};
 const invalid={...result,creatures:result.creatures.slice(0,3)};
 assert.throws(()=>ticket.applyResult(invalid),/incomplete|result/i);
 const shifted=input.owner.get();shifted.creatureTeam[1].hp-=1;
 input.owner.replace(shifted);
 assert.throws(()=>ticket.applyResult(result),/stale|profile|save|member/i);
 assert.equal(input.owner.writes(),0);
 const other=await native2v2SavedBridge();
 const reserve=other.owner.get();reserve.creatureReserve.push({...reserve.creatureTeam[1],uid:'ci-hidden'});
 other.owner.replace(reserve);
 assert.throws(()=>other.create().prepareEncounter(),/reserve/i);
 const duplicate=other.owner.get();duplicate.creatureReserve=[];
 duplicate.creatureTeam[1].uid=duplicate.creatureTeam[0].uid;other.owner.replace(duplicate);
 assert.throws(()=>other.create().prepareEncounter(),/duplicate|identity|instance/i);
 const wrong=other.owner.get();wrong.creatureTeam[1].uid='ci-golem';
 other.owner.replace(wrong);
 const wrongBridge=other.create();
 assert.throws(()=>wrongBridge.prepareEncounter(),/reserve|encounter|creature/i);
});
