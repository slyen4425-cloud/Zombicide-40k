import {tickCaptureBattleStatuses} from './status-tick.js';

const clone=value=>structuredClone(value);

export function tickCaptureModeStatuses(state,{amount=1}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const ticked=tickCaptureBattleStatuses(state.battle,{amount});
  if(!ticked.ok) return {...ticked,state};

  const activeId=String(ticked.battle.player?.activeInstanceId||'');
  const activeStatuses=clone(ticked.battle.player?.statuses||[]);
  const activeTeam=(state.activeTeam||[]).map(entry=>
    String(entry.instanceId)===activeId
      ? {...clone(entry),statuses:activeStatuses}
      : clone(entry)
  );
  const reserve=clone(state.reserve||[]);
  const roster=[...activeTeam,...reserve].map(clone);
  const next={
    ...state,
    battle:clone(ticked.battle),
    activeTeam,
    reserve,
    roster,
    exploration:{...(state.exploration||{}),freeMovement:false},
  };
  return {...ticked,state:next};
}
