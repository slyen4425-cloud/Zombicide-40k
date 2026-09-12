export const CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeBattleOpponent:true,
  readsAuthoritativeVitals:true,
  readsAuthoritativeStatuses:true,
  readsAuthoritativePosition:true,
  exposesInspectionTarget:true,
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

function statusEntry(status={}){
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

export function buildCaptureOpponentSummary(state={}){
  const battle=state?.battle||null;
  const opponent=battle?.opponent||null;
  if(!battle||battle.status!=='active'||!opponent) return null;

  const creature=opponent.creature||{};
  const instanceId=text(opponent.activeInstanceId||creature.instanceId,'');
  const speciesId=text(creature.speciesId||battle?.encounter?.speciesId,'');
  if(!instanceId&&!speciesId) return null;

  const currentHp=finiteOrNull(opponent?.vitals?.currentHp);
  const maxHp=finiteOrNull(opponent?.vitals?.maxHp);
  const ko=opponent?.vitals?.ko===true||(currentHp!==null&&currentHp<=0);
  const hpLabel=currentHp!==null&&maxHp!==null
    ?`${Math.max(0,currentHp)} / ${Math.max(0,maxHp)}`
    :currentHp!==null
      ?String(Math.max(0,currentHp))
      :maxHp!==null
        ?`? / ${Math.max(0,maxHp)}`
        :null;
  const statuses=Array.isArray(opponent.statuses)
    ?opponent.statuses.map(statusEntry).filter(Boolean)
    :[];
  const actorId=text(opponent.actorId,'');
  const position=actorId&&battle?.spatial?.positions?.[actorId]
    ?structuredClone(battle.spatial.positions[actorId])
    :null;

  return {
    instanceId,
    speciesId,
    title:speciesId||instanceId,
    wild:creature.wild===true||battle.mode==='wild',
    currentHp,
    maxHp,
    hpLabel,
    ko,
    statuses,
    position,
  };
}

export function buildCaptureOpponentInspection(state={}, {speciesDef=null}={}){
  const summary=buildCaptureOpponentSummary(state);
  if(!summary) return {ok:false,reason:'capture-opponent-inspection-unavailable'};
  const speciesName=text(speciesDef?.name)||text(speciesDef?.displayName)||summary.speciesId||summary.instanceId;
  const fields=[
    {id:'species',label:'Espèce',value:speciesName},
    {id:'instance',label:'Instance',value:summary.instanceId||'—'},
  ];
  if(summary.hpLabel!==null) fields.push({id:'hp',label:'PV',value:summary.hpLabel});
  if(summary.ko) fields.push({id:'ko',label:'État',value:'KO'});
  if(summary.statuses.length){
    fields.push({
      id:'statuses',
      label:'Statuts',
      value:summary.statuses.map(status=>{
        const stacks=status.stacks!==null&&status.stacks>1?` ×${status.stacks}`:'';
        const remaining=status.remainingDuration!==null?` · reste ${status.remainingDuration}`:'';
        return `${status.name||status.id}${stacks}${remaining}`;
      }).join(' ; '),
    });
  }
  if(summary.position&&summary.position.x!=null&&summary.position.y!=null){
    fields.push({id:'position',label:'Position',value:`${summary.position.x}, ${summary.position.y}`});
  }
  if(speciesDef&&Array.isArray(speciesDef.elements)&&speciesDef.elements.length){
    fields.push({id:'elements',label:'Éléments',value:speciesDef.elements.map(String).join(', ')});
  }
  return {
    ok:true,
    kind:'opponent-inspection',
    title:speciesName,
    message:summary.wild?'Adversaire sauvage':'Adversaire actif',
    fields:structuredClone(fields),
    metadata:{instanceId:summary.instanceId,speciesId:summary.speciesId,fields:structuredClone(fields)},
  };
}
