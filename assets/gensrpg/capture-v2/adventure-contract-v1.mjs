// Monster Capture V2 — Adventure game-state owner (GenSrpg only).
// Combat remains authoritative for the outcome, the native Bestiary remains
// authoritative for published species, and the existing Core owns storage
// serialization and XP->level. No legacy Capture imports or DOM access.
export const ADVENTURE_RULES_SCHEMA_V1='gensrpg-capture-adventure-rules-v1';
export const ADVENTURE_SAVE_SCHEMA_V1='gensrpg-capture-adventure-save-v1';
export const ADVENTURE_STORAGE_KEY_V1='gensrpg.capture.v2.adventure.save.v1';

const freeze=value=>{
 if(value&&typeof value==='object'){
  Object.values(value).forEach(freeze);
  Object.freeze(value);
 }
 return value;
};
export const DEFAULT_ADVENTURE_RULES_V1=freeze({
 schema:ADVENTURE_RULES_SCHEMA_V1,version:1,
 xp:{
  baseVictoryXp:1000,higherEnemyBonusPercent:30,
  higherAllyPenaltyPercent:30,globalMultiplier:1,distribution:'active'
 },
 progression:{xpCurveMode:'linear',xpPerLevel:1000,maxLevel:100},
 loot:{currencyPerVictory:0,items:[],drops:[]}
});
function object(value,label){
 if(!value||typeof value!=='object'||Array.isArray(value))
  throw new TypeError(label+' must be an object');
 return value;
}
function exact(value,fields,label){
 object(value,label);
 for(const key of Object.keys(value))
  if(!fields.includes(key))throw new TypeError(label+' unknown field: '+key);
 for(const key of fields)
  if(!Object.hasOwn(value,key))throw new TypeError(label+' requires '+key);
 return value;
}
function number(value,label,min=0,max=Number.MAX_SAFE_INTEGER){
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)
  throw new RangeError(label+' must be finite in ['+min+','+max+']');
 return value;
}
function integer(value,label,min=0,max=Number.MAX_SAFE_INTEGER){
 number(value,label,min,max);
 if(!Number.isSafeInteger(value))throw new RangeError(label+' must be an integer');
 return value;
}
function label(value,field){
 if(typeof value!=='string'||!value.trim())throw new TypeError(field+' must be a non-empty string');
 return value.trim();
}
function identity(value,field){
 const s=label(value,field);
 if(!/^[a-z0-9][a-z0-9_:.-]*$/i.test(s)||s.length>130)
  throw new RangeError(field+' must be a safe identifier');
 return s;
}
function iso(value,field){
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))
  throw new TypeError(field+' must be a valid ISO date');
 return value;
}
export function normalizeAdventureRulesV1(input){
 const rule=exact(input,['schema','version','xp','progression','loot'],'AdventureRules');
 if(rule.schema!==ADVENTURE_RULES_SCHEMA_V1||rule.version!==1)
  throw new RangeError('Unknown AdventureRules schema/version');
 const xp=exact(rule.xp,[
  'baseVictoryXp','higherEnemyBonusPercent','higherAllyPenaltyPercent',
  'globalMultiplier','distribution'
 ],'xp');
 integer(xp.baseVictoryXp,'baseVictoryXp',0,1000000);
 number(xp.higherEnemyBonusPercent,'higherEnemyBonusPercent',0,200);
 number(xp.higherAllyPenaltyPercent,'higherAllyPenaltyPercent',0,100);
 number(xp.globalMultiplier,'globalMultiplier',0,100);
 if(xp.distribution!=='active')
  throw new RangeError('xp.distribution active is the only implemented participant policy');
 const p=exact(rule.progression,['xpCurveMode','xpPerLevel','maxLevel'],'progression');
 if(p.xpCurveMode!=='linear')
  throw new RangeError('Custom progression thresholds require a separate explicit contract');
 integer(p.xpPerLevel,'xpPerLevel',1,1000000000);
 integer(p.maxLevel,'maxLevel',1,100);
 const loot=exact(rule.loot,['currencyPerVictory','items','drops'],'loot');
 integer(loot.currencyPerVictory,'currencyPerVictory',0,100000000);
 if(!Array.isArray(loot.items)||!Array.isArray(loot.drops))
  throw new TypeError('loot.items and loot.drops must be arrays');
 const itemIds=new Set();
 const items=loot.items.map((raw,i)=>{
  const item=exact(raw,['id','name','saleValue'],'loot.items['+i+']');
  const id=identity(item.id,'item.id');
  if(itemIds.has(id))throw new RangeError('Duplicate Adventure item '+id);
  itemIds.add(id);
  return {id,name:label(item.name,'item.name'),saleValue:integer(item.saleValue,'item.saleValue',0,100000000)};
 });
 const drops=loot.drops.map((raw,i)=>{
  const d=exact(raw,['speciesId','itemId','chancePercent','minQuantity','maxQuantity'],
   'loot.drops['+i+']');
  const speciesId=identity(d.speciesId,'drop.speciesId');
  const itemId=identity(d.itemId,'drop.itemId');
  if(!itemIds.has(itemId))throw new RangeError('Unknown drop itemId '+itemId);
  number(d.chancePercent,'drop.chancePercent',0,100);
  integer(d.minQuantity,'drop.minQuantity',1,9999);
  integer(d.maxQuantity,'drop.maxQuantity',d.minQuantity,9999);
  return {speciesId,itemId,chancePercent:d.chancePercent,
   minQuantity:d.minQuantity,maxQuantity:d.maxQuantity};
 });
 return freeze({
  schema:ADVENTURE_RULES_SCHEMA_V1,version:1,
  xp:{baseVictoryXp:xp.baseVictoryXp,higherEnemyBonusPercent:xp.higherEnemyBonusPercent,
   higherAllyPenaltyPercent:xp.higherAllyPenaltyPercent,
   globalMultiplier:xp.globalMultiplier,distribution:'active'},
  progression:{xpCurveMode:'linear',xpPerLevel:p.xpPerLevel,maxLevel:p.maxLevel},
  loot:{currencyPerVictory:loot.currencyPerVictory,items,drops}
 });
}
// This function NEVER decides if a draft is published: the official Combat
// captureBestiaryCardsV1 already made that decision with face/back/icon assets.
// Using the identical result preserves the Bestiary's publication predicate.
export function publishedAdventureSpeciesV1(officialBestiaryCards){
 if(!Array.isArray(officialBestiaryCards))throw new TypeError('Official published Bestiary cards required');
 const seen=new Set();
 return Object.freeze(officialBestiaryCards.map(card=>{
  const id=identity(card?.id,'official bestiaire species.id');
  label(card?.name,'official bestiaire species.name');
  if(seen.has(id))throw new RangeError('Duplicate published species '+id);
  seen.add(id);
  return card;
 }));
}
export function calculateAdventureXpV1({rules,allyLevel,enemyLevel}){
 const rule=normalizeAdventureRulesV1(rules);
 const local=integer(allyLevel,'allyLevel',1,rule.progression.maxLevel);
 const enemy=integer(enemyLevel,'enemyLevel',1,rule.progression.maxLevel);
 const gap=enemy-local;
 const multiplier=gap>=0
  ?(1+rule.xp.higherEnemyBonusPercent/100)**gap
  :(1-rule.xp.higherAllyPenaltyPercent/100)**(-gap);
 const xp=Math.round(rule.xp.baseVictoryXp*rule.xp.globalMultiplier*multiplier);
 if(!Number.isSafeInteger(xp))throw new RangeError('Adventure XP overflow');
 return freeze({xp,base:rule.xp.baseVictoryXp,globalMultiplier:rule.xp.globalMultiplier,
  levelGap:gap,levelFactor:multiplier,distribution:rule.xp.distribution});
}
function assertSession(session){
 const v=object(session,'AdventureSession');
 if(v.schema!==ADVENTURE_SAVE_SCHEMA_V1||v.version!==1)
  throw new RangeError('Invalid AdventureSave schema/version; cannot silently migrate');
 identity(v.sessionId,'sessionId');
 iso(v.createdAt,'createdAt');iso(v.updatedAt,'updatedAt');
 if(v.status!=='configured'&&v.status!=='playing')
  throw new RangeError('Unknown Adventure save status');
 normalizeAdventureRulesV1(v.rules);
 const actor=object(object(v.party,'party').active,'party.active');
 identity(actor.instanceId,'party.active.instanceId');
 identity(actor.speciesId,'party.active.speciesId');
 integer(actor.level,'party.active.level',1,v.rules.progression.maxLevel);
 integer(actor.xp,'party.active.xp');
 if(actor.hp!==null)integer(actor.hp,'party.active.hp');
 const inventory=object(v.inventory,'inventory');
 integer(inventory.currency,'inventory.currency');
 object(inventory.items,'inventory.items');
 for(const [id,count] of Object.entries(inventory.items)){
  identity(id,'inventory.itemId');integer(count,'inventory.quantity',1);
 }
 const world=object(v.world,'world');
 if(world.position!==null&&!Array.isArray(world.position))
  throw new TypeError('world.position must be a validated position or null');
 if(!Array.isArray(v.processedEncounterKeys))
  throw new TypeError('processedEncounterKeys must be an array');
 v.processedEncounterKeys.forEach(x=>identity(x,'processedEncounterKey'));
 return v;
}
export function createAdventureSessionV1({
 bestiaryCards,starterId,rules=DEFAULT_ADVENTURE_RULES_V1,ids,now
}){
 const cards=publishedAdventureSpeciesV1(bestiaryCards);
 const starter=cards.find(c=>c.id===starterId);
 if(!starter)throw new RangeError('Créature absente du Bestiaire publié: '+starterId);
 if(!Array.isArray(starter.skills)||!starter.skills.some(s=>s.state==='ready'))
  throw new RangeError('Créature sans compétence jouable publiée: '+starterId);
 const settings=normalizeAdventureRulesV1(rules);
 const sessionId=identity(ids?.sessionId,'sessionId');
 const instanceId=identity(ids?.instanceId,'instanceId');
 const timestamp=iso(now,'now');
 return freeze({
  schema:ADVENTURE_SAVE_SCHEMA_V1,version:1,sessionId,
  status:'configured',createdAt:timestamp,updatedAt:timestamp,rules:settings,
  party:{active:{instanceId,speciesId:starter.id,level:1,xp:0,hp:null}},
  inventory:{currency:0,items:{}},
  world:{mapRef:null,position:null},
  processedEncounterKeys:[],lastAward:null
 });
}
function roll(random){
 if(typeof random!=='function')throw new TypeError('Explicit random adapter required for Adventure loot');
 const value=random();
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>=1)
  throw new RangeError('Random adapter must return a number in [0,1)');
 return value;
}
export function applyAdventureCombatResultV1({
 session,envelope,bestiaryCards,progressionCore,random,now
}){
 const state=assertSession(session);
 const snapshot=object(envelope?.snapshot,'official EncounterSnapshot');
 const result=object(envelope?.result,'official CaptureCombatResult');
 if(envelope.version!==1||snapshot.schema!=='capture-encounter-snapshot-v1'||
    snapshot.version!==1||result.schema!=='capture-combat-result-v1'||result.version!==1)
  throw new RangeError('Official Exploration/Combat handoff version mismatch');
 const encounterId=identity(snapshot.encounterId,'encounterId');
 const token=identity(snapshot.returnToken,'returnToken');
 if(result.encounterId!==encounterId||result.returnToken!==token)
  throw new RangeError('CombatResult encounterId/returnToken corrélation invalide');
 if(!['victory','defeat','fled'].includes(result.outcome))
  throw new RangeError('Unknown official Combat outcome');
 const key=encounterId+':'+token;
 if(state.processedEncounterKeys.includes(key))
  return {applied:false,session:state,award:null};
 if((Array.isArray(result.rewards)&&result.rewards.length)||
    result.capture!=null||(Array.isArray(result.worldEffects)&&result.worldEffects.length))
  throw new RangeError('Unrecognized authoritative Combat rewards/capture/world effects require an explicit versioned adapter');
 if(result.partyState?.activeCreatureId!==state.party.active.speciesId)
  throw new RangeError('Combat party identity differs from the saved Adventure creature');
 const cards=publishedAdventureSpeciesV1(bestiaryCards);
 if(!cards.some(c=>c.id===state.party.active.speciesId))
  throw new RangeError('Owned creature no longer in published Bestiaire; save preserved without rewards');
 const enemyId=identity(snapshot.opponents?.[0]?.creatureId,'opponent.creatureId');
 const enemy=cards.find(c=>c.id===enemyId);
 if(!enemy)throw new RangeError('Opponent is not a creature in the published bestiaire: '+enemyId);
 if(!progressionCore||typeof progressionCore.levelFromXp!=='function')
  throw new TypeError('Existing Core Progression levelFromXp must be injected');
 const before=state.party.active.level;
 const amount=result.outcome==='victory'
  ?calculateAdventureXpV1({rules:state.rules,allyLevel:before,enemyLevel:enemy.level}).xp:0;
 const total=state.party.active.xp+amount;
 integer(total,'new accumulated XP');
 const level=progressionCore.levelFromXp(total,state.rules.progression);
 integer(level,'Core progression level',1,state.rules.progression.maxLevel);
 const currency=result.outcome==='victory'?state.rules.loot.currencyPerVictory:0;
 const itemCounts={...state.inventory.items};
 const drops=[];
 if(result.outcome==='victory'){
  for(const drop of state.rules.loot.drops.filter(d=>d.speciesId===enemyId)){
   if(roll(random)*100>=drop.chancePercent)continue;
   const quantity=drop.minQuantity+
    Math.floor(roll(random)*(drop.maxQuantity-drop.minQuantity+1));
   itemCounts[drop.itemId]=(itemCounts[drop.itemId]||0)+quantity;
   drops.push({itemId:drop.itemId,quantity});
  }
 }
 const hp=result.partyState?.hp;
 if(hp!==undefined&&hp!==null)integer(hp,'official battle HP');
 const timestamp=iso(now??state.updatedAt,'now');
 const award=freeze({
  encounterId,enemyId,outcome:result.outcome,xp:amount,
  levelBefore:before,levelAfter:level,currency,drops
 });
 const updated=freeze({
  ...state,updatedAt:timestamp,
  party:{active:{...state.party.active,level,xp:total,
   hp:hp==null?state.party.active.hp:hp}},
  inventory:{currency:state.inventory.currency+currency,items:itemCounts},
  processedEncounterKeys:[...state.processedEncounterKeys,key],
  lastAward:award
 });
 assertSession(updated);
 return {applied:true,session:updated,award};
}
export function createAdventureStoreV1({storage,coreStorage}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
    !coreStorage||typeof coreStorage.readJson!=='function'||typeof coreStorage.writeJson!=='function')
  throw new TypeError('The existing injected Core Storage service is required');
 const key=ADVENTURE_STORAGE_KEY_V1;
 const load=()=>{
  if(storage.getItem(key)===null)return null;
  const data=coreStorage.readJson(storage,key,null);
  if(!data)throw new Error('Sauvegarde Aventure invalide ou corrompue; aucune réinitialisation automatique');
  // Deserialize into the consumer realm, never share a mutable VM/adapter object.
  const candidate=JSON.parse(JSON.stringify(data));
  assertSession(candidate);
  return candidate;
 };
 const save=value=>{
  assertSession(value);
  const old=load();
  if(!old||old.sessionId!==value.sessionId)
   throw new Error('Impossible de remplacer une autre partie ou une sauvegarde absente');
  coreStorage.writeJson(storage,key,value);
  return value;
 };
 return Object.freeze({
  key,load,save,
  create(value){
   assertSession(value);
   if(storage.getItem(key)!==null)
    throw new Error('Une partie existe déjà; refuser de la remplacer sans consentement');
   coreStorage.writeJson(storage,key,value);
   return value;
  }
 });
}
