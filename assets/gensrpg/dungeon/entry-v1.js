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

  function planGeneratedBossPolicy(room,roomLimit,bossMode,bossEvery,bossRooms,bossChance){
    if(bossMode!=="none"&&room===Number(roomLimit))return {status:"boss",chance:null};
    if(bossMode==="everyN"&&room%Math.max(1,Number(bossEvery)||5)===0)return {status:"boss",chance:null};
    const explicit=String(bossRooms||"").split(/[,; ]+/).map(Number).filter(n=>n>0);
    if(bossMode==="specific"&&explicit.includes(room))return {status:"boss",chance:null};
    if(bossMode==="random"&&room>2)return {status:"random",chance:Math.max(0,Number(bossChance)||13)};
    return {status:"none",chance:null};
  }

  function buildGeneratedNonCombatRoomResult(kind,trapType){
    if(kind==="trap")return {title:"🪤 "+trapType.name,text:"Un piège est présent dans la salle.",enemyQty:0,trapId:trapType.id};
    if(kind==="chest")return {title:"🎁 Coffre",text:"Un coffre est présent dans la salle.",enemyQty:0};
    if(kind==="merchant")return {title:"🧙‍♂️ Marchand",text:"Un marchand attend le groupe.",enemyQty:0};
    if(kind==="rest")return {title:"⛩️ Sanctuaire",text:"Un lieu de repos.",enemyQty:0};
    return {title:"✨ Salle calme",text:"La salle semble calme.",enemyQty:0};
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

  function resolveAuthoredActiveHero(participants,activeIndex){
    const heroes=Array.isArray(participants)?participants:[];
    const index=Math.max(0,Math.min(Math.max(0,heroes.length-1),Number(activeIndex)||0));
    return String(heroes[index]||"");
  }

  function planAuthoredEntryMovement(remainingValue){
    const value=Number(remainingValue);
    return Number.isFinite(value)
      ?{status:"remaining",movement:Math.max(0,value)}
      :{status:"fallback",movement:null};
  }

  function planAuthoredArrivalCell(mapCellCount,edgeEntryIndex,mapEntryIndex){
    const count=Math.max(0,Number(mapCellCount)||0);
    const edge=Number(edgeEntryIndex);
    return Number.isInteger(edge)&&edge>=0&&edge<count
      ?edge
      :Math.max(0,Number(mapEntryIndex)||0);
  }

  function resolveAuthoredHeroMoveAllowance(runtimeMovementValue,statMovementValue){
    return Math.max(0,Number(runtimeMovementValue)||Number(statMovementValue)||3);
  }

  function selectAuthoredOutgoingEdge(outgoingEdges,heroPosition,positionalEnabled){
    const pos=Number(heroPosition);
    let edge=outgoingEdges.find(e=>Number(e.fromExitIndex)===pos)||null;
    if(!edge&&!positionalEnabled&&outgoingEdges.length===1)edge=outgoingEdges[0];
    return edge;
  }

  function resolveAuthoredRealExitIndex(cells,directExitIndex){
    const direct=Number(directExitIndex);
    if(Number.isInteger(direct)&&direct>=0&&String(cells[direct]||"").toLowerCase()==="exit")return direct;
    return cells.findIndex(v=>String(v||"").toLowerCase()==="exit");
  }

  function isAuthoredTerminalExit(heroId,realExitIndex,positionalEnabled,heroPosition){
    if(!heroId||realExitIndex<0)return false;
    if(!positionalEnabled)return true;
    return Number(heroPosition)===realExitIndex;
  }

  function isAuthoredExitBlocked(lastExitLocked,mapObjectiveStatus,objectiveStatus){
    if(lastExitLocked)return true;
    return String(mapObjectiveStatus||objectiveStatus||"")==="locked";
  }

  root.GensDungeonV1=Object.freeze({
    VERSION,
    exploration:Object.freeze({
      planGeneratedAdvance,
      planGeneratedBossPolicy,
      buildGeneratedNonCombatRoomResult,
      pickWeightedGeneratedRoomKind,
      buildGeneratedRoomTransition,
      pickWeightedGeneratedBranchType,
      shouldCreateGeneratedBranch,
      buildGeneratedBranchSceneElement
    }),
    movement:Object.freeze({
      resolveAuthoredActiveHero,
      planAuthoredEntryMovement,
      planAuthoredArrivalCell,
      resolveAuthoredHeroMoveAllowance,
      selectAuthoredOutgoingEdge,
      resolveAuthoredRealExitIndex,
      isAuthoredTerminalExit,
      isAuthoredExitBlocked
    })
  });
})(typeof window!=="undefined"?window:globalThis);
