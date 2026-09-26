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

  function pickWeightedGeneratedRoomKind(roomWeights,roll){
    const weights={enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11,...(roomWeights||{})};
    const entries=Object.entries(weights).map(([kind,value])=>[kind,Math.max(0,Number(value)||0)]);
    const total=entries.reduce((sum,[,value])=>sum+value,0)||1;
    let remaining=Number(roll)*total;
    for(const [kind,value] of entries){
      remaining-=value;
      if(remaining<=0)return kind;
    }
    return "enemy";
  }

  root.GensDungeonV1=Object.freeze({
    VERSION,
    exploration:Object.freeze({
      planGeneratedAdvance,
      pickWeightedGeneratedRoomKind
    })
  });
})(typeof window!=="undefined"?window:globalThis);
