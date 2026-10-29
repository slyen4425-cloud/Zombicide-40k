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
 function buildEncounter({encounterId,player,opponent,playerTeam,opponentTeam,arenaId,skillSpeedMultiplier,combatRules}={}){
  const eid=required(encounterId,'encounterId');
  const arena=required(arenaId,'arenaId');
  if(typeof skillSpeedMultiplier!=='number'||!Number.isFinite(skillSpeedMultiplier)||skillSpeedMultiplier<=0){
   throw new RangeError('skillSpeedMultiplier must be positive');
  }
  if(combatRules==null)throw new TypeError('Explicit authored combatRules required');

  // Existing 1v1 caller remains unchanged. Team mode is an explicit, mutually
  // exclusive Capture author input; it is never inferred from the saved roster.
  const teamMode=playerTeam!==undefined||opponentTeam!==undefined;
  if(teamMode&&(player!==undefined||opponent!==undefined)){
   throw new TypeError('Ambiguous 1v1 actor and 2v2 team inputs are exclusive');
  }
  if(teamMode&&(!Array.isArray(playerTeam)||!Array.isArray(opponentTeam)||
    playerTeam.length!==2||opponentTeam.length!==2)){
   throw new RangeError('Native 2v2 requires exactly two active slots per team');
  }
  const playerMembers=teamMode?playerTeam:[player];
  const opponentMembers=teamMode?opponentTeam:[opponent];
  const declared=[
   {actorId:'player',member:playerMembers[0],controllerId:'human-local',teamId:'capture-team'},
   ...(teamMode?[{actorId:'ally',member:playerMembers[1],controllerId:'ai-ally',teamId:'capture-team'}]:[]),
   {actorId:'opponent',member:opponentMembers[0],controllerId:'ai-enemy',teamId:'wild-team'},
   ...(teamMode?[{actorId:'opponent-b',member:opponentMembers[1],controllerId:'ai-enemy-b',teamId:'wild-team'}]:[])
  ].map(({actorId,member,controllerId,teamId})=>{
   if(teamMode&&(!member||typeof member!=='object'||Array.isArray(member)||
       Object.keys(member).some(key=>key!=='instanceId'&&key!=='creatureId'))){
    throw new TypeError('2v2 author slot supports only creatureId and instanceId; reserve data is unsupported');
   }
   const creatureId=required(member?.creatureId,actorId+' creatureId');
   const instanceId=required(member?.instanceId,actorId+' instanceId');
   return {actorId,creatureId,instanceId,controllerId,teamId,transfer:selected(creatureId)};
  });
  if(new Set(declared.map(row=>row.instanceId)).size!==declared.length){
   throw new RangeError('duplicate encounter instance IDs');
  }

  // One canonical transfer per species, even when two active slots share a
  // species; the Lab exporter owns all skill, stats and fighter projections.
  const participants=[...new Map(declared.map(row=>[row.creatureId,row.transfer])).values()];
  const drafts=participants.map(t=>overlayCombatRules({creatureDraft:t.draft,combatRules}));
  const requiredSkillIds=[...new Set(participants.flatMap(t=>t.loadout.slots.map(slot=>slot.skillId)
   .filter(id=>id!==null)))];
  const skillDrafts=requiredSkillIds.map(id=>{
   const draft=skillById.get(id);
   if(!draft)throw new RangeError('Unknown authored Combat skill in loadout: '+id);
   return draft;
  });
  const slot=entry=>({
   actorId:entry.actorId,creatureId:entry.creatureId,
   displayName:entry.transfer.draft.displayName,controllerId:entry.controllerId,
   roster:{activeMemberId:entry.instanceId,members:[{
    id:entry.instanceId,creatureId:entry.creatureId,displayName:entry.transfer.draft.displayName
   }]}
  });
  const setup={
   schema:'capture-battle-setup-editor-draft-v1',
   id:eid,localActorId:'player',arenaId:arena,skillSpeedMultiplier,
   teams:[
    {id:'capture-team',slots:declared.filter(x=>x.teamId==='capture-team').map(slot)},
    {id:'wild-team',slots:declared.filter(x=>x.teamId==='wild-team').map(slot)}
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
  if(actors.length!==declared.length||nativeCombatSource.battleFormat.localActorId!=='player'){
   throw new TypeError('Official Combat Lab export does not match the Capture encounter actors');
  }
  for(const {actorId,creatureId,instanceId,teamId,transfer} of declared){
   const roster=nativeCombatSource.roster?.teams?.[actorId];
   const actor=actors.find(a=>a.actorId===actorId);
   const actual=nativeCombatSource.skillIdsByActor?.[actorId];
   const expected=transfer.loadout.slots.map(s=>s.skillId).filter(id=>id!==null);
   if(!actor||actor.creatureId!==creatureId||
      nativeCombatSource.battleFormat.teamOf(actorId)!==teamId||
      !roster||roster.activeMemberId!==instanceId||roster.members.length!==1||
      roster.members[0].creatureId!==creatureId||!same(actual,expected)||
      !nativeCombatSource.fighterConfigs[creatureId]){
    throw new TypeError('Official Combat Lab authored loadout/roster projection drift');
   }
  }
  const actorIds=declared.map(x=>x.actorId);
  return Object.freeze({
   exported,nativeCombatSource,
   actorIds:Object.freeze(actorIds),
   encounterId:eid,
   instanceIds:Object.freeze(Object.fromEntries(declared.map(x=>[x.actorId,x.instanceId])))
  });
 }
 return Object.freeze({buildEncounter});
}
