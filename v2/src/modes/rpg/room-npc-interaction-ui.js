import { inspectAllyRoomInteraction } from './ally-interaction-runtime.js';
import { buildNpcInteractionView, applyNpcQuestAction, renderNpcInteractionView } from './npc-interaction-ui.js';

function clone(value){return structuredClone(value);}
function byId(list,id){return (list||[]).find(item=>String(item.id)===String(id))||null;}

function withEscortQuestAction(roomInteraction,gameplay,quests=[]){
  const next=clone(roomInteraction||{});
  next.data=clone(next.data||{});
  next.data.questActions=Array.isArray(next.data.questActions)?clone(next.data.questActions):[];
  const questId=gameplay?.escortQuestId;
  if(questId&&byId(quests,questId)&&!next.data.questActions.some(action=>action.kind==='start-quest'&&String(action.questId)===String(questId))){
    const quest=byId(quests,questId);
    next.data.questActions.push({id:`escort:${questId}`,kind:'start-quest',questId:String(questId),label:`Accepter : ${quest.name}`});
  }
  return next;
}

export function buildRoomNpcInteractionView({roomRuntime,roomId,roomInteraction,definitions={},quests=[],conditionEvaluator=null}={}){
  const inspected=inspectAllyRoomInteraction({roomRuntime,roomId,roomInteraction,definitions,conditionEvaluator});
  if(!inspected.ok) return {ok:false,reason:inspected.reason,view:null,dialogue:[],gameplay:null};
  const interaction=withEscortQuestAction(roomInteraction,inspected.gameplay,quests);
  const view=buildNpcInteractionView({interaction,dialogue:inspected.dialogue,quests,conditionEvaluator});
  return {
    ok:true,
    view,
    dialogue:clone(inspected.dialogue),
    gameplay:clone(inspected.gameplay),
    recruited:inspected.recruited,
    summoned:inspected.summoned,
    dismissed:inspected.dismissed,
    instanceId:inspected.instanceId,
  };
}

export function applyRoomNpcQuestAction(roomRuntime,quests,action,{definitions={},context={},now=null}={}){
  const questRuntime=roomRuntime?.questRuntime||null;
  const out=applyNpcQuestAction(questRuntime,quests,action,{definitions,context,now});
  if(!out.ok) return {...out,roomRuntime};
  const next=clone(roomRuntime||{});
  next.questRuntime=out.runtime;
  return {...out,roomRuntime:next};
}

export function mountRoomNpcInteraction(host,{roomRuntime,roomId,roomInteraction,definitions={},quests=[],conditionEvaluator=null,context={},onRoomRuntimeChange=null}={}){
  let currentRuntime=roomRuntime;
  const render=()=>{
    const built=buildRoomNpcInteractionView({roomRuntime:currentRuntime,roomId,roomInteraction,definitions,quests,conditionEvaluator});
    if(!built.ok){host.innerHTML='<p class="muted">Interaction indisponible.</p>';return built;}
    host.innerHTML=renderNpcInteractionView(built.view);
    host.querySelectorAll('[data-npc-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=built.view.actions.find(item=>String(item.id)===String(button.dataset.npcAction));
      const out=applyRoomNpcQuestAction(currentRuntime,quests,action,{definitions,context});
      if(out.ok){currentRuntime=out.roomRuntime;onRoomRuntimeChange?.(currentRuntime,out);render();}
    }));
    return built;
  };
  render();
  return {getRoomRuntime:()=>currentRuntime,render};
}
