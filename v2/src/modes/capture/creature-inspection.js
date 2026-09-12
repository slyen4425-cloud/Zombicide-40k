const clone=value=>structuredClone(value);

export const CAPTURE_CREATURE_INSPECTION_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeCreatureData:true,
  readsAuthoritativeVitals:true,
  readsAuthoritativeStatuses:true,
  readsAuthoritativeAbilityState:true,
  readsAuthoritativeReactionState:true,
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
  if(value==null||value==='') return null;
  const numeric=Number(value);
  return Number.isFinite(numeric)?numeric:null;
}

function statusLabel(status={}){
  const id=text(status?.id);
  const name=text(status?.name,id);
  if(!id&&!name) return null;
  const stacks=numericOrNull(status?.stacks);
  const remaining=numericOrNull(status?.remainingDuration);
  const stackLabel=stacks!=null&&stacks>1?` ×${Math.max(1,stacks)}`:'';
  const remainingLabel=remaining!=null?` · reste ${Math.max(0,remaining)}`:'';
  return `${name||id}${stackLabel}${remainingLabel}`;
}

function abilityLabels(creature={}){
  const state=creature?.abilityState;
  if(state&&typeof state==='object'&&!Array.isArray(state)){
    return Object.entries(state).map(([abilityId,slot])=>{
      const id=text(abilityId||slot?.id);
      if(!id) return null;
      const charges=numericOrNull(slot?.charges);
      const chargeMax=numericOrNull(slot?.chargeMax);
      const cooldown=numericOrNull(slot?.cooldownRemaining);
      const chargeLabel=charges!=null&&chargeMax!=null
        ?` · charges ${Math.max(0,charges)}/${Math.max(0,chargeMax)}`
        :charges!=null?` · charges ${Math.max(0,charges)}`:'';
      const cooldownLabel=cooldown!=null?` · recharge ${Math.max(0,cooldown)}`:'';
      return `${id}${chargeLabel}${cooldownLabel}`;
    }).filter(Boolean);
  }
  const saved=creature?.abilityCharges;
  if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
    return Object.entries(saved).map(([abilityId,value])=>{
      const id=text(abilityId);
      if(!id) return null;
      const charges=numericOrNull(value);
      return charges==null?id:`${id} · charges ${Math.max(0,charges)}`;
    }).filter(Boolean);
  }
  return [];
}

function reactionLabels(creature={}){
  const state=creature?.reactionState;
  if(!state||typeof state!=='object'||Array.isArray(state)) return [];
  return Object.entries(state).map(([reactionId,slot])=>{
    const id=text(reactionId||slot?.id);
    if(!id) return null;
    const resource=numericOrNull(slot?.resource);
    const cooldown=numericOrNull(slot?.cooldownRemaining);
    const cooldownLabel=cooldown==null
      ?''
      :Math.max(0,cooldown)<=0
        ?' · prête côté cooldown'
        :` · recharge ${Math.max(0,cooldown)}`;
    const resourceLabel=resource!=null?` · ressource ${Math.max(0,resource)}`:'';
    return `${id}${cooldownLabel}${resourceLabel}`;
  }).filter(Boolean);
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
  const ko=currentHp!=null&&currentHp<=0;
  const fields=[
    {id:'species',label:'Espèce',value:speciesName},
    {id:'instance',label:'Instance',value:instanceId},
    {id:'level',label:'Niveau',value:String(Math.max(1,Number(creature.level)||1))},
  ];

  if(currentHp!=null||maxHp!=null){
    fields.push({
      id:'hp',
      label:'PV',
      value:currentHp!=null&&maxHp!=null
        ?`${Math.max(0,currentHp)} / ${Math.max(0,maxHp)}`
        :(currentHp!=null?String(Math.max(0,currentHp)):`— / ${Math.max(0,maxHp)}`),
    });
  }
  if(ko) fields.push({id:'ko',label:'État',value:'KO'});

  const statuses=Array.isArray(creature.statuses)?creature.statuses.map(statusLabel).filter(Boolean):[];
  if(statuses.length) fields.push({id:'statuses',label:'Statuts actifs',value:statuses.join(' · ')});

  const abilities=abilityLabels(creature);
  if(abilities.length) fields.push({id:'abilities',label:'Capacités',value:abilities.join(' · ')});

  const reactions=reactionLabels(creature);
  if(reactions.length) fields.push({id:'reactions',label:'Réactions',value:reactions.join(' · ')});

  if(speciesDef&&Array.isArray(speciesDef.elements)&&speciesDef.elements.length){
    fields.push({id:'elements',label:'Éléments',value:speciesDef.elements.map(String).join(', ')});
  }

  return {
    ok:true,
    kind:'creature-inspection',
    title:nickname||speciesName,
    message:nickname&&nickname!==speciesName?speciesName:'Détails de la créature',
    fields:clone(fields),
    metadata:{instanceId,speciesId,ko,fields:clone(fields)},
  };
}
