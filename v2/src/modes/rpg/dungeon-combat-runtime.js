import { createCombatState } from './combat-engine.js';
import { calculateInitiative } from './initiative.js';
import { ensureCombatConfig } from './combat-config.js';
import { combatParticipants } from './spatial-engine.js';
import { getHeroRoomLocation, heroesInRoom } from './room-runtime.js';
import { resolveRoomCreatureDefeat } from './spawn-engine.js';
import { resolveHeroSkillIds } from './hero-engine.js';
import { prepareSkillAction, resolveAndAdvance } from './turn-runtime.js';
import { beginActiveTurn, reconcileCombatState } from './combat-session.js';

function clone(value){return structuredClone(value);}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function heroRuntimeById(heroRuntimes=[],heroId){
  const id=String(heroId||'');
  return list(heroRuntimes).find(hero=>String(hero?.instanceId||'')===id||String(hero?.heroId||'')===id)||null;
}

function definitionById(collection,id){
  return list(collection).find(entry=>String(entry?.id||'')===String(id||''))||null;
}

export function activeDungeonEnemies(roomRuntime,roomId=null){
  const id=String(roomId||roomRuntime?.currentRoomId||'');
  const room=roomRuntime?.rooms?.[id];
  if(!room) return [];
  return (room.entities||[]).filter(entity=>{
    const creature=entity?.kind==='creature'?entity.data?.creatureRuntime:null;
    return creature&&entity.active!==false&&!entity.removed&&!entity.defeated&&creature.active!==false&&!creature.removed&&!creature.defeated;
  }).map(entity=>({entityId:String(entity.id),runtime:clone(entity.data.creatureRuntime)}));
}

export function dungeonHeroParticipants({roomRuntime,heroRuntimes=[],engagerHeroId,spatial=null,spatialConfig={}}={}){
  const engagerId=String(engagerHeroId||'');
  const location=getHeroRoomLocation(roomRuntime,engagerId);
  const roomId=String(location?.roomId||roomRuntime?.currentRoomId||'');
  if(!roomId) return {ok:false,reason:'room-missing',roomId:null,heroIds:[],heroes:[]};
  const sameRoom=roomRuntime?.heroLocations?heroesInRoom(roomRuntime,roomId):list(heroRuntimes).map(hero=>String(hero?.instanceId||hero?.heroId||'')).filter(Boolean);
  if(roomRuntime?.heroLocations&&!sameRoom.includes(engagerId)) return {ok:false,reason:'engager-not-in-room',roomId,heroIds:[],heroes:[]};
  let selected=[...sameRoom];
  if(spatial&&engagerId){
    selected=combatParticipants(spatial,engagerId,sameRoom,spatialConfig);
  }
  const heroes=selected.map(id=>({id:String(id),runtime:heroRuntimeById(heroRuntimes,id)})).filter(entry=>entry.runtime&&entry.runtime.active!==false&&!entry.runtime.ko&&!entry.runtime.dead);
  if(!heroes.some(entry=>entry.id===engagerId)) return {ok:false,reason:'engager-unavailable',roomId,heroIds:heroes.map(x=>x.id),heroes};
  return {ok:true,reason:null,roomId,heroIds:heroes.map(x=>x.id),heroes};
}

export function startDungeonCombat({
  roomRuntime,
  heroRuntimes=[],
  engagerHeroId=null,
  universe={},
  spatial=null,
  spatialConfig={},
  random=Math.random,
}={}){
  const engagerId=String(engagerHeroId||roomRuntime?.focusedHeroId||'');
  if(!engagerId) return {ok:false,reason:'engager-missing',combat:null,roomId:null,heroIds:[],enemyIds:[]};
  const participants=dungeonHeroParticipants({roomRuntime,heroRuntimes,engagerHeroId:engagerId,spatial,spatialConfig});
  if(!participants.ok) return {...participants,combat:null,enemyIds:[]};
  const enemies=activeDungeonEnemies(roomRuntime,participants.roomId);
  if(!enemies.length) return {ok:false,reason:'no-active-enemies',combat:null,roomId:participants.roomId,heroIds:participants.heroIds,enemyIds:[]};

  const initiativeRule=ensureCombatConfig(universe).initiative;
  const combatants=[];
  for(const entry of participants.heroes){
    const base={
      id:entry.id,
      side:'heroes',
      state:clone(entry.runtime.state||{}),
      ko:Boolean(entry.runtime.ko),
      metadata:{sourceKind:'hero',heroId:String(entry.runtime.heroId||entry.id),instanceId:String(entry.runtime.instanceId||entry.id),roomId:participants.roomId},
    };
    combatants.push({...base,initiative:calculateInitiative(base,initiativeRule,random).total});
  }
  for(const entry of enemies){
    const creature=entry.runtime;
    const base={
      id:String(creature.instanceId||entry.entityId),
      side:'enemies',
      state:clone(creature.state||{}),
      ko:false,
      metadata:{sourceKind:'creature',roomEntityId:entry.entityId,creatureId:String(creature.creatureId||''),roomId:participants.roomId,skillIds:clone(creature.skillIds||[]),ai:clone(creature.ai||{})},
    };
    combatants.push({...base,initiative:calculateInitiative(base,initiativeRule,random).total});
  }

  const combat=createCombatState({combatants});
  combat.metadata={
    kind:'dungeon-room-combat',
    roomId:participants.roomId,
    engagerHeroId:engagerId,
    heroIds:clone(participants.heroIds),
    enemyIds:enemies.map(entry=>String(entry.runtime.instanceId||entry.entityId)),
    enemyEntityIds:enemies.map(entry=>entry.entityId),
  };
  return {
    ok:true,
    reason:null,
    combat,
    roomId:participants.roomId,
    engagerHeroId:engagerId,
    heroIds:clone(participants.heroIds),
    enemyIds:clone(combat.metadata.enemyIds),
    enemyEntityIds:clone(combat.metadata.enemyEntityIds),
  };
}

export function dungeonHeroCombatSkills({combat,heroRuntimes=[],universe={}}={}){
  if(!combat||combat.phase!=='turn'||!combat.activeActorId) return [];
  const actor=combat.actors?.[combat.activeActorId];
  if(!actor||actor.side!=='heroes'||actor.ko) return [];
  const hero=heroRuntimeById(heroRuntimes,actor.id);
  if(!hero) return [];
  const allowed=new Set(resolveHeroSkillIds(hero,universe).map(String));
  return list(universe.skills).filter(skill=>skill?.enabled!==false&&allowed.has(String(skill.id))).map(skill=>clone(skill));
}

function defaultTargetId(combat,skill){
  const actor=combat?.actors?.[combat?.activeActorId];
  if(!actor) return null;
  const targetKind=String(skill?.target||'enemy');
  if(targetKind==='self') return String(actor.id);
  const living=Object.values(combat.actors||{}).filter(candidate=>candidate&&!candidate.ko);
  if(targetKind==='ally') return String(living.find(candidate=>String(candidate.side)===String(actor.side)&&String(candidate.id)!==String(actor.id))?.id||actor.id);
  if(targetKind==='any') return String(living.find(candidate=>String(candidate.id)!==String(actor.id))?.id||actor.id);
  return String(living.find(candidate=>String(candidate.side)!==String(actor.side))?.id||'');
}

export function executeDungeonHeroSkill({
  combat,
  heroRuntimes=[],
  universe={},
  skillId,
  targetId=null,
  spatial=null,
  spatialConfig={},
  actionId=null,
  randomPercent=null,
}={}){
  if(!combat||combat.phase!=='turn') return {ok:false,reason:'not-in-turn',combat};
  const actor=combat.actors?.[combat.activeActorId];
  if(!actor) return {ok:false,reason:'missing-actor',combat};
  if(actor.side!=='heroes') return {ok:false,reason:'not-hero-turn',combat};
  const skills=dungeonHeroCombatSkills({combat,heroRuntimes,universe});
  const skill=skills.find(entry=>String(entry.id)===String(skillId||''));
  if(!skill) return {ok:false,reason:'skill-unavailable',combat};

  const config=ensureCombatConfig(universe);
  const effectiveSkill=clone(skill);
  effectiveSkill.roll=effectiveSkill.roll||{};
  if(effectiveSkill.roll.enabled!==false){
    effectiveSkill.roll.die=Number(effectiveSkill.roll.die)||Number(config.checkDefaults?.die)||100;
    effectiveSkill.roll.mode=effectiveSkill.roll.mode||config.checkDefaults?.mode||'roll-under';
  }
  const selectedTargetId=String(targetId||defaultTargetId(combat,effectiveSkill)||'');
  if(!selectedTargetId) return {ok:false,reason:'missing-target',combat};

  const prepared=prepareSkillAction(combat,effectiveSkill,selectedTargetId,universe,{
    actionId:actionId||`dungeon-${combat.turnSequence}-${actor.id}-${effectiveSkill.id}`,
    targeting:{spatial,config:spatialConfig},
  });
  if(!prepared.ok) return {ok:false,reason:prepared.reason,combat:prepared.combat||combat,targetCheck:prepared.targetCheck||null};
  const resolved=resolveAndAdvance(prepared.combat,{definitions:universe,randomPercent:randomPercent||undefined});
  if(!resolved.resolved) return {ok:false,reason:resolved.reason,combat:resolved.combat||prepared.combat};

  let next=reconcileCombatState(resolved.combat,{defeatRule:config.defeatRule});
  if(next.phase==='turn'&&next.activeActorId){
    next=beginActiveTurn(next,{definitions:universe,defeatRule:config.defeatRule}).combat;
  }
  return {
    ok:true,
    reason:null,
    combat:next,
    skillId:String(effectiveSkill.id),
    targetId:selectedTargetId,
    check:resolved.check||null,
    effects:clone(resolved.effects||[]),
  };
}

export function reconcileDungeonCombatResult({
  combat,
  roomRuntime,
  heroRuntimes=[],
  universe={},
  random=Math.random,
}={}){
  if(!combat||combat.metadata?.kind!=='dungeon-room-combat') return {ok:false,reason:'not-dungeon-combat',combat,roomRuntime,heroRuntimes:clone(heroRuntimes||[]),defeatedEnemyIds:[]};
  if(combat.phase!=='ended') return {ok:false,reason:'combat-not-ended',combat,roomRuntime,heroRuntimes:clone(heroRuntimes||[]),defeatedEnemyIds:[]};
  const roomId=String(combat.metadata?.roomId||'');
  const room=roomRuntime?.rooms?.[roomId];
  if(!room) return {ok:false,reason:'room-runtime-missing',combat,roomRuntime,heroRuntimes:clone(heroRuntimes||[]),defeatedEnemyIds:[]};

  const nextRuntime=clone(roomRuntime);
  let roomState=clone(nextRuntime.rooms[roomId]);
  const nextHeroes=list(heroRuntimes).map(hero=>clone(hero));
  const defeatedEnemyIds=[];

  for(const actor of Object.values(combat.actors||{})){
    if(actor.side==='heroes'){
      const hero=heroRuntimeById(nextHeroes,actor.id);
      if(!hero) continue;
      hero.state=clone(actor.state||hero.state||{});
      hero.ko=Boolean(actor.ko);
      if(hero.ko) hero.active=false;
      else if(!hero.dead) hero.active=true;
      continue;
    }
    if(actor.side!=='enemies') continue;
    const entityId=String(actor.metadata?.roomEntityId||'');
    const entity=(roomState.entities||[]).find(entry=>String(entry.id)===entityId);
    if(!entity?.data?.creatureRuntime) continue;
    entity.data.creatureRuntime.state=clone(actor.state||entity.data.creatureRuntime.state||{});
    if(!actor.ko) continue;
    const defeated=resolveRoomCreatureDefeat(roomState,entityId,universe,{random});
    if(defeated.ok||defeated.reason==='already-claimed'){
      roomState=defeated.roomRuntime;
      defeatedEnemyIds.push(entityId);
    }
  }

  nextRuntime.rooms[roomId]=roomState;
  const heroesStillAlive=nextHeroes.some(hero=>hero&&!hero.dead&&!hero.ko&&hero.active!==false);
  return {
    ok:true,
    reason:null,
    combat:clone(combat),
    roomRuntime:nextRuntime,
    heroRuntimes:nextHeroes,
    defeatedEnemyIds,
    roomCleared:activeDungeonEnemies(nextRuntime,roomId).length===0,
    heroesStillAlive,
    outcome:combat.winner==='heroes'?'victory':combat.winner==='enemies'?'defeat':'ended',
  };
}
