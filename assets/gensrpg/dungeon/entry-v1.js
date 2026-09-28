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

  function pickWeightedGeneratedBranchType(branchWeights,roll){
    const weights={treasure:45,boss:25,secret:30,...(branchWeights||{})};
    const entries=Object.entries(weights).map(([type,value])=>[type,Math.max(0,Number(value)||0)]);
    const total=entries.reduce((sum,[,value])=>sum+value,0)||1;
    let remaining=Number(roll)*total;
    for(const [type,value] of entries){
      remaining-=value;
      if(remaining<=0)return type;
    }
    return "treasure";
  }

  function shouldCreateGeneratedBranch(specialBranchChance,roll){
    return Number(roll)*100<Math.max(0,Number(specialBranchChance)||0);
  }

  function buildGeneratedBranchSceneElement(room,cellIndex,branchType){
    const name=branchType==="boss"?"Trappe inquiétante":branchType==="secret"?"Passage secret":"Cache souterraine";
    return {kind:"trapdoor",name,room,cellIndex,environment:"dungeon",branchType};
  }

  function buildGeneratedRoomTransition(heroId,fromRoom,toRoom,created,at){
    return {heroId,from:fromRoom,to:toRoom,created,at};
  }

  function planAuthoredEntryMovement(remainingValue){
    const value=Number(remainingValue);
    return Number.isFinite(value)
      ?{status:"remaining",movement:Math.max(0,value)}
      :{status:"fallback",movement:null};
  }

  function resolveAuthoredHeroMoveAllowance(runtimeMovementValue,statMovementValue){
    return Math.max(0,Number(runtimeMovementValue)||Number(statMovementValue)||3);
  }

  root.GensDungeonV1=Object.freeze({
    VERSION,
    exploration:Object.freeze({
      planGeneratedAdvance,
      pickWeightedGeneratedRoomKind,
      buildGeneratedRoomTransition,
      pickWeightedGeneratedBranchType,
      shouldCreateGeneratedBranch,
      buildGeneratedBranchSceneElement
    }),
    movement:Object.freeze({
      planAuthoredEntryMovement,
      resolveAuthoredHeroMoveAllowance
    })
  });
})(typeof window!=="undefined"?window:globalThis);
