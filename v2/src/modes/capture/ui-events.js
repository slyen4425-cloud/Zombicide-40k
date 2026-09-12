const clone=value=>structuredClone(value);

export const CAPTURE_UI_EVENT_CONTRACT=Object.freeze({
  presentationOnly:true,
  mutatesGameplayState:false,
  derivesFromAuthoritativeResults:true,
  reactionEvents:true,
  statusEvents:true,
  koEvents:true,
  switchEvents:true,
  isolatedFromRpg:true,
});

function event(type,payload={}){
  return {type:String(type),...clone(payload)};
}

function appendStatusApplied(events,result){
  const action=result?.action||null;
  const outcome=action?.outcome||null;
  if(outcome?.type==='status'&&outcome.statusId){
    events.push(event('status_applied',{
      side:String(action.targetSide||'opponent'),
      statusId:String(outcome.statusId),
      stacks:Number(outcome.stacks)||1,
      source:'ability',
    }));
  }
  const nested=Array.isArray(outcome?.applied)?outcome.applied:[];
  for(const applied of nested){
    if(applied?.type!=='status'||!applied.statusId) continue;
    events.push(event('status_applied',{
      side:String(applied.side||action?.targetSide||'opponent'),
      statusId:String(applied.statusId),
      stacks:Number(applied.stacks)||1,
      source:'ability',
    }));
  }
}

function appendReaction(events,result){
  const reaction=result?.reaction||result?.action?.reaction||null;
  if(!reaction?.triggered) return;
  events.push(event('reaction_triggered',{
    side:String(result?.action?.targetSide||reaction.targetSide||'opponent'),
    reactionId:String(reaction.reaction?.id||''),
    reactionType:String(reaction.reaction?.type||''),
    negated:!!(reaction.reaction?.negatesEffect&&result?.action?.outcome?.negated),
    outcome:clone(reaction.outcome??null),
  }));
}

function appendStatusTick(events,result){
  const tick=result?.statusTick||null;
  if(!tick) return;
  for(const side of ['player','opponent']){
    for(const applied of tick[`${side}Applied`]||[]){
      events.push(event('status_periodic_effect',{
        side,
        effectType:String(applied?.type||''),
        statusId:applied?.statusId==null?null:String(applied.statusId),
        amount:Number(applied?.amount)||0,
        stacks:Number(applied?.stacks)||1,
        ko:!!applied?.ko,
      }));
    }
    for(const expired of tick[`${side}Expired`]||[]){
      events.push(event('status_expired',{
        side,
        statusId:String(expired?.id||expired?.statusId||''),
      }));
    }
  }
}

function appendKoAndSwitch(events,result){
  const outcome=result?.koOutcome||result?.endReason||null;
  if(outcome==='opponent_ko') events.push(event('ko',{side:'opponent'}));
  if(outcome==='player_team_unavailable'){
    events.push(event('ko',{side:'player'}));
    events.push(event('team_unavailable',{side:'player'}));
  }
  if(outcome==='forced_switch'){
    events.push(event('ko',{side:'player',instanceId:result?.previousInstanceId?String(result.previousInstanceId):null}));
    events.push(event('forced_switch',{
      side:'player',
      previousInstanceId:result?.previousInstanceId?String(result.previousInstanceId):null,
      activeInstanceId:result?.activeInstanceId?String(result.activeInstanceId):null,
    }));
  }
}

export function captureUiEventsFromResult(result){
  if(!result||result.ok===false) return [];
  const events=[];
  appendReaction(events,result);
  appendStatusApplied(events,result);
  appendStatusTick(events,result);
  appendKoAndSwitch(events,result);
  return events;
}

export function captureUiEventsFromResults(results=[]){
  return (results||[]).flatMap(result=>captureUiEventsFromResult(result));
}
