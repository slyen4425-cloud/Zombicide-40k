/* GenSrpG Core Stats runtime adapter — transition from the legacy canonical stats owner.
   Generic stat/effect evaluation belongs to core/stats.js. This adapter only translates
   existing GenSrpG runtime/profile data into Core inputs; editor, storage and migrations
   remain temporarily owned by gens-rpg-stats-clean-167874.js.
*/
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgCoreStatsRuntimeAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";

  const VERSION="1.0.0";
  const SPECIAL_NATIVE=Object.freeze(["defense","armor","movement"]);
  const SPECIAL_SET=new Set(SPECIAL_NATIVE);
  let installed=false;
  let originals=null;

  const str=value=>String(value??"");
  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

  function core(rt=R){return rt?.GensRpgCoreStats||null}
  function legacy(rt=R){return rt?.GensCleanRpgStats167874||null}
  function profile(rt=R){
    try{return rt?.currentRpgProfile?.()||rt?.getActiveGameProfile?.()||null}catch(e){return null}
  }
  function heroState(rt,heroId){
    const id=str(heroId);
    try{if(id===str(rt?.current)&&rt?.state)return rt.state}catch(e){}
    try{return rt?.loadState?.(id)||null}catch(e){return null}
  }
  function heroRecord(rt,heroId){
    const id=str(heroId);
    try{return rt?.CHARS?.[id]||rt?.findCustomHero?.(id)||null}catch(e){return rt?.CHARS?.[id]||null}
  }
  function definitionMap(api){
    return new Map((api?.defs?.()||[]).map(def=>[str(def?.id),def]).filter(([id])=>!!id));
  }
  function activeIds(api,p){
    try{
      const stats=api?.root?.(p);
      if(Array.isArray(stats?.active))return stats.active.slice();
    }catch(e){}
    return (api?.defs?.()||[]).filter(def=>api?.active?.(def?.id)).map(def=>def.id);
  }
  function rawBase(rt,api,heroId,id,defs){
    const cid=str(id),def=defs.get(cid),st=heroState(rt,heroId),rec=heroRecord(rt,heroId);
    if(!def)return 0;
    const fromState=st?.rpgAttributes?.[cid];
    if(Number.isFinite(Number(fromState)))return num(fromState);
    if(SPECIAL_SET.has(cid)){
      const movementDefault=cid==="movement"?profile(rt)?.rpgUniverse?.movement?.defaults?.hero:undefined;
      return num(rec?.dungeonStats?.[cid]??rec?.[cid]??movementDefault,def.defaultValue);
    }
    return num(rec?.dungeonStats?.[cid],def.defaultValue);
  }
  function effectiveBase(rt,api,heroId,id,defs){
    const cid=str(id),st=heroState(rt,heroId);
    if(!defs.has(cid)||!api?.active?.(cid))return 0;
    let value=rawBase(rt,api,heroId,cid,defs);
    const current=str(heroId)===str(rt?.current);
    if(SPECIAL_SET.has(cid)){
      if(current&&(cid==="defense"||cid==="armor")){
        try{value+=num(rt?.dungeonEquipmentBonus?.(cid),0)}catch(e){}
        try{value+=num(rt?.dungeonSkillEffectTotal?.(cid),0)}catch(e){}
      }
      return value;
    }
    try{value+=num(rt?.dungeonEquipmentBonus?.(cid),0)}catch(e){}
    try{value+=num(rt?.dungeonSkillEffectTotal?.("attribute",null,cid),0)}catch(e){}
    try{value+=num(rt?.dungeonChallengeDebuffTotal067?.(cid,st),0)}catch(e){}
    return value;
  }
  function createEvaluator(rt=R,heroId=str(rt?.current||"")){
    const Core=core(rt),Legacy=legacy(rt),p=profile(rt);
    if(!Core?.createEvaluator||!Legacy?.defs||!Legacy?.effects)return null;
    const definitions=Legacy.defs(),defs=new Map(definitions.map(def=>[str(def?.id),def]).filter(([id])=>!!id));
    return Core.createEvaluator({
      definitions,
      activeIds:activeIds(Legacy,p),
      effects:Legacy.effects(),
      getBaseValue:id=>effectiveBase(rt,Legacy,heroId,id,defs),
      directTargets:SPECIAL_NATIVE,
    });
  }
  function value(rt=R,heroId=str(rt?.current||""),id="",seen=new Set()){
    const evaluator=createEvaluator(rt,heroId);
    if(evaluator)return evaluator.value(id,seen);
    return originals?.value?.call(legacy(rt),heroId,id,seen)??0;
  }
  function extraTotal(rt=R,target="",heroId=str(rt?.current||""),seen=new Set()){
    const evaluator=createEvaluator(rt,heroId);
    if(evaluator)return evaluator.totalForTarget(target,seen);
    return originals?.extraTotal?.call(legacy(rt),target,heroId,seen)??0;
  }
  function runtimeDefinitions(rt=R){
    const evaluator=createEvaluator(rt,str(rt?.current||""));
    if(evaluator)return evaluator.runtimeDefinitions();
    return originals?.runtimeDefs?.call(legacy(rt))||[];
  }
  function breakdown(rt=R,heroId=str(rt?.current||""),id=""){
    const evaluator=createEvaluator(rt,heroId);
    return evaluator?.breakdown?.(id)||null;
  }
  function install(rt=R){
    const Core=core(rt),Legacy=legacy(rt);
    if(!Core?.createEvaluator||!Legacy?.value||!Legacy?.extraTotal||!Legacy?.runtimeDefs)return false;
    if(Legacy.__gensCoreStatsRuntimeAdapter){installed=true;return true}
    originals={value:Legacy.value,extraTotal:Legacy.extraTotal,runtimeDefs:Legacy.runtimeDefs};
    Legacy.value=function(heroId,id,seen){return value(rt,heroId,id,seen)};
    Legacy.extraTotal=function(target,heroId,seen){return extraTotal(rt,target,heroId,seen)};
    Legacy.runtimeDefs=function(){return runtimeDefinitions(rt)};
    Legacy.breakdown=function(heroId,id){return breakdown(rt,heroId,id)};
    Legacy.__gensCoreStatsRuntimeAdapter=true;
    Legacy.__gensCoreStatsOriginals=originals;
    installed=true;
    try{rt?.GensMobileCombatPerformance16781022?.install?.()}catch(e){}
    return true;
  }
  function status(rt=R){
    return {
      installed:!!legacy(rt)?.__gensCoreStatsRuntimeAdapter&&installed,
      coreVersion:core(rt)?.VERSION||"",
      legacyVersion:legacy(rt)?.VERSION||"",
    };
  }

  const api={VERSION,SPECIAL_NATIVE,createEvaluator,value,extraTotal,runtimeDefinitions,breakdown,install,status};
  if(core(R)?.createEvaluator&&legacy(R)?.value)install(R);
  return api;
});
