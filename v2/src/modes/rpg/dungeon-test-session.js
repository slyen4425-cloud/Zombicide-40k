import {createDungeonRuntime} from './room-runtime.js';
import {createHeroRuntime} from './hero-engine.js';
import {buildWorldIndex,validateWorld} from './world-engine.js';
import {createSpatialState,setActorPosition} from './spatial-engine.js';
import {createDungeonDemoLaunch,hasConfiguredDungeonHeroes} from './dungeon-demo-content.js';

function list(source,key){return Array.isArray(source?.[key])?source[key]:Object.values(source?.[key]||{});}
function clone(value){return structuredClone(value);}

export const DUNGEON_TEST_SESSION_CONTRACT=Object.freeze({
  usesConfiguredWorld:true,
  usesConfiguredHeroes:true,
  inMemoryDemoFallback:true,
  persistsNothing:true,
  inventsGameplayDefinitions:false,
});

export function createDungeonTestSession({universe={},worldDraft={},layoutProvider=null,allowDemoFallback=true}={}){
  let launchUniverse=universe||{};
  let effectiveLayoutProvider=layoutProvider;
  let demo=false;
  let heroes=list(launchUniverse,'heroes').filter(hero=>hero&&hero.enabled!==false&&hero.id);

  if(!heroes.length&&allowDemoFallback&&!hasConfiguredDungeonHeroes(launchUniverse)){
    const demoLaunch=createDungeonDemoLaunch({worldDraft,layoutProvider});
    if(!demoLaunch.ok) return demoLaunch;
    launchUniverse=demoLaunch.universe;
    effectiveLayoutProvider=demoLaunch.layoutProvider;
    heroes=list(launchUniverse,'heroes').filter(hero=>hero&&hero.enabled!==false&&hero.id);
    demo=true;
  }
  if(!heroes.length) return {ok:false,reason:'dungeon-test-no-heroes'};

  const worldIndex=buildWorldIndex(worldDraft||{});
  const validation=validateWorld(worldIndex);
  if(!validation.valid) return {ok:false,reason:'dungeon-test-world-invalid',validation};

  const startRoomId=worldDraft?.world?.startRoomId||worldIndex?.world?.startRoomId||null;
  if(!startRoomId) return {ok:false,reason:'dungeon-test-start-room-missing'};

  const heroRuntimes=heroes.map(hero=>createHeroRuntime(hero,launchUniverse,{instanceId:String(hero.id)}));
  const created=createDungeonRuntime(worldIndex,{
    startRoomId,
    layoutProvider:effectiveLayoutProvider,
    quests:list(launchUniverse,'quests'),
    questDefinitions:launchUniverse,
    heroIds:heroes.map(hero=>String(hero.id)),
    focusedHeroId:String(heroes[0].id),
  });
  if(!created.ok) return {ok:false,reason:created.reason||'dungeon-test-runtime-failed'};

  let spatial=null;
  if(demo){
    spatial=createSpatialState({zoneId:String(startRoomId)});
    spatial=setActorPosition(spatial,String(heroes[0].id),{x:1,y:1,zoneId:String(startRoomId)});
    spatial=setActorPosition(spatial,'demo_enemy_instance',{x:4,y:1,zoneId:String(startRoomId)});
    created.runtime.spatial=clone(spatial);
  }

  return {
    ok:true,
    demo,
    universe:clone(launchUniverse),
    worldIndex,
    roomRuntime:created.runtime,
    heroRuntimes:clone(heroRuntimes),
    spatial:spatial?clone(spatial):null,
    focusedHeroId:String(heroes[0].id),
    startRoomId:String(startRoomId),
  };
}
