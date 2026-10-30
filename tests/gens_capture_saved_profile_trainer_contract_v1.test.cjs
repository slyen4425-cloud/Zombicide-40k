'use strict';
// Contract TDD for the *existing* Capture saved-profile owner. This does not
// simulate a Combat Lab victory: unit fixtures only verify transactional I/O.
// A separate real-browser/author-export test is required for product GREEN.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs')).href;
const native={
 battleFormat:{
  actors:[{actorId:'local',creatureId:'crea-loup',displayName:'Joueur'},
          {actorId:'opponent',creatureId:'crea_voltik',displayName:'Voltige'}],
  localActorId:'local',teamOf:id=>id==='local'?'ally':'enemy'
 },
 fighterConfigs:{'crea-loup':{maxHp:150},crea_voltik:{maxHp:120}},
 skillIdsByActor:{local:['claw'],opponent:['zap']},
 skills:{claw:{},zap:{}}
};
function fixture(overrides={}){
 const original={type:'hostile_trainer',encounterId:'enc-42',trainerId:'npc-4',
  trainerName:'Dresseur confirmé',trainerDifficulty:3,
  creatureIds:['crea_voltik'],captureAllowed:false};
 let event={...original,...overrides},hero={
  creatureTeam:[{uid:'hero-wolf',entityId:'crea-loup',hp:113,maxHp:150,
   activeAbilityIds:['claw'],knownAbilityIds:['claw'],xp:77}],
  creatureReserve:[],gold:94,inventory:[{itemId:'potion',qty:2}],
  custom:'saved-profile-intact'
 };
 let writes=0;
 return {
  event:()=>event,setEvent:x=>{event=x},
  hero:()=>hero,setHero:x=>{hero=x},writes:()=>writes,
  config:{
   encounterKind:'trainer',activeHeroId:()=> 'hero-1',
   loadHeroState:()=>hero,saveHeroState:(_,next)=>{writes++;hero=next},
   readEncounter:()=>event,exported:{schema:'official-export'},
   adaptCombatExport:()=>native,
   validateBattleResult:(raw,snapshot)=>{
    assert.equal(snapshot.sides.length,2);
    return raw;
   }
  }
 };
}
test('real trainer kind is distinct from wild and preserves authored identities, difficulty and HP owner',async()=>{
 const {createCaptureSavedProfileBattleBridgeV1}=await import(url);
 const f=fixture(),before=structuredClone(f.hero());
 const ticket=createCaptureSavedProfileBattleBridgeV1(f.config).prepareEncounter();
 assert.equal(ticket.encounterId,'enc-42');
 assert.equal(ticket.snapshot.sides[1].name,'Dresseur confirmé');
 assert.equal(ticket.snapshot.sides[1].creatures[0].instanceId,'trainer:enc-42');
 assert.equal(ticket.snapshot.sides[1].creatures[0].creatureId,'crea_voltik');
 assert.equal(ticket.snapshot.sides[0].creatures[0].hp,113);
 assert.equal(f.writes(),0);
 assert.equal(ticket.resolveBattle({encounterId:ticket.encounterId,snapshot:ticket.snapshot}).nativeCombatSource,native);
 const applied=ticket.applyResult({outcome:'flee',creatures:[
  {instanceId:'hero-wolf',hp:61},{instanceId:'trainer:enc-42',hp:45}
 ]});
 assert.equal(applied.outcome,'flee');
 assert.equal(f.writes(),1);
 assert.equal(f.hero().creatureTeam[0].hp,61);
 assert.equal(f.hero().creatureTeam[0].xp,before.creatureTeam[0].xp);
 assert.deepEqual(f.hero().inventory,before.inventory);
 assert.equal(f.hero().gold,before.gold);
 assert.equal(f.hero().custom,before.custom);
 assert.equal(ticket.applyResult({outcome:'flee',creatures:[]}),false);
 assert.equal(f.writes(),1);
 assert.deepEqual(f.event(),fixture().event());
});
test('trainer must have signed opponent identity and immutable difficulty/type',async()=>{
 const {createCaptureSavedProfileBattleBridgeV1}=await import(url);
 for(const patch of [
  {type:'wild'},{type:'trainer'},{trainerId:''},
  {trainerDifficulty:0},{trainerDifficulty:5},
  {creatureIds:['crea_son_1']},{creatureIds:[]},
  {captureAllowed:true}
 ]){
  const f=fixture(patch);
  assert.throws(()=>createCaptureSavedProfileBattleBridgeV1(f.config).prepareEncounter(),
   /trainer|opponent|species|difficulty|capture|creature/i,
   'Must reject '+JSON.stringify(patch));
  assert.equal(f.writes(),0);
 }
});
test('changed trainer, profile or reserve rejects result before any save',async()=>{
 const {createCaptureSavedProfileBattleBridgeV1}=await import(url);
 for(const mutate of [
  f=>f.setEvent({...f.event(),trainerDifficulty:4}),
  f=>f.setEvent({...f.event(),trainerId:'another-npc'}),
  f=>f.setEvent({...f.event(),creatureIds:['crea-loup']}),
  f=>f.setHero({...f.hero(),creatureReserve:[{uid:'other',entityId:'crea_voltik',hp:5,maxHp:120}]}),
  f=>f.setHero({...f.hero(),creatureTeam:[{...f.hero().creatureTeam[0],hp:12}]})
 ]){
  const f=fixture(),ticket=createCaptureSavedProfileBattleBridgeV1(f.config).prepareEncounter();
  mutate(f);
  assert.throws(()=>ticket.applyResult({outcome:'flee',creatures:[
   {instanceId:'hero-wolf',hp:61},{instanceId:'trainer:enc-42',hp:45}
  ]}),/stale|changed|trainer|profile|reserve|species/i);
  assert.equal(f.writes(),0);
 }
});
test('wild contract remains the default; trainer event cannot be disguised as wild',async()=>{
 const {createCaptureSavedProfileBattleBridgeV1}=await import(url);
 const f=fixture();
 const defaultBridge=createCaptureSavedProfileBattleBridgeV1({...f.config,encounterKind:undefined});
 assert.throws(()=>defaultBridge.prepareEncounter(),/wild/i);
 assert.equal(f.writes(),0);
});
