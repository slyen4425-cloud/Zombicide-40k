// Capture V2 Collection: read-only view of the ONE official AdventureSession
// and the ONE Combat published Bestiary. No owned-species DB or additional save.
import {publishedAdventureSpeciesV1} from './adventure-contract-v1.mjs';

export function adventureOwnedCollectionV1({session,bestiaryCards}={}){
 if(!session||!session.party?.active)throw new TypeError('AdventureSession party required');
 const published=publishedAdventureSpeciesV1(bestiaryCards);
 const team=[session.party.active,...(session.party.reserve??[])];
 const stored=session.storedCreatures??[];
 if(!Array.isArray(stored))throw new TypeError('Adventure storedCreatures must be an array');
 const bySpecies=new Map();
 for(const [member,place] of [...team.map(m=>[m,'équipe']),...stored.map(m=>[m,'stockage'])]){
  if(typeof member?.speciesId!=='string'||!Number.isSafeInteger(member.level)||member.level<1)
   throw new TypeError('Owned creature needs official species and level');
  const bucket=bySpecies.get(member.speciesId)??[];
  bucket.push(Object.freeze({instanceId:member.instanceId,level:member.level,place}));
  bySpecies.set(member.speciesId,bucket);
 }
 const entries=published.map(card=>{
  const owned=Object.freeze(bySpecies.get(card.id)??[]);
  return Object.freeze({
   speciesId:card.id,name:card.name,
   rarity:card.rarity??'rare',owned:owned.length>0,
   members:owned,
   // The official Bestiary is a read-only reference, not another catalog.
   card
  });
 });
 return Object.freeze({
  entries:Object.freeze(entries),
  ownedCount:entries.filter(entry=>entry.owned).length,
  totalCount:entries.length
 });
}
