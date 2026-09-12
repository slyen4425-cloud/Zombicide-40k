import {tickCaptureBattleStatuses} from './status-tick.js';

const clone=value=>structuredClone(value);

export function tickCaptureModeStatuses(state,{amount=1}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const ticked=tickCaptureBattleStatuses(state.battle,{amount,activeTeam:state.activeTeam});
  if(!ticked.ok) return {...ticked,state};

  const activeId=String(ticked.battle?.player?.activeInstanceId||'');
  const activeStatuses=clone(ticked.battle?.player?.statuses||[]);
  const activeVitals=clone(ticked.battle?.player?.vitals||null);
  const baseTeam=clone(ticked.activeTeam||state.activeTeam||[]);
  const activeTeam=baseTeam.map(entry=>
    String(entry.instanceId)===activeId
      ? {...clone(entry),statuses:activeStatuses,...(activeVitals?{currentHp:activeVitals.currentHp,maxHp:activeVitals.maxHp}:{})}
      : clone(entry)
  );
  const reserve=clone(state.reserve||[]);
  const roster=[...activeTeam,...reserve].map(clone);
  const ended=ticked.battle?.status==='ended';
  const endReason=ticked.battle?.endReason||null;
  const clearEncounter=ended&&(endReason==='opponent_ko'||endReason==='flee'||endReason==='capture_success');
  const next={
    ...state,
    battle:ended?null:clone(ticked.battle),
    activeTeam,
    reserve,
    roster,
    encounter:clearEncounter?null:state.encounter,
    exploration:{...(state.exploration||{}),freeMovement:ended?true:false},
  };
  return {...ticked,ended,endReason,state:next};
}
