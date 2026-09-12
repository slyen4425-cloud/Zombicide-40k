export const CAPTURE_UI_ROSTER_LIST_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeRosterData:true,
  exposesInspectionTarget:true,
  mutatesRoster:false,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function text(value,fallback=''){
  const normalized=String(value??'').trim();
  return normalized||fallback;
}

export function captureRosterListEntry(creature={},location='active'){
  const instanceId=text(creature?.instanceId,'');
  const speciesId=text(creature?.speciesId,'');
  if(!instanceId||!speciesId) return null;
  const nickname=text(creature?.nickname,'');
  const level=Math.max(1,Number(creature?.level)||1);
  return {
    instanceId,
    speciesId,
    location:location==='reserve'?'reserve':'active',
    title:nickname||speciesId,
    subtitle:`${speciesId} · Niv. ${level}`,
    inspectable:true,
  };
}

export function buildCaptureRosterLists(state={}){
  const activeTeam=(state?.activeTeam||[]).map(creature=>captureRosterListEntry(creature,'active')).filter(Boolean);
  const reserve=(state?.reserve||[]).map(creature=>captureRosterListEntry(creature,'reserve')).filter(Boolean);
  return {
    activeTeam,
    reserve,
    counts:{active:activeTeam.length,reserve:reserve.length},
  };
}
