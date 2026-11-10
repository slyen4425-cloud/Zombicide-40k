// Read-only projection of the ONE authoritative AdventureSession for the
// in-game sheet. Does not own stat formulas, inventory rules or team mutation.
import {
 availableAdventureStatPointsV1,publishedAdventureSpeciesV1,normalizeAdventureRulesV1
} from './adventure-contract-v1.mjs';
import {adventureFragmentSpeciesRulesV1}
 from './adventure-fragments-v1.mjs';
const frozen=value=>Object.freeze(value);
export function adventurePlaySheetSnapshotV1({session,bestiaryCards,statRegistry,projectCombatVitals=null,selectedInstanceId=null}={}){
 if(session?.status!=='playing')throw new Error('La fiche exige une partie Aventure en cours (playing)');
 if(statRegistry?.schema!=='capture-stat-registry-v1'||!Array.isArray(statRegistry.stats))
  throw new TypeError('Le registre officiel des statistiques Combat est requis');
 const published=publishedAdventureSpeciesV1(bestiaryCards);
 const active=session.party?.active;
 const members=[active,...(session.party?.reserve??[])];
 const selected=selectedInstanceId===null?active:members.find(actor=>actor.instanceId===selectedInstanceId);
 if(!selected)throw new RangeError('Créature sélectionnée absente de ton équipe');
 const card=published.find(entry=>entry.id===selected.speciesId);
 if(!card)throw new RangeError('Créature sélectionnée absente du Bestiaire officiel ; aucune donnée inventée');
 const available=availableAdventureStatPointsV1(session,selected.instanceId);
 const rules=normalizeAdventureRulesV1(session.rules);
 const projectMember=actor=>projectCombatVitals===null?null:projectCombatVitals({
  actor,hpMultiplier:rules.combat.hpMultiplier
 });
 const vitals=projectMember(selected);
 const stats=frozen(statRegistry.stats.map(stat=>{
  if(typeof stat?.id!=='string'||typeof stat?.label!=='string')
   throw new TypeError('Statistique officielle incomplète');
  const measure=Array.isArray(card.measures)?card.measures.find(m=>m.key===stat.id):null;
  const isGameHp=stat.id==='health'&&vitals!==null;
  return frozen({id:stat.id,label:isGameHp?'PV maximum en jeu':stat.label,
   allocated:selected.statAllocations?.[stat.id]??0,
   baseValue:isGameHp?vitals.maxHp:
    (typeof measure?.value==='number'&&Number.isFinite(measure.value)?measure.value:null),
   ...(isGameHp?{gameHp:true,authoredBaseHp:vitals.labMaxHp}:{} )});
 }));
 const catalog=new Map(rules.loot.items.map(item=>[item.id,item]));
 const stored=session.storedCreatures??[];
 // A fragment is a canonical inventory entry, not an independently stored
 // entity. Presentation reads its official species and the authored policy.
 const items=frozen(Object.entries(session.inventory.items).map(([id,quantity])=>{
  const rule=catalog.get(id);
  const speciesId=id.startsWith('fragment:')?id.slice('fragment:'.length):null;
  const species=speciesId&&rules.fragmentRecruitment?.enabled
   ?published.find(card=>card.id===speciesId):null;
  if(!species)return frozen({id,name:rule?.name??id,quantity,
   saleValue:rule?.saleValue??null,...(rule?.iconKey?{iconKey:rule.iconKey}:{})});
  const policy=adventureFragmentSpeciesRulesV1(rules.fragmentRecruitment,speciesId);
  const targets=[...members,...stored].filter(member=>member.speciesId===speciesId);
  const xpTargets=targets.filter(member=>member.level<rules.progression.maxLevel);
  const teamFree=members.length<6;
  const storageFree=stored.length<policy.storageCapacity;
  const canSummon=quantity>=policy.required&&
   (teamFree||storageFree)&&(policy.allowDuplicates||targets.length===0)&&
   Array.isArray(species.skills)&&species.skills.some(skill=>skill.state==='ready');
  return frozen({id,name:'Éclat de '+species.name,quantity,saleValue:null,
   fragment:frozen({speciesId,required:policy.required,
    summonLevel:policy.summonLevel,xpPerFragment:policy.xpPerFragment,
    canSummon,canConvert:xpTargets.length>0&&quantity>0&&policy.xpPerFragment>0,
    message:!teamFree&&!storageFree?'Stockage plein : éclats conservés':
     !policy.allowDuplicates&&targets.length>0?'Un seul exemplaire autorisé':
     'Éclats de '+species.name+' : '+quantity+' / '+policy.required,
    targets:frozen(xpTargets.map(member=>frozen({
     instanceId:member.instanceId,
     label:species.name+' · niv. '+member.level+
      (member.hp===0?' · KO':'')+(stored.includes(member)?' · stockage':' · équipe')
    })))
   })
  });
 }));
 const creature=frozen({
  instanceId:selected.instanceId,speciesId:selected.speciesId,name:card.name,
  level:selected.level,xp:selected.xp,hp:vitals?vitals.currentHp:selected.hp,
  isActive:selected.instanceId===active.instanceId,
  ...(vitals?{maxHp:vitals.maxHp,baseMaxHp:vitals.baseMaxHp,labMaxHp:vitals.labMaxHp,
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
  const shown=actor===selected?vitals:projectMember(actor);
  return frozen({instanceId:actor.instanceId,speciesId:actor.speciesId,
   name:memberCard.name,level:actor.level,
   hp:shown?shown.currentHp:actor.hp,
   ...(shown?{maxHp:shown.maxHp,hpPercent:shown.hpPercent}:{}),
   isActive:actor===active,isSelected:actor===selected});
 }));
 return frozen({sessionId:session.sessionId,hero,creature,team,
  storage:frozen({count:stored.length,members:frozen(stored.map(member=>{
   const card=published.find(item=>item.id===member.speciesId);
   return frozen({instanceId:member.instanceId,speciesId:member.speciesId,
    name:card?.name??member.speciesId,level:member.level,hp:member.hp});
  }))}),
  inventory:frozen({currency:session.inventory.currency,items,
   ...(rules.economy?{currencyLabel:rules.economy.currency.plural}:{})})});
}
