// Capture-owned data seam. Only the original Capture team owner persists HP.
// The pinned Combat Lab export/adapter owns fighters, skills, teams and rules.
// Both 1v1 and explicit two-active-per-side battles use this one boundary.
// No storage, gameplay, view, fallback, clock or second roster authority here.
export function createCaptureSavedProfileBattleBridgeV1({
  activeHeroId,loadHeroState,saveHeroState,readEncounter,
  exported,adaptCombatExport,validateBattleResult,encounterKind='wild'
}) {
  for(const [key,fn] of Object.entries({
    activeHeroId,loadHeroState,saveHeroState,readEncounter,adaptCombatExport,validateBattleResult
  })) {
    if(typeof fn!=='function')throw new TypeError('Capture owner requires '+key);
  }
  if(!exported||typeof exported!=='object')throw new TypeError('Official authored Combat export required');
  if(encounterKind!=='wild'&&encounterKind!=='trainer'){
    throw new TypeError('Explicit Capture encounter kind must be wild or trainer');
  }
  const isTrainer=encounterKind==='trainer';
  const nativeSource=adaptCombatExport(exported);
  const format=nativeSource?.battleFormat;
  const actors=format?.actors;
  const localId=format?.localActorId;
  if(!Array.isArray(actors)||![2,4].includes(actors.length)||
    !localId||typeof format?.teamOf!=='function') {
    throw new TypeError('Only official active 1v1 or 2v2 Combat exports are supported');
  }
  const selected=actors.find(actor=>actor.actorId===localId);
  if(!selected)throw new TypeError('Official Combat export has no local player actor');
  const localTeam=format.teamOf(localId);
  const localActors=actors.filter(actor=>format.teamOf(actor.actorId)===localTeam);
  const enemyActors=actors.filter(actor=>format.teamOf(actor.actorId)!==localTeam);
  const enemyTeam=enemyActors.length?format.teamOf(enemyActors[0].actorId):null;
  const activeCount=actors.length/2;
  if(!localTeam||!enemyTeam||enemyTeam===localTeam||
    localActors.length!==activeCount||enemyActors.length!==activeCount||
    localActors[0]?.actorId!==localId||
    enemyActors.some(actor=>format.teamOf(actor.actorId)!==enemyTeam)||
    new Set(actors.map(actor=>actor.actorId)).size!==actors.length) {
    throw new TypeError('Official Combat export requires balanced opposing active teams');
  }
  const actorIds=Object.freeze([...localActors,...enemyActors].map(actor=>actor.actorId));
  const exactSkills=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
    a.length===b.length&&a.every((id,i)=>id===b[i]);
  const text=value=>typeof value==='string'?value.trim():'';
  for(const actor of actors) {
    const definition=nativeSource.fighterConfigs?.[actor.creatureId];
    const skills=nativeSource.skillIdsByActor?.[actor.actorId];
    if(!definition||!Number.isFinite(definition.maxHp)||definition.maxHp<=0||
      !Array.isArray(skills)||new Set(skills).size!==skills.length||
      skills.some(id=>typeof id!=='string'||!nativeSource.skills?.[id])) {
      throw new TypeError('Incomplete official Combat creature catalog or skill loadout');
    }
  }

  // A trainer is a distinct World event, not a wild battle with renamed UI.
  // World owns trainer identity, difficulty and the declared opponent roster.
  function trainerFingerprint(encounter){
    return JSON.stringify({
      type:encounter?.type,trainerId:encounter?.trainerId,
      trainerName:encounter?.trainerName,trainerDifficulty:encounter?.trainerDifficulty,
      creatureIds:encounter?.creatureIds,captureAllowed:encounter?.captureAllowed
    });
  }
  function encounterSpecies(encounter){
    if(isTrainer){
      if(!['friendly_trainer','hostile_trainer'].includes(encounter?.type)||
        !text(encounter?.encounterId)||!text(encounter?.trainerId)||
        !text(encounter?.trainerName)||
        !Number.isInteger(encounter?.trainerDifficulty)||
        encounter.trainerDifficulty<1||encounter.trainerDifficulty>4||
        encounter.captureAllowed!==false){
        throw new TypeError('Official trainer encounter requires stable NPC identity, difficulty and capture prohibition');
      }
      const ids=encounter.creatureIds;
      if(!Array.isArray(ids)||ids.length!==activeCount||
        ids.some((id,i)=>!text(id)||id!==enemyActors[i].creatureId)){
        throw new TypeError('Trainer opponent roster must match official authored Combat creatures');
      }
      return [...ids];
    }
    if(encounter?.type!=='wild'||!text(encounter.encounterId)||!text(encounter.creatureId)){
      throw new TypeError('A live Capture wild encounter is required');
    }
    const ids=activeCount===1?[text(encounter.creatureId)]:encounter.creatureIds;
    if(!Array.isArray(ids)||ids.length!==activeCount||
      ids.some((id,i)=>!text(id)||id!==enemyActors[i].creatureId)||
      ids[0]!==text(encounter.creatureId)) {
      throw new TypeError('Wild encounter opponents do not match the official authored creatures');
    }
    // A 1v1 world event must not silently lose an explicitly declared second wild.
    if(activeCount===1&&encounter.creatureIds!==undefined&&
      (!Array.isArray(encounter.creatureIds)||encounter.creatureIds.length!==1||
       encounter.creatureIds[0]!==ids[0])) {
      throw new TypeError('Wild encounter has unsupported extra creature slots');
    }
    return [...ids];
  }
  function readActiveMembers(hero){
    if(!hero||!Array.isArray(hero.creatureTeam)||
      hero.creatureTeam.length!==activeCount||
      (activeCount===1&&!isTrainer&&Array.isArray(hero.creatureReserve)&&hero.creatureReserve.length)) {
      throw new TypeError('Persisted Capture active team requires '+activeCount+' members'+
        (activeCount===1?' and no reserve':''));
    }
    const used=new Set();
    return hero.creatureTeam.map((member,i)=>{
      const actor=localActors[i],uid=text(member?.uid),entityId=text(member?.entityId);
      const maxHp=member?.maxHp,hp=member?.hp,abilityIds=member?.activeAbilityIds;
      if(!uid||used.has(uid))throw new TypeError('Duplicate or missing Capture instance identity');
      used.add(uid);
      if(!entityId||entityId!==actor.creatureId) {
        throw new TypeError('Saved Capture creature identity does not match the official authored catalog');
      }
      if(!Number.isFinite(maxHp)||maxHp!==nativeSource.fighterConfigs[entityId].maxHp||
        !Number.isFinite(hp)||hp<=0||hp>maxHp) {
        throw new TypeError('Saved Capture HP are incompatible with the official Combat creature');
      }
      if(!exactSkills(abilityIds,nativeSource.skillIdsByActor[actor.actorId])) {
        throw new TypeError('Saved Capture ability loadout does not match the official Combat skills');
      }
      return Object.freeze({uid,entityId,hp,maxHp,abilityIds:Object.freeze([...abilityIds])});
    });
  }
  // The historical roster alone owns the off-field reserve. A 2v2 battle
  // may carry it in the saved profile, but NEVER sends it to the Combat Lab.
  // Snapshot all JSON fields and order so a concurrent reserve edit blocks
  // the later active-HP write instead of silently overwriting another save.
  function reserveFingerprint(hero,active){
    const raw=hero?.creatureReserve;
    if(raw!==undefined&&!Array.isArray(raw)){
      throw new TypeError('Invalid Capture reserve: expected an array');
    }
    const reserve=raw??[];
    if(activeCount===1&&!isTrainer&&reserve.length){
      throw new TypeError('Capture 1v1 historical profile requires no reserve');
    }
    const used=new Set(active.map(item=>item.uid));
    for(const member of reserve){
      const uid=text(member?.uid),entityId=text(member?.entityId);
      if(!uid||!entityId||used.has(uid)||
        !Number.isFinite(member?.maxHp)||member.maxHp<=0||
        !Number.isFinite(member?.hp)||member.hp<0||member.hp>member.maxHp||
        (member.activeAbilityIds!=null&&!Array.isArray(member.activeAbilityIds))||
        (member.knownAbilityIds!=null&&!Array.isArray(member.knownAbilityIds))){
        throw new TypeError('Invalid or duplicate Capture reserve identity or data');
      }
      used.add(uid);
    }
    return JSON.stringify(raw);
  }
  function matchesExpected(state,expected,reserveAtStart){
    if(!state||!Array.isArray(state.creatureTeam)||
      state.creatureTeam.length!==expected.length||
      JSON.stringify(state.creatureReserve)!==reserveAtStart)return false;
    return state.creatureTeam.every((item,i)=>{
      const original=expected[i];
      return item?.uid===original.uid&&item.entityId===original.entityId&&
        item.hp===original.hp&&item.maxHp===original.maxHp&&
        exactSkills(item.activeAbilityIds,original.abilityIds);
    });
  }
  function equalSnapshots(current,reference){
    const sides=current?.sides;
    if(!Array.isArray(sides)||sides.length!==2)return false;
    return sides.every((side,i)=>{
      const original=reference.sides[i];
      return Array.isArray(side?.creatures)&&side.creatures.length===activeCount&&
        Array.isArray(side.active)&&side.active.length===activeCount&&
        side.creatures.every((creature,j)=>{
          const match=original.creatures[j];
          return side.active[j]===original.active[j]&&
            creature.instanceId===match.instanceId&&creature.creatureId===match.creatureId&&
            creature.hp===match.hp&&creature.maxHp===match.maxHp&&
            exactSkills(creature.abilityIds,match.abilityIds);
        });
    });
  }

  function prepareEncounter(){
    const heroId=text(activeHeroId()),encounter=readEncounter();
    if(!heroId)throw new TypeError('Capture active hero identity required');
    const declaredSpecies=encounterSpecies(encounter);
    const initialTrainer=isTrainer?trainerFingerprint(encounter):null;
    const saved=loadHeroState(heroId);
    const player=readActiveMembers(saved);
    const reserveAtStart=reserveFingerprint(saved,player);
    const encounterId=text(encounter.encounterId);
    const enemies=enemyActors.map((actor,i)=>{
      const instanceId=(isTrainer?'trainer:':'wild:')+encounterId+(i?':'+(i+1):'');
      return Object.freeze({
        instanceId,creatureId:actor.creatureId,
        hp:nativeSource.fighterConfigs[actor.creatureId].maxHp,
        maxHp:nativeSource.fighterConfigs[actor.creatureId].maxHp,
        abilityIds:Object.freeze([...nativeSource.skillIdsByActor[actor.actorId]])
      });
    });
    const allIds=[...player.map(x=>x.uid),...enemies.map(x=>x.instanceId)];
    if(new Set(allIds).size!==allIds.length){
      throw new TypeError('Capture instance identity collision');
    }
    const asCreature=member=>({
      instanceId:member.uid??member.instanceId,
      creatureId:member.entityId??member.creatureId,
      hp:member.hp,maxHp:member.maxHp,abilityIds:[...member.abilityIds]
    });
    const snapshot=Object.freeze({sides:[
      {name:localActors[0].displayName??'',active:player.map(x=>x.uid),
       creatures:player.map(asCreature)},
      {name:isTrainer?encounter.trainerName:(enemyActors[0].displayName??''),active:enemies.map(x=>x.instanceId),
       creatures:enemies.map(asCreature)}
    ]});
    let applied=false;
    return Object.freeze({
      encounterId,snapshot,
      resolveBattle(context){
        if(context?.encounterId!==encounterId||
          !equalSnapshots(context?.snapshot,snapshot)){
          throw new TypeError('Official Combat resolver received a different Capture encounter snapshot');
        }
        return Object.freeze({nativeCombatSource:nativeSource,actorIds,exported,
          ...(isTrainer?{trainerDifficulty:encounter.trainerDifficulty}:{})});
      },
      applyResult(rawResult){
        if(applied)return false;
        if(text(activeHeroId())!==heroId){
          throw new Error('Stale Capture active hero: refusing to persist a different session');
        }
        const result=validateBattleResult(rawResult,snapshot);
        if(result.outcome==='cancelled')return false;
        const live=readEncounter();
        if(live?.encounterId!==encounterId){
          throw new Error('Stale Capture encounter: result cannot be persisted');
        }
        const species=encounterSpecies(live);
        if(species.length!==declaredSpecies.length||
          species.some((id,i)=>id!==declaredSpecies[i])||
          (isTrainer&&trainerFingerprint(live)!==initialTrainer)){
          throw new Error('Stale Capture encounter identity, difficulty or species changed');
        }
        const state=loadHeroState(heroId);
        if(!matchesExpected(state,player,reserveAtStart)){
          throw new Error('Stale Capture profile: refusing to overwrite another save');
        }
        const byId=new Map(result.creatures.map(creature=>[creature.instanceId,creature]));
        const nextHp=player.map(item=>{
          const local=byId.get(item.uid);
          if(!local)throw new TypeError('Incomplete validated local result');
          return local.hp;
        });
        const next={...state,creatureTeam:state.creatureTeam.map((item,i)=>({
          ...item,hp:nextHp[i]
        }))};
        // One verified atomic write, only through the historical Capture owner.
        saveHeroState(heroId,next);
        applied=true;
        return Object.freeze({
          applied:true,outcome:result.outcome,heroId,hp:nextHp[0],
          ...(activeCount===2?{teamHp:Object.freeze([...nextHp])}:{})
        });
      }
    });
  }
  return Object.freeze({prepareEncounter});
}
