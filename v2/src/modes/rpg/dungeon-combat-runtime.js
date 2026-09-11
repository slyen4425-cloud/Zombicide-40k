import { createCombatState } from './combat-engine.js';
import { calculateInitiative } from './initiative.js';
import { ensureCombatConfig } from './combat-config.js';
import { combatParticipants } from './spatial-engine.js';
import { getHeroRoomLocation, heroesInRoom } from './room-runtime.js';

function clone(value){return structuredClone(value);}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function heroRuntimeById(heroRuntimes=[],heroId){
  const id=String(heroId||'');
  return list(heroRuntimes).find(hero=>String(hero?.instanceId||'')===id||String(hero?.heroId||'')===id)||null;
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
