function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export const CHEST_RARITIES=['common','rare','epic','legendary'];

export function createChestDefinition({
  id:chestId=uid(),
  name='Coffre',
  rarity='common',
  enabled=true,
  locked=false,
  keyItemId=null,
  consumeKey=false,
  loot=[],
  trapInteractionId=null,
  puzzleInteractionId=null,
  eventId=null,
  audioId=null,
  data={},
}={}){
  return {
    id:String(chestId),
    name:String(name||'Coffre'),
    rarity:CHEST_RARITIES.includes(rarity)?rarity:'common',
    enabled:enabled!==false,
    locked:Boolean(locked),
    keyItemId:keyItemId?String(keyItemId):null,
    consumeKey:Boolean(consumeKey),
    loot:(loot||[]).map(entry=>({
      itemId:String(entry.itemId||''),
      quantity:Math.max(0,Math.floor(Number(entry.quantity??1)||0)),
      enabled:entry.enabled!==false,
    })).filter(entry=>entry.itemId&&entry.quantity>0),
    trapInteractionId:trapInteractionId?String(trapInteractionId):null,
    puzzleInteractionId:puzzleInteractionId?String(puzzleInteractionId):null,
    eventId:eventId?String(eventId):null,
    audioId:audioId?String(audioId):null,
    data:clone(data||{}),
  };
}

export function createChestState(definition={}){
  const def=createChestDefinition(definition);
  return {
    chestId:def.id,
    opened:false,
    openCount:0,
    lootGranted:false,
    triggeredTrap:false,
    triggeredPuzzle:false,
    triggeredEvent:false,
    keyConsumed:false,
    lastOpenResult:null,
  };
}

function inventoryQuantity(inventory,itemId){return Number(inventory?.[itemId])||0;}

export function canOpenChest(definition,state,{inventory={}}={}){
  const def=createChestDefinition(definition);
  const current=state||createChestState(def);
  if(!def.enabled) return {ok:false,reason:'disabled'};
  if(current.opened) return {ok:true,reason:'already-open'};
  if(def.locked&&def.keyItemId&&inventoryQuantity(inventory,def.keyItemId)<1) return {ok:false,reason:'missing-key',keyItemId:def.keyItemId};
  return {ok:true,reason:null};
}

export function openChest(definition,state,{inventory={}}={}){
  const def=createChestDefinition(definition);
  const current=clone(state||createChestState(def));
  const nextInventory=clone(inventory||{});
  const allowed=canOpenChest(def,current,{inventory:nextInventory});
  if(!allowed.ok) return {ok:false,reason:allowed.reason,state:current,inventory:nextInventory,result:null};

  if(current.opened){
    return {ok:true,reason:'already-open',state:current,inventory:nextInventory,result:clone(current.lastOpenResult)};
  }

  if(def.locked&&def.keyItemId&&def.consumeKey){
    nextInventory[def.keyItemId]=Math.max(0,inventoryQuantity(nextInventory,def.keyItemId)-1);
    current.keyConsumed=true;
  }

  const granted=[];
  if(!current.lootGranted){
    for(const entry of def.loot){
      if(entry.enabled===false) continue;
      nextInventory[entry.itemId]=inventoryQuantity(nextInventory,entry.itemId)+entry.quantity;
      granted.push({itemId:entry.itemId,quantity:entry.quantity});
    }
    current.lootGranted=true;
  }

  current.opened=true;
  current.openCount=(Number(current.openCount)||0)+1;
  current.triggeredTrap=Boolean(def.trapInteractionId);
  current.triggeredPuzzle=Boolean(def.puzzleInteractionId);
  current.triggeredEvent=Boolean(def.eventId);

  const result={
    chestId:def.id,
    rarity:def.rarity,
    granted,
    trapInteractionId:def.trapInteractionId,
    puzzleInteractionId:def.puzzleInteractionId,
    eventId:def.eventId,
    audioId:def.audioId,
    keyConsumed:current.keyConsumed,
  };
  current.lastOpenResult=clone(result);
  return {ok:true,reason:null,state:current,inventory:nextInventory,result};
}

export function syncChestInteractionState(interactionState,chestState){
  return {
    ...(clone(interactionState||{})),
    opened:Boolean(chestState?.opened),
    triggered:Boolean(chestState?.opened),
    completed:Boolean(chestState?.opened),
    data:{...(clone(interactionState?.data||{})),chest:clone(chestState||{})},
  };
}
