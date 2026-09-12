const clone=value=>structuredClone(value);

export const CAPTURE_STATUS_ENGINE_CONTRACT=Object.freeze({
  isolatedFromRpg:true,
  explicitTick:true,
  declarativeEffects:true,
  stackingConfigurable:true,
  exactRealtimeCadence:'future_design_not_frozen',
});

export function normalizeCaptureStatus(def={}){
  return {
    id:String(def.id||''),
    name:String(def.name||def.id||''),
    duration:Math.max(0,Number(def.duration)||0),
    stackMode:def.stackMode==='stack'?'stack':'refresh',
    maxStacks:Math.max(1,Number(def.maxStacks)||1),
    effects:Array.isArray(def.effects)?def.effects.map(clone):[],
    source:def.source||'capture',
  };
}

export function addCaptureStatus(statuses=[],statusDef={}){
  const status=normalizeCaptureStatus(statusDef);
  if(!status.id) return {ok:false,reason:'capture-status-id-required',statuses:clone(statuses||[])};
  const next=(statuses||[]).map(clone);
  const index=next.findIndex(entry=>String(entry.id)===status.id);
  if(index<0){
    next.push({...status,remainingDuration:status.duration,stacks:1});
    return {ok:true,statuses:next,status:clone(next[next.length-1])};
  }
  const current=next[index];
  if(status.stackMode==='stack') current.stacks=Math.min(status.maxStacks,Math.max(1,Number(current.stacks)||1)+1);
  else current.stacks=Math.max(1,Number(current.stacks)||1);
  current.remainingDuration=Math.max(current.remainingDuration||0,status.duration);
  current.effects=status.effects.map(clone);
  current.stackMode=status.stackMode;
  current.maxStacks=status.maxStacks;
  return {ok:true,statuses:next,status:clone(current)};
}

export function removeCaptureStatus(statuses=[],statusId){
  const id=String(statusId||'');
  const found=(statuses||[]).some(entry=>String(entry.id)===id);
  return {ok:found,statuses:(statuses||[]).filter(entry=>String(entry.id)!==id).map(clone),reason:found?null:'capture-status-missing'};
}

export function tickCaptureStatuses(statuses=[],amount=1){
  const delta=Math.max(0,Number(amount)||0);
  const expired=[];
  const active=[];
  for(const raw of statuses||[]){
    const entry=clone(raw);
    entry.remainingDuration=Math.max(0,(Number(entry.remainingDuration)||0)-delta);
    if(entry.remainingDuration<=0) expired.push(entry); else active.push(entry);
  }
  return {statuses:active,expired};
}

export function collectCaptureStatusEffects(statuses=[]){
  const effects=[];
  for(const status of statuses||[]){
    const stacks=Math.max(1,Number(status.stacks)||1);
    for(const effect of status.effects||[]) effects.push({...clone(effect),statusId:String(status.id),stacks});
  }
  return effects;
}

export function resolveCaptureStatusEffect({battle,action,ability}={}){
  const effect=ability?.effect||action?.effect||null;
  if(!effect||effect.type!=='status') return {ok:true,outcome:{type:'declared_effect',effect:clone(effect)}};
  const targetSide=String(action?.targetSide||'opponent');
  if(!battle?.[targetSide]) return {ok:false,reason:'capture-status-target-missing'};
  const statusDef=effect.status||effect.statusDef||null;
  if(!statusDef) return {ok:false,reason:'capture-status-definition-required'};
  const added=addCaptureStatus(battle[targetSide].statuses||[],statusDef);
  if(!added.ok) return added;
  const nextBattle=clone(battle);
  nextBattle[targetSide].statuses=added.statuses;
  return {ok:true,battle:nextBattle,outcome:{type:'status',targetSide,status:added.status}};
}
