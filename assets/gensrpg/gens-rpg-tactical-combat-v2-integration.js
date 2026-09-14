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

  function loadVisualDice1142(){
    const D=R.document;if(!D||R.__gensTacticalVisualDiceLoader1142)return false;
    R.__gensTacticalVisualDiceLoader1142=true;
    const install=()=>{try{R.GensRpgTacticalVisualDice16781142?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V114.2 visual/dice install",e)}};
    if(R.GensRpgTacticalVisualDice16781142){install();return true}
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js?v=16.78.114.2";
    s.async=false;s.onload=install;s.onerror=()=>console.error("GenSrpG V114.2 visual/dice load failed");
    (D.head||D.documentElement).appendChild(s);return true;
  }

  function loadHotfix114(){
    const D=R.document;if(!D||R.__gensTacticalHotfixLoader114)return false;
    R.__gensTacticalHotfixLoader114=true;
    const install=()=>{try{R.GensRpgTacticalHotfix1678114?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V114 tactical hotfix install",e)}loadVisualDice1142()};
    if(R.GensRpgTacticalHotfix1678114){install();return true}
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-hotfix-1678114.js?v=16.78.114.1";
    s.async=false;s.onload=install;s.onerror=()=>{console.error("GenSrpG V114 tactical hotfix load failed");loadVisualDice1142()};
    (D.head||D.documentElement).appendChild(s);return true;
  }

  function loadAuthority113(){
    const D=R.document;if(!D)return false;
    const after113=()=>{
      try{R.GensRpgTacticalRuntimeAuthority1678113?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V113 tactical runtime authority install",e)}
      loadHotfix114();
    };
    if(R.GensRpgTacticalRuntimeAuthority1678113){after113();return true}
    if(R.__gensTacticalAuthorityLoader113){loadHotfix114();return true}
    R.__gensTacticalAuthorityLoader113=true;
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js?v=16.78.113";
    s.async=false;s.onload=after113;s.onerror=()=>{console.error("GenSrpG V113 tactical runtime authority load failed");loadHotfix114()};
    (D.head||D.documentElement).appendChild(s);return true;
  }

  function loadCoherence112(){
    const D=R.document;if(!D)return false;
    const after112=()=>{
      try{R.GensRpgTacticalCombatCoherence1678112?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V112 combat coherence install",e)}
      loadAuthority113();
    };
    if(R.GensRpgTacticalCombatCoherence1678112){after112();return true}
    if(R.__gensTacticalCoherenceLoader112){loadAuthority113();return true}
    R.__gensTacticalCoherenceLoader112=true;
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js?v=16.78.112";
    s.async=false;s.onload=after112;s.onerror=()=>{console.error("GenSrpG V112 combat coherence load failed");loadAuthority113()};
    (D.head||D.documentElement).appendChild(s);return true;
  }

  function loadRuntime111(){
    const D=R.document;if(!D)return false;
    const after111=()=>{
      try{R.GensRpgTacticalRuntimeFixes1678111?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V111 tactical runtime install",e)}
      loadCoherence112();
    };
    if(R.GensRpgTacticalRuntimeFixes1678111){after111();return true}
    if(R.__gensTacticalRuntimeLoader111){loadCoherence112();return true}
    R.__gensTacticalRuntimeLoader111=true;
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js?v=16.78.111";
    s.async=false;s.onload=after111;s.onerror=()=>{console.error("GenSrpG V111 tactical runtime load failed");loadCoherence112()};
    (D.head||D.documentElement).appendChild(s);return true;
  }

  function loadStats110(){
    const D=R.document;if(!D)return false;
    const after110=()=>{
      try{R.GensRpgTacticalStats1678110?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V110 tactical stats install",e)}
      loadRuntime111();
    };
    if(R.GensRpgTacticalStats1678110){after110();return true}
    if(R.__gensTacticalStatsLoader110){loadRuntime111();return true}
    R.__gensTacticalStatsLoader110=true;
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js?v=16.78.110";
    s.async=false;s.onload=after110;s.onerror=()=>{console.error("GenSrpG V110 tactical stats load failed");loadRuntime111()};
    (D.head||D.documentElement).appendChild(s);return true;
  }

  function loadPolish109(){
    const D=R.document;if(!D)return false;
    const after109=()=>{
      try{R.GensRpgTacticalPolish1678109?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V109 polish install",e)}
      loadStats110();
    };
    if(R.GensRpgTacticalPolish1678109){after109();return true}
    if(R.__gensTacticalPolishLoader109){loadStats110();return true}
    R.__gensTacticalPolishLoader109=true;
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js?v=16.78.109";
    s.async=false;s.onload=after109;s.onerror=()=>{console.error("GenSrpG V109 polish load failed");loadStats110()};
    (D.head||D.documentElement).appendChild(s);return true;
  }

  /* V108 remains the movement/action bridge. V109 owns timeline/range polish.
     V110 snapshots canonical RPG stats. V111 preserves weapon dice and the fixed dock.
     V112 keeps detailed sheets and readable result explanations.
     V113 owns room/sub-room participant scope.
     V114.1 keeps the validated live enemy vision.
     V114.2 loads last and owns only wall visuals + Survival dice presentation. */
  function loadPolish108(){
    const D=R.document;if(!D)return false;
    const after108=()=>{
      try{R.GensRpgTacticalPolish1678108?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V108 polish install",e)}
      loadPolish109();
    };
    if(R.GensRpgTacticalPolish1678108){after108();return true}
    if(R.__gensTacticalPolishLoader108){loadPolish109();return true}
    R.__gensTacticalPolishLoader108=true;
    const s=D.createElement("script");
    s.src="assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js?v=16.78.108";
    s.async=false;s.onload=after108;s.onerror=()=>{console.error("GenSrpG V108 polish load failed");loadPolish109()};
    (D.head||D.documentElement).appendChild(s);return true;
  }
  loadPolish108();
})(typeof globalThis!=="undefined"?globalThis:this);