// Capture-owned, opt-in migration of a saved 1v1 creature to the exact
// official authored Combat Lab definition. The existing roster owner is
// the sole writer: this module has no storage, UI, gameplay or global hooks.
// Never run this from loading, from combat start, or without user consent.
export function createCaptureSavedProfileLabMigrationV1({
 activeHeroId, loadHeroState, saveHeroState, readEncounter, worldStorageKey,
 authoredSource, readBattleSettings, combatSha
}) {
 for (const [name,fn] of Object.entries({
  activeHeroId,loadHeroState,saveHeroState,readEncounter,worldStorageKey,readBattleSettings
 })) {
  if (typeof fn !== 'function') throw new TypeError('Capture migration needs '+name+' owner');
 }
 if (typeof authoredSource?.buildEncounter !== 'function') {
  throw new TypeError('Official Combat Lab authored source is required');
 }
 if (typeof combatSha !== 'string' || !/^[a-f0-9]{40}$/.test(combatSha)) {
  throw new TypeError('Immutable official Combat Lab version is required');
 }

 const schema='gensrpg-capture-lab-profile-migration-v1',version=1;
 const plans=new WeakMap();
 const text=value=>typeof value==='string'?value.trim():'';
 function selectedWorldKey(){
  const key=text(worldStorageKey());
  if(!key)throw new TypeError('Active Capture World storage key required for migration');
  return key;
 }
 const clone=value=>JSON.parse(JSON.stringify(value));
 const encode=value=>JSON.stringify(value);
 const identical=(a,b)=>encode(a)===encode(b);
 const sameArray=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
  a.length===b.length&&a.every((value,i)=>value===b[i]);
 function owner() {
  const heroId=text(activeHeroId());
  if (!heroId) throw new TypeError('Active Capture trainer required');
  const hero=loadHeroState(heroId);
  if (!hero || typeof hero!=='object'||Array.isArray(hero)) {
   throw new TypeError('Persisted Capture trainer profile required');
  }
  return {heroId,hero};
 }
 function encounter() {
  const current=readEncounter();
  if (current?.type!=='wild'||!text(current.creatureId)) {
   throw new TypeError('Saved Capture wild encounter is required for migration');
  }
  return current;
 }
 function consentLine(before,after) {
  return 'Je confirme la migration de '+before.entityId+' : PV '+
   before.hp+'/'+before.maxHp+' vers '+after.hp+'/'+after.maxHp+
   ', compétences actives ['+before.activeAbilityIds.join(', ')+'] vers ['+
   after.activeAbilityIds.join(', ')+'], avec sauvegarde de retour.';
 }
 function validateMember(hero) {
  if (hero.creatureTeam?.length!==1 || (hero.creatureReserve?.length??0)!==0) {
   throw new TypeError('Migration supports exactly one Capture team member and no reserve (1v1)');
  }
  const member=hero.creatureTeam[0];
  if (!text(member?.uid)||!text(member?.entityId)) {
   throw new TypeError('Saved Capture creature and instance identities are required');
  }
  if (!Number.isInteger(member.maxHp)||member.maxHp<=0||
      !Number.isInteger(member.hp)||member.hp<0||member.hp>member.maxHp) {
   throw new TypeError('Saved Capture HP/maxHp are invalid; no guessing permitted');
  }
  if (member.hp===0) {
   throw new TypeError('KO creature cannot be migrated into an active Combat 1v1');
  }
  if ((member.activeAbilityIds!=null&&!Array.isArray(member.activeAbilityIds))||
      (member.knownAbilityIds!=null&&!Array.isArray(member.knownAbilityIds))) {
   throw new TypeError('Historical Capture ability lists must be arrays; no inferred conversion');
  }
  if (member.statAlloc!=null && (typeof member.statAlloc!=='object'||Array.isArray(member.statAlloc))) {
   throw new TypeError('Invalid custom Capture stat allocation format');
  }
  if (Object.values(member.statAlloc??{}).some(value=>!Number.isFinite(Number(value))||Number(value)!==0)||
      (Array.isArray(member.talents)&&member.talents.length>0)) {
   throw new TypeError('Allocated custom stats or talents are unsupported by this Combat migration');
  }
  return member;
 }
 function official(member,wild) {
  const configured=readBattleSettings();
  if (!configured || typeof configured!=='object' || Array.isArray(configured)) {
   throw new TypeError('Explicit official authored Combat rules are required');
  }
  const instance='capture-migration-wild'+(member.uid==='capture-migration-wild'?'2':'');
  const authored=authoredSource.buildEncounter({
   ...configured,
   encounterId:'capture-migration-compatibility-v1',
   player:{instanceId:member.uid,creatureId:member.entityId},
   opponent:{instanceId:instance,creatureId:wild.creatureId}
  });
  const native=authored?.nativeCombatSource;
  if (!authored?.exported||!native||native.battleFormat?.localActorId!=='player'||
      !native.battleFormat.actors?.some(actor=>actor.actorId==='player'&&
       actor.creatureId===member.entityId)) {
   throw new TypeError('Official Combat export has an incompatible local creature identity');
  }
  const maxHp=native.fighterConfigs?.[member.entityId]?.maxHp;
  const abilities=native.skillIdsByActor?.player;
  if (!Number.isInteger(maxHp)||maxHp<=0||!Array.isArray(abilities)||
      !abilities.length||new Set(abilities).size!==abilities.length||
      abilities.some(id=>typeof id!=='string'||!native.skills?.[id])) {
   throw new TypeError('Incomplete official Combat Lab creature HP or skill catalog');
  }
  return {maxHp,activeAbilityIds:[...abilities]};
 }
 function prepare() {
  const {heroId,hero}=owner();
  const member=validateMember(hero),wild=encounter(),worldKey=selectedWorldKey();
  if (hero.captureLabProfileMigrationV1!=null) {
   throw new Error('Capture profile has an existing versioned Lab migration; no overwrite');
  }
  const projected=official(member,wild);
  const compatible=member.maxHp===projected.maxHp&&
   sameArray(member.activeAbilityIds,projected.activeAbilityIds)&&
   sameArray(member.knownAbilityIds,projected.activeAbilityIds);
  const nextHp=Math.max(1,Math.min(projected.maxHp,
   Math.round(member.hp/member.maxHp*projected.maxHp)));
  const before=Object.freeze({
   uid:member.uid,entityId:member.entityId,hp:member.hp,maxHp:member.maxHp,
   activeAbilityIds:Object.freeze([...(member.activeAbilityIds??[])])
  });
  const after=Object.freeze({
   uid:member.uid,entityId:member.entityId,
   hp:compatible?member.hp:nextHp,maxHp:projected.maxHp,
   activeAbilityIds:Object.freeze([...projected.activeAbilityIds])
  });
  const status=compatible?'compatible':'migration-required';
  const plan=Object.freeze({
   status,heroId,combatSha,version,previous:before,next:after,
   consentText:compatible?'':consentLine(before,after),
   explanation:'Conserver le pourcentage de PV et remplacer les capacités actives par les capacités réellement exportées du Labo officiel. Aucun changement avant accord.'
  });
  plans.set(plan,{
   saved:encode(hero),wild:encode(wild),worldKey,member:clone(member),
   official:projected,committed:false
  });
  return plan;
 }
 function commit(plan,{acknowledged}={}) {
  const prepared=plans.get(plan);
  if (!prepared||prepared.committed) throw new Error('Stale or already used Capture migration plan');
  if (plan.status!=='migration-required') throw new Error('Compatible profile requires no migration');
  if (!plan.consentText||acknowledged!==plan.consentText) {
   throw new Error('Exact informed user consent is required for Capture migration');
  }
  const {heroId,hero}=owner(),wild=encounter();
  if (heroId!==plan.heroId||encode(hero)!==prepared.saved||
      encode(wild)!==prepared.wild||selectedWorldKey()!==prepared.worldKey) {
   throw new Error('Stale Capture profile or encounter changed before migration');
  }
  const member=validateMember(hero);
  if (!identical(member,prepared.member)) {
   throw new Error('Stale saved Capture member; migration cancelled');
  }
  const nextMember={
   ...clone(member),hp:plan.next.hp,maxHp:plan.next.maxHp,
   activeAbilityIds:[...prepared.official.activeAbilityIds],
   knownAbilityIds:[...prepared.official.activeAbilityIds]
  };
  const next={
   ...clone(hero),
   creatureTeam:[nextMember],
   captureLabProfileMigrationV1:{
    schema,version,combatSha,
    heroId,uid:member.uid,entityId:member.entityId,
    encounterSnapshot:prepared.wild,worldKey:prepared.worldKey,
    originalMember:clone(member),
    migratedMember:clone(nextMember)
   }
  };
  // An owner may perform its write then throw during UI bookkeeping. The
  // same plan is never allowed to repeat that write in either case.
  prepared.committed=true;
  saveHeroState(heroId,next);
  return Object.freeze({migrated:true,heroId,combatSha,
   hp:nextMember.hp,maxHp:nextMember.maxHp,version});
 }
 function recordForRollback() {
  const {heroId,hero}=owner();
  const record=hero.captureLabProfileMigrationV1;
  if (!record) return null;
  if (record.schema!==schema||record.version!==version||
      record.combatSha!==combatSha||record.heroId!==heroId||
      record.uid!==hero.creatureTeam?.[0]?.uid||
      typeof record.worldKey!=='string') {
   throw new TypeError('Unknown or mismatched Capture migration version; refusing rollback');
  }
  if (hero.creatureTeam?.length!==1 ||(hero.creatureReserve?.length??0)!==0) {
   throw new Error('Capture team changed since migration; refusing rollback');
  }
  return {heroId,hero,record};
 }
 function rollbackConsent(record) {
  return 'Je confirme le retour de '+record.entityId+
   ' au profil Capture original, seulement avant le combat.';
 }
 function inspectRollback() {
  const found=recordForRollback();
  if (!found) return Object.freeze({available:false,reason:'No versioned Lab migration recorded'});
  const {record}=found;
  return Object.freeze({available:true,heroId:found.heroId,
   version,creatureId:record.entityId,combatSha,
   consentText:rollbackConsent(record)});
 }
 function rollback({acknowledged}={}) {
  const found=recordForRollback();
  if (!found) throw new Error('No available Capture migration rollback');
  const {heroId,hero,record}=found;
  if (acknowledged!==rollbackConsent(record)) {
   throw new Error('Exact informed rollback consent is required');
  }
  if (!identical(hero.creatureTeam[0],record.migratedMember)) {
   throw new Error('Capture creature changed since migration; refusing rollback');
  }
  if (selectedWorldKey()!==record.worldKey||
      encode(encounter())!==record.encounterSnapshot) {
   throw new Error('Capture wild encounter changed or battle completed since migration');
  }
  const next=clone(hero);
  next.creatureTeam=[clone(record.originalMember)];
  delete next.captureLabProfileMigrationV1;
  saveHeroState(heroId,next);
  return Object.freeze({restored:true,heroId,version});
 }
 return Object.freeze({prepare,commit,inspectRollback,rollback});
}
