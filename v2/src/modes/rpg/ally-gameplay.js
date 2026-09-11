import { createAllyRuntime, addAlly, dismissAlly } from './ally-engine.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}

export function createAllyInteractionDefinition({
  id=uid(),allyDefinitionId=null,dialogue=[],recruitment=null,summon=null,escortQuestId=null,dismissEventId=null,tags=[]
}={}){
  return {
    id:String(id),allyDefinitionId:allyDefinitionId==null?null:String(allyDefinitionId),
    dialogue:(dialogue||[]).map((line,index)=>({
      id:String(line.id||`line-${index+1}`),speaker:String(line.speaker||'npc'),text:String(line.text||''),
      conditionIds:[...(line.conditionIds||[])].map(String),eventId:line.eventId==null?null:String(line.eventId),
    })),
    recruitment:recruitment?{
      enabled:recruitment.enabled!==false,currencyId:String(recruitment.currencyId||'gold'),cost:Math.max(0,Number(recruitment.cost)||0),
      conditionIds:[...(recruitment.conditionIds||[])].map(String),successEventId:recruitment.successEventId==null?null:String(recruitment.successEventId),
      failureEventId:recruitment.failureEventId==null?null:String(recruitment.failureEventId),
    }:null,
    summon:summon?{
      enabled:summon.enabled!==false,sourceKind:['skill','item','event','manual'].includes(summon.sourceKind)?summon.sourceKind:'manual',
      sourceId:summon.sourceId==null?null:String(summon.sourceId),conditionIds:[...(summon.conditionIds||[])].map(String),
      successEventId:summon.successEventId==null?null:String(summon.successEventId),
    }:null,
    escortQuestId:escortQuestId==null?null:String(escortQuestId),dismissEventId:dismissEventId==null?null:String(dismissEventId),tags:[...(tags||[])].map(String),
  };
}

export function validateAllyInteraction(definition,definitions={}){
  const errors=[];
  if(!definition?.id) errors.push({code:'missing-id'});
  if(!definition?.allyDefinitionId||!byId(definitions,'allies',definition.allyDefinitionId)) errors.push({code:'missing-ally-definition'});
  for(const line of definition?.dialogue||[]){
    for(const id of line.conditionIds||[]) if(!byId(definitions,'conditions',id)) errors.push({code:'missing-condition',conditionId:String(id),lineId:String(line.id)});
    if(line.eventId&&!byId(definitions,'events',line.eventId)) errors.push({code:'missing-event',eventId:String(line.eventId),lineId:String(line.id)});
  }
  for(const id of definition?.recruitment?.conditionIds||[]) if(!byId(definitions,'conditions',id)) errors.push({code:'missing-condition',conditionId:String(id),scope:'recruitment'});
  for(const id of definition?.summon?.conditionIds||[]) if(!byId(definitions,'conditions',id)) errors.push({code:'missing-condition',conditionId:String(id),scope:'summon'});
  if(definition?.escortQuestId&&!byId(definitions,'quests',definition.escortQuestId)) errors.push({code:'missing-quest',questId:String(definition.escortQuestId)});
  if(definition?.recruitment?.successEventId&&!byId(definitions,'events',definition.recruitment.successEventId)) errors.push({code:'missing-event',eventId:String(definition.recruitment.successEventId)});
  if(definition?.recruitment?.failureEventId&&!byId(definitions,'events',definition.recruitment.failureEventId)) errors.push({code:'missing-event',eventId:String(definition.recruitment.failureEventId)});
  if(definition?.summon?.successEventId&&!byId(definitions,'events',definition.summon.successEventId)) errors.push({code:'missing-event',eventId:String(definition.summon.successEventId)});
  if(definition?.dismissEventId&&!byId(definitions,'events',definition.dismissEventId)) errors.push({code:'missing-event',eventId:String(definition.dismissEventId)});
  return {valid:errors.length===0,errors};
}

export function availableDialogue(definition,{conditionEvaluator=null}={}){
  return (definition?.dialogue||[]).filter(line=>{
    if(!line.conditionIds?.length) return true;
    if(!conditionEvaluator) return false;
    return line.conditionIds.every(id=>conditionEvaluator(String(id))===true);
  }).map(line=>clone(line));
}

function requirementsMet(conditionIds,conditionEvaluator){
  if(!conditionIds?.length) return true;
  if(!conditionEvaluator) return false;
  return conditionIds.every(id=>conditionEvaluator(String(id))===true);
}

export function recruitAlly({interaction,roster,wallet={},definitions={},ownerActorId=null,roomId=null,x=null,y=null,conditionEvaluator=null}={}){
  if(!interaction?.recruitment?.enabled) return {ok:false,reason:'recruitment-disabled',roster,wallet};
  if(!requirementsMet(interaction.recruitment.conditionIds,conditionEvaluator)) return {ok:false,reason:'conditions',roster,wallet,eventId:interaction.recruitment.failureEventId||null};
  const allyDef=byId(definitions,'allies',interaction.allyDefinitionId); if(!allyDef) return {ok:false,reason:'ally-definition-missing',roster,wallet};
  const currency=String(interaction.recruitment.currencyId||'gold'); const cost=Math.max(0,Number(interaction.recruitment.cost)||0); const balance=Math.max(0,Number(wallet?.[currency])||0);
  if(balance<cost) return {ok:false,reason:'not-enough-currency',roster,wallet,cost,currency,eventId:interaction.recruitment.failureEventId||null};
  const created=createAllyRuntime(allyDef,definitions,{ownerActorId,roomId,x,y}); if(!created.ok) return {ok:false,reason:created.reason,roster,wallet};
  const added=addAlly(roster,created.runtime); if(!added.ok) return {ok:false,reason:added.reason,roster,wallet};
  const nextWallet=clone(wallet||{}); nextWallet[currency]=balance-cost;
  return {ok:true,roster:added.roster,wallet:nextWallet,runtime:created.runtime,cost,currency,eventId:interaction.recruitment.successEventId||null,escortQuestId:interaction.escortQuestId||null};
}

export function summonAlly({interaction,roster,definitions={},ownerActorId=null,roomId=null,x=null,y=null,sourceKind=null,sourceId=null,conditionEvaluator=null}={}){
  if(!interaction?.summon?.enabled) return {ok:false,reason:'summon-disabled',roster};
  if(!requirementsMet(interaction.summon.conditionIds,conditionEvaluator)) return {ok:false,reason:'conditions',roster};
  if(sourceKind&&String(sourceKind)!==String(interaction.summon.sourceKind)) return {ok:false,reason:'wrong-source-kind',roster};
  if(interaction.summon.sourceId&&String(sourceId||'')!==String(interaction.summon.sourceId)) return {ok:false,reason:'wrong-source',roster};
  const allyDef=byId(definitions,'allies',interaction.allyDefinitionId); if(!allyDef) return {ok:false,reason:'ally-definition-missing',roster};
  const created=createAllyRuntime(allyDef,definitions,{ownerActorId,roomId,x,y}); if(!created.ok) return {ok:false,reason:created.reason,roster};
  const added=addAlly(roster,created.runtime); if(!added.ok) return {ok:false,reason:added.reason,roster};
  return {ok:true,roster:added.roster,runtime:created.runtime,eventId:interaction.summon.successEventId||null};
}

export function dismissGameplayAlly({interaction,roster,instanceId}={}){
  const out=dismissAlly(roster,instanceId); if(!out.ok) return out;
  return {...out,eventId:interaction?.dismissEventId||null};
}
