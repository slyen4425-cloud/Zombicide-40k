import { evaluateCondition } from '../../core/conditions.js';
import { applyEffect } from '../../core/effects.js';
import { inventoryQuantity, removeItem } from './inventory-engine.js';

function clone(value){return structuredClone(value);}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}

export function validateItemDefinition(item,definitions={}){
  const errors=[];
  if(!item?.id) errors.push({code:'missing-id'});
  if(!item?.name) errors.push({code:'missing-name'});
  for(const id of item?.conditionIds||[]) if(!byId(definitions,'conditions',id)) errors.push({code:'missing-condition',conditionId:String(id)});
  for(const id of item?.effectIds||[]) if(!byId(definitions,'effects',id)) errors.push({code:'missing-effect',effectId:String(id)});
  for(const id of item?.skillIds||[]) if(!byId(definitions,'skills',id)) errors.push({code:'missing-skill',skillId:String(id)});
  const ammoType=item?.data?.ammoType;
  if(item?.data?.requiresAmmo===true&&!ammoType) errors.push({code:'missing-ammo-type'});
  return {valid:errors.length===0,errors};
}

export function canUseItem(item,context={},definitions={}){
  if(!item||item.enabled===false) return {ok:false,reason:'item-disabled'};
  if(item.data?.usable===false) return {ok:false,reason:'not-usable'};
  for(const id of item.conditionIds||[]){
    const condition=byId(definitions,'conditions',id);
    if(!condition) return {ok:false,reason:'condition-missing',conditionId:String(id)};
    if(!evaluateCondition(condition,context)) return {ok:false,reason:'conditions',conditionId:String(id)};
  }
  return {ok:true};
}

export function useInventoryItem({inventory,itemId,targetState,definitions={},context={}}={}){
  const item=byId(definitions,'items',itemId);
  if(!item) return {ok:false,reason:'item-missing',inventory,targetState};
  if(inventoryQuantity(inventory,itemId)<1) return {ok:false,reason:'not-owned',inventory,targetState};
  const allowed=canUseItem(item,context,definitions); if(!allowed.ok) return {ok:false,...allowed,inventory,targetState};
  let state=clone(targetState||{}); const effects=[];
  for(const effectId of item.effectIds||[]){
    const effect=byId(definitions,'effects',effectId);
    if(!effect){effects.push({effectId:String(effectId),applied:false,reason:'missing-effect'});continue;}
    const out=applyEffect(effect,state,definitions,context);
    if(out.applied) state=out.state;
    effects.push({effectId:String(effectId),applied:out.applied,reason:out.reason||null});
  }
  let nextInventory=inventory;
  const consume=item.data?.consumeOnUse ?? ['consumable','scroll'].includes(item.kind);
  if(consume){const removed=removeItem(inventory,itemId,1);if(!removed.ok)return {ok:false,reason:removed.reason,inventory,targetState};nextInventory=removed.inventory;}
  return {ok:true,inventory:nextInventory,targetState:state,effects,skillIds:[...(item.skillIds||[])],audioId:item.audioId||null,eventId:item.data?.eventId||null,consumed:Boolean(consume)};
}

export function equippedItemBonuses(inventory,definitions={}){
  const unique=new Map();
  for(const record of Object.values(inventory?.equipment||{})) if(record&&!unique.has(String(record.entryId))) unique.set(String(record.entryId),record);
  const effectIds=[]; const skillIds=[]; const itemIds=[];
  for(const record of unique.values()){
    const item=byId(definitions,'items',record.itemId); if(!item) continue;
    itemIds.push(String(item.id));
    for(const id of item.effectIds||[]) if(!effectIds.includes(String(id))) effectIds.push(String(id));
    for(const id of item.skillIds||[]) if(!skillIds.includes(String(id))) skillIds.push(String(id));
  }
  return {itemIds,effectIds,skillIds};
}

export function compatibleAmmoItems(weapon,definitions={}){
  const ammoType=weapon?.data?.ammoType;
  if(!ammoType) return [];
  return list(definitions,'items').filter(item=>item?.enabled!==false&&['ammo','quiver'].includes(item.kind)&&String(item.data?.ammoType||'')===String(ammoType));
}

export function consumeWeaponAmmo({inventory,weapon,shots=1,definitions={}}={}){
  const count=Math.max(1,Math.floor(Number(shots)||1));
  if(!weapon?.data?.requiresAmmo) return {ok:true,inventory,consumed:null};
  const candidates=compatibleAmmoItems(weapon,definitions).filter(item=>inventoryQuantity(inventory,item.id)>0);
  if(!candidates.length) return {ok:false,reason:'ammo-empty',inventory};
  let next=inventory; let remaining=count; const consumed=[];
  for(const ammo of candidates){
    if(remaining<=0) break;
    const have=inventoryQuantity(next,ammo.id); const take=Math.min(have,remaining);
    if(take>0){const out=removeItem(next,ammo.id,take);if(out.ok){next=out.inventory;remaining-=take;consumed.push({itemId:String(ammo.id),quantity:take});}}
  }
  if(remaining>0) return {ok:false,reason:'not-enough-ammo',inventory};
  return {ok:true,inventory:next,consumed};
}
