import { appendCombatEvent } from './combat-session.js';

function clone(value){return structuredClone(value);}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function heroRuntimeById(heroRuntimes=[],actorId){
  const id=String(actorId||'');
  return list(heroRuntimes).find(hero=>String(hero?.instanceId||hero?.heroId||'')===id)||null;
}

export function fleeDungeonCombat({combat,roomRuntime,heroRuntimes=[]}={}){
  if(!combat||combat.metadata?.kind!=='dungeon-room-combat') return {ok:false,reason:'not-dungeon-combat',combat,roomRuntime,heroRuntimes:clone(heroRuntimes||[])};
  if(combat.phase!=='turn') return {ok:false,reason:'combat-not-active',combat,roomRuntime,heroRuntimes:clone(heroRuntimes||[])};

  const nextHeroes=list(heroRuntimes).map(hero=>clone(hero));
  for(const actor of Object.values(combat.actors||{})){
    if(actor?.side!=='heroes') continue;
    const hero=heroRuntimeById(nextHeroes,actor.id);
    if(!hero) continue;
    hero.state=clone(actor.state||hero.state||{});
    hero.ko=Boolean(actor.ko);
    if(hero.ko) hero.active=false;
    else if(!hero.dead) hero.active=true;
  }

  let fled=clone(combat);
  fled=appendCombatEvent(fled,'combat-fled',{
    roomId:String(combat.metadata?.roomId||''),
    heroIds:clone(combat.metadata?.heroIds||[]),
    enemyIds:clone(combat.metadata?.enemyIds||[]),
  });
  fled.phase='fled';
  fled.winner=null;
  fled.activeActorId=null;
  fled.pendingAction=null;
  fled.metadata={...(fled.metadata||{}),fled:true};

  const heroesStillAlive=nextHeroes.some(hero=>hero&&!hero.dead&&!hero.ko&&hero.active!==false);
  return {
    ok:true,
    reason:null,
    combat:fled,
    roomRuntime:clone(roomRuntime),
    heroRuntimes:nextHeroes,
    roomId:String(combat.metadata?.roomId||''),
    enemyStatesRestored:true,
    heroesStillAlive,
    outcome:'fled',
  };
}
