/* GenSrpG V16.78.106 — real Dungeon combat runtime repair.
   - Intercepts the renderer seam actually reached by Runtime 2.00's closure-local startCombat/launchCombat200.
   - Keeps Survival on its native combat renderer.
   - Repairs duplicate built-in Dungeon universe cards and prevents them from being saved again. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgRuntimeRepair1678106=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.2",APP_VERSION="16.78.106";
  const FAMILY_KEY="gensrpg_session_family_guard_v1";
  const PROFILES_KEY="gensrpg_game_profiles_v1";
  const ACTIVE_KEY="gensrpg_game_profile_active_v1";
  const CANONICAL_DUNGEON_ID="game_profile_dungeon_demo";
  const RENDER_NAMES=["__dc302RenderCombat","__dc214RenderCombat","__dc200StableRenderCombatRound","renderDungeonCombatRound"];
  const originals=new Map();
  let installed=false,opening=false,wrappedSave=null;
  const str=v=>String(v??"");
  const arr=v=>Array.isArray(v)?v:[];

  function readFamily(rt=R){
    try{return str(rt?.localStorage?.getItem?.(FAMILY_KEY)).trim().toLowerCase()}catch(e){return ""}
  }
  function activeProfile(rt=R){
    try{const p=rt?.getActiveGameProfile?.();if(p)return p}catch(e){}
    try{const p=rt?.activeGameProfileRaw?.();if(p)return p}catch(e){}
    return null;
  }
  function isDungeonContext(rt=R){
    const fam=readFamily(rt);
    if(fam==="adventure")return true;
    if(fam==="survival")return false;
    const p=activeProfile(rt);
    if(p?.gameStyle)return p.gameStyle==="dungeon";
    try{if(typeof rt?.currentGameStyle==="function"){const s=rt.currentGameStyle();if(s)return s==="dungeon"}}catch(e){}
    try{if(typeof rt?.isDungeonMode==="function")return !!rt.isDungeonMode()}catch(e){}
    return false;
  }
  function isBuiltinDungeon(p){
    return !!p&&p.builtIn===true&&str(p.gameStyle)==="dungeon"&&str(p.name).trim().toLowerCase()==="dungeon";
  }
  function dedupeProfiles(list,rt=R){
    const input=arr(list),candidates=input.filter(isBuiltinDungeon);
    if(candidates.length<=1)return {list:input,removed:[],keep:candidates[0]?.id||null,changed:false};
    const canonical=candidates.find(p=>str(p.id)===CANONICAL_DUNGEON_ID)||candidates[0];
    const keepId=str(canonical.id),removed=[];
    const out=[];let kept=false;
    for(const p of input){
      if(isBuiltinDungeon(p)){
        if(!kept&&str(p.id)===keepId){out.push(p);kept=true;continue}
        removed.push(str(p.id));continue;
      }
      out.push(p);
    }
    try{
      const active=str(rt?.localStorage?.getItem?.(ACTIVE_KEY));
      if(removed.includes(active))rt?.localStorage?.setItem?.(ACTIVE_KEY,keepId);
    }catch(e){}
    return {list:out,removed,keep:keepId,changed:removed.length>0};
  }
  function repairStoredProfiles(rt=R){
    try{
      const raw=rt?.localStorage?.getItem?.(PROFILES_KEY);
      if(!raw)return {changed:false,removed:[]};
      const parsed=JSON.parse(raw),fixed=dedupeProfiles(parsed,rt);
      if(fixed.changed){
        rt.localStorage.setItem(PROFILES_KEY,JSON.stringify(fixed.list));
        try{rt.renderGensFamilyGamesIfVisible?.()}catch(e){}
        try{rt.console?.warn?.("V16.78.106 removed duplicate built-in Dungeon profiles",fixed.removed)}catch(e){}
      }
      return fixed;
    }catch(e){try{rt?.console?.warn?.("V16.78.106 profile repair",e)}catch(_){ }return {changed:false,removed:[]}}
  }
  function wrapSaveProfiles(rt=R){
    const current=rt?.saveGameProfiles;
    if(typeof current!=="function")return false;
    if(current.__gensRpg106Dedupe)return true;
    if(!wrappedSave)wrappedSave=current;
    const wrapped=function(list){
      const fixed=dedupeProfiles(list,rt);
      return wrappedSave.call(this,fixed.list);
    };
    wrapped.__gensRpg106Dedupe=true;
    wrapped.__legacy=wrappedSave;
    rt.saveGameProfiles=wrapped;
    return true;
  }
  function ensureLegacyHostNonEmpty(rt=R){
    try{
      const host=rt?.document?.getElementById?.("dungeonCombatSetupView");
      if(host&&!str(host.innerHTML).trim())host.innerHTML='<div data-gens-tactical-v2-route="16.78.106" style="display:none"></div>';
    }catch(e){}
  }
  function closeLegacyCombat(rt=R){
    try{rt?.closeDungeonCombat?.()}catch(e){}
    try{
      const modal=rt?.document?.getElementById?.("dungeonCombatModal");
      if(modal){modal.classList?.remove?.("dc200CombatOpen","open");modal.style.display="none"}
    }catch(e){}
    try{if(rt?.document?.body?.style)rt.document.body.style.overflow=""}catch(e){}
    try{rt.dungeonCombatActive=false}catch(e){}
  }
  function currentBattle(rt=R){
    try{const b=rt?.GensRpgTacticalCombatV2Bridge?.currentBattle?.(rt);if(b)return b}catch(e){}
    try{return rt?.GensRpgTacticalCombatV2Ui?.getBattle?.()||null}catch(e){return null}
  }
  function openTactical(rt=R,entry="renderer"){
    const existing=currentBattle(rt);if(existing)return {ok:true,battle:existing,existing:true};
    if(opening)return {ok:false,reason:"already-opening"};
    const bridge=rt?.GensRpgTacticalCombatV2Bridge;
    const ui=rt?.GensRpgTacticalCombatV2Ui;
    const adapter=rt?.GensRpgTacticalCombatV2Adapter;
    if(!bridge||!ui||!adapter)return {ok:false,reason:"modules-missing"};
    opening=true;
    try{
      let result=null;
      if(typeof bridge.openCurrent==="function")result=bridge.openCurrent(rt,{entry:"runtime-renderer:"+entry,reason:"legacy-runtime-intercept"});
      else if(typeof ui.openCurrentEncounter==="function")result={ok:true,battle:ui.openCurrentEncounter({entry:"runtime-renderer:"+entry,reason:"legacy-runtime-intercept"})};
      if(result?.ok===false)return result;
      if(result?.battle||result?.ok===true){
        rt.__gensRpg106LastIntercept={entry,at:Date.now()};
        return result?.ok===true?result:{ok:true,battle:result?.battle||result};
      }
      return {ok:false,reason:"open-returned-empty"};
    }catch(error){
      try{rt?.console?.error?.("V16.78.106 tactical runtime intercept",error)}catch(e){}
      return {ok:false,reason:"open-failed",error};
    }finally{opening=false}
  }
  function makeRendererWrapper(rt,name,original){
    const wrapped=function(...args){
      if(!isDungeonContext(rt))return original.apply(this,args);
      const opened=openTactical(rt,name);
      if(opened?.ok){
        closeLegacyCombat(rt);
        ensureLegacyHostNonEmpty(rt);
        return opened.battle||true;
      }
      try{rt?.console?.warn?.("V16.78.106 tactical intercept fallback",name,opened?.reason)}catch(e){}
      return original.apply(this,args);
    };
    wrapped.__gensRpg106RealRuntime=true;
    wrapped.__legacy=original;
    return wrapped;
  }
  function wrapRenderers(rt=R){
    let count=0;
    for(const name of RENDER_NAMES){
      const current=rt?.[name];
      if(typeof current!=="function")continue;
      if(current.__gensRpg106RealRuntime){count++;continue}
      if(!originals.has(name))originals.set(name,current);
      rt[name]=makeRendererWrapper(rt,name,current);
      count++;
    }
    return count;
  }
  function install(rt=R){
    repairStoredProfiles(rt);
    wrapSaveProfiles(rt);
    const wrapped=wrapRenderers(rt);
    rt.GENS_RPG_REAL_TACTICAL_ROUTE_VERSION=APP_VERSION;
    installed=wrapped>0;
    return installed;
  }
  function status(rt=R){return {installed,dungeon:isDungeonContext(rt),wrapped:RENDER_NAMES.filter(n=>!!rt?.[n]?.__gensRpg106RealRuntime),last:rt?.__gensRpg106LastIntercept||null}}
  return {VERSION,APP_VERSION,isDungeonContext,isBuiltinDungeon,dedupeProfiles,repairStoredProfiles,wrapSaveProfiles,wrapRenderers,closeLegacyCombat,currentBattle,openTactical,install,status};
});
