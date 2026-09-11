function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function hasId(definitions,key,id){return list(definitions,key).some(x=>String(x.id)===String(id));}

export function createQuestDefinition({
  id=uid(),name='Nouvelle quête',description='',enabled=true,repeatable=false,
  startConditionIds=[],objectives=[],rewardItemIds=[],rewardXp=0,rewardEventId=null,
  completionEventId=null,failureEventId=null,tags=[],metadata={}
}={}){
  return {
    id:String(id),name:String(name||'Quête'),description:String(description||''),enabled:enabled!==false,repeatable:Boolean(repeatable),
    startConditionIds:[...(startConditionIds||[])].map(String),
    objectives:(objectives||[]).map((objective,index)=>normalizeObjective(objective,index)),
    rewardItemIds:[...(rewardItemIds||[])].map(String),rewardXp:Math.max(0,Number(rewardXp)||0),
    rewardEventId:rewardEventId==null?null:String(rewardEventId),completionEventId:completionEventId==null?null:String(completionEventId),
    failureEventId:failureEventId==null?null:String(failureEventId),tags:[...(tags||[])].map(String),metadata:clone(metadata||{}),
  };
}

function normalizeObjective(objective={},index=0){
  return {
    id:String(objective.id||`objective-${index+1}`),label:String(objective.label||`Objectif ${index+1}`),
    kind:String(objective.kind||'flag'),targetId:objective.targetId==null?null:String(objective.targetId),
    required:Math.max(1,Math.floor(Number(objective.required??1)||1)),optional:Boolean(objective.optional),
    conditionIds:[...(objective.conditionIds||[])].map(String),metadata:clone(objective.metadata||{}),
  };
}

export function validateQuestDefinition(quest,definitions={}){
  const errors=[]; const objectiveIds=new Set();
  if(!quest?.id) errors.push({code:'missing-id'}); if(!quest?.name) errors.push({code:'missing-name'});
  for(const id of quest?.startConditionIds||[]) if(!hasId(definitions,'conditions',id)) errors.push({code:'missing-condition',conditionId:String(id)});
  for(const id of quest?.rewardItemIds||[]) if(!hasId(definitions,'items',id)) errors.push({code:'missing-item',itemId:String(id)});
  for(const eventField of ['rewardEventId','completionEventId','failureEventId']){const id=quest?.[eventField];if(id&&!hasId(definitions,'events',id)) errors.push({code:'missing-event',field:eventField,eventId:String(id)});}
  for(const objective of quest?.objectives||[]){
    if(objectiveIds.has(String(objective.id))) errors.push({code:'duplicate-objective',objectiveId:String(objective.id)}); objectiveIds.add(String(objective.id));
    for(const id of objective.conditionIds||[]) if(!hasId(definitions,'conditions',id)) errors.push({code:'missing-objective-condition',objectiveId:String(objective.id),conditionId:String(id)});
  }
  return {valid:errors.length===0,errors};
}

export function createQuestState(quest,{runId=null}={}){
  const definition=createQuestDefinition(quest||{});
  const progress={}; for(const objective of definition.objectives) progress[objective.id]=0;
  return {questId:definition.id,runId:String(runId||`${definition.id}:run`),status:'inactive',progress,completedObjectiveIds:[],startedAt:null,completedAt:null,failedAt:null,rewardsClaimed:false,history:[]};
}

export function startQuest(quest,state,{canStart=true,now=null}={}){
  if(!quest||quest.enabled===false) return {ok:false,reason:'quest-disabled',state};
  if(state?.status==='active') return {ok:false,reason:'already-active',state};
  if(state?.status==='completed'&&!quest.repeatable) return {ok:false,reason:'already-completed',state};
  if(!canStart) return {ok:false,reason:'conditions',state};
  const next=createQuestState(quest,{runId:state?.runId}); next.status='active'; next.startedAt=now||new Date().toISOString(); next.history.push({type:'started',at:next.startedAt});
  return {ok:true,state:next};
}

export function addQuestProgress(quest,state,objectiveId,amount=1,{now=null}={}){
  if(state?.status!=='active') return {ok:false,reason:'not-active',state};
  const objective=(quest?.objectives||[]).find(x=>String(x.id)===String(objectiveId));
  if(!objective) return {ok:false,reason:'objective-missing',state};
  const next=clone(state); const id=String(objective.id); const required=Math.max(1,Number(objective.required)||1); const delta=Math.max(0,Number(amount)||0);
  next.progress[id]=Math.min(required,Math.max(0,Number(next.progress?.[id]||0))+delta);
  if(next.progress[id]>=required&&!next.completedObjectiveIds.includes(id)) next.completedObjectiveIds.push(id);
  next.history=[...(next.history||[]),{type:'progress',objectiveId:id,amount:delta,value:next.progress[id],at:now||new Date().toISOString()}];
  return {ok:true,state:next,objectiveCompleted:next.progress[id]>=required,questReady:isQuestReady(quest,next)};
}

export function isQuestReady(quest,state){
  if(state?.status!=='active') return false;
  return (quest?.objectives||[]).filter(x=>!x.optional).every(objective=>Number(state.progress?.[objective.id]||0)>=Math.max(1,Number(objective.required)||1));
}

export function completeQuest(quest,state,{now=null}={}){
  if(state?.status==='completed') return {ok:false,reason:'already-completed',state};
  if(!isQuestReady(quest,state)) return {ok:false,reason:'objectives-incomplete',state};
  const next=clone(state); next.status='completed'; next.completedAt=now||new Date().toISOString(); next.history=[...(next.history||[]),{type:'completed',at:next.completedAt}];
  return {ok:true,state:next,rewards:{itemIds:[...(quest.rewardItemIds||[])],xp:Math.max(0,Number(quest.rewardXp)||0),eventIds:[quest.rewardEventId,quest.completionEventId].filter(Boolean).map(String)}};
}

export function failQuest(quest,state,{now=null}={}){
  if(state?.status!=='active') return {ok:false,reason:'not-active',state};
  const next=clone(state); next.status='failed'; next.failedAt=now||new Date().toISOString(); next.history=[...(next.history||[]),{type:'failed',at:next.failedAt}];
  return {ok:true,state:next,eventId:quest?.failureEventId||null};
}

export function claimQuestRewards(state){
  if(state?.status!=='completed') return {ok:false,reason:'not-completed',state};
  if(state?.rewardsClaimed) return {ok:false,reason:'already-claimed',state};
  const next=clone(state); next.rewardsClaimed=true; next.history=[...(next.history||[]),{type:'rewards-claimed'}]; return {ok:true,state:next};
}
