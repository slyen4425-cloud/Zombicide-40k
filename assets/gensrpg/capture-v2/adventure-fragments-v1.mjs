// GenSRPG Monster Capture V2 — fragments live in the EXISTING Adventure inventory.
// The AdventureSession remains the only owner of creature instances and storage.
// No Combat/Exploration mutation, generated species ID, separate save or global owner.
export const DEFAULT_ADVENTURE_FRAGMENTS_V1=Object.freeze({
 enabled:true,required:10,summonLevel:1,xpPerFragment:100,
 dropChancePercent:100,dropMin:1,dropMax:1,
 allowDuplicates:true,storageCapacity:100,perSpecies:{}
});
const validId=(v,label)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(v))
  throw new RangeError('Invalid '+label);
 return v;
};
const positive=(v,label,min,max=Number.MAX_SAFE_INTEGER)=>{
 if(!Number.isSafeInteger(v)||v<min||v>max)
  throw new RangeError('Invalid '+label);
 return v;
};
const percent=(v,label)=>{
 if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)
  throw new RangeError('Invalid '+label);
 return v;
};
const deepFreeze=v=>{
 if(v&&typeof v==='object'){Object.values(v).forEach(deepFreeze);Object.freeze(v)}
 return v;
};
const own=(v,key)=>Object.prototype.hasOwnProperty.call(v,key);
export const adventureFragmentItemIdV1=speciesId=>'fragment:'+validId(speciesId,'fragment species');
export function normalizeAdventureFragmentRulesV1(input){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw new TypeError('Creature fragment rules must be an object');
 const allowed=['enabled','required','summonLevel','xpPerFragment','dropChancePercent',
  'dropMin','dropMax','allowDuplicates','storageCapacity','perSpecies'];
 if(Object.keys(input).some(key=>!allowed.includes(key)))
  throw new TypeError('Unknown fragment rule');
 const merged={...DEFAULT_ADVENTURE_FRAGMENTS_V1,...input};
 if(typeof merged.enabled!=='boolean'||typeof merged.allowDuplicates!=='boolean')
  throw new TypeError('Fragment enabled/duplicates must be booleans');
 positive(merged.required,'fragment.required',1,9999);
 positive(merged.summonLevel,'fragment.summonLevel',1,100000);
 positive(merged.xpPerFragment,'fragment.xpPerFragment',0,1000000000);
 percent(merged.dropChancePercent,'fragment.dropChancePercent');
 positive(merged.dropMin,'fragment.dropMin',1,9999);
 positive(merged.dropMax,'fragment.dropMax',merged.dropMin,9999);
 positive(merged.storageCapacity,'fragment.storageCapacity',0,100000);
 const overrides=merged.perSpecies;
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))
  throw new TypeError('fragment.perSpecies must be an object');
 const perSpecies={};
 for(const [speciesId,raw] of Object.entries(overrides)){
  validId(speciesId,'overridden fragment species');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))
   throw new TypeError('Invalid species fragment override');
  const keys=['required','summonLevel','xpPerFragment','dropChancePercent','dropMin','dropMax'];
  if(Object.keys(raw).some(key=>!keys.includes(key)))
   throw new TypeError('Unknown species fragment override');
  const cfg={};
  for(const key of keys)if(own(raw,key)){
   if(key==='dropChancePercent')percent(raw[key],key);
   else positive(raw[key],key,key==='xpPerFragment'?0:1,
    key==='summonLevel'?100000:key==='xpPerFragment'?1000000000:9999);
   cfg[key]=raw[key];
  }
  const min=cfg.dropMin??merged.dropMin,max=cfg.dropMax??merged.dropMax;
  if(max<min)throw new RangeError('Fragment drop maximum smaller than minimum');
  perSpecies[speciesId]=cfg;
 }
 return deepFreeze({...merged,perSpecies});
}
export function adventureFragmentSpeciesRulesV1(rules,speciesId){
 const policy=normalizeAdventureFragmentRulesV1(rules);
 return deepFreeze({...policy,...(policy.perSpecies[validId(speciesId,'speciesId')]??{})});
}
// Pure roll using the SAME official combat result and injected randomness.
// Actual write is performed by applyAdventureCombatResultV1 in its existing
// once-per-encounter transaction. Manual/world/merchant grants use the same
// AdventureSession but NOT this automatic battle roll.
export function rollAdventureFragmentDropV1({rules,speciesId,random}={}){
 if(rules===undefined||rules===null)return null; // historical rules: no drops
 const policy=adventureFragmentSpeciesRulesV1(rules,speciesId);
 if(!policy.enabled||policy.dropChancePercent===0)return null;
 if(typeof random!=='function')
  throw new TypeError('Official Adventure loot random adapter required');
 const chance=random();
 if(typeof chance!=='number'||!Number.isFinite(chance)||chance<0||chance>=1)
  throw new RangeError('Invalid fragment drop random roll');
 if(chance*100>=policy.dropChancePercent)return null;
 const quantityRoll=random();
 if(typeof quantityRoll!=='number'||!Number.isFinite(quantityRoll)||
    quantityRoll<0||quantityRoll>=1)
  throw new RangeError('Invalid fragment quantity random roll');
 return Object.freeze({
  itemId:adventureFragmentItemIdV1(speciesId),
  quantity:policy.dropMin+Math.floor(
   quantityRoll*(policy.dropMax-policy.dropMin+1))
 });
}
const published=(cards,speciesId)=>{
 if(!Array.isArray(cards)||!cards.some(card=>card.id===speciesId))
  throw new RangeError('Creature not in official published Bestiary: '+speciesId);
};
const owned=(session)=>[
 session.party.active,...(session.party.reserve??[]),...(session.storedCreatures??[])
];
const action=(session,actionId)=>{
 validId(actionId,'fragment action ID');
 if(!Array.isArray(session.processedFragmentActions??[]))
  throw new TypeError('Invalid processed fragment actions');
 return (session.processedFragmentActions??[]).includes(actionId);
};
const withAction=(session,actionId,now,parts)=>deepFreeze({
 ...session,...parts,
 updatedAt:now??session.updatedAt,
 processedFragmentActions:[...(session.processedFragmentActions??[]),actionId]
});
const requireSession=session=>{
 if(!session||session.status!=='playing'||!session.rules||
    !session.inventory||!session.party)
  throw new TypeError('A real playing AdventureSession is required');
 return session;
};
const fragmentPolicy=(session,speciesId)=>{
 const raw=session.rules.fragmentRecruitment;
 if(!raw||!normalizeAdventureFragmentRulesV1(raw).enabled)
  throw new Error('Creature fragment recruitment is disabled for this world');
 return adventureFragmentSpeciesRulesV1(raw,speciesId);
};
const fragmentBalance=(session,speciesId)=>
 session.inventory.items?.[adventureFragmentItemIdV1(speciesId)]??0;
const debit=(session,speciesId,count)=>{
 const itemId=adventureFragmentItemIdV1(speciesId);
 const old=fragmentBalance(session,speciesId);
 if(old<count)throw new RangeError('Not enough creature fragments');
 const items={...session.inventory.items};
 if(old===count)delete items[itemId];else items[itemId]=old-count;
 return {...session.inventory,items};
};
const ensureActionFresh=(session,actionId)=>
 action(session,actionId)?{applied:false,session}:null;

// A manual harvest/quest/merchant adapter must pass a real official species
// and a unique event/transaction ID. Same event cannot grant twice.
export function grantAdventureFragmentsV1({
 session,bestiaryCards,speciesId,quantity,actionId,now
}={}){
 requireSession(session);
 if(action(session,actionId))return {applied:false,session};
 published(bestiaryCards,speciesId);
 fragmentPolicy(session,speciesId);
 positive(quantity,'fragment grant quantity',1,9999);
 const itemId=adventureFragmentItemIdV1(speciesId);
 const previous=fragmentBalance(session,speciesId);
 positive(previous+quantity,'new fragment inventory count',1);
 const next=withAction(session,actionId,now,{
  inventory:{...session.inventory,items:{...session.inventory.items,
   [itemId]:previous+quantity}}
 });
 return {applied:true,session:next,itemId,quantity};
}
function xpForSummonLevel(level,core,config){
 if(level===1)return 0;
 if(typeof core?.levelFromXp!=='function')
  throw new TypeError('Core Progression required for non-level-1 summons');
 let lower=0,upper=1;
 while(core.levelFromXp(upper,config)<level&&upper<Number.MAX_SAFE_INTEGER)
  upper=Math.min(Number.MAX_SAFE_INTEGER,upper*2);
 if(core.levelFromXp(upper,config)<level)
  throw new RangeError('Summon level is unreachable under the Core progression');
 while(lower+1<upper){
  const middle=Math.floor((lower+upper)/2);
  if(core.levelFromXp(middle,config)>=level)upper=middle;else lower=middle;
 }
 return upper;
}
// Spend and create an Adventure-owned instance in ONE immutable transition.
// Stored creatures never enter the Combat party (party.reserve is a battle bench).
export function summonAdventureFromFragmentsV1({
 session,bestiaryCards,speciesId,instanceId,actionId,now,
 destination='auto',progressionCore,progressionConfig
}={}){
 requireSession(session);
 if(action(session,actionId))return {applied:false,session};
 published(bestiaryCards,speciesId);
 const policy=fragmentPolicy(session,speciesId);
 validId(instanceId,'new creature instanceId');
 if(!['auto','party','storage'].includes(destination))
  throw new RangeError('Unknown summon destination');
 if(owned(session).some(member=>member.instanceId===instanceId))
  throw new RangeError('Creature instanceId already exists');
 if(!policy.allowDuplicates&&owned(session).some(member=>member.speciesId===speciesId))
  throw new RangeError('This world forbids duplicate creature ownership');
 const maxLevel=session.rules.progression.maxLevel;
 if(policy.summonLevel>maxLevel)
  throw new RangeError('Summon level exceeds world cap');
 const partySize=1+(session.party.reserve?.length??0);
 const target=destination==='auto'?(partySize<6?'party':'storage'):destination;
 if(target==='party'&&partySize>=6)throw new RangeError('Combat party is full');
 if(target==='storage'&&(session.storedCreatures??[]).length>=policy.storageCapacity)
  throw new RangeError('Creature storage full: fragments are preserved');
 const xp=xpForSummonLevel(policy.summonLevel,progressionCore,progressionConfig);
 const member={instanceId,speciesId,level:policy.summonLevel,xp,hp:null,
  ...(session.rules.progression.statPointsPerLevel===undefined?{}:{statAllocations:{}})};
 const inventory=debit(session,speciesId,policy.required);
 const updated=withAction(session,actionId,now,{
  inventory,
  ...(target==='party'
   ?{party:{...session.party,reserve:[...(session.party.reserve??[]),member]}}
   :{storedCreatures:[...(session.storedCreatures??[]),member]})
 });
 return {applied:true,session:updated,creature:member,destination:target,
  fragmentsSpent:policy.required};
}
// Convert explicitly selected fragments into XP of a specific owned INSTANCE.
// All levels come from the existing Core; never reset KO, stats or progression.
export function convertAdventureFragmentsToXpV1({
 session,bestiaryCards,speciesId,instanceId,quantity,actionId,now,
 progressionCore,progressionConfig
}={}){
 requireSession(session);
 if(action(session,actionId))return {applied:false,session};
 published(bestiaryCards,speciesId);
 const policy=fragmentPolicy(session,speciesId);
 validId(instanceId,'target creature instanceId');
 positive(quantity,'fragments to convert',1,9999);
 if(typeof progressionCore?.levelFromXp!=='function')
  throw new TypeError('Official Core Progression required');
 const member=owned(session).find(v=>v.instanceId===instanceId&&v.speciesId===speciesId);
 if(!member)throw new RangeError('Target creature instance is not owned');
 const inventory=debit(session,speciesId,quantity);
 const gain=positive(quantity*policy.xpPerFragment,'fragment XP award',0);
 const xp=positive(member.xp+gain,'total creature XP',0);
 const level=progressionCore.levelFromXp(xp,progressionConfig);
 positive(level,'Core creature level',1,session.rules.progression.maxLevel);
 const nextMember={...member,xp,level};
 const party={...session.party,
  active:session.party.active.instanceId===instanceId?nextMember:session.party.active,
  reserve:(session.party.reserve??[]).map(v=>v.instanceId===instanceId?nextMember:v)};
 const storedCreatures=(session.storedCreatures??[]).map(v=>
  v.instanceId===instanceId?nextMember:v);
 const updated=withAction(session,actionId,now,{inventory,party,storedCreatures});
 return {applied:true,session:updated,creature:nextMember,xpGained:gain,
  fragmentsSpent:quantity};
}
