import { availableDialogue, recruitAlly, summonAlly, dismissGameplayAlly } from './ally-gameplay.js';
import { updateRoomInteractionState } from './room-runtime.js';

function clone(value){return structuredClone(value);}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}

function resolveDefinitions(definitions,roomInteraction){
  const allyInteractionId=roomInteraction?.data?.allyInteractionId;
  return allyInteractionId?byId(definitions,'allyInteractions',allyInteractionId):null;
}

export function inspectAllyRoomInteraction({roomRuntime,roomId,roomInteraction,definitions={},conditionEvaluator=null}={}){
  if(!roomInteraction||!['npc','ally'].includes(roomInteraction.kind)) return {ok:false,reason:'not-ally-interaction'};
  const state=roomRuntime?.rooms?.[String(roomId)]?.interactions?.[String(roomInteraction.id)];
  if(!state) return {ok:false,reason:'interaction-state-missing'};
  if(state.enabled===false) return {ok:false,reason:'interaction-disabled'};
  const gameplay=resolveDefinitions(definitions,roomInteraction);
  if(!gameplay) return {ok:false,reason:'ally-interaction-definition-missing'};
  return {
    ok:true,
    gameplay:clone(gameplay),
    dialogue:availableDialogue(gameplay,{conditionEvaluator}),
    recruited:Boolean(state.data?.recruited),
    summoned:Boolean(state.data?.summoned),
    dismissed:Boolean(state.data?.dismissed),
    instanceId:state.data?.allyInstanceId||null,
  };
}

function persist(roomRuntime,roomId,interactionId,patch){
  const current=roomRuntime?.rooms?.[String(roomId)]?.interactions?.[String(interactionId)];
  if(!current) return {ok:false,reason:'interaction-state-missing',roomRuntime};
  const data={...(current.data||{}),...(patch.data||{})};
  return updateRoomInteractionState(roomRuntime,roomId,interactionId,{...patch,data});
}

export function recruitFromRoomInteraction({roomRuntime,roomId,roomInteraction,roster,wallet={},definitions={},ownerActorId=null,x=null,y=null,conditionEvaluator=null}={}){
  const inspected=inspectAllyRoomInteraction({roomRuntime,roomId,roomInteraction,definitions,conditionEvaluator});
  if(!inspected.ok) return {...inspected,roomRuntime,roster,wallet};
  if(inspected.recruited) return {ok:false,reason:'already-recruited',roomRuntime,roster,wallet};
  const out=recruitAlly({interaction:inspected.gameplay,roster,wallet,definitions,ownerActorId,roomId,x,y,conditionEvaluator});
  if(!out.ok) return {...out,roomRuntime};
  const saved=persist(roomRuntime,roomId,roomInteraction.id,{triggered:true,completed:true,data:{recruited:true,allyInstanceId:String(out.runtime.instanceId)}});
  if(!saved.ok) return {ok:false,reason:saved.reason,roomRuntime,roster,wallet};
  return {...out,roomRuntime:saved.runtime};
}

export function summonFromRoomInteraction({roomRuntime,roomId,roomInteraction,roster,definitions={},ownerActorId=null,x=null,y=null,sourceKind=null,sourceId=null,conditionEvaluator=null}={}){
  const inspected=inspectAllyRoomInteraction({roomRuntime,roomId,roomInteraction,definitions,conditionEvaluator});
  if(!inspected.ok) return {...inspected,roomRuntime,roster};
  const out=summonAlly({interaction:inspected.gameplay,roster,definitions,ownerActorId,roomId,x,y,sourceKind,sourceId,conditionEvaluator});
  if(!out.ok) return {...out,roomRuntime};
  const saved=persist(roomRuntime,roomId,roomInteraction.id,{triggered:true,data:{summoned:true,allyInstanceId:String(out.runtime.instanceId)}});
  if(!saved.ok) return {ok:false,reason:saved.reason,roomRuntime,roster};
  return {...out,roomRuntime:saved.runtime};
}

export function dismissFromRoomInteraction({roomRuntime,roomId,roomInteraction,roster,instanceId,definitions={}}={}){
  const inspected=inspectAllyRoomInteraction({roomRuntime,roomId,roomInteraction,definitions});
  if(!inspected.ok) return {...inspected,roomRuntime,roster};
  const out=dismissGameplayAlly({interaction:inspected.gameplay,roster,instanceId});
  if(!out.ok) return {...out,roomRuntime};
  const saved=persist(roomRuntime,roomId,roomInteraction.id,{data:{dismissed:true,allyInstanceId:String(instanceId)}});
  if(!saved.ok) return {ok:false,reason:saved.reason,roomRuntime,roster};
  return {...out,roomRuntime:saved.runtime};
}
