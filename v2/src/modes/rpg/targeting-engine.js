import { evaluateAttackPosition, combatDistance } from './tactical-combat.js';

function clamp01(value){return Math.max(0,Math.min(0.999999999,Number(value)||0));}

export function validCombatTargets({combat,actorId,spatial=null,source=null,config={}}={}){
  const actor=combat?.actors?.[String(actorId)];
  if(!actor||actor.ko) return [];
  const targets=[];
  for(const candidate of Object.values(combat?.actors||{})){
    if(!candidate||candidate.ko||String(candidate.id)===String(actorId)||String(candidate.side)===String(actor.side)) continue;
    let position={ok:true,distance:null,modifier:0};
    if(spatial&&source) position=evaluateAttackPosition({spatial,combat,actorId,targetId:candidate.id,source,config});
    if(!position.ok) continue;
    targets.push({actor:candidate,distance:position.distance,modifier:position.modifier||0,position});
  }
  return targets;
}

export function validatePlayerTarget({combat,actorId,targetId,spatial=null,source=null,config={}}={}){
  if(String(combat?.activeActorId)!==String(actorId)) return {ok:false,reason:'not-active-actor'};
  const actor=combat?.actors?.[String(actorId)];
  const target=combat?.actors?.[String(targetId)];
  if(!actor) return {ok:false,reason:'missing-actor'};
  if(!target) return {ok:false,reason:'missing-target'};
  if(actor.ko) return {ok:false,reason:'actor-ko'};
  if(target.ko) return {ok:false,reason:'target-ko'};
  if(String(actor.side)===String(target.side)) return {ok:false,reason:'same-side'};
  if(spatial&&source){
    const position=evaluateAttackPosition({spatial,combat,actorId,targetId,source,config});
    if(!position.ok) return {ok:false,reason:position.reason,position};
    return {ok:true,targetId:String(targetId),position};
  }
  return {ok:true,targetId:String(targetId),position:null};
}

function resourceRatio(actor,resourceId){
  if(!resourceId) return 1;
  const resource=actor?.state?.resources?.[resourceId];
  const current=Number(resource?.current??resource??0)||0;
  const max=Number(resource?.max??current)||0;
  return max>0?current/max:1;
}

function randomIndex(length,random){return Math.min(length-1,Math.floor(clamp01(random())*length));}

export function chooseAiTarget({combat,actorId,spatial=null,source=null,config={},ai={},memory={},random=Math.random}={}){
  const candidates=validCombatTargets({combat,actorId,spatial,source,config});
  if(!candidates.length) return {ok:false,reason:'no-valid-target',targetId:null,memory:{...memory}};

  const rule=String(ai.targetRule||'varied');
  const primaryResourceId=ai.primaryResourceId||config.primaryResourceId||null;
  const lastTargetId=memory.lastTargetId==null?null:String(memory.lastTargetId);
  const avoidRepeat=ai.avoidRepeat!==false && candidates.length>1;
  const repeatPenalty=Math.max(0,Number(ai.repeatPenalty??0.35)||0);

  let pool=candidates;
  if(rule==='random'){
    if(avoidRepeat){
      const alternatives=candidates.filter(x=>String(x.actor.id)!==lastTargetId);
      if(alternatives.length) pool=alternatives;
    }
  } else if(rule==='nearest'){
    const withDistance=candidates.map(entry=>({entry,distance:Number.isFinite(entry.distance)?entry.distance:(spatial?combatDistance(spatial,actorId,entry.actor.id,{roomLayout:config.roomLayout||null}):Infinity)}));
    const min=Math.min(...withDistance.map(x=>x.distance));
    pool=withDistance.filter(x=>x.distance===min).map(x=>x.entry);
    if(avoidRepeat&&pool.length>1){const alternatives=pool.filter(x=>String(x.actor.id)!==lastTargetId);if(alternatives.length) pool=alternatives;}
  } else if(rule==='weakest'){
    const scored=candidates.map(entry=>({entry,score:resourceRatio(entry.actor,primaryResourceId)}));
    const min=Math.min(...scored.map(x=>x.score));
    pool=scored.filter(x=>x.score===min).map(x=>x.entry);
  } else {
    const weighted=[];
    let total=0;
    for(const entry of candidates){
      let weight=1;
      if(String(entry.actor.id)===lastTargetId&&avoidRepeat) weight*=repeatPenalty;
      if(Number.isFinite(entry.distance)) weight*=1/(1+Math.max(0,entry.distance)*0.15);
      weight=Math.max(0.0001,weight);
      total+=weight; weighted.push({entry,weight,total});
    }
    const pick=clamp01(random())*total;
    const chosen=weighted.find(x=>pick<x.total)?.entry||weighted.at(-1).entry;
    return {ok:true,targetId:String(chosen.actor.id),rule,memory:{...memory,lastTargetId:String(chosen.actor.id)}};
  }

  const chosen=pool[randomIndex(pool.length,random)]||pool[0];
  return {ok:true,targetId:String(chosen.actor.id),rule,memory:{...memory,lastTargetId:String(chosen.actor.id)}};
}
