// Read-only projection of the ONE authoritative AdventureSession for the
// in-game sheet. Does not own stat formulas, inventory rules or team mutation.
import {
 availableAdventureStatPointsV1,publishedAdventureSpeciesV1,normalizeAdventureRulesV1
} from './adventure-contract-v1.mjs';
const frozen=value=>Object.freeze(value);
export function adventurePlaySheetSnapshotV1({session,bestiaryCards,statRegistry,projectCombatVitals=null}={}){
 if(session?.status!=='playing')throw new Error('La fiche exige une partie Aventure en cours (playing)');
 if(statRegistry?.schema!=='capture-stat-registry-v1'||!Array.isArray(statRegistry.stats))
  throw new TypeError('Le registre officiel des statistiques Combat est requis');
 const published=publishedAdventureSpeciesV1(bestiaryCards);
 const active=session.party?.active;
 const card=published.find(entry=>entry.id===active?.speciesId);
 if(!card)throw new RangeError('Créature active absente du Bestiaire officiel ; aucune donnée inventée');
 const available=availableAdventureStatPointsV1(session); // Canonical session validation.
 const rules=normalizeAdventureRulesV1(session.rules);
 const projectMember=actor=>projectCombatVitals===null?null:projectCombatVitals({
  actor,hpMultiplier:rules.combat.hpMultiplier
 });
 const vitals=projectMember(active);
 const stats=frozen(statRegistry.stats.map(stat=>{
  if(typeof stat?.id!=='string'||typeof stat?.label!=='string')
   throw new TypeError('Statistique officielle incomplète');
  const measure=Array.isArray(card.measures)?card.measures.find(m=>m.key===stat.id):null;
  const isGameHp=stat.id==='health'&&vitals!==null;
  return frozen({id:stat.id,label:isGameHp?'PV maximum en jeu':stat.label,
   allocated:active.statAllocations?.[stat.id]??0,
   baseValue:isGameHp?vitals.maxHp:
    (typeof measure?.value==='number'&&Number.isFinite(measure.value)?measure.value:null),
   ...(isGameHp?{gameHp:true,authoredBaseHp:vitals.baseMaxHp}:{} )});
 }));
 const catalog=new Map(rules.loot.items.map(item=>[item.id,item]));
 const items=frozen(Object.entries(session.inventory.items).map(([id,quantity])=>{
  const rule=catalog.get(id);
  return frozen({id,name:rule?.name??id,quantity,saleValue:rule?.saleValue??null});
 }));
 const creature=frozen({
  instanceId:active.instanceId,speciesId:active.speciesId,name:card.name,
  level:active.level,xp:active.xp,hp:vitals?vitals.currentHp:active.hp,
  ...(vitals?{maxHp:vitals.maxHp,baseMaxHp:vitals.baseMaxHp,
   hpPercent:vitals.hpPercent}:{}),
  availablePoints:available,stats,
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
 // The same AdventureSession owns every reserve member; show its real HP
 // without creating a second team or changing any saved participant.
 const team=frozen([active,...(session.party.reserve??[])].map(actor=>{
  const memberCard=published.find(item=>item.id===actor.speciesId);
  if(!memberCard)throw new Error('Équipe : créature absente du Bestiaire officiel');
  const shown=actor===active?vitals:projectMember(actor);
  return frozen({instanceId:actor.instanceId,speciesId:actor.speciesId,
   name:memberCard.name,level:actor.level,
   hp:shown?shown.currentHp:actor.hp,
   ...(shown?{maxHp:shown.maxHp,hpPercent:shown.hpPercent}:{}),
   isActive:actor===active});
 }));
 return frozen({sessionId:session.sessionId,hero,creature,team,
  inventory:frozen({currency:session.inventory.currency,items})});
}
