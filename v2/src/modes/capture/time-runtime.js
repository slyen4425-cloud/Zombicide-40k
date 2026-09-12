import {tickCaptureReactionStateMap} from './reaction-state.js';
import {tickCaptureModeStatuses} from './status-runtime.js';

const clone=value=>structuredClone(value);

export const CAPTURE_TIME_RUNTIME_CONTRACT=Object.freeze({
  explicitAdvance:true,
  fixedRealtimeCadence:false,
  advancesReactionClock:true,
  advancesReactionCooldowns:true,
  advancesStatuses:true,
  usesRpgTimeline:false,
  isolatedFromRpg:true,
});

function advanceReactionLayer(state,amount,{tickReactionCooldowns=true}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const delta=Math.max(0,Number(amount)||0);
  const battle=clone(state.battle);
  const rawCurrent=battle?.timing?.reactionTime;
  const numericCurrent=rawCurrent==null?0:Number(rawCurrent);
  const reactionTime=(Number.isFinite(numericCurrent)?numericCurrent:0)+delta;
  battle.timing={...(battle.timing||{}),reactionTime};

  if(tickReactionCooldowns&&delta>0){
    battle.player.reactionState=tickCaptureReactionStateMap(battle.player?.reactionState||{},delta);
    battle.opponent.reactionState=tickCaptureReactionStateMap(battle.opponent?.reactionState||{},delta);
  }

  const activeId=String(battle.player?.activeInstanceId||'');
  const activeTeam=(state.activeTeam||[]).map(entry=>String(entry.instanceId)!==activeId
    ? clone(entry)
    : {...clone(entry),reactionState:clone(battle.player?.reactionState||{})});
  const reserve=clone(state.reserve||[]);
  const roster=[...activeTeam,...reserve].map(clone);
  return {
    ok:true,
    amount:delta,
    reactionTime,
    state:{...state,battle,activeTeam,reserve,roster},
  };
}

export function advanceCaptureModeTime(state,{amount=1,tickReactionCooldowns=true,tickStatuses=true}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const delta=Math.max(0,Number(amount)||0);
  const reaction=advanceReactionLayer(state,delta,{tickReactionCooldowns});
  if(!reaction.ok) return reaction;

  if(!tickStatuses||delta<=0){
    return {
      ok:true,
      amount:delta,
      reactionTime:reaction.reactionTime,
      statusTick:null,
      ended:false,
      endReason:null,
      state:reaction.state,
    };
  }

  const statuses=tickCaptureModeStatuses(reaction.state,{amount:delta});
  if(!statuses.ok) return {...statuses,reactionTime:reaction.reactionTime};
  return {
    ok:true,
    amount:delta,
    reactionTime:reaction.reactionTime,
    statusTick:{
      playerApplied:clone(statuses.playerApplied||[]),
      opponentApplied:clone(statuses.opponentApplied||[]),
      playerExpired:clone(statuses.playerExpired||[]),
      opponentExpired:clone(statuses.opponentExpired||[]),
    },
    ended:!!statuses.ended,
    endReason:statuses.endReason||null,
    koOutcome:statuses.koOutcome||null,
    state:statuses.state,
  };
}
