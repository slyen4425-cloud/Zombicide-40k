/* GenSrpG V16.78.85 — isolated equipment → ability-library runtime adapter.
   Source of truth stays in rpgAbilityRefs + the existing ability library.
   This module only exposes abilities while the granting equipment is currently equipped.
   It does not modify damage, movement, spawn, detection, timeline or combat resolution. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const VERSION="1.0.1",APP_VERSION="16.78.85";

function abilityLibrary(){
  try{return Array.isArray(R.loadAbilityLibrary?.())?R.loadAbilityLibrary():[]}catch(e){return []}
}
function rpgAbilities(){
  return abilityLibrary().filter(a=>{
    try{return (R.gensAbilityUsages?.(a)||a?.usageScopes||["rpgHero"]).includes("rpgHero")}catch(e){return true}
  });
}
function itemById(id){
  try{return R.itemById?.(id)||R.dungeonItems?.().find(x=>String(x?.id)===String(id))||null}catch(e){return null}
}
function equippedItems(hero){
  try{
    const st=R.loadState?.(hero)||{};
    const slots=[st.rightHand,st.leftHand,st.equipment,...Object.values(st.rpgGear||{})];
    const seenSlots=new Set(),out=[];
    for(const slot of slots){
      if(slot===null||slot===undefined||slot===""||seenSlots.has(String(slot)))continue;
      seenSlots.add(String(slot));
      const entry=st.inventory?.[Number(slot)];
      if(!entry?.itemId)continue;
      const item=itemById(entry.itemId);
      if(item)out.push(item);
    }
    return out;
  }catch(e){return []}
}
function grantedAbilityIds(hero){
  const ids=new Set();
  for(const item of equippedItems(hero)){
    for(const id of (Array.isArray(item?.rpgAbilityRefs)?item.rpgAbilityRefs:[])){
      if(id!==null&&id!==undefined&&String(id))ids.add(String(id));
    }
  }
  return [...ids];
}
function grantedAbilities(hero){
  const map=new Map(rpgAbilities().map(a=>[String(a?.id),a]));
  return grantedAbilityIds(hero).map(id=>map.get(id)).filter(Boolean).map(a=>({
    ...a,
    grantedByEquipment:true,
    requires:[],
    cost:0,
    tier:0
  }));
}
function mergeUnique(base,extra){
  const out=Array.isArray(base)?base.slice():[];
  const seen=new Set(out.map(x=>String(x?.id||"")));
  for(const x of extra||[]){const id=String(x?.id||"");if(!id||seen.has(id))continue;seen.add(id);out.push(x)}
  return out;
}
function appendEffects(base,extra){
  const out=Array.isArray(base)?base.slice():[];
  for(const effect of extra||[])out.push(effect);
  return out;
}
function install(){
  const wrapAbilities=(name,buildExtra)=>{
    const old=R[name];
    if(typeof old!=="function"||old.__gearAbility167885)return false;
    const w=function(hero){return mergeUnique(old.apply(this,arguments),buildExtra(String(hero??"")))};
    w.__gearAbility167885=true;w.__original=old;R[name]=w;return true;
  };
  wrapAbilities("dungeonTreeNodesForHero",hero=>grantedAbilities(hero));
  wrapAbilities("dungeonUnlockedActiveTalents",hero=>grantedAbilities(hero).filter(a=>String(a?.type)==="active"));
  const oldEffects=R.dungeonUnlockedSkillEffectsForHero;
  if(typeof oldEffects==="function"&&!oldEffects.__gearAbility167885){
    const w=function(hero){
      const extra=grantedAbilities(String(hero??"")).filter(a=>String(a?.type)!=="active").flatMap(a=>Array.isArray(a?.effects)?a.effects:[]);
      return appendEffects(oldEffects.apply(this,arguments),extra);
    };
    w.__gearAbility167885=true;w.__original=oldEffects;R.dungeonUnlockedSkillEffectsForHero=w;
  }
  try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
  return true;
}

R.GensEquipmentAbilityRuntime167885={VERSION,APP_VERSION,abilityLibrary,rpgAbilities,equippedItems,grantedAbilityIds,grantedAbilities,mergeUnique,appendEffects,install};
install();
})();
