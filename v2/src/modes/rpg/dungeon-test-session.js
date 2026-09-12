import {createDungeonRuntime} from './room-runtime.js';
import {createHeroRuntime} from './hero-engine.js';
import {buildWorldIndex,validateWorld} from './world-engine.js';

function list(source,key){return Array.isArray(source?.[key])?source[key]:Object.values(source?.[key]||{});}
function clone(value){return structuredClone(value);}

export const DUNGEON_TEST_SESSION_CONTRACT=Object.freeze({
  usesConfiguredWorld:true,
  usesConfiguredHeroes:true,
  persistsNothing:true,
  inventsGameplayDefinitions:false,
});

export function createDungeonTestSession({universe={},worldDraft={},layoutProvider=null}={}){
  const heroes=list(universe,'heroes').filter(hero=>hero&&hero.enabled!==false&&hero.id);
  if(!heroes.length) return {ok:false,reason:'dungeon-test-no-heroes'};

  const worldIndex=buildWorldIndex(worldDraft||{});
  const validation=validateWorld(worldIndex);
  if(!validation.valid) return {ok:false,reason:'dungeon-test-world-invalid',validation};

  const startRoomId=worldDraft?.world?.startRoomId||worldIndex?.world?.startRoomId||null;
  if(!startRoomId) return {ok:false,reason:'dungeon-test-start-room-missing'};

  const heroRuntimes=heroes.map(hero=>createHeroRuntime(hero,universe,{instanceId:String(hero.id)}));
  const created=createDungeonRuntime(worldIndex,{
    startRoomId,
    layoutProvider,
    quests:list(universe,'quests'),
    questDefinitions:universe,
    heroIds:heroes.map(hero=>String(hero.id)),
    focusedHeroId:String(heroes[0].id),
  });
  if(!created.ok) return {ok:false,reason:created.reason||'dungeon-test-runtime-failed'};

  return {
    ok:true,
    worldIndex,
    roomRuntime:created.runtime,
    heroRuntimes:clone(heroRuntimes),
    focusedHeroId:String(heroes[0].id),
    startRoomId:String(startRoomId),
  };
}
