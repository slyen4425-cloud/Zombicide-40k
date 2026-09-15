/* GenSrpG Tactical Combat V2 — hard Dungeon combat router.
   V16.78.106: the tactical engine owns RPG/Dungeon combat, including the real Runtime 2.00 renderer seam.
   Legacy combat is kept only for non-Dungeon contexts and as inert rollback code. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Bridge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.6.0",APP_VERSION="16.78.114.10";
  let opening=false,installed=false,repairLoading=false;
  let legacyStart=null,legacySetup=null,legacyLaunch=null,legacyStartCombatFn=null;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");

  function activeProfile(rt=R){
    try{const p=rt?.getActiveGameProfile?.();if(p)return p}catch(e){}
    try{const p=rt?.activeGameProfileRaw?.();if(p)return p}catch(e){}
    return null;
  }
  function dungeonContext(rt=R){
    try{
      const fam=rt?.localStorage?.getItem?.("gensrpg_session_family_guard_v1");
      if(fam==="adventure")return true;
      if(fam==="survival")return false;
    }catch(e){}
    const p=activeProfile(rt);
    if(p?.gameStyle)return p.gameStyle==="dungeon";
    try{if(typeof rt?.currentGameStyle==="function"){const s=rt.currentGameStyle();if(s)return s==="dungeon"}}catch(e){}
    try{if(typeof rt?.isDungeonMode==="function")return !!rt.isDungeonMode()}catch(e){}
    return false;
  }
  function reconcileAdventureFamily(rt=R){
    if(!dungeonContext(rt))return false;
    try{rt?.GensSurvivalModeIsolation1678104?.rememberFamily?.("adventure")}catch(e){}
    return true;
  }
  function eligible(rt=R,options={}){
    if(!dungeonContext(rt))return {ok:false,reason:"not-dungeon"};
    reconcileAdventureFamily(rt);
    const A=rt?.GensRpgTacticalCombatV2Adapter,U=rt?.GensRpgTacticalCombatV2Ui;
    if(!rt?.GensRpgTacticalCombatV2||!A||!U)return {ok:false,reason:"modules-missing"};
    const requestedHeroes=arr(options.heroIds).length?arr(options.heroIds):arr(A.participants?.(rt)),heroes=typeof A.enteredParticipants==="function"?arr(A.enteredParticipants(rt,requestedHeroes,options.scope)):requestedHeroes;
    const wanted=arr(options.enemyIds).map(str),all=arr(A.activeEnemies?.(rt)),enemies=wanted.length?all.filter(e=>wanted.includes(str(e.id))):all;
    if(!heroes.length)return {ok:false,reason:"no-entered-heroes"};
    if(!enemies.length)return {ok:false,reason:"no-enemies"};
    return {ok:true,heroes:heroes.length,enemies:enemies.length,heroIds:heroes.map(str),enemyIds:enemies.map(e=>str(e.id))};
  }
  function currentBattle(rt=R){try{return rt?.GensRpgTacticalCombatV2Ui?.getBattle?.()||null}catch(e){return null}}
  function finishExploration(rt,battle,summary,reason){
    try{rt.document?.body?.style&&(rt.document.body.style.overflow="")}catch(e){}
    try{rt.updateDungeonExploreButtons?.()}catch(e){}
    try{rt.DungeonCore01?.render?.()}catch(e){try{rt.renderDungeonCore01?.()}catch(_){}}
    try{
      const win=battle?.winner;
      if(win==="hero")rt.showToast?.("🏆 Combat tactique remporté");
      else if(win==="enemy")rt.showToast?.("💀 Groupe vaincu");
      else rt.showToast?.("⚔️ Combat tactique terminé");
    }catch(e){}
    try{rt.dispatchEvent?.(new CustomEvent("gensrpg:tactical-combat-finished",{detail:{winner:battle?.winner||null,summary:summary||null,reason:reason||""}}))}catch(e){}
  }
  function reportBlocked(rt,result,entry){
    const detail=result?.reason||"unknown";
    try{rt.showToast?.("⚠️ Combat tactique V2 indisponible : "+detail)}catch(e){}
    try{rt.console?.error?.("Combat tactique V2 route blocked",{entry,detail,result})}catch(e){}
    return result||{ok:false,reason:detail};
  }
  function isV113DetectionReason(reason){return /detect|vision|rep[eé]rage|ambush|embuscade/i.test(str(reason))}
  function prepareV113Detection(rt=R,authority=null,options={}){
    if(!isV113DetectionReason(options.reason)||typeof authority?.detectionPairs!=="function")return {ok:true,options};
    const pairs=arr(authority.detectionPairs(rt)),visible=new Set(pairs.map(p=>str(p?.enemyId)).filter(Boolean));
    let enemyIds=arr(options.enemyIds).map(str).filter(Boolean);if(!enemyIds.length)enemyIds=[...visible];
    enemyIds=enemyIds.filter(id=>visible.has(id));if(!enemyIds.length)return {ok:false,reason:"not-detected-v113",pairs};
    const relevant=pairs.filter(p=>enemyIds.includes(str(p?.enemyId))),sourceHeroIds=[...new Set(relevant.map(p=>str(p?.heroId)).filter(Boolean))],scope=relevant.find(p=>p?.scope)?.scope||options.scope;
    const prepared={...options,enemyIds,scope,sourceHeroIds};
    if(scope&&sourceHeroIds.length){
      rt.__gensTacticalV113Context={scope,sourceHeroIds,enemyIds,reason:options.reason,at:Date.now()};
    }
    return {ok:true,options:prepared,pairs};
  }
  function scopedRequest(rt=R,options={}){
    const authority=rt?.GensRpgTacticalRuntimeAuthority1678113;
    if(typeof authority?.selectCombatants!=="function")return {ok:true,options};
    try{
      const prepared=prepareV113Detection(rt,authority,options);if(!prepared.ok)return prepared;
      const selection=authority.selectCombatants(rt,prepared.options||{}),heroIds=arr(selection?.heroIds).map(str).filter(Boolean),enemyIds=arr(selection?.enemyIds).map(str).filter(Boolean);
      if(!heroIds.length||!enemyIds.length)return {ok:false,reason:"no-scoped-combatants-v113",selection};
      return {ok:true,options:{...prepared.options,heroIds,enemyIds,scope:selection?.scope||prepared.options?.scope,sourceHeroIds:arr(selection?.sourceHeroIds).map(str).filter(Boolean)},selection};
    }catch(error){
      try{rt?.console?.error?.("Combat tactique V2 V113 scope",error)}catch(e){}
      return {ok:false,reason:"scope-failed-v113",error};
    }
  }
  function openCurrent(rt=R,options={}){
    if(opening||currentBattle(rt))return {ok:false,reason:"battle-already-open"};
    const e=eligible(rt,options);if(!e.ok)return e;
    opening=true;
    try{
      const merged={...options,heroIds:e.heroIds,enemyIds:e.enemyIds,onFinish:({battle,summary}={})=>finishExploration(rt,battle,summary,options.reason)};
      const battle=rt.GensRpgTacticalCombatV2Ui.openCurrentEncounter(merged);
      try{rt.document?.body?.style&&(rt.document.body.style.overflow="hidden")}catch(_){ }
      rt.__gensTacticalV2LastRoute={entry:options.entry||"openCurrent",reason:options.reason||"",at:Date.now(),enemyIds:e.enemyIds,heroIds:e.heroIds};
      return {ok:true,battle};
    }catch(err){
      try{rt.console?.error?.("Combat tactique V2",err)}catch(e){}
      return {ok:false,reason:"open-failed",error:err};
    }finally{opening=false}
  }
  function requestCombat(rt=R,options={}){
    const entry=str(options.entry||"requestCombat")||"requestCombat";
    const enemyIds=arr(options.enemyIds).map(str).filter(Boolean),scoped=scopedRequest(rt,{...options,enemyIds,entry});
    if(!scoped.ok)return reportBlocked(rt,scoped,entry);
    const result=openCurrent(rt,{...scoped.options,entry});
    return result.ok?result:reportBlocked(rt,result,entry);
  }
  function startDefault(rt=R,enemyIds=[],reason="manual"){
    if(!dungeonContext(rt))return typeof legacyStart==="function"?legacyStart.call(rt,enemyIds,reason):{ok:false,reason:"not-dungeon"};
    return requestCombat(rt,{enemyIds:arr(enemyIds).map(str),reason,entry:"dc200StartCombat"});
  }
  function setupDefault(rt=R){
    if(!dungeonContext(rt))return typeof legacySetup==="function"?legacySetup.call(rt):{ok:false,reason:"not-dungeon"};
    return requestCombat(rt,{reason:"manual-setup",entry:"openDungeonCombatSetup"});
  }
  function launchDefault(rt=R,x=null,chosen=[]){
    if(!dungeonContext(rt))return typeof legacyLaunch==="function"?legacyLaunch.apply(rt,[x,chosen]):false;
    const ids=arr(chosen).map(e=>str(e?.id??e)).filter(Boolean);
    const result=requestCombat(rt,{enemyIds:ids,reason:"legacy-launch",entry:"launchCombat200"});
    return !!result.ok;
  }
  function directStartDefault(rt=R,ids=[],reason="manual"){
    if(!dungeonContext(rt))return typeof legacyStartCombatFn==="function"?legacyStartCombatFn.apply(rt,[ids,reason]):false;
    return requestCombat(rt,{enemyIds:arr(ids).map(str),reason,entry:"dc200StartCombat"});
  }
  function rememberLegacy(current,kind){
    if(typeof current!=="function"||current.__gensTacticalV2Default)return;
    if(kind==="start"&&!legacyStart)legacyStart=current;
    if(kind==="setup"&&!legacySetup)legacySetup=current;
    if(kind==="launch"&&!legacyLaunch)legacyLaunch=current;
    if(kind==="startCombat"&&!legacyStartCombatFn)legacyStartCombatFn=current;
  }
  function installRepair(rt=R){
    try{if(rt?.GensRpgRuntimeRepair1678106?.install)return !!rt.GensRpgRuntimeRepair1678106.install(rt)}catch(e){try{rt.console?.error?.("V106 runtime repair install",e)}catch(_){} }
    return false;
  }
  function ensureRuntimeRepair(rt=R){
    if(installRepair(rt))return true;
    const D=rt?.document;if(!D?.createElement||repairLoading)return false;
    repairLoading=true;
    try{
      const s=D.createElement("script");
      s.src="assets/gensrpg/gens-rpg-runtime-repair-1678106.js?v=16.78.106";
      s.async=false;
      s.onload=()=>{repairLoading=false;installRepair(rt);setTimeout(()=>installRepair(rt),250);setTimeout(()=>installRepair(rt),1200)};
      s.onerror=()=>{repairLoading=false;try{rt.console?.error?.("GenSrpG V106 runtime repair load failed")}catch(e){}};
      (D.head||D.documentElement)?.appendChild?.(s);
      return true;
    }catch(e){repairLoading=false;return false}
  }
  function install(rt=R){
    if(!rt?.GensRpgTacticalCombatV2||!rt?.GensRpgTacticalCombatV2Adapter||!rt?.GensRpgTacticalCombatV2Ui)return false;
    rememberLegacy(rt.dc200StartCombat,"start");
    rememberLegacy(rt.openDungeonCombatSetup,"setup");
    rememberLegacy(rt.launchCombat200,"launch");
    rememberLegacy(rt.startCombat,"startCombat");

    const start=function(enemyIds,reason){return startDefault(rt,enemyIds,reason)};
    start.__gensTacticalV2Default=true;start.__legacy=legacyStart;rt.dc200StartCombat=start;

    const setup=function(){return setupDefault(rt)};
    setup.__gensTacticalV2Default=true;setup.__legacy=legacySetup;rt.openDungeonCombatSetup=setup;

    if(typeof rt.launchCombat200==="function"){
      const launch=function(x,chosen){return launchDefault(rt,x,chosen)};
      launch.__gensTacticalV2Default=true;launch.__legacy=legacyLaunch;rt.launchCombat200=launch;
    }
    if(typeof rt.startCombat==="function"){
      const direct=function(ids,reason){return directStartDefault(rt,ids,reason)};
      direct.__gensTacticalV2Default=true;direct.__legacy=legacyStartCombatFn;rt.startCombat=direct;
    }

    rt.openTacticalCombatV2=(opts={})=>requestCombat(rt,{...opts,entry:opts.entry||"openTacticalCombatV2"});
    rt.GENS_TACTICAL_V2_DEFAULT=true;
    rt.GENS_TACTICAL_V2_ROUTER_VERSION=APP_VERSION;
    installed=true;
    ensureRuntimeRepair(rt);
    try{rt.dispatchEvent?.(new CustomEvent("gensrpg:tactical-combat-ready",{detail:{version:APP_VERSION}}))}catch(e){}
    return true;
  }
  function status(rt=R){return {installed,dungeon:dungeonContext(rt),router:rt?.GENS_TACTICAL_V2_ROUTER_VERSION||"",battle:!!currentBattle(rt),repair:rt?.GensRpgRuntimeRepair1678106?.status?.(rt)||null,last:rt?.__gensTacticalV2LastRoute||null}}
  return {VERSION,APP_VERSION,dungeonContext,eligible,currentBattle,isV113DetectionReason,prepareV113Detection,scopedRequest,openCurrent,requestCombat,startDefault,setupDefault,launchDefault,ensureRuntimeRepair,install,status};
});
