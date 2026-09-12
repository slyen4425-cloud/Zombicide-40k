const clone=value=>structuredClone(value);

export const CAPTURE_CREATURE_INSPECTION_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeCreatureData:true,
  derivesGameplayRules:false,
  supportsOptionalSpeciesData:true,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function text(value,fallback=''){
  const normalized=String(value??'').trim();
  return normalized||fallback;
}

function numericOrNull(value){
  if(value==null) return null;
  const numeric=Number(value);
  return Number.isFinite(numeric)?numeric:null;
}

function countEntries(value){
  if(!value||typeof value!=='object') return 0;
  return Object.keys(value).length;
}

export function buildCaptureCreatureInspection(creature,{speciesDef=null}={}){
  if(!creature||typeof creature!=='object'){
    return {ok:false,reason:'capture-creature-inspection-creature-missing'};
  }
  const instanceId=text(creature.instanceId);
  const speciesId=text(creature.speciesId);
  if(!instanceId||!speciesId){
    return {ok:false,reason:'capture-creature-inspection-identity-missing'};
  }

  const nickname=text(creature.nickname);
  const speciesName=text(speciesDef?.name)||text(speciesDef?.displayName)||speciesId;
  const currentHp=numericOrNull(creature.currentHp);
  const maxHp=numericOrNull(creature.maxHp);
  const fields=[
    {id:'species',label:'Espèce',value:speciesName},
    {id:'instance',label:'Instance',value:instanceId},
    {id:'level',label:'Niveau',value:String(Math.max(1,Number(creature.level)||1))},
  ];

  if(currentHp!=null||maxHp!=null){
    fields.push({
      id:'hp',
      label:'PV',
      value:currentHp!=null&&maxHp!=null?`${currentHp} / ${maxHp}`:(currentHp!=null?String(currentHp):`— / ${maxHp}`),
    });
  }

  const abilityCount=countEntries(creature.abilityCharges);
  if(abilityCount>0) fields.push({id:'abilityCharges',label:'Capacités suivies',value:String(abilityCount)});

  const statusCount=Array.isArray(creature.statuses)?creature.statuses.length:0;
  if(statusCount>0) fields.push({id:'statuses',label:'Statuts actifs',value:String(statusCount)});

  if(speciesDef&&Array.isArray(speciesDef.elements)&&speciesDef.elements.length){
    fields.push({id:'elements',label:'Éléments',value:speciesDef.elements.map(String).join(', ')});
  }

  return {
    ok:true,
    kind:'creature-inspection',
    title:nickname||speciesName,
    message:nickname&&nickname!==speciesName?speciesName:'Détails de la créature',
    fields:clone(fields),
    metadata:{instanceId,speciesId,fields:clone(fields)},
  };
}
