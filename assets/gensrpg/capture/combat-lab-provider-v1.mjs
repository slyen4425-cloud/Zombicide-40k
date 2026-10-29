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
    const counts=Array.isArray(sides)&&sides.length===2
      ? sides.map(side=>Array.isArray(side?.creatures)?side.creatures.length:0):[];
    // Combat v1 is active-only: the owner must explicitly model any reserve
    // before this boundary. Never silently drop a bench creature.
    if(counts.length!==2||![1,2].includes(counts[0])||counts[0]!==counts[1]||
       sides.some((side,i)=>!Array.isArray(side?.active)||
        side.active.length!==counts[i]||
        new Set(side.active).size!==counts[i]||
        side.creatures.some(creature=>!creature||
          !side.active.includes(creature.instanceId))||
        new Set(side.creatures.map(creature=>creature.instanceId)).size!==counts[i])) {
      throw new TypeError('This adapter supports balanced 1v1 or 2v2 active teams without reserves only');
    }
    const activePerSide=counts[0];
    const creatures=sides.flatMap(side=>side.creatures.map(c=>({
      ...c,abilityIds:[...(c.abilityIds??[])]
    })));
    if(new Set(creatures.map(c=>c.instanceId)).size!==creatures.length) {
      throw new TypeError('Duplicate instance identity across Combat sides');
    }
    const resolved=resolveBattle(context);
    const source=resolved?.nativeCombatSource;
    const actorIds=Array.isArray(resolved?.actorIds)?[...resolved.actorIds]:null;
    if(!source||!Array.isArray(actorIds)||
       actorIds.length!==creatures.length||new Set(actorIds).size!==actorIds.length||
       source.fighters?.length!==creatures.length||
       source.battleFormat?.localActorId!==actorIds[0]) {
      throw new TypeError('Resolved native active Combat actors must identify the local player');
    }
    const actors=source.battleFormat.actors;
    if(!Array.isArray(actors)||actors.length!==creatures.length||
       typeof source.battleFormat.teamOf!=='function') {
      throw new TypeError('Official Combat battle format does not match the active roster');
    }
    const alliedIds=actorIds.slice(0,activePerSide);
    const enemyIds=actorIds.slice(activePerSide);
    const friendlyTeam=source.battleFormat.teamOf(alliedIds[0]);
    const opponentTeam=source.battleFormat.teamOf(enemyIds[0]);
    if(friendlyTeam===opponentTeam||
       alliedIds.some(id=>source.battleFormat.teamOf(id)!==friendlyTeam)||
       enemyIds.some(id=>source.battleFormat.teamOf(id)!==opponentTeam)) {
      throw new TypeError('Native Combat active actors must belong to two opposing teams');
    }
    const fighters=creatures.map((creature,i)=>{
      const actorId=actorIds[i];
      const config=source.fighters.find(fighter=>fighter.id===actorId);
      const authored=source.fighterConfigs?.[creature.creatureId];
      const actor=actors.find(candidate=>candidate.actorId===actorId);
      const roster=source.roster?.teams?.[actorId] ??
        Object.values(source.roster?.teams??{}).find(team=>team.slotId===actorId);
      if(!config||!authored||!actor||actor.creatureId!==creature.creatureId||
         !roster||roster.members?.length!==1||
         roster.activeMemberId!==creature.instanceId||
         roster.members[0].id!==creature.instanceId||
         roster.members[0].creatureId!==creature.creatureId) {
        throw new TypeError('Native Combat roster identity mismatch or unsupported reserve');
      }
      if(!Number.isFinite(creature.hp)||creature.hp<=0||
         creature.hp>creature.maxHp||creature.maxHp!==config.maxHp||
         creature.maxHp!==authored.maxHp) {
        throw new TypeError('Capture and Combat HP definitions must agree');
      }
      const actual=source.skillIdsByActor?.[actorId];
      if(!Array.isArray(actual)||!Array.isArray(creature.abilityIds)||
         actual.length!==creature.abilityIds.length||
         new Set(actual).size!==actual.length||
         !actual.every(id=>creature.abilityIds.includes(id)&&source.skills?.[id])) {
        throw new TypeError('Capture and Combat skill loadouts must agree');
      }
      return {...config,initialHp:creature.hp};
    });
    const session = engine.createCombatSession({fighters,
      battleFormat:source.battleFormat,skillSpeedMultiplier:source.skillSpeedMultiplier});
    // Reuse the native reserve-effect owner even though this milestone has no switch commands.
    engine.createRosterSession({combatSession:session,roster:source.roster,fighterConfigs:source.fighterConfigs,
      battleFormat:source.battleFormat,recallCooldownMs:source.gameOptions?.recallCooldownMs});

    let phase='created', view=null, runtime=null, ais=[];
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
        if(alliedIds.every(id=>state.fighters[id]?.hp<=0))finish('defeat');
        else if(enemyIds.every(id=>state.fighters[id]?.hp<=0))finish('victory');
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
          try {for(const ai of ais)ai.takeTurn();} catch(error){fail(error);}
        }
      }
    });
    if(resolved.aiEnabled!==false) {
      // Use only the Lab's controller for each nonhuman participant.
      // The capture-team ally targets enemies; both wild actors target allies.
      ais=actors.filter(actor=>actor.actorId!==actorIds[0]&&
        typeof actor.controllerId==='string'&&actor.controllerId.startsWith('ai-')
      ).map(actor=>engine.createBattleActorAiController({
        session,runtime,actorId:actor.actorId,
        targetIds:source.battleFormat.teamOf(actor.actorId)===friendlyTeam?enemyIds:alliedIds,
        skillIds:source.skillIdsByActor[actor.actorId],skillsById:source.skills,
        tactics:resolved.aiTactics
      }));
    }
    const handle = Object.freeze({
      completion,
      state:()=>session.snapshot(),
      skills:()=>Object.freeze(source.skillIdsByActor[actorIds[0]].map(id=>Object.freeze({id,name:source.skills[id].name}))),
      useSkill(id,targetInstanceId) {
        if(phase!=='running')return Object.freeze({ok:false,outcome:'battle_inactive'});
        if(!source.skillIdsByActor[actorIds[0]].includes(id))
          throw new TypeError('Skill not in local loadout');
        const target=targetInstanceId??creatures[actorIds.indexOf(
          enemyIds.find(actorId=>session.snapshot().fighters[actorId]?.hp>0)??enemyIds[0]
        )].instanceId;
        const index=creatures.findIndex(c=>c.instanceId===target);
        if(index<0)throw new TypeError('Unknown target instance');
        try{return runtime.startSkill({
          actorId:actorIds[0],targetId:actorIds[index],skill:source.skills[id]
        });}catch(error){fail(error);throw error;}
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
    protocol:1,version:'1.0.0',capabilities:Object.freeze(['battle-trigger','battle-1v1','battle-2v2-active']),
    createBattle,
    startBattle:handle=>record(handle).start(),
    stopBattle:handle=>records.get(handle)?.stop(),
    disposeBattle:handle=>records.get(handle)?.dispose(),
    // Required protocol slots; unavailable capabilities are never advertised.
    openCreatureEditor(){throw new Error('Creature editor is not connected by this adapter');},
    closeCreatureEditor(){return false;}
  });
}
