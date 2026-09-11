function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function createSetDefinition({
  id=uid(),name='Nouveau set',enabled=true,itemIds=[],thresholds=[],icon=null,artId=null,tags=[]
}={}){
  return {
    id:String(id),name:String(name||'Set'),enabled:enabled!==false,
    itemIds:[...(itemIds||[])].map(String),
    thresholds:(thresholds||[]).map((entry,index)=>({
      id:String(entry?.id||`${id}:t${index+1}`),
      pieces:Math.max(1,Math.floor(Number(entry?.pieces)||1)),
      effectIds:[...(entry?.effectIds||[])].map(String),
      skillIds:[...(entry?.skillIds||[])].map(String),
      label:entry?.label==null?null:String(entry.label),
    })).sort((a,b)=>a.pieces-b.pieces),
    icon:icon==null?null:String(icon),artId:artId==null?null:String(artId),tags:[...(tags||[])].map(String),
  };
}

export function ensureEquipmentSets(universe){
  universe.sets=Array.isArray(universe.sets)?universe.sets:[];
  return universe;
}

export function validateSetDefinition(set,definitions={}){
  const errors=[];
  const items=new Set((definitions.items||[]).map(x=>String(x.id)));
  const effects=new Set((definitions.effects||[]).map(x=>String(x.id)));
  const skills=new Set((definitions.skills||[]).map(x=>String(x.id)));
  if(!set?.id) errors.push({code:'missing-id'});
  if(!set?.name) errors.push({code:'missing-name'});
  const uniqueItems=new Set();
  for(const itemId of set?.itemIds||[]){
    const id=String(itemId); if(uniqueItems.has(id)) errors.push({code:'duplicate-item',itemId:id});
    uniqueItems.add(id); if(!items.has(id)) errors.push({code:'missing-item',itemId:id});
  }
  let previous=0;
  for(const threshold of set?.thresholds||[]){
    if(Number(threshold.pieces)<=previous) errors.push({code:'threshold-order',thresholdId:String(threshold.id)});
    previous=Number(threshold.pieces)||0;
    if(Number(threshold.pieces)>uniqueItems.size) errors.push({code:'threshold-too-high',thresholdId:String(threshold.id)});
    for(const effectId of threshold.effectIds||[]) if(!effects.has(String(effectId))) errors.push({code:'missing-effect',effectId:String(effectId)});
    for(const skillId of threshold.skillIds||[]) if(!skills.has(String(skillId))) errors.push({code:'missing-skill',skillId:String(skillId)});
  }
  return {valid:errors.length===0,errors};
}

export function equippedSetProgress(inventory,set){
  if(!set||set.enabled===false) return {setId:set?.id||null,equipped:0,total:(set?.itemIds||[]).length,itemIds:[],activeThresholds:[]};
  const equippedItemIds=[...new Set(Object.values(inventory?.equipment||{}).filter(Boolean).map(x=>String(x.itemId)))];
  const setItems=new Set((set.itemIds||[]).map(String));
  const activeItems=equippedItemIds.filter(id=>setItems.has(id));
  const count=activeItems.length;
  const activeThresholds=(set.thresholds||[]).filter(t=>count>=Number(t.pieces)).map(clone);
  return {setId:String(set.id),equipped:count,total:setItems.size,itemIds:activeItems,activeThresholds};
}

export function resolveEquippedSetBonuses(inventory,definitions={}){
  const sets=(definitions.sets||[]).filter(set=>set&&set.enabled!==false);
  const progress=sets.map(set=>equippedSetProgress(inventory,set));
  const effectIds=[]; const skillIds=[];
  for(const entry of progress) for(const threshold of entry.activeThresholds){
    for(const effectId of threshold.effectIds||[]) if(!effectIds.includes(String(effectId))) effectIds.push(String(effectId));
    for(const skillId of threshold.skillIds||[]) if(!skillIds.includes(String(skillId))) skillIds.push(String(skillId));
  }
  return {progress,effectIds,skillIds};
}

export function formatSetProgress(set,progress){
  const name=String(set?.name||'Set'); const equipped=Number(progress?.equipped)||0; const total=Number(progress?.total ?? set?.itemIds?.length ?? 0)||0;
  return `${name} — ${equipped}/${total}`;
}
