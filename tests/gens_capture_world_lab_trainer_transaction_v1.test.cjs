'use strict';
// RED contract for the *Capture-owned* trainer World transaction: never turn
// an NPC into a fake wild encounter; never instantiate a second combat engine.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const moduleUrl=pathToFileURL(path.resolve(__dirname,
 '../assets/gensrpg/capture/capture-world-lab-trainer-transaction-v1.mjs')).href;
const source={
 battleFormat:{
  actors:[{actorId:'player',creatureId:'crea-loup',displayName:'Loup'},
          {actorId:'opponent',creatureId:'crea_voltik',displayName:'Voltige'}],
  localActorId:'player',teamOf:id=>id==='player'?'capture-team':'wild-team'
 },
 fighterConfigs:{'crea-loup':{maxHp:150},crea_voltik:{maxHp:120}},
 skillIdsByActor:{player:['claw'],opponent:['zap']},
 skills:{claw:{},zap:{}}
};
function fixture(){
 let world={locationId:'route',last:{
  type:'hostile_trainer',trainerId:'npc-7',trainerName:'Dresseur confirmé',
  trainerDifficulty:3,creatureIds:['crea_voltik'],captureAllowed:false,
  text:'Combat de dresseur'
 }};
 let profile={creatureTeam:[{uid:'wolf-1',entityId:'crea-loup',hp:113,
  maxHp:150,activeAbilityIds:['claw'],knownAbilityIds:['claw'],xp:42}],
  creatureReserve:[{uid:'res-2',entityId:'crea_voltik',hp:70,
   maxHp:120,activeAbilityIds:['zap'],knownAbilityIds:['zap']}],
  gold:90,inventory:[{itemId:'ball',qty:2}]};
 let saves=0,worldSaves=0,consumes=0;
 const options={
  activeHeroId:()=> 'hero-7',loadHeroState:()=>profile,
  saveHeroState:(_,next)=>{saves++;profile=next},
  readWorldState:()=>world,saveWorldState:next=>{worldSaves++;world=next},
  consumeTrainerEncounter:()=>{consumes++;world={...world,last:{type:'resolved',text:'Terminé'}}},
  worldStorageKey:()=> 'world-profile-7',nextEncounterId:()=> 'trainer-7',
  authoredSource:{buildEncounter:config=>{
   if(config.opponent?.creatureId!=='crea_voltik')throw Error('unknown Lab creature');
   if(config.player?.creatureId!=='crea-loup')throw Error('unknown Lab player');
   return {exported:{schema:'signed-lab-export'},nativeCombatSource:source};
  }},
  readBattleSettings:()=>({arenaId:'forest',skillSpeedMultiplier:0.5,
   combatRules:{schema:'official-rules'}}),
  adaptCombatExport:()=>source,validateBattleResult:result=>result
 };
 return {options,world:()=>world,setWorld:x=>{world=x},profile:()=>profile,
  setProfile:x=>{profile=x},saves:()=>saves,worldSaves:()=>worldSaves,
  consumes:()=>consumes};
}
test('typed trainer session uses canonical World NPC and native Lab export, saves exactly once',async()=>{
 const {createCaptureWorldLabTrainerTransactionV1}=await import(moduleUrl);
 const f=fixture(),before=structuredClone(f.profile());
 const tx=createCaptureWorldLabTrainerTransactionV1(f.options);
 const ticket=tx.prepareTrainer();
 assert.equal(ticket.encounterId,'trainer-7');
 assert.equal(f.world().last.type,'hostile_trainer');
 assert.equal(f.world().last.encounterId,'trainer-7');
 assert.equal(f.worldSaves(),1);
 assert.equal(ticket.snapshot.sides[0].creatures[0].hp,113);
 assert.equal(ticket.snapshot.sides[1].creatures[0].instanceId,'trainer:trainer-7');
 assert.equal(ticket.snapshot.sides[1].name,'Dresseur confirmé');
 assert.equal(ticket.resolveBattle({encounterId:ticket.encounterId,snapshot:ticket.snapshot}).nativeCombatSource,source);
 assert.equal(tx.status().pending,true);
 const saved=ticket.applyResult({outcome:'flee',creatures:[
  {instanceId:'wolf-1',hp:81},{instanceId:'trainer:trainer-7',hp:25}
 ]});
 assert.equal(saved.outcome,'flee');
 assert.equal(saved.worldResolved,true);
 assert.equal(f.saves(),1);
 assert.equal(f.consumes(),1);
 assert.equal(f.profile().creatureTeam[0].hp,81);
 assert.deepEqual(f.profile().creatureReserve,before.creatureReserve);
 assert.deepEqual(f.profile().inventory,before.inventory);
 assert.equal(f.profile().gold,before.gold);
 assert.equal(tx.status().pending,false);
 assert.equal(ticket.applyResult({outcome:'flee',creatures:[]}),false);
 assert.equal(f.saves(),1);
});
test('NPC type, identity and signed species are mandatory; no silent wild conversion',async()=>{
 const {createCaptureWorldLabTrainerTransactionV1}=await import(moduleUrl);
 for(const patch of [
  {type:'wild'},{trainerId:''},{trainerDifficulty:0},
  {trainerName:''},{creatureIds:['crea_son_1']},{captureAllowed:true}
 ]){
  const f=fixture();
  f.setWorld({...f.world(),last:{...f.world().last,...patch}});
  const tx=createCaptureWorldLabTrainerTransactionV1(f.options);
  assert.throws(()=>tx.prepareTrainer(),/trainer|NPC|Lab|species|creature|difficulty|capture|signed/i);
  assert.equal(f.saves(),0);
  assert.equal(f.worldSaves(),0);
 }
});
test('trainer profile/world changes during preparation or combat block stale commits',async()=>{
 const {createCaptureWorldLabTrainerTransactionV1}=await import(moduleUrl);
 for(const edit of [
  f=>f.setWorld({...f.world(),locationId:'new-route'}),
  f=>f.setWorld({...f.world(),last:{...f.world().last,trainerDifficulty:4}}),
  f=>f.setProfile({...f.profile(),creatureReserve:[]})
 ]){
  const f=fixture(),ticket=createCaptureWorldLabTrainerTransactionV1(f.options).prepareTrainer();
  edit(f);
  assert.throws(()=>ticket.applyResult({outcome:'flee',creatures:[
   {instanceId:'wolf-1',hp:81},{instanceId:'trainer:trainer-7',hp:25}
  ]}),/Stale|changed|world|profile|trainer|reserve/i);
  assert.equal(f.saves(),0);
  assert.equal(f.consumes(),0);
 }
});
test('one pending trainer ticket; cancelled attempt leaves original NPC encounter',async()=>{
 const {createCaptureWorldLabTrainerTransactionV1}=await import(moduleUrl);
 const f=fixture(),tx=createCaptureWorldLabTrainerTransactionV1(f.options);
 const ticket=tx.prepareTrainer();
 assert.throws(()=>tx.prepareTrainer(),/pending|active/i);
 assert.equal(ticket.cancel(),true);
 assert.equal(ticket.cancel(),false);
 assert.equal(f.world().last.type,'hostile_trainer');
 assert.equal(f.saves(),0);
 assert.equal(f.consumes(),0);
 assert.equal(tx.status().pending,false);
});

test('one existing Combat Lab command dispatches trainer to typed ticket and commits once',async()=>{
 const {createCaptureLabHubBattleCommandV1}=await import(pathToFileURL(path.resolve(__dirname,
  '../assets/gensrpg/capture/capture-lab-hub-battle-command-v1.mjs')).href);
 let settle,installed=false,battle=false,kind=null,applied=0,prepared=0,returned=[];
 const completion=new Promise(resolve=>{settle=resolve});
 const ticket={encounterId:'trainer-7',snapshot:{sides:[]},
  resolveBattle:()=>({}),applyResult:()=>{applied++;return {applied:true,outcome:'flee'}},
  cancel:()=>true};
 const tx={prepareTrainer:()=>{prepared++;return ticket},status:()=>({pending:false})};
 const wild={prepareWild:()=>{throw Error('wild must not start')},status:()=>({pending:false})};
 const port={status:()=>({installed,battleActive:battle}),
  install:()=>{installed=true},uninstall:()=>{installed=false},
  startEncounter:options=>{kind=options.mode;battle=true;return {completion}},
  stopEncounter:()=>{battle=false}};
 const command=createCaptureLabHubBattleCommandV1({transaction:wild,trainerTransaction:tx,
  combatPort:port,engine:{createRosterSession:()=>{}},
  createProvider:()=>({}),mountBattle:()=>{},onReturn:e=>returned.push(e)});
 const started=command.startTrainerBattle();
 assert.equal(started.ready,true);assert.equal(kind,'capture-world-trainer');
 assert.equal(prepared,1);assert.equal(installed,true);
 settle({outcome:'flee',creatures:[]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(applied,1);assert.equal(returned.length,1);
 assert.equal(command.status().phase,'idle');assert.equal(installed,false);
 assert.equal(command.dispose(),true);
});


test('trainer author policy and selected World level reach the native ticket without a consumer multiplier',async()=>{
 const {createCaptureWorldLabTrainerTransactionV1}=await import(moduleUrl);
 const f=fixture(),originalSettings=f.options.readBattleSettings;
 const policy=Object.freeze({schema:'capture-trainer-difficulty-policy-v1',version:1,
  levels:[1,2,3,4].map(level=>({level,hpMultiplier:level,outgoingDamagePctBonus:level-1}))});
 let authoredInput;
 f.options.readBattleSettings=()=>({...originalSettings(),trainerDifficultyPolicy:policy});
 f.options.authoredSource={buildEncounter:input=>{
  authoredInput=input;
  return {exported:{schema:'signed-lab-export'},nativeCombatSource:{...source,trainerDifficultyPolicy:policy}};
 }};
 const tx=createCaptureWorldLabTrainerTransactionV1(f.options);
 const ticket=tx.prepareTrainer();
 assert.equal(authoredInput.trainerDifficultyPolicy,policy,
  'the original signed author policy must be passed intact');
 const resolved=ticket.resolveBattle({encounterId:ticket.encounterId,snapshot:ticket.snapshot});
 assert.equal(resolved.trainerDifficulty,3,'the World selects only the authored difficulty level');
 assert.equal(f.saves(),0,'no HP persistence before the Lab outcome');
 assert.equal(f.world().last.trainerDifficulty,3);
});

test('author exports an optional trainer policy unchanged, never invents it for wild battles',async()=>{
 const {createCaptureLabAuthoredSourceV1}=await import(
  '../assets/gensrpg/capture/combat-lab-authored-source-v1.mjs');
 const policy=Object.freeze({schema:'capture-trainer-difficulty-policy-v1',version:1,
  levels:[1,2,3,4].map(level=>({level,hpMultiplier:level,outgoingDamagePctBonus:level-1}))});
 const calls=[];
 const author=createCaptureLabAuthoredSourceV1({
  normalizeCreatureTransfer:value=>value,normalizeSkillDraft:value=>value,
  overlayCombatRules:({creatureDraft})=>creatureDraft,
  exportEditorDrafts:input=>{
   calls.push(input);
   return {battle:input.trainerDifficultyPolicy===undefined?{}:
    {trainerDifficultyPolicy:input.trainerDifficultyPolicy}};
  },
  adaptCombatExport:exported=>({
   trainerDifficultyPolicy:exported.battle.trainerDifficultyPolicy,
   battleFormat:{actors:[
    {actorId:'player',creatureId:'species-p'},
    {actorId:'opponent',creatureId:'species-e'}
   ],localActorId:'player',teamOf:id=>id==='player'?'capture-team':'wild-team'},
   roster:{teams:{
    player:{activeMemberId:'member-p',members:[{creatureId:'species-p'}]},
    opponent:{activeMemberId:'member-e',members:[{creatureId:'species-e'}]}
   }},
   skillIdsByActor:{player:['skill-p'],opponent:['skill-e']},
   fighterConfigs:{'species-p':{maxHp:30},'species-e':{maxHp:40}}
  }),
  statRegistry:{stats:[]},
  configuredSkillDrafts:[{id:'skill-p'},{id:'skill-e'}],
  creatureTransfers:[
   {draft:{id:'species-p',displayName:'Player'},loadout:{slots:[{skillId:'skill-p'}]},statValues:{}},
   {draft:{id:'species-e',displayName:'Enemy'},loadout:{slots:[{skillId:'skill-e'}]},statValues:{}}
  ]
 });
 const base={encounterId:'trainer-policy-test',arenaId:'forest',skillSpeedMultiplier:0.5,
  combatRules:{schema:'signed-combat-rules'},
  player:{instanceId:'member-p',creatureId:'species-p'},
  opponent:{instanceId:'member-e',creatureId:'species-e'}};
 const wild=author.buildEncounter(base);
 assert.equal(Object.hasOwn(calls[0],'trainerDifficultyPolicy'),false);
 assert.equal(Object.hasOwn(wild.nativeCombatSource,'trainerDifficultyPolicy'),true);
 assert.equal(wild.nativeCombatSource.trainerDifficultyPolicy,undefined);
 const trainer=author.buildEncounter({...base,trainerDifficultyPolicy:policy});
 assert.equal(calls[1].trainerDifficultyPolicy,policy);
 assert.equal(trainer.nativeCombatSource.trainerDifficultyPolicy,policy);
});

test('native provider refuses a trainer level without a signed Lab policy',async()=>{
 const {createCaptureNativeLabProviderV1}=await import(
  '../assets/gensrpg/capture/capture-native-lab-provider-v1.mjs');
 const native={...source,
  fighters:[{id:'player',maxHp:150},{id:'opponent',maxHp:120}],
  roster:{teams:{
   player:{activeMemberId:'wolf-1',members:[{creatureId:'crea-loup'}]},
   opponent:{activeMemberId:'trainer:trainer-7',members:[{creatureId:'crea_voltik'}]}
  }}};
 const snapshot={sides:[
  {active:['wolf-1'],creatures:[{instanceId:'wolf-1',creatureId:'crea-loup',hp:113,maxHp:150}]},
  {active:['trainer:trainer-7'],creatures:[{instanceId:'trainer:trainer-7',creatureId:'crea_voltik',hp:120,maxHp:120}]}
 ]};
 const provider=createCaptureNativeLabProviderV1({
  resolveBattle:()=>({actorIds:['player','opponent'],nativeCombatSource:native,
   exported:{schema:'signed-lab-export'},trainerDifficulty:3}),
  mountBattle:()=>{throw Error('must never mount an unsigned trainer');}
 });
 assert.throws(()=>provider.createBattle({snapshot}),/trainer.*policy|policy.*trainer/i);
});
