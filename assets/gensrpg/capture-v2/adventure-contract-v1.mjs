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
 loot:{currencyPerVictory:0,items:[],drops:[]},
 // Default applies only to a NEW game, and remains editable by the creator.
 combat:{hpMultiplier:0.25,defeatPolicy:'restore'},
 // A Capture hero is a travel avatar with NO level by default. A game's
 // creator can explicitly enable its independent progression and talent
 // points; this never steals or changes a creature's victory XP.
 heroProgression:{enabled:false,xpGainPercent:100,xpPerLevel:1000,
  maxLevel:100,talentPointsPerLevel:0}
});
// The showcase is an explicit NEW-GAME preset; historical linear saves keep
// their exact existing progression and do not gain retroactive stat points.
export const SHOWCASE_ADVENTURE_RULES_V1=freeze({
 ...DEFAULT_ADVENTURE_RULES_V1,
 progression:{
  xpCurveMode:'custom',xpPerLevel:2000,maxLevel:100,statPointsPerLevel:20,
  xpBands:[
   {throughLevel:20,xpPerLevel:2000},
   {throughLevel:40,xpPerLevel:4000},
   {throughLevel:60,xpPerLevel:6000},
   {throughLevel:80,xpPerLevel:8000},
   {throughLevel:100,xpPerLevel:10000}
  ]
 }
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
// Adventure only persists an official Exploration HeroDefinition ID.
export function officialAdventureHeroDefinitionIdV1(value){
 if(typeof value!=='string'||
  !/^hero\.user\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value))
  throw new RangeError('Aventure requires an authored Exploration HeroDefinition ID');
 return value;
}
function iso(value,field){
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))
  throw new TypeError(field+' must be a valid ISO date');
 return value;
}
export function normalizeAdventureRulesV1(input){
 // Additive optional policy: historical v1 rules have no heroProgression.
 // Their precise old representation remains legal, and never enables hero XP.
 const {heroProgression:heroRaw,combat:combatRaw,...legacy}=object(input,'AdventureRules');
 // Old saves were authored without this policy: never quarter their HP on load.
 // Old saves keep their HP policy; absent defeat policy means recovery, not game over.
 const inputCombat=combatRaw===undefined?{hpMultiplier:1}:object(combatRaw,'combat');
 const {defeatPolicy='restore',...combatBase}=inputCombat;
 const combat=exact(combatBase,['hpMultiplier'],'combat');
 number(combat.hpMultiplier,'combat.hpMultiplier',Number.EPSILON,1);
 if(defeatPolicy!=='restore'&&defeatPolicy!=='game-over')
  throw new RangeError('combat.defeatPolicy must be restore or game-over');
 const rule=exact(legacy,['schema','version','xp','progression','loot'],'AdventureRules');
 const hero=heroRaw===undefined?DEFAULT_ADVENTURE_RULES_V1.heroProgression:
  exact(heroRaw,['enabled','xpGainPercent','xpPerLevel','maxLevel',
   'talentPointsPerLevel'],'heroProgression');
 if(typeof hero.enabled!=='boolean')throw new TypeError('heroProgression.enabled must be boolean');
 number(hero.xpGainPercent,'heroProgression.xpGainPercent',0,1000);
 integer(hero.xpPerLevel,'heroProgression.xpPerLevel',1,1000000000);
 integer(hero.maxLevel,'heroProgression.maxLevel',1);
 integer(hero.talentPointsPerLevel,'heroProgression.talentPointsPerLevel',0,1000);
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
 const {xpBands:bandsRaw,statPointsPerLevel:pointsRaw,...baseProgression}=
  object(rule.progression,'progression');
 const p=exact(baseProgression,['xpCurveMode','xpPerLevel','maxLevel'],'progression');
 if(p.xpCurveMode!=='linear'&&p.xpCurveMode!=='custom')
  throw new RangeError('Unknown Adventure XP curve mode');
 integer(p.xpPerLevel,'xpPerLevel',1,1000000000);
 integer(p.maxLevel,'maxLevel',1);
 if(pointsRaw!==undefined)integer(pointsRaw,'statPointsPerLevel',0,1000);
 if(p.xpCurveMode==='linear'&&bandsRaw!==undefined)
  throw new RangeError('Linear XP curve cannot declare custom bands');
 let bands;
 if(p.xpCurveMode==='custom'){
  if(!Array.isArray(bandsRaw)||bandsRaw.length===0)
   throw new RangeError('Custom XP bands must be a non-empty list');
  let previous=1;
  bands=bandsRaw.map((entry,i)=>{
   const raw=exact(entry,['throughLevel','xpPerLevel'],'xpBands['+i+']');
   const throughLevel=integer(raw.throughLevel,'xpBands.throughLevel',2);
   const xpPerLevel=integer(raw.xpPerLevel,'xpBands.xpPerLevel',1,1000000000);
   if(throughLevel<=previous)
    throw new RangeError('XP band end levels must increase');
   previous=throughLevel;return {throughLevel,xpPerLevel};
  });
  if(previous<p.maxLevel)
   throw new RangeError('XP bands must cover maxLevel');
  coreAdventureProgressionConfigV1({...p,xpBands:bands});
 }
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
  progression:{xpCurveMode:p.xpCurveMode,xpPerLevel:p.xpPerLevel,maxLevel:p.maxLevel,
    ...(pointsRaw===undefined?{}:{statPointsPerLevel:pointsRaw}),
    ...(bands===undefined?{}:{xpBands:bands})},
  loot:{currencyPerVictory:loot.currencyPerVictory,items,drops},
  combat:{hpMultiplier:combat.hpMultiplier,defeatPolicy},
  heroProgression:{enabled:hero.enabled,xpGainPercent:hero.xpGainPercent,
   xpPerLevel:hero.xpPerLevel,maxLevel:hero.maxLevel,
   talentPointsPerLevel:hero.talentPointsPerLevel}
 });
}
// The existing Core Progression accepts compact bands and alone computes
// each level, avoiding a huge thresholds table when the creator sets a large cap.
export function coreAdventureProgressionConfigV1(input){
 const p=object(input,'progression');
 const maxLevel=integer(p.maxLevel,'maxLevel',1);
 const perLevel=integer(p.xpPerLevel,'xpPerLevel',1);
 if(p.xpCurveMode==='linear')
  return freeze({xpCurveMode:'linear',xpPerLevel:perLevel,maxLevel});
 if(p.xpCurveMode!=='custom'||!Array.isArray(p.xpBands))
  throw new RangeError('Custom Adventure XP bands are required');
 let cumulative=0,previous=1;
 for(const band of p.xpBands){
  const last=integer(band.throughLevel,'xpBands.throughLevel',2);
  const cost=integer(band.xpPerLevel,'xpBands.xpPerLevel',1);
  if(last<=previous)throw new RangeError('XP bands must be strictly ascending');
  const end=Math.min(last,maxLevel);
  if(end>previous){
   const segmentCost=(end-previous)*cost;
   if(!Number.isSafeInteger(segmentCost)||!Number.isSafeInteger(cumulative+segmentCost))
    throw new RangeError('Total XP threshold overflow');
   cumulative+=segmentCost;
  }
  previous=last;
 }
 if(previous<maxLevel)throw new RangeError('XP bands do not cover maxLevel');
 return freeze({xpCurveMode:'custom',xpPerLevel:perLevel,
  maxLevel,xpBands:p.xpBands.map(b=>({throughLevel:b.throughLevel,xpPerLevel:b.xpPerLevel}))});
}
// These declarations belong to the AdventureSession, not to a fabricated
// multiplayer server or a second exploration Game Master runtime.
export const DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1=freeze({
 editProgression:false,editRewards:false,editWorld:false,
 allocateOwnCreatureStats:true
});
// One policy validator for the creator draft AND an active AdventureSession.
// No creator identity exists until a real game is explicitly created.
export function normalizeAdventureSessionControlSettingsV1(raw){
 const value=exact(raw,['hostIsGameMaster','joinEnabled','guestPermissions'],
  'AdventureSessionControl settings');
 const guest=exact(value.guestPermissions,
  ['editProgression','editRewards','editWorld','allocateOwnCreatureStats'],
  'guestPermissions');
 if(typeof value.hostIsGameMaster!=='boolean'||typeof value.joinEnabled!=='boolean')
  throw new TypeError('AdventureSessionControl flags must be boolean');
 for(const [name,allowed] of Object.entries(guest))
  if(typeof allowed!=='boolean')
   throw new TypeError('guestPermissions.'+name+' must be boolean');
 return freeze({hostIsGameMaster:value.hostIsGameMaster,joinEnabled:value.joinEnabled,
  guestPermissions:{...guest}});
}
function normalizeAdventureSessionControlV1(raw){
 const value=exact(raw,['creatorId','hostIsGameMaster','joinEnabled','guestPermissions'],
  'AdventureSessionControl');
 const settings=normalizeAdventureSessionControlSettingsV1({
  hostIsGameMaster:value.hostIsGameMaster,joinEnabled:value.joinEnabled,
  guestPermissions:value.guestPermissions});
 return freeze({creatorId:identity(value.creatorId,'creatorId'),...settings});
}
function statWallet(actor,progression){
 const allocations=actor.statAllocations??{};
 object(allocations,'Creature statAllocations');
 let spent=0;
 for(const [statId,amount] of Object.entries(allocations)){
  identity(statId,'statId');
  spent+=integer(amount,'statAllocations.'+statId,0,100000);
  if(!Number.isSafeInteger(spent))throw new RangeError('Stat point sum overflow');
 }
 const earned=(actor.level-1)*(progression.statPointsPerLevel??0);
 if(!Number.isSafeInteger(earned)||spent>earned)
  throw new RangeError('Creature stat points spent exceed earned level budget');
 return {spent,earned};
}
export function availableAdventureStatPointsV1(session){
 const v=assertSession(session);
 const wallet=statWallet(v.party.active,normalizeAdventureRulesV1(v.rules).progression);
 return wallet.earned-wallet.spent;
}
// The actual stat IDs come ONLY from Combat's published registry. This stores
// bonus allocations, not a second authority for stat effects or base values.
export function allocateAdventureStatPointsV1({session,registry,statId,points,now}={}){
 const v=assertSession(session);
 const id=identity(statId,'statId');
 if(registry?.schema!=='capture-stat-registry-v1'||!Array.isArray(registry.stats)||
    !registry.stats.some(entry=>entry.id===id))
  throw new RangeError('Stat absent du registre officiel Combat');
 const amount=integer(points,'points to allocate',1,100000);
 if(amount>availableAdventureStatPointsV1(v))
  throw new RangeError('Not enough available creature stat points');
 const actor=v.party.active;
 const statAllocations={...(actor.statAllocations??{})};
 statAllocations[id]=(statAllocations[id]??0)+amount;
 const updated=freeze({...v,updatedAt:iso(now??v.updatedAt,'now'),
  party:{...v.party,active:{...actor,statAllocations}}});
 assertSession(updated);
 return updated;
}
// Historical saves intentionally remain unchanged on load. A visible owner
// action can attach the creator/MJ policy once, with a fresh generated ID.
export function initializeAdventureSessionControlV1({session,creatorId,settings,now}={}){
 const v=assertSession(session);
 if(Object.hasOwn(v,'sessionControl'))
  throw new Error('Existing creator control cannot be replaced');
 const input=exact(settings,['hostIsGameMaster','joinEnabled','guestPermissions'],
  'session control settings');
 const sessionControl=normalizeAdventureSessionControlV1({
  ...input,creatorId:identity(creatorId,'creatorId')
 });
 const updated=freeze({...v,updatedAt:iso(now??v.updatedAt,'now'),sessionControl});
 assertSession(updated);
 return updated;
}
export function updateAdventureSessionControlV1({session,settings,now}={}){
 const v=assertSession(session);
 if(!v.sessionControl)
  throw new Error('Legacy session requires an explicit creator-control migration');
 const input=exact(settings,['hostIsGameMaster','joinEnabled','guestPermissions'],
  'session control settings');
 const sessionControl=normalizeAdventureSessionControlV1({
  ...input,creatorId:v.sessionControl.creatorId
 });
 const updated=freeze({...v,updatedAt:iso(now??v.updatedAt,'now'),sessionControl});
 assertSession(updated);
 return updated;
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
 const enemy=integer(enemyLevel,'enemyLevel',1);
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
 if(v.status!=='configured'&&v.status!=='playing'&&v.status!=='finished')
  throw new RangeError('Unknown Adventure save status');
 normalizeAdventureRulesV1(v.rules);
 const actor=object(object(v.party,'party').active,'party.active');
 identity(actor.instanceId,'party.active.instanceId');
 identity(actor.speciesId,'party.active.speciesId');
 integer(actor.level,'party.active.level',1,v.rules.progression.maxLevel);
 integer(actor.xp,'party.active.xp');
 statWallet(actor,normalizeAdventureRulesV1(v.rules).progression);
 if(Object.hasOwn(v,'sessionControl'))
  normalizeAdventureSessionControlV1(v.sessionControl);
 if(actor.hp!==null)number(actor.hp,'party.active.hp');
 if(Object.hasOwn(v,'hero')){
  const hasDefinition=Object.hasOwn(v.hero,'definitionId');
  const hero=exact(v.hero,hasDefinition?['progression','definitionId']:['progression'],'hero');
  if(hasDefinition)officialAdventureHeroDefinitionIdV1(hero.definitionId);
  if(hero.progression!==null){
   const progress=exact(hero.progression,['xp','level','talentPoints'],'hero.progression');
   integer(progress.xp,'hero.progression.xp');
   integer(progress.level,'hero.progression.level',1,v.rules.heroProgression?.maxLevel??Number.MAX_SAFE_INTEGER);
   integer(progress.talentPoints,'hero.progression.talentPoints');
  }
 }
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
 bestiaryCards,starterId,rules=DEFAULT_ADVENTURE_RULES_V1,ids,now,
 heroDefinitionId=null
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
  party:{active:{instanceId,speciesId:starter.id,level:1,xp:0,hp:null,
   ...(settings.progression.statPointsPerLevel===undefined?{}:{statAllocations:{}})}},
  sessionControl:{
   creatorId:identity(ids?.creatorId??'owner-'+sessionId,'creatorId'),
   hostIsGameMaster:false,joinEnabled:false,
   guestPermissions:{...DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1}
  },
  hero:{
   ...(heroDefinitionId===null?{}:{definitionId:officialAdventureHeroDefinitionIdV1(heroDefinitionId)}),
   progression:settings.heroProgression.enabled
    ?{xp:0,level:1,talentPoints:0}:null
  },
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
 const level=progressionCore.levelFromXp(total,
  coreAdventureProgressionConfigV1(normalizeAdventureRulesV1(state.rules).progression));
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
 if(hp!==undefined&&hp!==null)number(hp,'official battle HP');
 // Hero progression is optional, independent of Creature XP and computed by
 // existing Core Progression. No new stats, hero skill definitions or battle
 // simulation are created. Legacy saves without a hero property stay intact.
 const heroConfig=normalizeAdventureRulesV1(state.rules).heroProgression;
 let heroState=state.hero,heroXp=0;
 if(heroConfig.enabled){
  const previous=state.hero?.progression??{xp:0,level:1,talentPoints:0};
  heroXp=result.outcome==='victory'?Math.round(amount*heroConfig.xpGainPercent/100):0;
  integer(heroXp,'hero XP award');
  const totalHeroXp=integer(previous.xp+heroXp,'hero total XP');
  const heroProgression={xpCurveMode:'linear',xpPerLevel:heroConfig.xpPerLevel,
   maxLevel:heroConfig.maxLevel,talentPointsPerLevel:heroConfig.talentPointsPerLevel};
  const heroLevel=progressionCore.levelFromXp(totalHeroXp,heroProgression);
  integer(heroLevel,'hero Core level',1,heroConfig.maxLevel);
  if(typeof progressionCore.earnedSkillPointsFromLevel!=='function')
   throw new TypeError('Core earnedSkillPointsFromLevel required for hero progression');
  const talentPoints=progressionCore.earnedSkillPointsFromLevel(heroLevel,heroProgression);
  integer(talentPoints,'hero Core talent points');
  // Keep the official Exploration HeroDefinition selection when Aventure
  // updates only the hero's optional progression after a real combat.
  // Legacy sessions without hero remain valid: do not fabricate a selection.
  heroState={...(state.hero??{}),progression:{xp:totalHeroXp,level:heroLevel,talentPoints}};
 }

 const timestamp=iso(now??state.updatedAt,'now');
 const award=freeze({
  encounterId,enemyId,outcome:result.outcome,xp:amount,
  levelBefore:before,levelAfter:level,currency,drops,heroXp
 });
 // The creator chooses recovery or terminal game over in the save's rules.
 // Recovery uses Combat's own max HP for the next encounter (null snapshot).
 const defeatPolicy=normalizeAdventureRulesV1(state.rules).combat.defeatPolicy;
 const defeated=result.outcome==='defeat';
 const recover=defeated&&defeatPolicy==='restore';
 const gameOver=defeated&&defeatPolicy==='game-over';
 const updated=freeze({
  ...state,status:gameOver?'finished':state.status,updatedAt:timestamp,
  party:{active:{...state.party.active,level,xp:total,
   hp:recover?null:gameOver?0:hp==null?state.party.active.hp:hp}},
  ...(heroState===undefined?{}:{hero:heroState}),
  inventory:{currency:state.inventory.currency+currency,items:itemCounts},
  processedEncounterKeys:[...state.processedEncounterKeys,key],
  lastAward:award
 });
 assertSession(updated);
 return {applied:true,session:updated,award};
}
export function createAdventureStoreV1({storage,coreStorage,key=ADVENTURE_STORAGE_KEY_V1}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
    !coreStorage||typeof coreStorage.readJson!=='function'||typeof coreStorage.writeJson!=='function')
  throw new TypeError('The existing injected Core Storage service is required');
 // Reuse the exact same Core AdventureSave serializer for each Capture slot.
 // No arbitrary keys: other modules, especially Survie, remain untouched.
 if(key!==ADVENTURE_STORAGE_KEY_V1&&
    (typeof key!=='string'||!/^gensrpg\.capture\.v2\.adventure\.slot\.v1:[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(key)))
  throw new TypeError('Clé de sauvegarde étrangère au module Monster Capture');
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
