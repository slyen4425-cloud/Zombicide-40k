// Monster Capture V2 — immutable author item templates, not a second game-state
// authority. Pressing "Import" copies validated definitions into AdventureRules.
// The save/draft continues to own all items, inventory and encounter drops.
export const CAPTURE_ITEM_TEMPLATE_SCHEMA_V1='gensrpg-capture-item-templates-v1';
const id=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9._-]{0,95}$/.test(v);
const number=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function normalizeCaptureItemTemplatesV1(raw,knownSpecies=null){
 if(!raw||Array.isArray(raw)||raw.schema!==CAPTURE_ITEM_TEMPLATE_SCHEMA_V1||
    raw.version!==1||!Array.isArray(raw.items))
  throw new TypeError('Invalid official Capture item template catalog');
 const species=knownSpecies===null?null:new Set(knownSpecies.map(x=>x.id));
 const ids=new Set(),keys=new Set();
 const items=raw.items.map((entry,i)=>{
  if(!entry||Array.isArray(entry)||typeof entry!=='object')throw new TypeError('Invalid item template '+i);
  const fields=Object.keys(entry);
  if(fields.some(key=>!['id','name','speciesId','iconPath','saleValue','chancePercent','minQuantity','maxQuantity'].includes(key)))
   throw new TypeError('Unknown item template field');
  const {id:itemId,name,speciesId,iconPath,saleValue,chancePercent,minQuantity,maxQuantity}=entry;
  if(!id(itemId)||ids.has(itemId))throw new RangeError('Invalid or duplicate item template id');
  if(!id(speciesId)||species&&!species.has(speciesId))
   throw new RangeError('Item template references unapproved creature '+speciesId);
  if(typeof name!=='string'||!name.trim()||name.length>80)
   throw new RangeError('Invalid authored item name');
  // Transport only same-owner published pictures, never a free-form URL or input.
  if(typeof iconPath!=='string'||!/^\.\/item-icons\/[a-z0-9][a-z0-9._-]{0,95}\.(png|webp)$/.test(iconPath))
   throw new RangeError('Item icon path must belong to official Capture item-icons/');
  if(keys.has(iconPath))throw new RangeError('An official icon has multiple item owners');
  if(!number(saleValue,0,100000000)||typeof chancePercent!=='number'||
     !Number.isFinite(chancePercent)||chancePercent<0||chancePercent>100||
     !number(minQuantity,1,9999)||!number(maxQuantity,minQuantity,9999))
   throw new RangeError('Invalid item drop defaults');
  ids.add(itemId);keys.add(iconPath);
  return Object.freeze({id:itemId,name:name.trim(),speciesId,iconPath,saleValue,
   chancePercent,minQuantity,maxQuantity});
 });
 return Object.freeze({schema:raw.schema,version:raw.version,items:Object.freeze(items)});
}
export function materializeCaptureItemTemplatesV1({rules,templates}){
 if(!rules?.loot||!Array.isArray(rules.loot.items)||!Array.isArray(rules.loot.drops))
  throw new TypeError('AdventureRules required before importing author item templates');
 const normalized=normalizeCaptureItemTemplatesV1(templates);
 const items=[...rules.loot.items],drops=[...rules.loot.drops];
 const byId=new Set(items.map(x=>x.id));
 const byPair=new Set(drops.map(x=>x.speciesId+'\u0000'+x.itemId));
 let addedItems=0,addedDrops=0;
 for(const template of normalized.items){
  if(!byId.has(template.id)){
   items.push({id:template.id,name:template.name,saleValue:template.saleValue,
    iconKey:template.id});
   byId.add(template.id);addedItems++;
  }
  const key=template.speciesId+'\u0000'+template.id;
  if(!byPair.has(key)){
   drops.push({speciesId:template.speciesId,itemId:template.id,
    chancePercent:template.chancePercent,minQuantity:template.minQuantity,
    maxQuantity:template.maxQuantity});
   byPair.add(key);addedDrops++;
  }
 }
 return Object.freeze({loot:{...rules.loot,items,drops},addedItems,addedDrops});
}
