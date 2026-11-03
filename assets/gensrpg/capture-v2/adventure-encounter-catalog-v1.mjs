// Read-only owner bridge: Combat's OFFICIAL published Bestiary cards gate the
// creatures offered by Exploration's one existing Encounter Controller.
// We neither publish creatures nor copy their stats, rarity or visuals.
import {publishedAdventureSpeciesV1} from './adventure-contract-v1.mjs';

function requiredProvider(provider){
 if(!provider || ['listCreatures','listElements','findByElement','resolveCreature']
   .some(method=>typeof provider[method]!=='function'))
  throw new TypeError('Official Exploration Capture creature catalog provider required');
 return provider;
}
function records(source){
 const entries=source.listCreatures();
 if(!Array.isArray(entries))
  throw new TypeError('Exploration catalog listCreatures() must return an array');
 const seen=new Set();
 for(const entry of entries){
  if(typeof entry?.id!=='string'||!entry.id||
     !Array.isArray(entry.elements)||
     typeof entry.spawnChance!=='number'||!Number.isFinite(entry.spawnChance)||
     entry.spawnChance<0||entry.spawnChance>100)
   throw new TypeError('Incomplete official Exploration encounter creature');
  if(seen.has(entry.id))throw new RangeError('Duplicate Exploration creature '+entry.id);
  seen.add(entry.id);
 }
 return entries;
}

export function createPublishedEncounterCatalogV1({bestiaryCards,captureCatalog}={}){
 // No other species list or publication flag is consulted. Cards MUST be the
 // unaltered result from Combat captureBestiaryCardsV1, supplied at bootstrap.
 const cards=publishedAdventureSpeciesV1(bestiaryCards);
 const source=requiredProvider(captureCatalog);
 const playable=new Set(cards.filter(card=>
  Array.isArray(card.skills)&&card.skills.some(skill=>skill.state==='ready')
 ).map(card=>card.id));
 const allowed=Object.freeze(records(source).filter(c=>playable.has(c.id)));
 const byId=new Map(allowed.map(c=>[c.id,c]));
 const elements=Object.freeze(source.listElements().filter(entry=>
  allowed.some(creature=>creature.elements.includes(entry.id))
 ));
 return Object.freeze({
  listCreatures(){return allowed;},
  listElements(){return elements;},
  resolveCreature(id){return byId.get(id)??null;},
  findByElement(id){
   return Object.freeze(allowed.filter(creature=>creature.elements.includes(id)));
  }
 });
}
