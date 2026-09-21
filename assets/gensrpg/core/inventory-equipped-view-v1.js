/* GenSrpG Core Inventory equipped view V1 — pure slot-reference contract. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const inventoryOf=value=>Array.isArray(value)?value:[];

function normalizeRef(value,length=Infinity){
  if(value===null||value===undefined)return null;
  const n=Number(value);
  if(!Number.isInteger(n)||n<0)return null;
  if(Number.isFinite(length)&&n>=Math.max(0,Number(length)||0))return null;
  return n;
}

function normalizeGear(value,length=Infinity){
  const out={};
  if(!record(value))return Object.freeze(out);
  for(const [slot,ref] of Object.entries(value))out[String(slot)]=normalizeRef(ref,length);
  return Object.freeze(out);
}

function normalizeRefs(config={}){
  const inventory=inventoryOf(config.inventory);
  const length=inventory.length;
  return Object.freeze({
    rightHand:normalizeRef(config.rightHand,length),
    leftHand:normalizeRef(config.leftHand,length),
    equipment:normalizeRef(config.equipment,length),
    rpgGear:normalizeGear(config.rpgGear,length)
  });
}

function equippedIndices(config={}){
  const inventory=inventoryOf(config.inventory);
  const refs=normalizeRefs({...config,inventory});
  const out=[];
  const seen=new Set();

  const push=ref=>{
    if(ref===null||seen.has(ref))return;
    if(inventory[ref]===undefined)return;
    seen.add(ref);
    out.push(ref);
  };

  push(refs.rightHand);
  push(refs.leftHand);
  for(const ref of Object.values(refs.rpgGear))push(ref);

  return Object.freeze(out);
}

function equippedItems(config={}){
  const inventory=inventoryOf(config.inventory);
  const resolveItem=typeof config.resolveItem==="function"?config.resolveItem:(entry=>entry);
  const out=[];
  for(const index of equippedIndices({...config,inventory})){
    const item=resolveItem(inventory[index],index,inventory);
    if(item!==null&&item!==undefined)out.push(item);
  }
  return Object.freeze(out);
}

function reindexRefAfterRemoval(value,removedIndex){
  const ref=normalizeRef(value);
  const removed=normalizeRef(removedIndex);
  if(ref===null||removed===null)return ref;
  if(ref===removed)return null;
  return ref>removed?ref-1:ref;
}

function reindexGearAfterRemoval(value,removedIndex){
  const out={};
  if(!record(value))return Object.freeze(out);
  for(const [slot,ref] of Object.entries(value)){
    out[String(slot)]=reindexRefAfterRemoval(ref,removedIndex);
  }
  return Object.freeze(out);
}

function reindexRefsAfterRemoval(config={},removedIndex){
  return Object.freeze({
    rightHand:reindexRefAfterRemoval(config.rightHand,removedIndex),
    leftHand:reindexRefAfterRemoval(config.leftHand,removedIndex),
    equipment:reindexRefAfterRemoval(config.equipment,removedIndex),
    rpgGear:reindexGearAfterRemoval(config.rpgGear,removedIndex)
  });
}

ROOT.GensInventoryEquippedViewV1=Object.freeze({
  VERSION,
  normalizeRef,
  normalizeGear,
  normalizeRefs,
  equippedIndices,
  equippedItems,
  reindexRefAfterRemoval,
  reindexRefsAfterRemoval
});
})(typeof window!=="undefined"?window:globalThis);
