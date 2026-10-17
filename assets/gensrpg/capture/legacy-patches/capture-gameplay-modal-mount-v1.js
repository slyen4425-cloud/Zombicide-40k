
document.addEventListener("DOMContentLoaded",()=>{
  ["captureExploreModal","captureEncounterModal","captureTrainerModal","captureHealModal",
   "captureShopModal","captureMjModal","captureBattleSetupModal"].forEach(id=>{
    const el=document.getElementById(id);
    if(el && el.parentElement!==document.body) document.body.appendChild(el);
  });
});
