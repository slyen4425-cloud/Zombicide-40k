// Capture-owned assembly of a battle request. Authoritative combat data,
// validation, timing and export remain entirely in the pinned Combat Lab.
// Creature/skill transfers and rules are injected from its validated catalog.
// No storage, DOM, producer paths, guessing, cached duplicate rules or fallback.
export function createCaptureLabAuthoredSourceV1({
 normalizeCreatureTransfer, normalizeSkillDraft, overlayCombatRules,
 exportEditorDrafts, adaptCombatExport,
 statRegistry, configuredSkillDrafts, creatureTransfers
}) {
 const callable={normalizeCreatureTransfer,normalizeSkillDraft,overlayCombatRules,
   exportEditorDrafts,adaptCombatExport};
 for(const [name,fn] of Object.entries(callable)){
  if(typeof fn!=='function')throw new TypeError('Official Combat Lab contract missing '+name);
 }
 if(!statRegistry||typeof statRegistry!=='object')throw new TypeError('Official stat registry required');
 if(!Array.isArray(configuredSkillDrafts)||!Array.isArray(creatureTransfers)){
  throw new TypeError('Official authored skill and creature catalogs required');
 }
 const required=(value,field)=>{
  if(typeof value!=='string'||!value.trim())throw new TypeError(field+' required');
  return value.trim();
 };
 const creatureById=new Map();
 for(const source of creatureTransfers){
  const t=normalizeCreatureTransfer(source,statRegistry);
  const id=required(t.draft.id,'creature id');
  if(creatureById.has(id))throw new RangeError('duplicate official creature transfer: '+id);
  if(!t.loadout||!t.statValues)throw new TypeError('Authored creature transfer is incomplete: '+id);
  creatureById.set(id,t);
 }
 const skillById=new Map();
 for(const raw of configuredSkillDrafts){
  const draft=normalizeSkillDraft(raw),id=required(draft.id,'skill id');
  if(skillById.has(id))throw new RangeError('duplicate configured skill draft: '+id);
  skillById.set(id,draft);
 }
 const same=(a,b)=>a?.length===b?.length && Array.isArray(a) && Array.isArray(b) &&
   a.every((value,i)=>value===b[i]);
 const selected=(id)=>{
  const transfer=creatureById.get(id);
  if(!transfer)throw new RangeError('unknown official authored Capture creature: '+id);
  return transfer;
 };
 function buildEncounter({encounterId,player,opponent,arenaId,skillSpeedMultiplier,combatRules}={}){
  const eid=required(encounterId,'encounterId');
  const arena=required(arenaId,'arenaId');
  if(typeof skillSpeedMultiplier!=='number'||!Number.isFinite(skillSpeedMultiplier)||skillSpeedMultiplier<=0){
   throw new RangeError('skillSpeedMultiplier must be positive');
  }
  if(combatRules==null)throw new TypeError('Explicit authored combatRules required');
  const playerId=required(player?.creatureId,'player creatureId');
  const opponentId=required(opponent?.creatureId,'opponent creatureId');
  const playerInstance=required(player?.instanceId,'player instanceId');
  const opponentInstance=required(opponent?.instanceId,'opponent instanceId');
  if(playerInstance===opponentInstance)throw new RangeError('duplicate encounter instance IDs');
  const playerTransfer=selected(playerId),opponentTransfer=selected(opponentId);
  const byId=new Map([[playerId,playerTransfer],[opponentId,opponentTransfer]]);
  const participants=[...byId.values()];
  const drafts=participants.map(t=>overlayCombatRules({
   creatureDraft:t.draft,combatRules
  }));
  const requiredSkillIds=[...new Set(participants.flatMap(t=>t.loadout.slots.map(slot=>slot.skillId)
   .filter(id=>id!==null)))];
  const skillDrafts=requiredSkillIds.map(id=>{
   const draft=skillById.get(id);
   if(!draft)throw new RangeError('Unknown authored Combat skill in loadout: '+id);
   return draft;
  });
  const setup={
   schema:'capture-battle-setup-editor-draft-v1',
   id:eid,localActorId:'player',arenaId:arena,skillSpeedMultiplier,
   teams:[
    {id:'capture-team',slots:[{actorId:'player',creatureId:playerId,
      displayName:playerTransfer.draft.displayName,controllerId:'human-local',
      roster:{activeMemberId:playerInstance,members:[{
       id:playerInstance,creatureId:playerId,displayName:playerTransfer.draft.displayName
      }]}}]},
    {id:'wild-team',slots:[{actorId:'opponent',creatureId:opponentId,
      displayName:opponentTransfer.draft.displayName,controllerId:'ai-enemy',
      roster:{activeMemberId:opponentInstance,members:[{
       id:opponentInstance,creatureId:opponentId,displayName:opponentTransfer.draft.displayName
      }]}}]}
   ]
  };
  const exported=exportEditorDrafts({
   battleSetup:setup,creatureDrafts:drafts,skillDrafts,
   loadouts:participants.map(t=>t.loadout),
   statRegistry,statValues:participants.map(t=>t.statValues),
   metadata:{producer:'GenSrpg-Capture-consumer',encounterId:eid}
  });
  const nativeCombatSource=adaptCombatExport(exported);
  const actors=nativeCombatSource.battleFormat.actors;
  if(actors.length!==2||nativeCombatSource.battleFormat.localActorId!=='player'||
     !actors.some(a=>a.actorId==='player'&&a.creatureId===playerId)||
     !actors.some(a=>a.actorId==='opponent'&&a.creatureId===opponentId)){
   throw new TypeError('Official Combat Lab export does not match the Capture encounter actors');
  }
  for(const [actorId,creatureId,instanceId] of [
   ['player',playerId,playerInstance],['opponent',opponentId,opponentInstance]
  ]){
   const roster=nativeCombatSource.roster?.teams?.[actorId];
   const actual=nativeCombatSource.skillIdsByActor[actorId];
   const expected=byId.get(creatureId).loadout.slots
      .map(slot=>slot.skillId).filter(id=>id!==null);
   if(!roster||roster.activeMemberId!==instanceId||roster.members.length!==1||
      roster.members[0].creatureId!==creatureId||!same(actual,expected)||
      !nativeCombatSource.fighterConfigs[creatureId]){
    throw new TypeError('Official Combat Lab authored loadout/roster projection drift');
   }
  }
  return Object.freeze({
   exported,nativeCombatSource,
   actorIds:Object.freeze(['player','opponent']),
   encounterId:eid,
   instanceIds:Object.freeze({player:playerInstance,opponent:opponentInstance})
  });
 }
 return Object.freeze({buildEncounter});
}
