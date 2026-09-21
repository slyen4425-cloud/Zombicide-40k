/* GenSrpG Core Equipment Bonus Persistence V1 — pure immutable state-transition contract. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const list=value=>Array.isArray(value)?value:[];

function bonusSnapshot(value){
  return record(value)?{...value}:{};
}

function customSnapshot(value){
  return list(value).slice();
}

function overrideSnapshot(value){
  return record(value)?{...value}:{};
}

function applyCustom(items,id,bonuses){
  const source=list(items);
  const next=source.slice();
  const targetId=String(id??"").trim();
  if(!targetId)return Object.freeze({found:false,items:next});

  const index=source.findIndex(item=>String(item?.id??"")===targetId);
  if(index<0)return Object.freeze({found:false,items:next});

  const current=record(source[index])?source[index]:{};
  next[index]={...current,rpgBonuses:bonusSnapshot(bonuses)};
  return Object.freeze({found:true,items:next});
}

function applyBuiltin(overrides,id,bonuses){
  const source=record(overrides)?overrides:{};
  const next={...source};
  const targetId=String(id??"").trim();
  if(!targetId)return Object.freeze({found:false,overrides:next});

  const current=record(source[targetId])?source[targetId]:{};
  next[targetId]={...current,rpgBonuses:bonusSnapshot(bonuses)};
  return Object.freeze({found:true,overrides:next});
}

function apply(config={}){
  const kind=String(config?.kind??"");
  if(kind==="custom"){
    const result=applyCustom(config.customItems,config.id,config.bonuses);
    return Object.freeze({
      kind,
      found:result.found,
      customItems:result.items,
      overrides:overrideSnapshot(config.overrides)
    });
  }
  if(kind==="builtin"){
    const result=applyBuiltin(config.overrides,config.id,config.bonuses);
    return Object.freeze({
      kind,
      found:result.found,
      customItems:customSnapshot(config.customItems),
      overrides:result.overrides
    });
  }
  return Object.freeze({
    kind,
    found:false,
    customItems:customSnapshot(config.customItems),
    overrides:overrideSnapshot(config.overrides)
  });
}

ROOT.GensEquipmentBonusPersistenceV1=Object.freeze({
  VERSION,
  bonusSnapshot,
  applyCustom,
  applyBuiltin,
  apply
});
})(typeof window!=="undefined"?window:globalThis);
