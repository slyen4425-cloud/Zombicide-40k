/* GenSrpG Tactical Combat V2 — opt-in exploration bridge.
   It never replaces/intercepts legacy combat automatically. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Bridge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.1.0",APP_VERSION="16.78.103",KEY="gensrpg_tactical_combat_v2_experimental";
  let launcher=null;
  const arr=v=>Array.isArray(v)?v:[];
  function enabled(rt=R){try{return rt?.GENS_TACTICAL_V2_EXPERIMENTAL===true||rt?.localStorage?.getItem(KEY)==="1"}catch(e){return !!rt?.GENS_TACTICAL_V2_EXPERIMENTAL}}
  function eligible(rt=R){
    try{if(typeof rt?.isDungeonMode==="function"&&!rt.isDungeonMode())return {ok:false,reason:"not-dungeon"}}catch(e){}
    const A=rt?.GensRpgTacticalCombatV2Adapter;if(!rt?.GensRpgTacticalCombatV2||!A||!rt?.GensRpgTacticalCombatV2Ui)return {ok:false,reason:"modules-missing"};
    const heroes=arr(A.participants?.(rt)),enemies=arr(A.activeEnemies?.(rt));
    if(!heroes.length)return {ok:false,reason:"no-heroes"};if(!enemies.length)return {ok:false,reason:"no-enemies"};
    return {ok:true,heroes:heroes.length,enemies:enemies.length};
  }
  function openCurrent(rt=R,options={}){
    const e=eligible(rt);if(!e.ok)return e;
    const battle=rt.GensRpgTacticalCombatV2Ui.openCurrentEncounter(options);
    return {ok:true,battle};
  }
  function removeLauncher(){try{launcher?.remove()}catch(e){}launcher=null}
  function renderLauncher(rt=R){
    if(!rt?.document||!enabled(rt)){removeLauncher();return false}
    if(launcher?.isConnected)return true;
    launcher=rt.document.createElement("button");launcher.type="button";launcher.id="gensTacticalV2Launcher";launcher.textContent="⚔️ COMBAT TACTIQUE V2";
    launcher.style.cssText="position:fixed;right:12px;bottom:12px;z-index:29000;border:1px solid #97733d;border-radius:12px;background:#2b2114;color:#ffe6ad;padding:12px 14px;font:800 13px system-ui;box-shadow:0 8px 28px #000a";
    launcher.addEventListener("click",()=>{const e=eligible(rt);if(!e.ok){rt.alert?.(`Combat tactique V2 indisponible : ${e.reason}`);return}openCurrent(rt)});
    rt.document.body.appendChild(launcher);return true;
  }
  function enable(rt=R){try{rt.GENS_TACTICAL_V2_EXPERIMENTAL=true;rt.localStorage?.setItem(KEY,"1")}catch(e){}renderLauncher(rt);return true}
  function disable(rt=R){try{rt.GENS_TACTICAL_V2_EXPERIMENTAL=false;rt.localStorage?.removeItem(KEY)}catch(e){}removeLauncher();return true}
  function install(rt=R){
    rt.openTacticalCombatV2=(opts={})=>openCurrent(rt,opts);
    rt.enableTacticalCombatV2=()=>enable(rt);rt.disableTacticalCombatV2=()=>disable(rt);
    if(enabled(rt)){if(rt.document?.readyState==="loading")rt.document.addEventListener("DOMContentLoaded",()=>renderLauncher(rt),{once:true});else renderLauncher(rt)}
    return true;
  }
  return {VERSION,APP_VERSION,KEY,enabled,eligible,openCurrent,renderLauncher,enable,disable,install};
});
