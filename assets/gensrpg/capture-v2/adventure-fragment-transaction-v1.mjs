// Monster Capture recruitment transaction: writes to ONE AdventureSession only.
// Stored creatures are NOT party.reserve and cannot enter the Combat grant.
import {assertAdventureSessionV1,normalizeAdventureRulesV1,
 coreAdventureProgressionConfigV1,publishedAdventureSpeciesV1}
 from './adventure-contract-v1.mjs';
import {adventureFragmentSettingsV1,fragmentItemIdV1}
 from './adventure-fragment-policy-v1.mjs';
const freeze=x=>{
 if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}
 return x;
};
const safePositive=(n,field)=>{if(!Number.isSafeInteger(n)||n<1)throw new RangeError(field+' must be positive integer');return n;};
const safeId=(s,field)=>{
 if(typeof s!=='string'||!/^[a-z0-9][a-z0-9_:.-]*$/i.test(s)||s.length>130)
  throw new RangeError(field+' must be a canonical ID');
 return s;
};
function knownSpecies(bestiaryCards,speciesId){
 const card=publishedAdventureSpeciesV1(bestiaryCards).find(entry=>entry.id===safeId(speciesId,'speciesId'));
 if(!card)throw new RangeError('Créature absente du Bestiaire publié');
 return card;
}
export function redeemAdventureFragmentsV1({
 session,bestiaryCards,speciesId,action,quantity=null,instanceId=null,
 newInstanceId=null,progressionCore=null,now
}={}){
 const state=assertAdventureSessionV1(session);
 if(state.status!=='playing')throw new RangeError('Les fragments ne sont échangeables que dans une partie active');
 const rules=normalizeAdventureRulesV1(state.rules);
 const settings=adventureFragmentSettingsV1(rules,speciesId);
 if(!settings)throw new RangeError('Fragments désactivés par le créateur de ce jeu');
 const card=knownSpecies(bestiaryCards,speciesId);
 const key=fragmentItemIdV1(card.id);
 const available=state.inventory.items[key]??0;
 let spent,party=state.party,collection=state.collection??{stored:[]};
 let xpGained=0,targetInstanceId=null;
 if(action==='xp'){
  spent=safePositive(quantity,'quantity');
  if(spent>available)throw new RangeError('Fragments insuffisants pour cette conversion XP');
  targetInstanceId=safeId(instanceId,'instanceId');
  const owned=[state.party.active,...(state.party.reserve??[]),...collection.stored];
  const actor=owned.find(c=>c.instanceId===targetInstanceId);
  if(!actor||actor.speciesId!==card.id)
   throw new RangeError('XP : sélectionner une instance déjà possédée de cette espèce');
  if(actor.level>=rules.progression.maxLevel)
   throw new RangeError('Niveau maximum atteint : fragments conservés');
  if(typeof progressionCore?.levelFromXp!=='function')
   throw new TypeError('Le Core Progression officiel est requis');
  xpGained=spent*settings.xpPerFragment;
  if(!Number.isSafeInteger(xpGained)||!Number.isSafeInteger(actor.xp+xpGained))
   throw new RangeError('XP trop élevée : fragments conservés');
  const totalXp=actor.xp+xpGained;
  const level=progressionCore.levelFromXp(totalXp,
   coreAdventureProgressionConfigV1(rules.progression));
  if(!Number.isSafeInteger(level)||level<actor.level||level>rules.progression.maxLevel)
   throw new RangeError('Niveau Core invalide : fragments conservés');
  const changed={...actor,xp:totalXp,level};
  if(state.party.active.instanceId===targetInstanceId)party={...party,active:changed};
  else if((party.reserve??[]).some(c=>c.instanceId===targetInstanceId))
   party={...party,reserve:party.reserve.map(c=>c.instanceId===targetInstanceId?changed:c)};
  else collection={...collection,stored:collection.stored.map(c=>c.instanceId===targetInstanceId?changed:c)};
 }else if(action==='invoke'){
  spent=settings.required;
  if(spent>available)throw new RangeError('Fragments insuffisants pour invoquer cette espèce');
  if(!Array.isArray(card.skills)||!card.skills.some(s=>s.state==='ready'))
   throw new RangeError('Créature publiée mais non jouable : fragments conservés');
  if(collection.stored.length>=rules.recruitment.storageCapacity)
   throw new RangeError('Réserve de stockage pleine : fragments conservés');
  const id=safeId(newInstanceId,'newInstanceId');
  if([party.active,...(party.reserve??[]),...collection.stored]
    .some(c=>c.instanceId===id))throw new RangeError('Identifiant de créature déjà utilisé');
  const actor={instanceId:id,speciesId:card.id,level:1,xp:0,hp:null,
   ...(rules.progression.statPointsPerLevel===undefined?{}:{statAllocations:{}})};
  // Strictly outside party: no automatic switch, start slot or battle grant.
  collection={...collection,stored:[...collection.stored,actor]};
  targetInstanceId=id;
 }else throw new RangeError('Action fragments inconnue');
 const items={...state.inventory.items};
 if(available===spent)delete items[key];
 else items[key]=available-spent;
 const next=freeze({...state,updatedAt:now??state.updatedAt,party,collection,
  inventory:{...state.inventory,items}});
 assertAdventureSessionV1(next);
 return freeze({session:next,action,speciesId:card.id,spent,xpGained,
  instanceId:targetInstanceId});
}
