"use strict";
// Capture's only early Shell dependency is pure profile classification.
// No creature, skill, battle, world or saved-roster data is defined here.
(function(root){
  function isProfile(profile){
    const gameplay=profile?.rpgUniverse?.gameplay;
    if(!gameplay||typeof gameplay!=="object")return false;
    return gameplay.profile==="creature"||
      (gameplay.modules?.capture===true&&gameplay.modules?.controllableCreatures===true);
  }
  if(root.GensCaptureV1)throw new Error("Competing Capture identity owner");
  root.GensCaptureV1=Object.freeze({VERSION:"2.0.0",isProfile});
})(typeof window!=="undefined"?window:globalThis);
