"use strict";

(function installGensDungeonV1(root){
  const VERSION="1.0.0";

  function planGeneratedAdvance(currentRoom,roomLimit,roomStates){
    const current=Number(currentRoom||0);
    const limit=Number(roomLimit||10);
    if(current>=limit)return {status:"complete",targetRoom:null};
    const targetRoom=Math.max(1,current+1);
    const states=roomStates&&typeof roomStates==="object"?roomStates:{};
    const existing=states[String(targetRoom)];
    return {status:existing?.last?"existing":"create",targetRoom};
  }

  root.GensDungeonV1=Object.freeze({
    VERSION,
    exploration:Object.freeze({
      planGeneratedAdvance
    })
  });
})(typeof window!=="undefined"?window:globalThis);
