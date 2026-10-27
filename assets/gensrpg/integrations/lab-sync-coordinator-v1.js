"use strict";
/* Pure coordinator. Caller supplies trusted, fetched manifests; never fetches or activates runtime. */
(function(root){
  function plan(current,next,requirements,explorationCombatDependency,combatRelease){
    const gate=root.GensLabVersionSyncV1;
    if(!gate)throw new Error("Version gate unavailable");
    const proposed=gate.verify(next,requirements);
    gate.verifyAlignment(proposed,explorationCombatDependency);
    const published=gate.verifyCombatRelease(combatRelease);
    if(published.codeSha!==proposed.combat.sha)throw new TypeError("Combat release SHA differs from proposed version");
    if(current!==null&&current!==undefined){
      const installed=gate.verify(current,requirements);
      return Object.freeze({versions:proposed,changed:Object.freeze(gate.changed(installed,proposed)),combatAssetsSha:published.assetsSha,ready:true});
    }
    return Object.freeze({versions:proposed,changed:Object.freeze(["combat","exploration"]),combatAssetsSha:published.assetsSha,ready:true});
  }
  root.GensLabSyncCoordinatorV1=Object.freeze({plan});
})(typeof window!=="undefined"?window:globalThis);
