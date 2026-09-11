import { useInventoryItem, canUseItem } from './item-engine.js';
import { inventoryQuantity } from './inventory-engine.js';
import { normalizeTargetKind, validateSkillTarget } from './targeting-engine.js';
import { ensureCombatConfig } from './combat-config.js';
import { appendCombatEvent, beginActiveTurn, endActiveTurn, reconcileCombatState } from './combat-session.js';

function clone(value){return structuredClone(value);}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function heroRuntimeIndex(heroRuntimes=[],actorId){
  const id=String(actorId||'');
  return list(heroRuntimes).findIndex(hero=>String(hero?.instanceId||hero?.heroId||'')===id);
}

function itemById(universe={},itemId){
  return list(universe.items).find(item=>String(item?.id||'')===String(itemId||''))||null;
}

export function combatItemTargetKind(item){
  return normalizeTargetKind(item?.data?.targetKind??item?.data?.target??'self');
}

export function dungeonHeroCombatItems({combat,heroRuntimes=[],universe={},context={}}={}){
  if(!combat||combat.phase!=='turn'||!combat.activeActorId) return [];
  const actor=combat.actors?.[combat.activeActorId];
  if(!actor||actor.side!=='heroes'||actor.ko) return [];
  const index=heroRuntimeIndex(heroRuntimes,actor.id);
  if(index<0) return [];
  const hero=list(heroRuntimes)[index];
  const seen=new Set();
  const out=[];
  for(const entry of hero?.inventory?.entries||[]){
    const itemId=String(entry?.itemId||'');
    if(!itemId||seen.has(itemId)) continue;
    seen.add(itemId);
    const item=itemById(universe,itemId);
    if(!item||item.enabled===false) continue;
    const combatUsable=item.data?.combatUsable===true||(['consumable','scroll'].includes(String(item.kind))&&item.data?.combatUsable!==false);
    if(!combatUsable) continue;
    const quantity=inventoryQuantity(hero.inventory,itemId);
    if(quantity<1) continue;
    const allowed=canUseItem(item,{...context,combat,actor:actor.state},universe);
    if(!allowed.ok) continue;
    out.push({item:clone(item),itemId,quantity,targetKind:combatItemTargetKind(item),consumeTurn:item.data?.consumeTurn!==false});
  }
  return out;
}

export function useDungeonHeroCombatItem({combat,heroRuntimes=[],universe={},itemId,targetId=null,context={}}={}){
  if(!combat||combat.phase!=='turn'||!combat.activeActorId) return {ok:false,reason:'not-in-turn',combat,heroRuntimes:clone(heroRuntimes||[])};
  const actor=combat.actors?.[combat.activeActorId];
  if(!actor) return {ok:false,reason:'missing-actor',combat,heroRuntimes:clone(heroRuntimes||[])};
  if(actor.side!=='heroes') return {ok:false,reason:'not-hero-turn',combat,heroRuntimes:clone(heroRuntimes||[])};
  if(actor.ko) return {ok:false,reason:'actor-ko',combat,heroRuntimes:clone(heroRuntimes||[])};

  const items=dungeonHeroCombatItems({combat,heroRuntimes,universe,context});
  const entry=items.find(candidate=>String(candidate.itemId)===String(itemId||''));
  if(!entry) return {ok:false,reason:'item-unavailable',combat,heroRuntimes:clone(heroRuntimes||[])};

  const candidates=Object.values(combat.actors||{}).filter(candidate=>candidate&&!candidate.ko);
  const fallback=entry.targetKind==='self'
    ? String(actor.id)
    : String(candidates.find(candidate=>entry.targetKind==='ally'
      ? String(candidate.side)===String(actor.side)&&String(candidate.id)!==String(actor.id)
      : entry.targetKind==='enemy'
        ? String(candidate.side)!==String(actor.side)
        : true)?.id||'');
  const selectedTargetId=String(targetId||fallback||'');
  if(!selectedTargetId) return {ok:false,reason:'missing-target',combat,heroRuntimes:clone(heroRuntimes||[])};

  const targetCheck=validateSkillTarget({combat,actorId:actor.id,targetId:selectedTargetId,targetKind:entry.targetKind});
  if(!targetCheck.ok) return {ok:false,reason:targetCheck.reason,targetCheck,combat,heroRuntimes:clone(heroRuntimes||[])};

  const heroes=clone(heroRuntimes||[]);
  const heroArray=list(heroes);
  const heroIndex=heroRuntimeIndex(heroArray,actor.id);
  if(heroIndex<0) return {ok:false,reason:'hero-runtime-missing',combat,heroRuntimes:heroes};
  const hero=heroArray[heroIndex];
  const targetActor=combat.actors?.[selectedTargetId];
  const used=useInventoryItem({
    inventory:hero.inventory,
    itemId:entry.itemId,
    targetState:targetActor.state,
    definitions:universe,
    context:{...context,combat,actor:actor.state,target:targetActor.state,actorId:String(actor.id),targetId:selectedTargetId},
  });
  if(!used.ok) return {ok:false,reason:used.reason,combat,heroRuntimes:clone(heroRuntimes||[])};

  hero.inventory=used.inventory;
  let next=clone(combat);
  next.actors[selectedTargetId].state=used.targetState;
  next=appendCombatEvent(next,'item-used',{
    actorId:String(actor.id),targetId:selectedTargetId,itemId:String(entry.itemId),
    consumed:Boolean(used.consumed),effects:clone(used.effects||[]),audioId:used.audioId||null,eventId:used.eventId||null,
  });

  const config=ensureCombatConfig(universe);
  next=reconcileCombatState(next,{defeatRule:config.defeatRule});
  if(entry.consumeTurn&&next.phase==='turn'){
    next=endActiveTurn(next,{definitions:universe,defeatRule:config.defeatRule}).combat;
    if(next.phase==='turn'&&next.activeActorId) next=beginActiveTurn(next,{definitions:universe,defeatRule:config.defeatRule}).combat;
  }

  return {
    ok:true,reason:null,combat:next,heroRuntimes:heroes,
    actorId:String(actor.id),targetId:selectedTargetId,itemId:String(entry.itemId),targetKind:entry.targetKind,
    quantityRemaining:inventoryQuantity(hero.inventory,entry.itemId),consumed:Boolean(used.consumed),consumeTurn:Boolean(entry.consumeTurn),
    effects:clone(used.effects||[]),audioId:used.audioId||null,eventId:used.eventId||null,
  };
}
