import { evaluateConditions } from '../../core/conditions.js';
import { createQuestState, startQuest, addQuestProgress, completeQuest, failQuest } from './quest-engine.js';

function clone(value){return structuredClone(value);}
function byId(list,id){return (list||[]).find(x=>String(x.id)===String(id));}
function conditionList(ids,definitions={}){return (ids||[]).map(id=>byId(definitions.conditions,id)).filter(Boolean);}

export function createQuestRuntime(quests=[]){
  return {
    states:Object.fromEntries((quests||[]).filter(q=>q?.id).map(q=>[String(q.id),createQuestState(q)])),
    sequence:0,
    log:[],
  };
}

function ensureState(runtime,quest){
  const next=clone(runtime||createQuestRuntime());
  next.states=next.states||{};
  const id=String(quest.id);
  if(!next.states[id]) next.states[id]=createQuestState(quest);
  return next;
}

function appendLog(runtime,type,payload={}){
  const next=clone(runtime);
  next.sequence=(Number(next.sequence)||0)+1;
  next.log=Array.isArray(next.log)?next.log:[];
  next.log.push({seq:next.sequence,type,...clone(payload)});
  return next;
}

export function startQuestRuntime(runtime,quest,{definitions={},context={},now=null}={}){
  let next=ensureState(runtime,quest);
  const conditions=conditionList(quest.startConditionIds,definitions);
  const canStart=evaluateConditions(conditions,context,'all');
  const started=startQuest(quest,next.states[String(quest.id)],{canStart,now});
  if(!started.ok) return {ok:false,reason:started.reason,runtime:next,state:clone(next.states[String(quest.id)])};
  next.states[String(quest.id)]=started.state;
  next=appendLog(next,'quest-started',{questId:String(quest.id),runId:started.state.runId});
  return {ok:true,runtime:next,state:clone(started.state)};
}

function objectiveMatches(objective,signal){
  if(String(objective.kind||'flag')!==String(signal.kind||'')) return false;
  if(objective.targetId!=null&&String(objective.targetId)!==String(signal.targetId??'')) return false;
  return true;
}

export function applyQuestSignal(runtime,quests,signal,{definitions={},context={},now=null}={}){
  let next=clone(runtime||createQuestRuntime(quests));
  const updates=[];
  for(const quest of quests||[]){
    if(!quest?.id) continue;
    next=ensureState(next,quest);
    let state=next.states[String(quest.id)];
    if(state.status!=='active') continue;
    for(const objective of quest.objectives||[]){
      if(!objectiveMatches(objective,signal)) continue;
      const conditions=conditionList(objective.conditionIds,definitions);
      if(!evaluateConditions(conditions,context,'all')) continue;
      const progressed=addQuestProgress(quest,state,objective.id,signal.amount??1,{now});
      if(!progressed.ok) continue;
      state=progressed.state;
      next.states[String(quest.id)]=state;
      updates.push({questId:String(quest.id),objectiveId:String(objective.id),value:state.progress?.[objective.id]||0,ready:progressed.questReady});
      next=appendLog(next,'quest-progress',{questId:String(quest.id),objectiveId:String(objective.id),amount:signal.amount??1,value:state.progress?.[objective.id]||0});
    }
  }
  return {ok:true,runtime:next,updates};
}

export function completeQuestRuntime(runtime,quest,{now=null}={}){
  let next=ensureState(runtime,quest);
  const completed=completeQuest(quest,next.states[String(quest.id)],{now});
  if(!completed.ok) return {ok:false,reason:completed.reason,runtime:next,state:clone(next.states[String(quest.id)])};
  next.states[String(quest.id)]=completed.state;
  next=appendLog(next,'quest-completed',{questId:String(quest.id),rewards:completed.rewards});
  return {ok:true,runtime:next,state:clone(completed.state),rewards:clone(completed.rewards)};
}

export function failQuestRuntime(runtime,quest,{now=null}={}){
  let next=ensureState(runtime,quest);
  const failed=failQuest(quest,next.states[String(quest.id)],{now});
  if(!failed.ok) return {ok:false,reason:failed.reason,runtime:next,state:clone(next.states[String(quest.id)])};
  next.states[String(quest.id)]=failed.state;
  next=appendLog(next,'quest-failed',{questId:String(quest.id),eventId:failed.eventId||null});
  return {ok:true,runtime:next,state:clone(failed.state),eventId:failed.eventId||null};
}

export function questRuntimeSnapshot(runtime,questId){
  const state=runtime?.states?.[String(questId)];
  return state?clone(state):null;
}
