/* GenSrpG V16.78.114.4 — Dungeon tactical combat session guard.
   Prevents stale/hidden exploration state from reopening combat over menus and makes
   the tactical V2 route fail closed: legacy Dungeon combat is never used as fallback. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalSessionGuard16781144=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.114.4";
  const FAMILY_KEY="gensrpg_session_family_guard_v1";
  const HOLD_KEY="gensrpg_tactical_menu_hold_v1144";
  const START_NAMES=["dc200StartCombat","startCombat","openDungeonCombatSetup","launchCombat200","openTacticalCombatV2"];
  const RENDER_NAMES=["__dc302RenderCombat","__dc214RenderCombat","__dc200StableRenderCombatRound","renderDungeonCombatRound"];
  const RETRIES=[0,60,180,450,1000,2200,4500,8000,12000];
  let installed=false,menuBound=false,boardBound=false,observer=null,queued=false,seenHiddenSinceHold=false,lastBlockedToast=0;
  const str=v=>String(v??"");

  function doc(rt=R){return rt?.document||null}
  function family(rt=R){try{return str(rt?.localStorage?.getItem?.(FAMILY_KEY)).trim().toLowerCase()}catch(e){return ""}}
  function activeProfile(rt=R){try{return rt?.getActiveGameProfile?.()||rt?.activeGameProfileRaw?.()||null}catch(e){return null}}
  function dungeonContext(rt=R){
    const f=family(rt);if(f==="adventure")return true;if(f==="survival")return false;
    const p=activeProfile(rt);if(p?.gameStyle)return p.gameStyle==="dungeon";
    try{if(typeof rt?.currentGameStyle==="function"){const s=rt.currentGameStyle();if(s)return s==="dungeon"}}catch(e){}
    try{if(typeof rt?.isDungeonMode==="function")return !!rt.isDungeonMode()}catch(e){}
    return false;
  }
  function visible(el,rt=R){
    if(!el)return false;let node=el,depth=0;
    while(node&&depth++<10){
      try{const inline=node.style;if(inline&&(inline.display==="none"||inline.visibility==="hidden"))return false}catch(e){}
      try{const cs=rt?.getComputedStyle?.(node);if(cs&&(cs.display==="none"||cs.visibility==="hidden"||cs.opacity==="0"))return false}catch(e){}
      node=node.parentElement;
    }
    try{const rect=el.getBoundingClientRect?.();if(rect&&Number.isFinite(Number(rect.width))&&Number.isFinite(Number(rect.height))&&(Number(rect.width)<=0||Number(rect.height)<=0))return false}catch(e){}
    return true;
  }
  function explorationVisible(rt=R){const D=doc(rt),board=D?.querySelector?.("#dc047RoomBoard");return !!board&&visible(board,rt)}
  function currentBattle(rt=R){
    try{const b=rt?.GensRpgTacticalCombatV2Ui?.getBattle?.();if(b)return b}catch(e){}
    try{return rt?.GensRpgTacticalCombatV2Bridge?.currentBattle?.(rt)||null}catch(e){return null}
  }
  function holdActive(rt=R){try{return rt?.sessionStorage?.getItem?.(HOLD_KEY)==="1"}catch(e){return !!rt?.__gensRpg1144MenuHold}}
  function setMenuHold(rt=R,value=true){
    const on=!!value;try{rt.__gensRpg1144MenuHold=on}catch(e){}try{if(on)rt?.sessionStorage?.setItem?.(HOLD_KEY,"1");else rt?.sessionStorage?.removeItem?.(HOLD_KEY)}catch(e){}
    seenHiddenSinceHold=on?!explorationVisible(rt):false;return on;
  }
  function combatAllowed(rt=R){if(!dungeonContext(rt))return true;if(holdActive(rt))return false;return explorationVisible(rt)}
  function closeLegacyCombat(rt=R){
    const D=doc(rt);try{rt?.closeDungeonCombat?.()}catch(e){}
    try{const modal=D?.getElementById?.("dungeonCombatModal");if(modal){modal.classList?.remove?.("dc200CombatOpen","open");if(modal.style)modal.style.display="none"}}catch(e){}
    try{for(const el of D?.querySelectorAll?.(".dc200CombatOpen")||[])el.classList?.remove?.("dc200CombatOpen","open")}catch(e){}
    try{rt.dungeonCombatActive=false}catch(e){}
    try{if(D?.body?.style)D.body.style.overflow=""}catch(e){}
    return true;
  }
  function closeStaleMenuCombat(rt=R){
    if(!dungeonContext(rt)||explorationVisible(rt))return false;
    try{const U=rt?.GensRpgTacticalCombatV2Ui;if(U?.getBattle?.()||doc(rt)?.querySelector?.(".gtv2Overlay"))U?.close?.(false)}catch(e){}
    try{for(const el of doc(rt)?.querySelectorAll?.(".gtv2Overlay,[data-v1143-transition]")||[])el.remove?.()}catch(e){}
    closeLegacyCombat(rt);return true;
  }
  function blockedValue(name){return name==="dc200StartCombat"||name==="openTacticalCombatV2"?{ok:false,reason:"menu-or-hidden-exploration-v1144"}:false}
  function wrapStart(rt=R,name){
    const fn=rt?.[name];if(typeof fn!=="function")return false;if(fn.__gensRpg1144SessionStart)return true;const old=fn;
    const wrapped=function(){
      if(!dungeonContext(rt))return old.apply(this,arguments);
      if(currentBattle(rt))return old.apply(this,arguments);
      if(!combatAllowed(rt)){closeLegacyCombat(rt);return blockedValue(name)}
      return old.apply(this,arguments);
    };
    wrapped.__gensRpg1144SessionStart=true;wrapped.__original=old;rt[name]=wrapped;return true;
  }
  function warnBlocked(rt=R,reason="tactical-unavailable"){
    const now=Date.now();if(now-lastBlockedToast<1500)return;lastBlockedToast=now;
    try{rt?.showToast?.("⚠️ Combat tactique indisponible — ancien combat bloqué ("+reason+")")}catch(e){}
  }
  function wrapRenderer(rt=R,name){
    const fn=rt?.[name];if(typeof fn!=="function")return false;if(fn.__gensRpg1144SessionRenderer)return true;const old=fn;
    const wrapped=function(){
      if(!dungeonContext(rt))return old.apply(this,arguments);
      const existing=currentBattle(rt);if(existing){closeLegacyCombat(rt);return existing}
      if(!combatAllowed(rt)){closeLegacyCombat(rt);return false}
      let result=null;
      try{
        const bridge=rt?.GensRpgTacticalCombatV2Bridge;
        if(typeof bridge?.openCurrent==="function")result=bridge.openCurrent(rt,{entry:"session-guard:"+name,reason:"legacy-render-block-v1144"});
        else if(typeof rt?.GensRpgTacticalCombatV2Ui?.openCurrentEncounter==="function")result={ok:true,battle:rt.GensRpgTacticalCombatV2Ui.openCurrentEncounter({entry:"session-guard:"+name,reason:"legacy-render-block-v1144"})};
      }catch(error){result={ok:false,reason:"open-failed",error}}
      if(result?.ok!==false&&(result?.battle||result?.ok===true)){closeLegacyCombat(rt);return result?.battle||true}
      closeLegacyCombat(rt);warnBlocked(rt,result?.reason||"modules-missing");return false;
    };
    wrapped.__gensRpg1144SessionRenderer=true;wrapped.__original=old;rt[name]=wrapped;return true;
  }
  function ensureGuards(rt=R){for(const name of START_NAMES)wrapStart(rt,name);for(const name of RENDER_NAMES)wrapRenderer(rt,name);return true}
  function syncVisibility(rt=R){
    const now=explorationVisible(rt),hold=holdActive(rt);
    if(!hold)return now;
    if(!now){seenHiddenSinceHold=true;return false}
    if(seenHiddenSinceHold){setMenuHold(rt,false);return true}
    return false;
  }
  function bindMenu(rt=R){
    const D=doc(rt);if(!D?.addEventListener||menuBound)return !!D;
    D.addEventListener("click",ev=>{const b=ev?.target?.closest?.("[data-v1143-menu]");if(!b)return;setMenuHold(rt,true);closeLegacyCombat(rt)},true);menuBound=true;return true;
  }
  function bindBoard(rt=R){
    const D=doc(rt);if(!D?.addEventListener||boardBound)return !!D;
    const resume=ev=>{const cell=ev?.target?.closest?.("#dc047RoomBoard .dc047Cell");if(!cell||!visible(cell,rt))return;if(holdActive(rt))setMenuHold(rt,false)};
    D.addEventListener("pointerdown",resume,true);D.addEventListener("click",resume,true);boardBound=true;return true;
  }
  function relevantMutation(node){return !!(node?.nodeType===1&&(node.matches?.("#dc047RoomBoard,#dc047RoomBoard *,.gtv2Overlay,#dungeonCombatModal")||node.querySelector?.("#dc047RoomBoard,.gtv2Overlay,#dungeonCombatModal")))}
  function queueMaintain(rt=R){if(queued)return;queued=true;const run=()=>{queued=false;install(rt)};if(typeof rt?.requestAnimationFrame==="function")rt.requestAnimationFrame(run);else if(typeof setTimeout==="function")setTimeout(run,0);else run()}
  function observe(rt=R){
    const D=doc(rt);if(!D?.body||observer||typeof rt?.MutationObserver!=="function")return !!observer;
    observer=new rt.MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes||[]){if(relevantMutation(n)){queueMaintain(rt);return}}if(m.type==="attributes"){queueMaintain(rt);return}}});
    observer.observe(D.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden"]});return true;
  }
  function install(rt=R){
    ensureGuards(rt);bindMenu(rt);bindBoard(rt);observe(rt);syncVisibility(rt);closeStaleMenuCombat(rt);
    try{rt.GENS_RPG_TACTICAL_SESSION_GUARD_VERSION=APP_VERSION}catch(e){}installed=true;return true;
  }
  function installWithRetries(rt=R){
    install(rt);try{rt?.addEventListener?.("gensrpg:tactical-combat-ready",()=>install(rt))}catch(e){}
    if(typeof setTimeout==="function")for(const ms of RETRIES.slice(1))setTimeout(()=>install(rt),ms);return true;
  }
  const api={VERSION,APP_VERSION,FAMILY_KEY,HOLD_KEY,START_NAMES,RENDER_NAMES,dungeonContext,visible,explorationVisible,currentBattle,holdActive,setMenuHold,combatAllowed,closeLegacyCombat,closeStaleMenuCombat,wrapStart,wrapRenderer,ensureGuards,syncVisibility,install,installWithRetries,status:()=>({installed,menuBound,boardBound,observer:!!observer,hold:holdActive(R),exploration:explorationVisible(R)})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});