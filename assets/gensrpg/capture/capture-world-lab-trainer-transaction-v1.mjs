import {createCaptureSavedProfileBattleBridgeV1} from './saved-profile-battle-bridge-v1.mjs';

// Canonical *Capture World* NPC transaction. The World produces a real trainer
// declaration and owns its consumption; the signed Lab author owns all stats,
// actors, rules, AI and skills; the original saved-profile owner alone writes
// player HP. No second CombatSession, storage owner, adapter or legacy engine.
// This port does not invent opponent IDs, trainer levels, drops or XP.
export function createCaptureWorldLabTrainerTransactionV1({
 activeHeroId,loadHeroState,saveHeroState,readWorldState,saveWorldState,
 consumeTrainerEncounter,worldStorageKey,nextEncounterId,authoredSource,
 readBattleSettings,adaptCombatExport,validateBattleResult
}) {
 const functions={activeHeroId,loadHeroState,saveHeroState,readWorldState,
  saveWorldState,consumeTrainerEncounter,worldStorageKey,nextEncounterId,
  readBattleSettings,adaptCombatExport,validateBattleResult};
 for(const [name,fn] of Object.entries(functions)){
  if(typeof fn!=='function')throw new TypeError('Capture trainer World owner missing '+name);
 }
 if(typeof authoredSource?.buildEncounter!=='function'){
  throw new TypeError('Signed Combat Lab author is required for trainer encounters');
 }
 const name=value=>typeof value==='string'?value.trim():'';
 const eventId=id=>{
  const value=name(id);
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)){
   throw new TypeError('Canonical trainer encounter ID must be a stable opaque token');
  }
  return value;
 };
 const serial=value=>JSON.stringify(value);
 const fingerprint=(world)=>serial({locationId:world?.locationId,last:world?.last});
 const kind=event=>['friendly_trainer','hostile_trainer'].includes(event?.type);
 function validateWorld(world){
  const e=world?.last;
  if(!kind(e)||!name(e.trainerId)||!name(e.trainerName)||
     !Number.isInteger(e.trainerDifficulty)||e.trainerDifficulty<1||
     e.trainerDifficulty>4||e.captureAllowed!==false||
     !Array.isArray(e.creatureIds)||![1,2].includes(e.creatureIds.length)||
     e.creatureIds.some(id=>!name(id)||name(id)!==id)){
   throw new TypeError('Capture World requires an explicitly declared trainer NPC, difficulty, signed species and no capture');
  }
  return e;
 }
 let pending=null;
 function prepareTrainer(){
  if(pending)throw new Error('Capture trainer encounter already pending');
  const key=name(worldStorageKey()),world=readWorldState();
  if(!key||!world||typeof world!=='object')throw new TypeError('Active Capture World identity required');
  const e=validateWorld(world);
  const initialFingerprint=fingerprint(world);
  const id=eventId(e.encounterId||nextEncounterId());
  const originalStamped=!!name(e.encounterId);
  const declared={...e,encounterId:id};
  const heroId=name(activeHeroId()),saved=heroId?loadHeroState(heroId):null;
  const team=saved?.creatureTeam;
  if(!heroId||!Array.isArray(team)||team.length!==e.creatureIds.length||
     team.some(member=>!name(member?.uid)||!name(member?.entityId))){
   throw new TypeError('Trainer requires a persisted Capture trainer and matching active team');
  }
  const config=readBattleSettings();
  if(!config||typeof config!=='object'||Array.isArray(config)){
   throw new TypeError('Explicit Combat Lab battle settings required for trainer');
  }
  const players=team.map(member=>({instanceId:member.uid,creatureId:member.entityId}));
  const rivals=e.creatureIds.map((creatureId,i)=>({
   instanceId:'trainer:'+id+(i?':'+(i+1):''),creatureId
  }));
  const authored=authoredSource.buildEncounter({
   ...config,encounterId:id,
   ...(players.length===1?{player:players[0],opponent:rivals[0]}:
      {playerTeam:players,opponentTeam:rivals})
  });
  // Prepare the authoritative profile bridge without changing the World.
  // A virtual stamped event exists only inside this one preparation operation.
  // No fake wild event and no write before Lab validation succeeds.
  let identityCommitted=originalStamped;
  const readEncounter=()=>{
   if(name(worldStorageKey())!==key)return null;
   const now=readWorldState();
   if(!identityCommitted&&fingerprint(now)===initialFingerprint){
    return {...now.last,encounterId:id};
   }
   return now?.last;
  };
  const bridge=createCaptureSavedProfileBattleBridgeV1({
   activeHeroId,loadHeroState,saveHeroState,readEncounter,
   exported:authored.exported,adaptCombatExport,validateBattleResult,
   encounterKind:'trainer'
  });
  const ticket=bridge.prepareEncounter();
  const unchanged=readWorldState();
  if(name(worldStorageKey())!==key||fingerprint(unchanged)!==initialFingerprint){
   throw new Error('Stale Capture trainer World changed while preparing Lab battle');
  }
  if(!identityCommitted){
   saveWorldState({...unchanged,last:declared});
   identityCommitted=true;
  }
  const verified=readWorldState(),expected=fingerprint({...world,last:declared});
  if(name(worldStorageKey())!==key||fingerprint(verified)!==expected){
   throw new Error('Capture World owner failed to persist the trainer encounter identity');
  }
  const record={id,key,expected,ticket,persisted:null,rawResult:null};
  pending=record;
  return Object.freeze({
   encounterId:id,snapshot:ticket.snapshot,
   resolveBattle(context){
    if(pending!==record)throw new Error('Trainer Lab resolution is no longer active');
    return ticket.resolveBattle(context);
   },
   applyResult(rawResult){
    if(pending!==record)return false;
    if(record.persisted===null){
     if(name(worldStorageKey())!==key||
        fingerprint(readWorldState())!==expected){
      throw new Error('Stale Capture trainer World changed before battle result');
     }
     const result=ticket.applyResult(rawResult);
     if(!result){
      pending=null;return false;
     }
     record.persisted=result;
     record.rawResult=serial(rawResult);
    }else if(record.rawResult!==serial(rawResult)){
     throw new Error('Trainer result retry cannot replace a persisted Combat Lab outcome');
    }
    if(name(worldStorageKey())!==key||
       fingerprint(readWorldState())!==expected){
     throw new Error('Stale trainer World changed during result commit');
    }
    try{
     consumeTrainerEncounter(record.persisted.outcome);
    }catch(error){
     const current=readWorldState();
     if(name(worldStorageKey())===key&&current?.last?.type==='resolved'){
      pending=null;
     }
     throw error;
    }
    const final=readWorldState();
    if(name(worldStorageKey())!==key||final?.last?.type!=='resolved'){
     throw new Error('Capture World owner did not consume completed trainer battle');
    }
    pending=null;
    return Object.freeze({...record.persisted,worldResolved:true});
   },
   cancel(){
    if(pending!==record||record.persisted!==null)return false;
    pending=null;return true;
   }
  });
 }
 return Object.freeze({
  prepareTrainer,
  status:()=>Object.freeze({pending:!!pending,encounterId:pending?.id??null})
 });
}
