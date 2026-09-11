import { applyQuestSignal } from './quest-runtime.js';

function clone(value){return structuredClone(value);}

function normalizeSignal(signal){
  if(!signal?.kind) return null;
  return {
    kind:String(signal.kind),
    targetId:signal.targetId==null?null:String(signal.targetId),
    amount:Math.max(0,Number(signal.amount??1)||0),
    metadata:clone(signal.metadata||{}),
  };
}

export function questSignalsForRoomVisit(roomId,{amount=1}={}){
  if(roomId==null||roomId==='') return [];
  return [{kind:'visit',targetId:String(roomId),amount:Math.max(0,Number(amount)||0)}];
}

export function questSignalsForInteraction(interaction,result={}){
  if(!interaction?.id||result?.success!==true) return [];
  const id=String(interaction.id);
  const kind=String(interaction.kind||'object');
  const signals=[
    {kind:'interact',targetId:id,amount:1,metadata:{interactionKind:kind}},
    {kind,targetId:id,amount:1,metadata:{interactionKind:kind}},
  ];
  for(const custom of interaction.data?.questSignals||[]){
    const normalized=normalizeSignal(custom);
    if(normalized) signals.push(normalized);
  }
  return signals;
}

export function applyRoomQuestSignals(runtime,quests,signals,{definitions={},context={},now=null}={}){
  let next=clone(runtime);
  const updates=[];
  for(const raw of signals||[]){
    const signal=normalizeSignal(raw);
    if(!signal||signal.amount<=0) continue;
    const out=applyQuestSignal(next,quests,signal,{definitions,context,now});
    next=out.runtime;
    updates.push(...(out.updates||[]));
  }
  return {ok:true,runtime:next,updates};
}

export function applyRoomVisitToQuests(runtime,quests,roomId,options={}){
  return applyRoomQuestSignals(runtime,quests,questSignalsForRoomVisit(roomId),options);
}

export function applyInteractionResultToQuests(runtime,quests,interaction,result,options={}){
  return applyRoomQuestSignals(runtime,quests,questSignalsForInteraction(interaction,result),options);
}
