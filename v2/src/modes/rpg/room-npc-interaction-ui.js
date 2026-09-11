import { inspectAllyRoomInteraction, recruitFromRoomInteraction, summonFromRoomInteraction, dismissFromRoomInteraction } from './ally-interaction-runtime.js';
import { buildNpcInteractionView, applyNpcQuestAction, renderNpcInteractionView } from './npc-interaction-ui.js';
import { enqueueEventRequest } from './event-queue-runtime.js';
import { drainRoomRuntimeEvents } from './room-event-runtime.js';

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

export function allyRoomUiActions({gameplay,recruited=false,summoned=false,dismissed=false,instanceId=null}={}){
  const actions=[];
  if(gameplay?.recruitment?.enabled&&!recruited&&!dismissed){
    const cost=Math.max(0,Number(gameplay.recruitment.cost)||0);
    const currency=String(gameplay.recruitment.currencyId||'gold');
    actions.push({id:'ally:recruit',kind:'recruit-ally',label:cost>0?`Recruter · ${cost} ${currency}`:'Recruter'});
  }
  if(gameplay?.summon?.enabled&&!summoned&&!dismissed){
    actions.push({id:'ally:summon',kind:'summon-ally',label:'Invoquer',sourceKind:gameplay.summon.sourceKind||'manual',sourceId:gameplay.summon.sourceId||null});
  }
  if(instanceId&&(recruited||summoned)&&!dismissed){
    actions.push({id:'ally:dismiss',kind:'dismiss-ally',label:'Renvoyer',instanceId:String(instanceId)});
  }
  return actions;
}

export function buildRoomNpcInteractionView({roomRuntime,roomId,roomInteraction,definitions={},quests=[],conditionEvaluator=null}={}){
  const inspected=inspectAllyRoomInteraction({roomRuntime,roomId,roomInteraction,definitions,conditionEvaluator});
  if(!inspected.ok) return {ok:false,reason:inspected.reason,view:null,dialogue:[],gameplay:null};
  const interaction=withEscortQuestAction(roomInteraction,inspected.gameplay,quests);
  const view=buildNpcInteractionView({interaction,dialogue:inspected.dialogue,quests,conditionEvaluator});
  view.actions.push(...allyRoomUiActions(inspected));
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

function queueAllyEvent(roomRuntime,eventId,action,roomInteraction,outcome){
  if(!eventId) return {roomRuntime,eventQueued:false,eventRequest:null};
  const next=clone(roomRuntime||{});
  const queued=enqueueEventRequest(next.eventQueue,eventId,{source:'npc-ally-action',sourceId:roomInteraction?.id||null,metadata:{actionKind:action?.kind||null,outcome}});
  if(!queued.ok) return {roomRuntime,eventQueued:false,eventRequest:null};
  next.eventQueue=queued.queue;
  return {roomRuntime:next,eventQueued:true,eventRequest:queued.request};
}

export function applyRoomNpcAllyAction(roomRuntime,roomId,roomInteraction,action,{roster,wallet={},definitions={},ownerActorId=null,x=null,y=null,conditionEvaluator=null}={}){
  if(!action) return {ok:false,reason:'action-missing',roomRuntime,roster,wallet,eventQueued:false};
  let out;
  if(action.kind==='recruit-ally'){
    out=recruitFromRoomInteraction({roomRuntime,roomId,roomInteraction,roster,wallet,definitions,ownerActorId,x,y,conditionEvaluator});
  } else if(action.kind==='summon-ally'){
    out=summonFromRoomInteraction({roomRuntime,roomId,roomInteraction,roster,definitions,ownerActorId,x,y,sourceKind:action.sourceKind,sourceId:action.sourceId,conditionEvaluator});
  } else if(action.kind==='dismiss-ally'){
    out=dismissFromRoomInteraction({roomRuntime,roomId,roomInteraction,roster,instanceId:action.instanceId,definitions});
  } else {
    return {ok:false,reason:'action-unsupported',roomRuntime,roster,wallet,eventQueued:false};
  }
  const baseRuntime=out.roomRuntime||roomRuntime;
  const queued=queueAllyEvent(baseRuntime,out.eventId,action,roomInteraction,out.ok?'success':'failure');
  return {...out,roomRuntime:queued.roomRuntime,eventQueued:queued.eventQueued,eventRequest:queued.eventRequest};
}

export function mountRoomNpcInteraction(host,{roomRuntime,roomId,roomInteraction,definitions={},quests=[],conditionEvaluator=null,context={},roster=null,wallet={},ownerActorId=null,x=null,y=null,eventContext={},onRoomRuntimeChange=null,onAllyStateChange=null,onEventStateChange=null}={}){
  let currentRuntime=roomRuntime;
  let currentRoster=roster;
  let currentWallet=wallet;
  let currentEventWorld=clone(eventContext.world||{});
  const render=()=>{
    const built=buildRoomNpcInteractionView({roomRuntime:currentRuntime,roomId,roomInteraction,definitions,quests,conditionEvaluator});
    if(!built.ok){host.innerHTML='<p class="muted">Interaction indisponible.</p>';return built;}
    host.innerHTML=renderNpcInteractionView(built.view);
    host.querySelectorAll('[data-npc-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=built.view.actions.find(item=>String(item.id)===String(button.dataset.npcAction));
      if(!action) return;
      if(['recruit-ally','summon-ally','dismiss-ally'].includes(action.kind)){
        const out=applyRoomNpcAllyAction(currentRuntime,roomId,roomInteraction,action,{roster:currentRoster,wallet:currentWallet,definitions,ownerActorId,x,y,conditionEvaluator});
        if(out.ok||out.eventQueued){
          currentRuntime=out.roomRuntime;
          if(out.ok&&out.roster) currentRoster=out.roster;
          if(out.ok&&out.wallet) currentWallet=out.wallet;
          if(out.eventQueued){
            const events=drainRoomRuntimeEvents(currentRuntime,definitions,{...eventContext,roomId,world:currentEventWorld});
            currentRuntime=events.roomRuntime;
            currentEventWorld=events.world;
            onEventStateChange?.({roomRuntime:currentRuntime,world:currentEventWorld,eventState:events.eventState,processed:events.processed,reason:events.reason},out);
          }
          if(out.ok) onAllyStateChange?.({roomRuntime:currentRuntime,roster:currentRoster,wallet:currentWallet},out);
          onRoomRuntimeChange?.(currentRuntime,out);
          render();
        }
        return;
      }
      const out=applyRoomNpcQuestAction(currentRuntime,quests,action,{definitions,context});
      if(out.ok){currentRuntime=out.roomRuntime;onRoomRuntimeChange?.(currentRuntime,out);render();}
    }));
    return built;
  };
  render();
  return {getRoomRuntime:()=>currentRuntime,getRoster:()=>currentRoster,getWallet:()=>currentWallet,getEventWorld:()=>currentEventWorld,render};
}
