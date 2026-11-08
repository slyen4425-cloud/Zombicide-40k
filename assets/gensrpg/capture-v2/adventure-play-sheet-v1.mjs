// Read-only projection of the ONE authoritative AdventureSession for the
// in-game sheet. No local HP math: official Combat Core computes base stat
// effects AND the game's maximum-HP policy via injected pure functions.
import {
 availableAdventureStatPointsV1,publishedAdventureSpeciesV1,normalizeAdventureRulesV1
} from './adventure-contract-v1.mjs';
const frozen=value=>Object.freeze(value);
export function adventurePlaySheetSnapshotV1({
 session,bestiaryCards,statRegistry,projectCombatStatEffects,projectCombatMaxHp
}={}){
 if(session?.status!=='playing')throw new Error('La fiche exige une partie Aventure en cours (playing)');
 if(statRegistry?.schema!=='capture-stat-registry-v1'||!Array.isArray(statRegistry.stats))
  throw new TypeError('Le registre officiel des statistiques Combat est requis');
 if(typeof projectCombatStatEffects!=='function'||typeof projectCombatMaxHp!=='function')
  throw new TypeError('Les deux projections officielles Combat des PV sont requises ; aucune formule locale');
 const published=publishedAdventureSpeciesV1(bestiaryCards);
 const active=session.party?.active;
 const card=published.find(entry=>entry.id===active?.speciesId);
 if(!card)throw new RangeError('Créature active absente du Bestiaire officiel ; aucune donnée inventée');
 const available=availableAdventureStatPointsV1(session);
 const rules=normalizeAdventureRulesV1(session.rules);
 const baseStats=statRegistry.stats.map(stat=>{
  if(typeof stat?.id!=='string'||typeof stat?.label!=='string')
   throw new TypeError('Statistique officielle incomplète');
  const measure=Array.isArray(card.measures)?card.measures.find(m=>m.key===stat.id):null;
  const baseValue=typeof measure?.value==='number'&&Number.isFinite(measure.value)
   ?measure.value:null;
  return {id:stat.id,label:stat.label,allocated:active.statAllocations?.[stat.id]??0,
   baseValue,isHealthStat:typeof stat.maxHpPerPoint==='number'&&stat.maxHpPerPoint>0};
 });
 // The official Combat exporter uses these published stat values, plus the
 // saved instance-only point allocations, before it applies the HP percentage.
 // No changes to the Bestiary, the Core save, or the Combat Tester's values.
 const values=Object.fromEntries(baseStats.map(stat=>[
  stat.id,(stat.baseValue??0)+stat.allocated
 ]));
 const authored=projectCombatStatEffects({
  registry:statRegistry,statValues:{
   schema:'capture-creature-stat-values-v1',creatureId:card.id,values
  }
 });
 if(authored?.hasMaxHpProjection!==true||
    typeof authored.maxHp!=='number'||!Number.isFinite(authored.maxHp))
  throw new Error('Le maximum de PV doit venir du registre Santé officiel Combat');
 const gameMaxHp=projectCombatMaxHp(authored.maxHp,rules.combat.hpMultiplier);
 if(!Number.isSafeInteger(gameMaxHp)||gameMaxHp<0)
  throw new RangeError('Projection officielle des PV en jeu invalide');
 const multiplierPercent=Number((rules.combat.hpMultiplier*100).toFixed(2));
 const stats=frozen(baseStats.map(stat=>frozen({
  ...stat,
  ...(stat.isHealthStat?{
   effectiveValue:gameMaxHp,
   labWithAllocations:authored.maxHp,
   hpPercent:multiplierPercent
  }:{})
 })));
 const catalog=new Map(rules.loot.items.map(item=>[item.id,item]));
 const items=frozen(Object.entries(session.inventory.items).map(([id,quantity])=>{
  const record=catalog.get(id);
  return frozen({id,quantity,name:record?.name??id,saleValue:record?.saleValue??null});
 }));
 const gameHp=frozen({
  current:active.hp===null?gameMaxHp:active.hp,
  max:gameMaxHp,labMax:authored.maxHp,
  percent:multiplierPercent,
  restoredOnNextCombat:active.hp===null,
  savedHpExceedsMax:active.hp!==null&&active.hp>gameMaxHp
 });
 const creature=frozen({
  instanceId:active.instanceId,speciesId:active.speciesId,name:card.name,
  level:active.level,xp:active.xp,hp:active.hp,gameHp,availablePoints:available,stats,
  portrait:card.portrait??null,
  elements:frozen(Array.isArray(card.elements)?card.elements.slice():[])
 });
 const heroState=session.hero?.progression;
 const hero=frozen({
  definitionId:session.hero?.definitionId??null,
  progressionEnabled:rules.heroProgression.enabled,
  level:rules.heroProgression.enabled?(heroState?.level??1):null,
  xp:rules.heroProgression.enabled?(heroState?.xp??0):null,
  talentPoints:rules.heroProgression.enabled?(heroState?.talentPoints??0):null
 });
 // Team members remain canonical in the session. This sheet shows only the
 // active instance until the dedicated team sheet consumes the full roster.
 return frozen({sessionId:session.sessionId,hero,creature,
  team:frozen([frozen({instanceId:active.instanceId,speciesId:active.speciesId,
   name:card.name,level:active.level,hp:active.hp,gameHp})]),
  inventory:frozen({currency:session.inventory.currency,items})});
}
