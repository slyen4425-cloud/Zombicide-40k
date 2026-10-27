import {createCaptureSavedProfileBattleBridgeV1} from './saved-profile-battle-bridge-v1.mjs';

// Pure opt-in Capture port. No independent world storage, gameplay clock,
// outcome rules, UI or legacy global overrides. All state I/O is delegated to
// the actual Capture owners. The Lab V3 exporter and Combat Core stay official.
// The existing world owner creates the "wild" event and alone writes its state;
// this port stamps the missing encounter identity via that owner's save API.
export function createCaptureWorldLabWildTransactionV1({
 activeHeroId,loadHeroState,saveHeroState,
 readWorldState,saveWorldState,consumeWildEncounter,worldStorageKey,
 nextEncounterId,authoredSource,readBattleSettings,
 adaptCombatExport,validateBattleResult
}) {
 for(const [key,fn] of Object.entries({
  activeHeroId,loadHeroState,saveHeroState,
  readWorldState,saveWorldState,consumeWildEncounter,worldStorageKey,
  nextEncounterId,readBattleSettings,adaptCombatExport,validateBattleResult
 })) {
  if(typeof fn!=='function')throw new TypeError('Capture owner requires '+key);
 }
 if(typeof authoredSource?.buildEncounter!=='function') {
  throw new TypeError('Official authored Combat Lab source required');
 }
 const name=value=>typeof value==='string'?value.trim():'';
 const encounterKey=value=>{
  const id=name(value);
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id)){
   throw new TypeError('Capture World encounter identity must be a stable opaque token');
  }
  return id;
 };
 const worldIdentity=(world,last)=>{
  return name(world?.locationId)+'|'+JSON.stringify(last);
 };
 let pending=null;

 function prepareWild(creatureId){
  if(pending)throw new Error('Capture wild encounter already pending');
  const key=name(worldStorageKey());
  if(!key)throw new TypeError('Capture World owner storage key is required');
  const requested=name(creatureId),world=readWorldState(),last=world?.last;
  if(!requested||last?.type!=='wild'||name(last.creatureId)!==requested){
   throw new TypeError('Capture World has no matching live wild encounter');
  }
  const originalIdentity=worldIdentity(world,last);
  const encounterId=encounterKey(last.encounterId||nextEncounterId());
  const heroId=name(activeHeroId()),saved=heroId?loadHeroState(heroId):null;
  const player=saved?.creatureTeam?.[0];
  const config=readBattleSettings();
  if(!heroId||!name(player?.uid)||!name(player?.entityId)){
   throw new TypeError('Capture saved local creature and trainer identity required');
  }
  if(!config||typeof config!=='object'||Array.isArray(config)) {
   throw new TypeError('Explicit Capture battle configuration required');
  }
  const authored=authoredSource.buildEncounter({
   ...config,encounterId,
   player:{instanceId:name(player.uid),creatureId:name(player.entityId)},
   opponent:{instanceId:'wild:'+encounterId,creatureId:requested}
  });
  let identityCommitted=!!name(last.encounterId);
  const readEncounter=()=>{
   if(name(worldStorageKey())!==key)return null;
   const live=readWorldState();
   const encounter=live?.last;
   if(!identityCommitted && encounter?.type==='wild' &&
      worldIdentity(live,encounter)===originalIdentity){
    return {...encounter,encounterId};
   }
   return encounter;
  };
  // The saved-profile bridge performs all the strict checks (historical HP,
  // authored loadout, selected hero, team/reserve and source integrity) before
  // the World owner even receives a write request.
  const bridge=createCaptureSavedProfileBattleBridgeV1({
   activeHeroId,loadHeroState,saveHeroState,readEncounter,
   exported:authored.exported,adaptCombatExport,validateBattleResult
  });
  const ticket=bridge.prepareEncounter();
  const latest=readWorldState();
  if(name(worldStorageKey())!==key||worldIdentity(latest,latest?.last)!==originalIdentity){
   throw new Error('Stale Capture world: wild encounter changed during preparation');
  }
  if(!identityCommitted){
   // Synchronous, only through the existing Capture World owner. A stamped
   // legacy encounter survives reload; no external independent ID store.
   saveWorldState({...latest,last:{...latest.last,encounterId}});
   identityCommitted=true;
  }
  const live=readWorldState();
  if(name(worldStorageKey())!==key||live?.last?.type!=='wild'||name(live.last.creatureId)!==requested ||
     live.last.encounterId!==encounterId ||
     name(live.locationId)!==name(world.locationId)){
   throw new Error('Capture World did not commit the original wild identity');
  }
  const entry={encounterId,requested,ticket,persisted:null,rawResult:null};
  pending=entry;
  const liveTicket=Object.freeze({
   encounterId,snapshot:ticket.snapshot,
   resolveBattle(context){
    if(pending!==entry)throw new Error('Capture encounter closed; no Combat resolution authority');
    return ticket.resolveBattle(context);
   },
   applyResult(rawResult){
    if(pending!==entry)return false;
    // A result is allowed only when the original saved owner verified the
    // actual hero + world identity; never trust an outcome from the view.
    if(entry.persisted===null){
     const applied=ticket.applyResult(rawResult);
     if(!applied){
      pending=null;return false; // validated cancellation, no world consume
     }
     entry.persisted=applied;
     entry.rawResult=JSON.stringify(rawResult);
    }else if(entry.rawResult!==JSON.stringify(rawResult)){
     throw new Error('A settled Capture battle cannot change its result during World commit retry');
    }
    const state=readWorldState();
    if(name(worldStorageKey())!==key||state?.last?.type!=='wild'||state.last.encounterId!==encounterId||
       state.last.creatureId!==requested ||
       name(state.locationId)!==name(world.locationId)){
      throw new Error('Stale Capture World during result commit: refusing to consume another encounter');
    }
    // Only the original World owner can turn wild into resolved, refresh UI
    // and preserve the day, profile and creator-specific location.
    try{
     consumeWildEncounter(entry.persisted.outcome==='victory'?'victory':'battle');
    }catch(error){
     // An owner can commit storage successfully and then fail during UI render.
     // Never mask its error, but release this port if the World was consumed.
     const afterError=readWorldState();
     if(name(worldStorageKey())===key && afterError?.last?.type==='resolved')pending=null;
     throw error;
    }
    const resolved=readWorldState();
    if(name(worldStorageKey())!==key||resolved?.last?.type!=='resolved'){
     throw new Error('Capture World owner did not consume the resolved wild encounter');
    }
    pending=null;
    return Object.freeze({...entry.persisted,worldResolved:true});
   },
   cancel(){
    if(pending!==entry||entry.persisted!==null)return false;
    pending=null;
    return true;
   }
  });
  return liveTicket;
 }
 function status(){
  return Object.freeze({pending:!!pending,encounterId:pending?.encounterId??null});
 }
 return Object.freeze({prepareWild,status});
}
