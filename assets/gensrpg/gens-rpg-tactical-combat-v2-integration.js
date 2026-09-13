/* GenSrpG Tactical Combat V2 — GenSrpG outcome integration.
   Rewards are resolved once at commit; legacy combat timeline is never started. */
(function(root){
  "use strict";
  const R=root||globalThis,A=R.GensRpgTacticalCombatV2Adapter;if(!A||A.__gensTacticalIntegration103)return;
  const oldCommit=A.commitBattle;
  const str=v=>String(v??"");
  const arr=v=>Array.isArray(v)?v:[];
  function loadEnemies(){try{return arr(R.loadActiveEnemies?.())}catch(e){return []}}
  function defOf(inst){try{return R.activeEnemyDefinition?.(inst?.enemyId)||null}catch(e){return null}}
  function killerFor(battle,actor){
    const hit=[...arr(battle?.log)].reverse().find(x=>x?.type==="attack"&&str(x.targetId)===str(actor.id)&&x.hit);
    if(hit?.attackerId)return str(hit.attackerId);
    return str(battle?.actors?.find(a=>a.side==="hero"&&a.alive)?.id||battle?.actors?.find(a=>a.side==="hero")?.id||"");
  }
  function processRewards(battle,before){
    if(!battle||battle.__gensRewardsCommitted)return [];
    const rewards=[];
    for(const actor of arr(battle.actors).filter(a=>a.side==="enemy"&&!a.alive)){
      const iid=str(actor.meta?.instanceId),inst=before.find(x=>str(x.id)===iid);if(!inst)continue;
      const def=defOf(inst);if(!def)continue;
      const killerId=killerFor(battle,actor);let drops=[],xp={total:0,shares:[]};
      try{if(typeof R.rollEnemyLoot==="function")drops=R.rollEnemyLoot(inst,def)||[]}catch(e){console.warn("V2 loot",e)}
      try{if(typeof R.awardDungeonDefeatXp==="function")xp=R.awardDungeonDefeatXp(def,killerId)||xp}catch(e){console.warn("V2 xp",e)}
      try{if(drops.length&&typeof R.grantEnemyLootToHeroId==="function")R.grantEnemyLootToHeroId(killerId,drops)}catch(e){console.warn("V2 grant loot",e)}
      try{if(typeof R.dungeonRecordCombatReward==="function")R.dungeonRecordCombatReward(def,xp,drops,killerId)}catch(e){}
      rewards.push({instanceId:iid,enemyId:str(inst.enemyId),killerId,xp,drops});
    }
    battle.__gensRewardsCommitted=true;return rewards;
  }
  A.commitBattle=function(rt=R,battle,opts={}){
    const before=loadEnemies(),rewards=processRewards(battle,before),result=oldCommit.call(this,rt,battle,opts)||{};
    try{R.updateDungeonExploreButtons?.()}catch(e){}
    try{R.renderActiveEnemies?.()}catch(e){}
    return {...result,rewards};
  };
  A.__gensTacticalIntegration103=true;
})(typeof globalThis!=="undefined"?globalThis:this);
