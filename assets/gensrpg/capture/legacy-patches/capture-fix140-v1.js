
(function(){
/* V16.140 — une seule source de vérité pour les réglages MJ Capture.
   Les anciens panneaux ne peuvent plus écraser les réglages récents. */

window.captureSyncMjRules140=function(source){
  const mj=captureMjRules137();
  const pr=captureCreatureProgressRules();

  if(source==="progress"){
    /* utilisé uniquement lors d'une vraie modification depuis un ancien éditeur */
    mj.xpMultiplier=Math.max(0,Number(pr.xpMultiplier??mj.xpMultiplier)||1);
    mj.starterLimit=Math.max(1,Math.min(3,Number(pr.starterLimit??mj.starterLimit)||1));
    mj.healCost=Math.max(0,Number(pr.healCenterCost??mj.healCost)||0);
    mj.dayHealPct=Math.max(0,Math.min(100,Number(pr.dayHealPct??mj.dayHealPct)||0));
    localStorage.setItem(captureMjRulesKey137(),JSON.stringify(mj));
  }else{
    /* par défaut le panneau MJ global est maître */
    pr.xpMultiplier=mj.xpMultiplier;
    pr.starterLimit=mj.starterLimit;
    pr.healCenterCost=mj.healCost;
    pr.dayHealPct=mj.dayHealPct;
    GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),pr);
  }
  return captureMjRules137();
};

/* Tous les boutons MJ Capture ouvrent désormais EXACTEMENT le même panneau. */
window.captureOpenPregameMj130=function(){captureOpenMjGlobal137()};
window.captureSavePregameMj130=function(){captureSaveMjRules137()};
window.captureSavePregameMj134=function(){captureSaveMjRules137()};

/* L'ancien bouton de préparation est conservé si une vieille couche le recrée,
   mais il ouvre le panneau central et ne possède plus son propre état. */
function normalizeButtons140(){
  const old=document.getElementById("preMj130Btn");
  if(old){
    old.onclick=captureOpenMjGlobal137;
    old.textContent="🎛️ RÉGLAGES MJ — CAPTURE";
  }
  const newer=document.getElementById("capturePregameMjBig134");
  if(newer)newer.remove(); /* doublon historique */
  const main=document.getElementById("captureMjBig137");
  if(main)main.onclick=captureOpenMjGlobal137;
  const ingame=document.getElementById("captureMjInGame137");
  if(ingame)ingame.onclick=captureOpenMjGlobal137;
}

/* Sauvegarde centrale : écrit simultanément les deux formats historiques. */
const save140=window.captureSaveMjRules137;
window.captureSaveMjRules137=function(){
  save140.apply(this,arguments);
  captureSyncMjRules140("mj");
  normalizeButtons140();
};

/* Ouverture centrale : resynchronise d'abord les dépendances, puis affiche
   toujours les valeurs réellement actives. */
const open140=window.captureOpenMjGlobal137;
window.captureOpenMjGlobal137=function(){
  captureSyncMjRules140("mj");
  open140.apply(this,arguments);
};

/* Si l'éditeur de progression des créatures modifie une valeur commune,
   on répercute immédiatement cette modification dans le panneau MJ global. */
const progSave140=window.captureSaveCreatureProgressRulesFromUi;
if(typeof progSave140==="function"){
  window.captureSaveCreatureProgressRulesFromUi=function(){
    progSave140.apply(this,arguments);
    captureSyncMjRules140("progress");
  };
}

/* Au démarrage et à chaque rendu : pas de divergence silencieuse. */
setTimeout(()=>{captureSyncMjRules140("mj");normalizeButtons140()},80);
const rr140=window.renderCaptureWorldHub;
if(typeof rr140==="function")window.renderCaptureWorldHub=function(){
  captureSyncMjRules140("mj");
  const r=rr140.apply(this,arguments);
  normalizeButtons140();
  return r;
};
const rp140=window.renderParticipantSelector;
if(typeof rp140==="function")window.renderParticipantSelector=function(){
  captureSyncMjRules140("mj");
  const r=rp140.apply(this,arguments);
  normalizeButtons140();
  return r;
};
})();
