// Monster Capture only: a fragment is a logical inventory entry for ONE published
// Bestiary species. No second item catalogue, portrait file, or persistent wallet.
export const FRAGMENT_ITEM_PREFIX_V1='fragment:';
const fail=name=>{throw new RangeError('Fragment policy: '+name);};
const id=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9_:.-]*$/i.test(value)&&value.length<=130
 ?value:fail('invalid species ID');
const int=(n,name,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max?n:fail(name);
const percent=(n,name)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100?n:fail(name);
const freeze=x=>Object.freeze(x);
export function fragmentItemIdV1(speciesId){return FRAGMENT_ITEM_PREFIX_V1+id(speciesId);}
export function speciesFromFragmentItemV1(itemId){
 if(typeof itemId!=='string'||!itemId.startsWith(FRAGMENT_ITEM_PREFIX_V1))return null;
 const speciesId=itemId.slice(FRAGMENT_ITEM_PREFIX_V1.length);
 return id(speciesId);
}
// This optional policy is absent on historical saves. Only explicitly opted-in
// games receive fragments; retroactive grants are never fabricated.
export function normalizeAdventureRecruitmentV1(raw){
 if(raw===undefined||raw===null)return null;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    Object.keys(raw).some(k=>!['fragments','storageCapacity'].includes(k)))
  fail('unknown recruitment fields');
 const f=raw.fragments;
 if(!f||typeof f!=='object'||Array.isArray(f)||
    Object.keys(f).some(k=>!['enabled','required','xpPerFragment','dropChancePercent',
       'minQuantity','maxQuantity','speciesOverrides'].includes(k)))fail('fragment fields');
 if(typeof f.enabled!=='boolean')fail('enabled must be boolean');
 const required=int(f.required,'required',1,9999);
 const xpPerFragment=int(f.xpPerFragment,'xpPerFragment',1,10000000);
 const dropChancePercent=percent(f.dropChancePercent,'dropChancePercent');
 const minQuantity=int(f.minQuantity,'minQuantity',1,9999);
 const maxQuantity=int(f.maxQuantity,'maxQuantity',minQuantity,9999);
 const storageCapacity=int(raw.storageCapacity,'storageCapacity',1,10000);
 const overrides=f.speciesOverrides??{};
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))fail('speciesOverrides');
 const speciesOverrides={};
 for(const [species,settings] of Object.entries(overrides)){
  id(species);
  if(!settings||typeof settings!=='object'||Array.isArray(settings)||
     Object.keys(settings).some(k=>!['required','xpPerFragment','dropChancePercent',
       'minQuantity','maxQuantity'].includes(k)))fail('species override');
  const merged={required,xpPerFragment,dropChancePercent,minQuantity,maxQuantity,...settings};
  int(merged.required,'species.required',1,9999);
  int(merged.xpPerFragment,'species.xpPerFragment',1,10000000);
  percent(merged.dropChancePercent,'species.dropChancePercent');
  int(merged.minQuantity,'species.minQuantity',1,9999);
  int(merged.maxQuantity,'species.maxQuantity',merged.minQuantity,9999);
  speciesOverrides[species]=freeze({...settings});
 }
 return freeze({fragments:freeze({enabled:f.enabled,required,xpPerFragment,
  dropChancePercent,minQuantity,maxQuantity,speciesOverrides:freeze(speciesOverrides)}),
  storageCapacity});
}
export function adventureFragmentSettingsV1(rules,speciesId){
 const policy=normalizeAdventureRecruitmentV1(rules?.recruitment);
 if(!policy||!policy.fragments.enabled)return null;
 return freeze({...policy.fragments,
  ...(policy.fragments.speciesOverrides[id(speciesId)]??{})});
}
export function rollAdventureFragmentDropV1({rules,speciesId,random}){
 const settings=adventureFragmentSettingsV1(rules,speciesId);
 if(!settings||settings.dropChancePercent===0)return 0;
 if(typeof random!=='function')throw new TypeError('Random adapter required');
 const roll=()=>{
  const n=random();
  if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>=1)
   throw new RangeError('Random adapter must return a number in [0,1)');
  return n;
 };
 if(roll()*100>=settings.dropChancePercent)return 0;
 if(settings.minQuantity===settings.maxQuantity)return settings.minQuantity;
 return settings.minQuantity+
  Math.floor(roll()*(settings.maxQuantity-settings.minQuantity+1));
}
