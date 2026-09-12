function clone(value){return structuredClone(value);}
function makeId(){return globalThis.crypto?.randomUUID?.()||`capture_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function buildSpeciesAliasIndex(canonicalization={}){
  const byAlias={};
  const byCanonical={};
  for(const species of canonicalization.species||[]){
    const canonicalId=String(species.canonicalId);
    byCanonical[canonicalId]=clone(species);
    byAlias[canonicalId]=canonicalId;
    for(const alias of species.legacyAliases||[]) byAlias[String(alias)]=canonicalId;
  }
  return {byAlias,byCanonical};
}

export function canonicalizeSpeciesId(speciesId,canonicalization={}){
  const key=String(speciesId||'');
  if(!key) return {ok:false,reason:'missing-species-id',canonicalId:null};
  const {byAlias,byCanonical}=buildSpeciesAliasIndex(canonicalization);
  const canonicalId=byAlias[key]||null;
  if(!canonicalId||!byCanonical[canonicalId]) return {ok:false,reason:'unknown-species',canonicalId:null,legacySpeciesId:key};
  return {ok:true,canonicalId,legacySpeciesId:key};
}

export function normalizeOwnedCreature(raw={},canonicalization={}){
  const sourceSpeciesId=raw.speciesId||raw.creatureId||raw.entityId||raw.baseId||raw.id;
  const species=canonicalizeSpeciesId(sourceSpeciesId,canonicalization);
  if(!species.ok){
    return {
      status:'quarantine',
      reason:species.reason,
      legacy:clone(raw),
    };
  }
  return {
    status:'ok',
    creature:{
      instanceId:String(raw.instanceId||raw.ownedId||raw.uid||makeId()),
      speciesId:species.canonicalId,
      legacySpeciesId:species.legacySpeciesId,
      nickname:raw.nickname??raw.name??null,
      level:Math.max(1,Number(raw.level??1)||1),
      xp:Math.max(0,Number(raw.xp??0)||0),
      currentHp:raw.currentHp==null?null:Math.max(0,Number(raw.currentHp)||0),
      maxHp:raw.maxHp==null?null:Math.max(0,Number(raw.maxHp)||0),
      abilityCharges:clone(raw.abilityCharges||{}),
      metadata:clone(raw.metadata||{}),
    },
  };
}

export function importLegacyOwnedCreatures(entries=[],canonicalization={}){
  const roster=[];
  const quarantine=[];
  for(const raw of entries||[]){
    const migrated=normalizeOwnedCreature(raw,canonicalization);
    if(migrated.status==='ok') roster.push(migrated.creature);
    else quarantine.push(migrated);
  }
  return {roster,quarantine};
}

export function splitRosterIntoTeamAndReserve(roster=[],{preferredActiveIds=[],teamSize=6}={}){
  const max=Math.max(0,Math.min(6,Number(teamSize)||6));
  const byId=new Map((roster||[]).map(c=>[String(c.instanceId),c]));
  const active=[];
  const used=new Set();
  for(const id of preferredActiveIds||[]){
    const key=String(id);
    const creature=byId.get(key);
    if(!creature||used.has(key)||active.length>=max) continue;
    active.push(clone(creature)); used.add(key);
  }
  for(const creature of roster||[]){
    const key=String(creature.instanceId);
    if(used.has(key)||active.length>=max) continue;
    active.push(clone(creature)); used.add(key);
  }
  const reserve=(roster||[]).filter(c=>!used.has(String(c.instanceId))).map(clone);
  return {activeTeam:active,reserve};
}

export function moveOwnedCreature({activeTeam=[],reserve=[]}={},instanceId,destination){
  const id=String(instanceId);
  const all=[...(activeTeam||[]),...(reserve||[])];
  const creature=all.find(c=>String(c.instanceId)===id);
  if(!creature) return {ok:false,reason:'creature-not-owned',activeTeam,reserve};
  const nextActive=(activeTeam||[]).filter(c=>String(c.instanceId)!==id).map(clone);
  const nextReserve=(reserve||[]).filter(c=>String(c.instanceId)!==id).map(clone);
  if(destination==='active'){
    if(nextActive.length>=6) return {ok:false,reason:'capture-active-team-limit',activeTeam,reserve};
    nextActive.push(clone(creature));
  }else if(destination==='reserve') nextReserve.push(clone(creature));
  else return {ok:false,reason:'invalid-destination',activeTeam,reserve};
  return {ok:true,activeTeam:nextActive,reserve:nextReserve};
}
