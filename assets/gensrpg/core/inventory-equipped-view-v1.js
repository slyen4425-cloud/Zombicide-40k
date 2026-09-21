/* GenSrpG Core Inventory Equipped View V1 — pure slot-reference contract. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
function normalizedIndex(value,inventoryLength=null){
  if(value===null||value===undefined||typeof value==="boolean")return null;
  if(typeof value==="string"&&!value.trim())return null;
  const index=Number(value);
  if(!Number.isInteger(index)||index<0)return null;
  if(Number.isInteger(inventoryLength)&&inventoryLength>=0&&index>=inventoryLength)return null;
  return index;
}

function slotRefs(config={}){
  const out=[
    Object.freeze({scope:"hand",slot:"rightHand",index:config.rightHand}),
    Object.freeze({scope:"hand",slot:"leftHand",index:config.leftHand})
  ];
  const gear=record(config.rpgGear)?config.rpgGear:{};
  for(const [slot,index] of Object.entries(gear)){
    out.push(Object.freeze({scope:"rpgGear",slot:String(slot),index}));
  }
  return Object.freeze(out);
}

function equippedIndices(config={}){
  const length=Number.isInteger(config.inventoryLength)&&config.inventoryLength>=0
    ?config.inventoryLength
    :null;
  const seen=new Set(),out=[];
  for(const ref of slotRefs(config)){
    const index=normalizedIndex(ref.index,length);
    if(index===null||seen.has(index))continue;
    seen.add(index);
    out.push(index);
  }
  return Object.freeze(out);
}

function equippedItems(config={}){
  const inventory=Array.isArray(config.inventory)?config.inventory:[];
  const resolveItem=typeof config.resolveItem==="function"?config.resolveItem:null;
  if(!resolveItem)return Object.freeze([]);
  const out=[];
  for(const index of equippedIndices({
    inventoryLength:inventory.length,
    rightHand:config.rightHand,
    leftHand:config.leftHand,
    rpgGear:config.rpgGear
  })){
    const entry=inventory[index];
    if(!entry)continue;
    const item=resolveItem(entry,index);
    if(item)out.push(item);
  }
  return Object.freeze(out);
}

function rebaseIndexAfterRemoval(value,removedIndex){
  const index=normalizedIndex(value);
  const removed=normalizedIndex(removedIndex);
  if(index===null||removed===null)return null;
  if(index===removed)return null;
  return index>removed?index-1:index;
}

function rebaseSlotRefsAfterRemoval(config={},removedIndex){
  const gear=record(config.rpgGear)?config.rpgGear:{};
  const nextGear={};
  for(const [slot,index] of Object.entries(gear)){
    nextGear[slot]=rebaseIndexAfterRemoval(index,removedIndex);
  }
  return Object.freeze({
    rightHand:rebaseIndexAfterRemoval(config.rightHand,removedIndex),
    leftHand:rebaseIndexAfterRemoval(config.leftHand,removedIndex),
    rpgGear:Object.freeze(nextGear)
  });
}

ROOT.GensInventoryEquippedViewV1=Object.freeze({
  VERSION,
  normalizedIndex,
  slotRefs,
  equippedIndices,
  equippedItems,
  rebaseIndexAfterRemoval,
  rebaseSlotRefsAfterRemoval
});
})(typeof window!=="undefined"?window:globalThis);
