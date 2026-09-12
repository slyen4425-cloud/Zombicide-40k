export const CAPTURE_UI_ROSTER_LIST_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeRosterData:true,
  readsAuthoritativeBattleActiveInstance:true,
  readsAuthoritativeVitals:true,
  readsAuthoritativeStatuses:true,
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

function finiteOrNull(value){
  if(value==null||value==='') return null;
  const number=Number(value);
  return Number.isFinite(number)?number:null;
}

function captureRosterStatusEntry(status={}){
  const id=text(status?.id,'');
  const name=text(status?.name,id);
  if(!id&&!name) return null;
  const stacks=finiteOrNull(status?.stacks);
  const remainingDuration=finiteOrNull(status?.remainingDuration);
  return {
    id,
    name,
    stacks:stacks===null?null:Math.max(1,stacks),
    remainingDuration:remainingDuration===null?null:Math.max(0,remainingDuration),
  };
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
  const currentHp=finiteOrNull(creature?.currentHp);
  const maxHp=finiteOrNull(creature?.maxHp);
  const hasVitals=currentHp!==null||maxHp!==null;
  const hpLabel=currentHp!==null&&maxHp!==null
    ?`${Math.max(0,currentHp)} / ${Math.max(0,maxHp)}`
    :currentHp!==null
      ?String(Math.max(0,currentHp))
      :maxHp!==null
        ?`? / ${Math.max(0,maxHp)}`
        :null;
  const ko=currentHp!==null&&currentHp<=0;
  const statuses=Array.isArray(creature?.statuses)
    ?creature.statuses.map(captureRosterStatusEntry).filter(Boolean)
    :[];
  return {
    instanceId,
    speciesId,
    location:normalizedLocation,
    title:nickname||speciesId,
    subtitle:`${speciesId} · Niv. ${level}`,
    inspectable:true,
    activeInBattle,
    hasVitals,
    currentHp,
    maxHp,
    hpLabel,
    ko,
    statuses,
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
