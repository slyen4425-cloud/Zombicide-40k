/* GenSrpG Core Equipment Evolution V1 — pure deterministic contract. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const list=value=>Array.isArray(value)?value:[];

function itemBonus(item,key,xp){
  const evolution=item?.evolution;
  if(!evolution?.enabled||!Array.isArray(evolution.levels))return 0;
  return evolution.levels.reduce((sum,step)=>{
    const threshold=Math.max(0,num(step?.xp,0));
    return xp>=threshold?sum+num(step?.rpgBonuses?.[key],0):sum;
  },0);
}

function totalBonus(items,key,xp){
  return list(items).reduce((sum,item)=>sum+itemBonus(item,key,xp),0);
}

ROOT.GensEquipmentEvolutionV1=Object.freeze({
  VERSION,
  itemBonus,
  totalBonus
});
})(typeof window!=="undefined"?window:globalThis);
