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
