function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export const ITEM_KINDS=['weapon','armor','equipment','consumable','scroll','ammo','quiver','quest','material','relic','misc'];

export function createItemDefinition({
  id=uid(),name='Nouvel objet',kind='misc',enabled=true,stackable=false,maxStack=99,
  rarity='common',icon=null,artId=null,audioId=null,value=0,weight=0,
  equipSlots=[],occupiesSlots=[],conditionIds=[],effectIds=[],skillIds=[],tags=[],data={}
}={}){
  return {
    id:String(id),name:String(name||'Objet'),kind:ITEM_KINDS.includes(kind)?kind:'misc',enabled:enabled!==false,
    stackable:Boolean(stackable),maxStack:Math.max(1,Number(maxStack)||99),rarity:String(rarity||'common'),
    icon:icon==null?null:String(icon),artId:artId==null?null:String(artId),audioId:audioId==null?null:String(audioId),
    value:Math.max(0,Number(value)||0),weight:Math.max(0,Number(weight)||0),
    equipSlots:[...(equipSlots||[])].map(String),occupiesSlots:[...(occupiesSlots||[])].map(String),
    conditionIds:[...(conditionIds||[])].map(String),effectIds:[...(effectIds||[])].map(String),skillIds:[...(skillIds||[])].map(String),
    tags:[...(tags||[])].map(String),data:clone(data||{}),
  };
}

export function createInventoryState({slots=[]}={}){
  return {entries:[],equipment:{},slots:[...(slots||[])].map(String),sequence:0};
}

function findDefinition(definitions,itemId){
  return (definitions?.items||[]).find?.(x=>String(x.id)===String(itemId))||definitions?.items?.[itemId]||null;
}

export function addItem(inventory,itemId,quantity=1,definitions={}){
  const item=findDefinition(definitions,itemId);
  const qty=Math.max(0,Math.floor(Number(quantity)||0));
  if(!item||item.enabled===false) return {ok:false,reason:'item-missing',inventory};
  if(qty<=0) return {ok:false,reason:'invalid-quantity',inventory};
  const next=clone(inventory); next.entries=Array.isArray(next.entries)?next.entries:[];
  if(item.stackable){
    let remaining=qty;
    for(const entry of next.entries.filter(e=>String(e.itemId)===String(itemId)&&Number(e.quantity)<Number(item.maxStack))){
      const room=Math.max(0,Number(item.maxStack)-Number(entry.quantity));
      const moved=Math.min(room,remaining); entry.quantity+=moved; remaining-=moved; if(remaining<=0) break;
    }
    while(remaining>0){const moved=Math.min(Number(item.maxStack),remaining);next.entries.push({entryId:uid(),itemId:String(itemId),quantity:moved});remaining-=moved;}
  } else {
    for(let i=0;i<qty;i++) next.entries.push({entryId:uid(),itemId:String(itemId),quantity:1});
  }
  next.sequence=(Number(next.sequence)||0)+1;
  return {ok:true,inventory:next};
}

export function removeItem(inventory,itemId,quantity=1){
  const qty=Math.max(0,Math.floor(Number(quantity)||0)); if(qty<=0) return {ok:false,reason:'invalid-quantity',inventory};
  const total=(inventory?.entries||[]).filter(e=>String(e.itemId)===String(itemId)).reduce((n,e)=>n+Number(e.quantity||0),0);
  if(total<qty) return {ok:false,reason:'not-enough',inventory};
  const next=clone(inventory); let remaining=qty;
  for(const entry of next.entries){if(String(entry.itemId)!==String(itemId)||remaining<=0) continue;const take=Math.min(Number(entry.quantity)||0,remaining);entry.quantity-=take;remaining-=take;}
  next.entries=next.entries.filter(e=>Number(e.quantity)>0);
  const existingEntryIds=new Set(next.entries.map(e=>String(e.entryId)));
  for(const [slot,equipped] of Object.entries(next.equipment||{})) if(equipped&&!existingEntryIds.has(String(equipped.entryId))) delete next.equipment[slot];
  next.sequence=(Number(next.sequence)||0)+1;
  return {ok:true,inventory:next};
}

function clearEquipmentEntries(equipment,entryIds){
  for(const [used,equipped] of Object.entries(equipment||{})){
    if(equipped&&entryIds.has(String(equipped.entryId))) delete equipment[used];
  }
}

export function equipItem(inventory,entryId,slot,definitions={}){
  const next=clone(inventory); const entry=(next.entries||[]).find(e=>String(e.entryId)===String(entryId));
  if(!entry) return {ok:false,reason:'entry-missing',inventory};
  const item=findDefinition(definitions,entry.itemId); if(!item) return {ok:false,reason:'item-missing',inventory};
  const target=String(slot||'');
  if(!target||!(next.slots||[]).includes(target)) return {ok:false,reason:'slot-missing',inventory};
  if(!(item.equipSlots||[]).includes(target)) return {ok:false,reason:'slot-not-allowed',inventory};
  const occupied=[...new Set([target,...(item.occupiesSlots||[]).map(String)])];
  for(const used of occupied) if(!(next.slots||[]).includes(used)) return {ok:false,reason:'required-slot-missing',inventory};

  next.equipment=next.equipment||{};
  const conflictingEntryIds=new Set([String(entryId)]);
  for(const used of occupied){
    const equipped=next.equipment[used];
    if(equipped?.entryId) conflictingEntryIds.add(String(equipped.entryId));
  }
  clearEquipmentEntries(next.equipment,conflictingEntryIds);

  const record={entryId:String(entryId),itemId:String(entry.itemId),primarySlot:target};
  for(const used of occupied) next.equipment[used]=record;
  next.sequence=(Number(next.sequence)||0)+1;
  return {ok:true,inventory:next,equipped:clone(record),occupiedSlots:occupied};
}

export function unequipSlot(inventory,slot){
  const target=inventory?.equipment?.[String(slot)]; if(!target) return {ok:false,reason:'slot-empty',inventory};
  const next=clone(inventory); for(const [used,equipped] of Object.entries(next.equipment||{})) if(String(equipped?.entryId)===String(target.entryId)) delete next.equipment[used];
  next.sequence=(Number(next.sequence)||0)+1; return {ok:true,inventory:next};
}

export function equippedItemIds(inventory){return [...new Set(Object.values(inventory?.equipment||{}).filter(Boolean).map(x=>String(x.itemId)))];}

export function inventoryQuantity(inventory,itemId){return (inventory?.entries||[]).filter(e=>String(e.itemId)===String(itemId)).reduce((n,e)=>n+Number(e.quantity||0),0);}
