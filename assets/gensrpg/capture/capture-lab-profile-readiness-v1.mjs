import {createCaptureSavedProfileBattleBridgeV1} from './saved-profile-battle-bridge-v1.mjs';

// Read-only diagnostic for the canonical Capture Hub. The official author
// builds the encounter, and the existing saved-profile bridge decides if it
// can run. A suggestion here is NEVER a migration or permission to write.
// No storage, global handler, Combat instance, fake HP or fallback provider.
export function createCaptureLabProfileReadinessV1({
 activeHeroId,loadHeroState,readWorldState,worldStorageKey,
 authoredSource,readBattleSettings,adaptCombatExport,validateBattleResult
}) {
 for(const [name,fn] of Object.entries({
  activeHeroId,loadHeroState,readWorldState,worldStorageKey,
  readBattleSettings,adaptCombatExport,validateBattleResult
 })) {
  if(typeof fn!=='function')throw new TypeError('Read-only Capture Hub requires '+name);
 }
 if(typeof authoredSource?.buildEncounter!=='function'){
  throw new TypeError('Official authored Combat source required');
 }
 const name=value=>typeof value==='string'?value.trim():'';
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const immutableChanges=changes=>Object.freeze(changes.map(change=>Object.freeze(change)));
 function status(status,reason='',changes=[],official=null){
  return Object.freeze({status,battleReady:status==='ready',canApplyAutomatically:false,
   reason,changes:immutableChanges(changes),official:official?Object.freeze(official):null});
 }
 function inspect(){
  const heroId=name(activeHeroId()),key=name(worldStorageKey()),world=readWorldState();
  const encounter=world?.last;
  if(!key||!heroId)return status('unsupported','Un dresseur et un monde Capture actifs sont requis.');
  if(encounter?.type!=='wild'||!name(encounter.creatureId)){
   return status('no-wild','Aucune rencontre sauvage active dans le monde Capture.');
  }
  const original=JSON.stringify(encounter),location=name(world.locationId);
  const hero=loadHeroState(heroId);
  const members=hero?.creatureTeam,reserves=hero?.creatureReserve;
  if(!Array.isArray(members)||members.length!==1||
     (Array.isArray(reserves)&&reserves.length)){
   return status('unsupported','Le Core officiel raccordé ne supporte pas encore cette équipe ou ses réserves.');
  }
  const member=members[0],creatureId=name(member?.entityId),uid=name(member?.uid);
  if(!creatureId||!uid)return status('unsupported','Identité sauvegardée de la créature absente.');
  // Only a diagnostic token: it is NEVER persisted into World. The real
  // transaction has exclusive ownership of encounter IDs at battle start.
  const encounterId=name(encounter.encounterId)||'capture-readonly-inspection';
  let authored;
  try{
   const config=readBattleSettings();
   if(!config||typeof config!=='object'||Array.isArray(config))throw new TypeError('Configuration auteur absente');
   authored=authoredSource.buildEncounter({
    ...config,encounterId,
    player:{instanceId:uid,creatureId},
    opponent:{instanceId:'wild:'+encounterId,creatureId:name(encounter.creatureId)}
   });
  }catch(error){
   return status('unsupported','Catalogue officiel non compatible : '+String(error?.message||error));
  }
  const source=authored.nativeCombatSource,localId=source?.battleFormat?.localActorId;
  const officialPlayer=source?.fighterConfigs?.[creatureId];
  const officialOpponent=source?.fighterConfigs?.[name(encounter.creatureId)];
  const skills=source?.skillIdsByActor?.[localId];
  if(!officialPlayer||!officialOpponent||!Array.isArray(skills)){
   return status('unsupported','Exporter officiel incomplet pour cette rencontre.');
  }
  const changes=[];
  if(member.maxHp!==officialPlayer.maxHp){
   changes.push({field:'maxHp',saved:member.maxHp??null,official:officialPlayer.maxHp});
  }
  if(!same(member.activeAbilityIds,skills)){
   changes.push({field:'activeAbilityIds',saved:Array.isArray(member.activeAbilityIds)?
    Object.freeze([...member.activeAbilityIds]):null,official:Object.freeze([...skills])});
  }
  const official={player:Object.freeze({creatureId,maxHp:officialPlayer.maxHp,
    abilityIds:Object.freeze([...skills])}),
   opponent:Object.freeze({creatureId:name(encounter.creatureId),maxHp:officialOpponent.maxHp})};
  const stillSame=()=>name(activeHeroId())===heroId && name(worldStorageKey())===key &&
    (()=>{const live=readWorldState();return name(live?.locationId)===location &&
      JSON.stringify(live?.last)===original;})() &&
    same(loadHeroState(heroId),hero);
  let compatible=false,error=null;
  try{
   // The SAME authoritative bridge used by startWildBattle checks HP, team,
   // skills, instance identity and official Combat export. No simulated result.
   const bridge=createCaptureSavedProfileBattleBridgeV1({
    activeHeroId,loadHeroState,
    saveHeroState:()=>{throw new Error('Read-only diagnostic must never save');},
    readEncounter:()=>{
     const live=readWorldState();
     return name(worldStorageKey())===key&&name(live?.locationId)===location&&
       JSON.stringify(live?.last)===original?{...live.last,encounterId}:null;
    },
    exported:authored.exported,adaptCombatExport,validateBattleResult
   });
   bridge.prepareEncounter();
   compatible=true;
  }catch(cause){error=cause;}
  if(!stillSame())return status('stale','Le profil ou la rencontre a changé pendant la vérification.');
  if(compatible)return status('ready','Ce profil peut lancer le combat officiel 1v1.',[],official);
  if(changes.length)return status('review-required',
    'Écart avec les PV/compétences auteur. Une migration explicite est requise ; rien n’a été modifié.',
    changes,official);
  return status('unsupported','Le propriétaire Combat refuse ce profil : '+String(error?.message||error),
   [],official);
 }
 return Object.freeze({inspect});
}
