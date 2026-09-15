/* GenSrpG Runtime Bootstrap — explicit runtime composition owner.
   This file preserves the V16.78.105 load order while removing module composition
   from the mobile performance layer. It does not own gameplay or module UI.
*/
(function(root){
  "use strict";
  const R=root||globalThis,D=R?.document||null;
  const VERSION="1.0.0",APP_VERSION="16.78.105";
  const FILES=Object.freeze([
    "assets/gensrpg/core/asset-resolver.js",
    "assets/gensrpg/core/storage.js",
    "assets/gensrpg/core/stats.js",
    "assets/gensrpg/core/stats-runtime-adapter.js",
    "assets/gensrpg/gens-rpg-tactical-combat-v2.js",
    "assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js",
    "assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js",
    "assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js",
    "assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js",
    "assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js",
    "assets/gensrpg/gens-survival-mode-isolation-1678104.js"
  ]);
  let installed=false,loading=false,loaded=false;

  function finalize(rt=R){
    const apply=()=>{
      try{
        rt?.GensRpgCoreStatsRuntimeAdapter?.install?.(rt);
        rt?.GensSurvivalModeIsolation1678104?.install?.();
        rt?.GensRpgTacticalCombatV2Bridge?.install?.(rt);
      }catch(e){try{rt?.console?.error?.("GenSrpG runtime bootstrap install",e)}catch(_){} }
    };
    apply();
    if(typeof rt?.setTimeout==="function"){
      rt.setTimeout(apply,250);
      rt.setTimeout(apply,1200);
      rt.setTimeout(apply,3000);
    }
    loaded=true;loading=false;return true;
  }

  function loadSequential(rt=R,index=0){
    const doc=rt?.document||D;if(!doc||(doc.head||doc.documentElement)==null)return false;
    if(index>=FILES.length)return finalize(rt);
    const script=doc.createElement("script");
    script.src=FILES[index]+"?v="+APP_VERSION;
    script.async=false;
    script.onload=()=>loadSequential(rt,index+1);
    script.onerror=()=>{try{rt?.console?.error?.("GenSrpG runtime load failed",FILES[index])}catch(_){}loadSequential(rt,index+1)};
    (doc.head||doc.documentElement).appendChild(script);
    return true;
  }

  function install(rt=R){
    if(installed||loading||loaded)return true;
    const doc=rt?.document||D;if(!doc||(doc.head||doc.documentElement)==null)return false;
    installed=true;loading=true;
    return loadSequential(rt,0);
  }

  const api={VERSION,APP_VERSION,FILES,install,loadSequential,finalize,status:()=>({installed,loading,loaded})};
  R.GensRpgRuntimeBootstrap=api;
  install(R);
})(typeof globalThis!=="undefined"?globalThis:this);
