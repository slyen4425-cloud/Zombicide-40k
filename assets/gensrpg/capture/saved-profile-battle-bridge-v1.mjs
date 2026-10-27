// Capture-owned data seam. The existing Capture owner reads/saves the profile;
// the pinned official Lab adapter owns definitions and the Combat Core owns rules.
// This module never installs a runtime, writes storage or invents authored data.
export function createCaptureSavedProfileBattleBridgeV1({
  activeHeroId, loadHeroState, saveHeroState, readEncounter,
  exported, adaptCombatExport, validateBattleResult
}) {
  for (const [name,fn] of Object.entries({
    activeHeroId,loadHeroState,saveHeroState,readEncounter,adaptCombatExport,validateBattleResult
  })) {
    if (typeof fn !== 'function') throw new TypeError('Capture owner requires '+name);
  }
  if (!exported || typeof exported !== 'object') throw new TypeError('Official authored Combat export required');
  const nativeSource = adaptCombatExport(exported);
  const actors = nativeSource?.battleFormat?.actors;
  const localId = nativeSource?.battleFormat?.localActorId;
  if (!Array.isArray(actors) || actors.length !== 2 || !localId) {
    throw new TypeError('Only an official two-actor Combat export is supported');
  }
  const player = actors.find(actor=>actor.actorId === localId);
  const opponent = actors.find(actor=>actor.actorId !== localId);
  if (!player || !opponent ||
      nativeSource.battleFormat.teamOf(player.actorId) === nativeSource.battleFormat.teamOf(opponent.actorId)) {
    throw new TypeError('Official Combat export has no opposing local player');
  }
  const actorIds = Object.freeze([player.actorId,opponent.actorId]);
  const sourceSkills = nativeSource.skillIdsByActor?.[localId];
  const authoredPlayer = nativeSource.fighterConfigs?.[player.creatureId];
  const authoredWild = nativeSource.fighterConfigs?.[opponent.creatureId];
  if (!Array.isArray(sourceSkills) || !authoredPlayer || !authoredWild) {
    throw new TypeError('Incomplete official Combat creature catalog or skill loadout');
  }
  const exactSkills = (a,b) => Array.isArray(a) && Array.isArray(b) &&
    a.length === b.length && a.every((id,i)=>id === b[i]);
  const text = value=>typeof value === 'string' ? value.trim() : '';

  function prepareEncounter() {
    const heroId = text(activeHeroId());
    const encounter = readEncounter();
    if (!heroId) throw new TypeError('Capture active hero identity required');
    if (encounter?.type !== 'wild' || !text(encounter.encounterId) || !text(encounter.creatureId)) {
      throw new TypeError('A live Capture wild encounter is required');
    }
    if (encounter.creatureId !== opponent.creatureId) {
      throw new TypeError('Wild encounter is absent from the official authored creature catalog');
    }
    const hero = loadHeroState(heroId);
    if (!hero || !Array.isArray(hero.creatureTeam) || hero.creatureTeam.length !== 1 ||
        (Array.isArray(hero.creatureReserve) && hero.creatureReserve.length)) {
      throw new TypeError('Persisted Capture 1v1 currently requires exactly one team member and no reserve');
    }
    const selected = hero.creatureTeam[0];
    const uid = text(selected?.uid);
    const entityId = text(selected?.entityId);
    const hp = selected?.hp, maxHp=selected?.maxHp;
    const abilityIds = selected?.activeAbilityIds;
    if (!uid || !entityId || entityId !== player.creatureId) {
      throw new TypeError('Saved Capture creature identity does not match the official authored catalog');
    }
    if (!Number.isFinite(maxHp) || maxHp !== authoredPlayer.maxHp ||
        !Number.isFinite(hp) || hp <= 0 || hp > maxHp) {
      throw new TypeError('Saved Capture HP are incompatible with the official Combat creature');
    }
    if (!exactSkills(abilityIds,sourceSkills)) {
      throw new TypeError('Saved Capture ability loadout does not match the official Combat skills');
    }
    const wildId='wild:'+text(encounter.encounterId);
    if (uid === wildId) throw new TypeError('Capture instance identity collision');
    if (!Number.isFinite(authoredWild.maxHp) || authoredWild.maxHp <= 0) {
      throw new TypeError('Invalid official wild creature HP');
    }
    const snapshot=Object.freeze({
      sides:[
        {name:player.displayName ?? '',active:[uid],creatures:[{
          instanceId:uid,creatureId:entityId,hp,maxHp,abilityIds:[...abilityIds]
        }]},
        {name:opponent.displayName ?? '',active:[wildId],creatures:[{
          instanceId:wildId,creatureId:opponent.creatureId,
          hp:authoredWild.maxHp,maxHp:authoredWild.maxHp,
          abilityIds:[...nativeSource.skillIdsByActor[opponent.actorId]]
        }]}
      ]
    });
    const expected={uid,entityId,hp,maxHp,abilityIds:[...abilityIds],
      encounterId:text(encounter.encounterId)};
    let applied=false;

    return Object.freeze({
      encounterId:expected.encounterId,snapshot,
      resolveBattle(context) {
        const sides=context?.snapshot?.sides;
        if (context?.encounterId !== expected.encounterId ||
            !Array.isArray(sides) || sides.length !== 2 ||
            sides.some((side,i)=>{
              const canonical=snapshot.sides[i],creature=side?.creatures?.[0],reference=canonical.creatures[0];
              return !Array.isArray(side?.creatures) || side.creatures.length !== 1 ||
                !Array.isArray(side?.active) || side.active.length !== 1 ||
                side.active[0] !== canonical.active[0] || !creature ||
                creature.instanceId !== reference.instanceId ||
                creature.creatureId !== reference.creatureId ||
                creature.hp !== reference.hp || creature.maxHp !== reference.maxHp ||
                !exactSkills(creature.abilityIds,reference.abilityIds);
            })) {
          throw new TypeError('Official Combat resolver received a different Capture encounter snapshot');
        }
        return Object.freeze({nativeCombatSource:nativeSource,actorIds});
      },
      applyResult(rawResult) {
        if (applied) return false;
        if (text(activeHeroId()) !== heroId) {
          throw new Error('Stale Capture active hero: refusing to persist a different session');
        }
        const result=validateBattleResult(rawResult,snapshot);
        if (result.outcome === 'cancelled') return false;
        const live=readEncounter();
        if (live?.type !== 'wild' || live.encounterId !== expected.encounterId ||
            live.creatureId !== opponent.creatureId) {
          throw new Error('Stale Capture encounter: result cannot be persisted');
        }
        const state=loadHeroState(heroId);
        const member=state?.creatureTeam?.[0];
        if (!Array.isArray(state?.creatureTeam) || state.creatureTeam.length !== 1 ||
            (Array.isArray(state.creatureReserve) && state.creatureReserve.length) ||
            !member || member.uid !== expected.uid || member.entityId !== expected.entityId ||
            member.hp !== expected.hp || member.maxHp !== expected.maxHp ||
            !exactSkills(member.activeAbilityIds,expected.abilityIds)) {
          throw new Error('Stale Capture profile: refusing to overwrite another save');
        }
        const local=result.creatures.find(creature=>creature.instanceId===expected.uid);
        if (!local) throw new TypeError('Incomplete validated local result');
        const next={...state,creatureTeam:state.creatureTeam.map((item,i)=>
          i===0 ? {...item,hp:local.hp} : item
        )};
        // The original Capture team owner is the ONLY writer of this profile.
        saveHeroState(heroId,next);
        applied=true;
        return Object.freeze({applied:true,outcome:result.outcome,heroId,hp:local.hp});
      }
    });
  }
  return Object.freeze({prepareEncounter});
}
