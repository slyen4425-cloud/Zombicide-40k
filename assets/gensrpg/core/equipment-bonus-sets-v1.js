/* GenSrpG Core Equipment bonus + sets V1 — pure deterministic contract. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const list=value=>Array.isArray(value)?value:[];
const num=value=>Number(value)||0;

function thresholds(set){
  if(Array.isArray(set?.thresholds)){
    return [...set.thresholds].sort((a,b)=>Number(a?.pieces)-Number(b?.pieces));
  }
  return Object.entries(set?.thresholds||{})
    .map(([pieces,bonuses])=>({pieces:Number(pieces),bonuses}))
    .sort((a,b)=>a.pieces-b.pieces);
}

function directBonus(items,key){
  return list(items).reduce((sum,item)=>sum+num(item?.rpgBonuses?.[key]),0);
}

function setState(items,registry={}){
  const grouped={};
  list(items).forEach(item=>{
    const setId=String(item?.setId||"");
    if(!setId||!registry?.[setId])return;
    const piece=String(item?.setPieceId||item?.id||"");
    const group=grouped[setId]||(grouped[setId]={
      set:registry[setId],
      pieces:new Set(),
      items:[]
    });
    if(!group.pieces.has(piece)){
      group.pieces.add(piece);
      group.items.push(item);
    }
  });

  return Object.entries(grouped).map(([setId,group])=>{
    const count=group.pieces.size;
    const activeThresholds=thresholds(group.set)
      .filter(threshold=>count>=Math.max(1,Number(threshold?.pieces)||1));
    const bonuses={};
    activeThresholds.forEach(threshold=>{
      Object.entries(threshold?.bonuses||{}).forEach(([key,value])=>{
        bonuses[key]=num(bonuses[key])+num(value);
      });
    });
    return {
      setId,
      set:group.set,
      count,
      pieces:[...group.pieces],
      items:group.items,
      activeThresholds,
      bonuses
    };
  });
}

function setBonus(items,key,registry={}){
  return setState(items,registry)
    .reduce((sum,state)=>sum+num(state?.bonuses?.[key]),0);
}

function totalBonus(items,key,registry={}){
  return directBonus(items,key)+setBonus(items,key,registry);
}

ROOT.GensEquipmentBonusSetsV1=Object.freeze({
  VERSION,
  thresholds,
  directBonus,
  setState,
  setBonus,
  totalBonus
});
})(typeof window!=="undefined"?window:globalThis);
