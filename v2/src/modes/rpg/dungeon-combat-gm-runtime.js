import { combatInteractionPolicy } from './combat-config.js';
import { appendCombatEvent, endActiveTurn } from './combat-session.js';
import { resolveCheck } from './combat-engine.js';

function clone(value){return structuredClone(value);}

function ensureManual(universe,combat){
  const policy=combatInteractionPolicy(universe||{});
  if(!policy.manualCombatControls) return {ok:false,reason:'gm-control-disabled',combat};
  if(!combat||combat.metadata?.kind!=='dungeon-room-combat') return {ok:false,reason:'not-dungeon-combat',combat};
  if(combat.phase!=='turn') return {ok:false,reason:'combat-not-active',combat};
  return {ok:true,policy};
}

export function gmSetCombatResource({universe={},combat=null,actorId=null,resourceId=null,value=0}={}){
  const gate=ensureManual(universe,combat);
  if(!gate.ok) return gate;
  const id=String(actorId||'');
  const rid=String(resourceId||'');
  const actor=combat.actors?.[id];
  if(!actor) return {ok:false,reason:'actor-missing',combat};
  if(!rid) return {ok:false,reason:'resource-missing',combat};
  const next=clone(combat);
  next.actors[id].state=next.actors[id].state||{};
  next.actors[id].state.resources=next.actors[id].state.resources||{};
  const existing=next.actors[id].state.resources[rid];
  let nextValue=Number(value);
  if(!Number.isFinite(nextValue)) return {ok:false,reason:'invalid-value',combat};
  if(existing&&typeof existing==='object'){
    const max=Number(existing.max);
    if(Number.isFinite(max)) nextValue=Math.min(max,nextValue);
    nextValue=Math.max(0,nextValue);
    next.actors[id].state.resources[rid]={...existing,current:nextValue};
  }else{
    next.actors[id].state.resources[rid]=nextValue;
  }
  const logged=appendCombatEvent(next,'gm-resource-set',{targetActorId:id,resourceId:rid,value:nextValue});
  return {ok:true,reason:null,combat:logged,actorId:id,resourceId:rid,value:nextValue};
}

export function gmSetCombatKo({universe={},combat=null,actorId=null,ko=true}={}){
  const gate=ensureManual(universe,combat);
  if(!gate.ok) return gate;
  const id=String(actorId||'');
  if(!combat.actors?.[id]) return {ok:false,reason:'actor-missing',combat};
  let next=clone(combat);
  next.actors[id].ko=Boolean(ko);
  next=appendCombatEvent(next,ko?'gm-combatant-ko':'gm-combatant-reactivated',{targetActorId:id,side:next.actors[id].side});
  return {ok:true,reason:null,combat:next,actorId:id,ko:Boolean(ko)};
}

export function gmRollCombatCheck({universe={},combat=null,actorId=null,spec={},roll=null,random=Math.random}={}){
  const gate=ensureManual(universe,combat);
  if(!gate.ok) return gate;
  const id=String(actorId||combat.activeActorId||'');
  const actor=combat.actors?.[id];
  if(!actor) return {ok:false,reason:'actor-missing',combat};
  const statId=spec?.statId==null?null:String(spec.statId);
  const statValue=statId?Number(actor.state?.stats?.[statId]??0)||0:Number(spec?.statValue)||0;
  const check=resolveCheck({...spec,statValue,roll,random});
  const next=appendCombatEvent(combat,'gm-check',{targetActorId:id,check});
  return {ok:true,reason:null,combat:next,actorId:id,check};
}

export function gmAdvanceCombatTurn({universe={},combat=null}={}){
  const gate=ensureManual(universe,combat);
  if(!gate.ok) return gate;
  const previousActorId=combat.activeActorId;
  const out=endActiveTurn(combat,{definitions:universe,defeatRule:universe?.combat?.defeatRule||null});
  let next=out.combat;
  next=appendCombatEvent(next,'gm-turn-advanced',{previousActorId,nextActorId:next.activeActorId});
  return {ok:true,reason:null,combat:next,previousActorId,nextActorId:next.activeActorId,statusEvents:out.statusEvents||[]};
}
