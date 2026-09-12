export const CAPTURE_UI_ROSTER_LIST_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeRosterData:true,
  readsAuthoritativeBattleActiveInstance:true,
  exposesInspectionTarget:true,
  mutatesRoster:false,
  mutatesBattle:false,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function text(value,fallback=''){
  const normalized=String(value??'').trim();
  return normalized||fallback;
}

export function captureRosterListEntry(creature={},location='active',{activeBattleInstanceId=null}={}){
  const instanceId=text(creature?.instanceId,'');
  const speciesId=text(creature?.speciesId,'');
  if(!instanceId||!speciesId) return null;
  const nickname=text(creature?.nickname,'');
  const level=Math.max(1,Number(creature?.level)||1);
  const normalizedLocation=location==='reserve'?'reserve':'active';
  const battleActiveId=text(activeBattleInstanceId,'');
  const activeInBattle=normalizedLocation==='active'&&Boolean(battleActiveId)&&instanceId===battleActiveId;
  return {
    instanceId,
    speciesId,
    location:normalizedLocation,
    title:nickname||speciesId,
    subtitle:`${speciesId} · Niv. ${level}`,
    inspectable:true,
    activeInBattle,
  };
}

export function buildCaptureRosterLists(state={}){
  const activeBattleInstanceId=state?.battle?.player?.activeInstanceId??null;
  const options={activeBattleInstanceId};
  const activeTeam=(state?.activeTeam||[]).map(creature=>captureRosterListEntry(creature,'active',options)).filter(Boolean);
  const reserve=(state?.reserve||[]).map(creature=>captureRosterListEntry(creature,'reserve',options)).filter(Boolean);
  return {
    activeTeam,
    reserve,
    activeBattleInstanceId:text(activeBattleInstanceId,'')||null,
    counts:{active:activeTeam.length,reserve:reserve.length},
  };
}
