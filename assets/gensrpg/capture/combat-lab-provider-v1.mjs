// Capture adapter only: the imported Lab owns rules, costs, timing, roster and AI.
export function createCombatLabProviderV1({
  engine, resolveBattle, mountBattle = () => ({dispose(){}}), clock = {}
}) {
  for (const name of ['createCombatSession','createCombatRuntime','createRosterSession','createBattleActorAiController']) {
    if (typeof engine?.[name] !== 'function') throw new TypeError('Combat Core missing '+name);
  }
  if (typeof resolveBattle !== 'function' || typeof mountBattle !== 'function') {
    throw new TypeError('Capture battle resolver and view factory required');
  }
  const records = new WeakMap();

  function createBattle(context) {
    const sides = context?.snapshot?.sides;
    if (!Array.isArray(sides) || sides.length !== 2 || sides.some(side => side.creatures?.length !== 1)) {
      throw new TypeError('This adapter supports 1v1 without reserves only');
    }
    const creatures = sides.map(side => ({...side.creatures[0],abilityIds:[...(side.creatures[0].abilityIds ?? [])]}));
    if (sides.some((side,i) => side.active?.length !== 1 || side.active[0] !== creatures[i].instanceId)) {
      throw new TypeError('Each side requires exactly one active instance');
    }
    if (new Set(creatures.map(c=>c.instanceId)).size !== 2) throw new TypeError('Duplicate instance identity');
    const resolved = resolveBattle(context);
    const source = resolved?.nativeCombatSource;
    const actorIds = Array.isArray(resolved?.actorIds) ? [...resolved.actorIds] : null;
    if (!source || !Array.isArray(actorIds) || actorIds.length !== 2 || new Set(actorIds).size !== 2 ||
        source.fighters?.length !== 2 || source.battleFormat?.localActorId !== actorIds[0]) {
      throw new TypeError('Resolved native 1v1 actors must identify the local player');
    }
    const actors = source.battleFormat.actors;
    const fighters = creatures.map((creature,i) => {
      const actorId = actorIds[i];
      const config = source.fighters.find(fighter=>fighter.id === actorId);
      const authored = source.fighterConfigs?.[creature.creatureId];
      const roster = source.roster?.teams?.[actorId];
      // The native roster uses slot IDs as keys. Never silently drop a reserve.
      const rosterTeam = roster ?? Object.values(source.roster?.teams ?? {}).find(team=>team.slotId === actorId);
      if (!config || !authored || !actors.some(actor=>actor.actorId === actorId && actor.creatureId === creature.creatureId) ||
          !rosterTeam || rosterTeam.members.length !== 1 ||
          rosterTeam.members[0].creatureId !== creature.creatureId) {
        throw new TypeError('Native roster identity mismatch or unsupported 1v1 roster');
      }
      if (!Number.isFinite(creature.hp) || creature.hp <= 0 || creature.hp > creature.maxHp ||
          creature.maxHp !== config.maxHp || creature.maxHp !== authored.maxHp) {
        throw new TypeError('Capture and Combat HP definitions must agree');
      }
      const actual = source.skillIdsByActor?.[actorId];
      if (!Array.isArray(actual) || !Array.isArray(creature.abilityIds) ||
          actual.length !== creature.abilityIds.length || new Set(actual).size !== actual.length ||
          !actual.every(id=>creature.abilityIds.includes(id) && source.skills?.[id])) {
        throw new TypeError('Capture and Combat skill loadouts must agree');
      }
      return {...config, initialHp:creature.hp};
    });
    if (source.battleFormat.teamOf(actorIds[0]) === source.battleFormat.teamOf(actorIds[1])) {
      throw new TypeError('Combat sides must be opponents');
    }
    const session = engine.createCombatSession({fighters,
      battleFormat:source.battleFormat,skillSpeedMultiplier:source.skillSpeedMultiplier});
    // Reuse the native reserve-effect owner even though this milestone has no switch commands.
    engine.createRosterSession({combatSession:session,roster:source.roster,fighterConfigs:source.fighterConfigs,
      battleFormat:source.battleFormat,recallCooldownMs:source.gameOptions?.recallCooldownMs});

    let phase='created', view=null, runtime=null, ai=null;
    let resolveCompletion, rejectCompletion;
    const completion = new Promise((resolve,reject)=>{resolveCompletion=resolve;rejectCompletion=reject;});
    function terminal() {return phase === 'settled' || phase === 'disposed';}
    function finish(outcome) {
      if (terminal()) return false;
      phase='settled';
      const state=session.snapshot();
      // Let the Core finish its current stack before releasing its scheduler.
      queueMicrotask(()=>runtime.dispose());
      resolveCompletion(Object.freeze({outcome,creatures:creatures.map((c,i)=>({
        instanceId:c.instanceId,hp:state.fighters[actorIds[i]].hp
      }))}));
      return true;
    }
    function fail(error) {
      if (terminal()) return;
      phase='settled';queueMicrotask(()=>runtime.dispose());rejectCompletion(error);
    }
    function observe(state) {
      if (phase !== 'running') return;
      try {
        view?.render?.(state);
        if (state.fighters[actorIds[0]].hp <= 0) finish('defeat');
        else if (state.fighters[actorIds[1]].hp <= 0) finish('victory');
      } catch (error) {fail(error);}
    }
    const scheduler = {};
    for (const key of ['now','setTimer','clearTimer']) {
      if (clock[key] !== undefined) {
        if (typeof clock[key] !== 'function') throw new TypeError('Invalid clock '+key);
        scheduler[key]=clock[key];
      }
    }
    runtime = engine.createCombatRuntime({session,...scheduler,
      onState:observe,
      onClock(state) {
        observe(state);
        if (phase === 'running') {
          try {ai?.takeTurn();} catch (error) {fail(error);}
        }
      }
    });
    if (resolved.aiEnabled !== false) {
      ai=engine.createBattleActorAiController({session,runtime,actorId:actorIds[1],targetIds:[actorIds[0]],
        skillIds:source.skillIdsByActor[actorIds[1]],skillsById:source.skills,tactics:resolved.aiTactics});
    }
    const handle = Object.freeze({
      completion,
      state:()=>session.snapshot(),
      skills:()=>Object.freeze(source.skillIdsByActor[actorIds[0]].map(id=>Object.freeze({id,name:source.skills[id].name}))),
      useSkill(id,targetInstanceId=creatures[1].instanceId) {
        if (phase !== 'running') return Object.freeze({ok:false,outcome:'battle_inactive'});
        if (!source.skillIdsByActor[actorIds[0]].includes(id)) throw new TypeError('Skill not in local loadout');
        const index=creatures.findIndex(c=>c.instanceId === targetInstanceId);
        if (index < 0) throw new TypeError('Unknown target instance');
        try {return runtime.startSkill({actorId:actorIds[0],targetId:actorIds[index],skill:source.skills[id]});}
        catch(error){fail(error);throw error;}
      },
      flee:()=>phase === 'running' && finish('flee')
    });
    records.set(handle,{
      start() {
        if (phase !== 'created') throw new Error('Battle already started');
        view=mountBattle(handle,context);
        if (!view || typeof view.dispose !== 'function') throw new TypeError('Battle view requires dispose()');
        phase='running';runtime.start();
      },
      stop() {finish('cancelled');runtime.dispose();},
      dispose() {
        finish('cancelled');phase='disposed';runtime.dispose();
        try {view?.dispose?.();} finally {view=null;records.delete(handle);}
      }
    });
    return handle;
  }
  function record(handle) {
    const value=records.get(handle);
    if (!value) throw new TypeError('Unknown battle handle');
    return value;
  }
  return Object.freeze({
    protocol:1,version:'1.0.0',capabilities:Object.freeze(['battle-trigger','battle-1v1']),
    createBattle,
    startBattle:handle=>record(handle).start(),
    stopBattle:handle=>records.get(handle)?.stop(),
    disposeBattle:handle=>records.get(handle)?.dispose(),
    // Required protocol slots; unavailable capabilities are never advertised.
    openCreatureEditor(){throw new Error('Creature editor is not connected by this adapter');},
    closeCreatureEditor(){return false;}
  });
}
