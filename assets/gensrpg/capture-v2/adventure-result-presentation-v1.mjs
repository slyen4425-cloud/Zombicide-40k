// Read-only UI projection of the ALREADY committed AdventureSession award.
// GenSRPG Core alone calculated XP, level, item drops and currency after the
// official CombatResult. This file never mutates the party or rolls a reward.
export function projectAdventureCombatAwardV1({session,award,bestiaryCards=[]}={}){
 const saved=session?.lastAward;
 if(!saved||!award||saved.encounterId!==award.encounterId||
    JSON.stringify(saved)!==JSON.stringify(award))
  throw new Error('Résultat de combat non identique au résultat persisté dans la sauvegarde');
 if(!['victory','defeat','fled'].includes(saved.outcome)||
    !Number.isSafeInteger(saved.xp)||saved.xp<0||
    !Number.isSafeInteger(saved.levelBefore)||!Number.isSafeInteger(saved.levelAfter)||
    !Number.isSafeInteger(saved.heroXp)||!Number.isSafeInteger(saved.currency)||
    !Array.isArray(saved.drops))
  throw new Error('Résultat de combat sauvegardé incomplet');
 const name=id=>bestiaryCards.find(card=>card.id===id)?.name??id;
 const member=name(session.party.active.speciesId);
 const roster=[session.party.active,...(session.party.reserve??[])];
 const recipients=saved.distribution==='all'&&Array.isArray(saved.recipients)
  ?saved.recipients:null;
 if(recipients){
  const seen=new Set();
  let totalXp=0;
  for(const entry of recipients){
   if(!entry||typeof entry.instanceId!=='string'||seen.has(entry.instanceId)||
      !Number.isSafeInteger(entry.xp)||entry.xp<0||
      !Number.isSafeInteger(entry.levelBefore)||!Number.isSafeInteger(entry.levelAfter)||
      !roster.some(creature=>creature.instanceId===entry.instanceId&&
       creature.speciesId===entry.speciesId))
    throw new Error('Répartition XP incohérente avec la sauvegarde officielle');
   seen.add(entry.instanceId);totalXp+=entry.xp;
  }
  if(recipients.length!==roster.length||totalXp!==saved.xp)
   throw new Error('Total XP de la répartition différent de la récompense officielle');
 }
 const itemName=id=>session.rules.loot.items.find(item=>item.id===id)?.name??id;
 const drops=saved.drops.map(item=>itemName(item.itemId)+' ×'+item.quantity);
 const title=saved.outcome==='victory'?'Victoire':
  saved.outcome==='defeat'?'Défaite':'Fuite';
 return Object.freeze({title,outcome:saved.outcome,
  rows:Object.freeze([
   Object.freeze({label:'Adversaire',value:name(saved.enemyId)}),
   ...(recipients?recipients.map(entry=>Object.freeze({
    label:'XP · '+name(entry.speciesId)+' ('+entry.instanceId+')',
    value:'+'+entry.xp+' XP · Niveau '+entry.levelBefore+' → '+entry.levelAfter
   })):[
    Object.freeze({label:'XP créature',value:'+'+saved.xp+' XP pour '+member}),
    Object.freeze({label:'Progression',value:'Niveau '+saved.levelBefore+' → '+saved.levelAfter})
   ]),
   Object.freeze({label:'XP du héros',value:'+'+saved.heroXp+' XP'}),
   Object.freeze({label:'Monnaie',value:'+'+saved.currency}),
   Object.freeze({label:'Objets',value:drops.length?drops.join(', '):'Aucun objet'})
  ])});
}
