
(function(){
/* V16.139 — séparation réelle du lancement Capture et Dungeon */

/* En Capture, le dresseur est choisi AVANT Démarrer.
   Le lancement ne doit jamais ouvrir/reproposer un héros. */
window.GensCaptureHubEntryV1.install({
  closeTurnPopup:()=>closeTurnPopup(false),
  renderMenuStatuses:()=>renderMenuStatuses(),
  renderCaptureWorldHub:()=>renderCaptureWorldHub()
});

/* Le propriétaire Capture initialise la session ; Capture139 ne conserve que le câblage legacy explicite. */
window.GensCaptureSessionStartV1.install({
  normalizeParticipants:()=>normalizeGameParticipants(),
  participantsReady:()=>typeof gensCaptureParticipantsReady!=="function"||gensCaptureParticipantsReady(),
  activateParticipant:id=>{
    current=String(id);
    try{state=loadState(current)}catch(e){}
  },
  saveParticipants:participants=>saveGameParticipants([...participants]),
  applyCustomHeroes:()=>applyCustomHeroesMulti(),
  applyPregameGold:participants=>applyPregameGoldToParticipants(participants),
  markSessionActive:()=>markSessionActive(true),
  loadWorld:()=>captureWorldState(),
  saveWorld:ws=>saveCaptureWorldState(ws),
  ensureStarterKits:()=>captureEnsureStarterKitsForParticipants(),
  readTurnOrderEnabled:()=>!!document.getElementById("participantTurnOrderToggle")?.checked,
  loadCustomization:()=>loadGameCustomization(),
  saveCustomization:cfg=>saveGameCustomization(cfg),
  startTurnManager:()=>startTurnManagerForGame(),
  clearTurnManager:()=>{saveTurnState(null);closeTurnPopup(false);renderTurnUi()},
  enterWorld:()=>window.GensCaptureHubEntryV1.enterWorld(),
  notify:message=>alert(message),
  openParticipantSetup:()=>openSessionHeroSetup()
});
window.GensCaptureV1.install(window.GensCaptureSessionStartV1);

/* Le propriétaire Capture enregistre son retour via ses seules dépendances legacy. */
window.GensCaptureScreenReturnV1.install({
  hasActiveSession:()=>hasActiveSession(),
  isCaptureContext:()=>isCaptureContext138(),
  enterWorld:()=>window.GensCaptureHubEntryV1.enterWorld()
});
})();
