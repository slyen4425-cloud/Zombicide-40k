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
 // An old award contains one recipient. New team awards persist the exact
 // per-member allocation before any post-battle automatic active swap.
 const detailed=Array.isArray(saved.memberXp)?saved.memberXp:null;
 if(detailed&&(
   detailed.length<1||detailed.length>6||
   detailed.some(m=>typeof m.instanceId!=='string'||
     typeof m.speciesId!=='string'||!Number.isSafeInteger(m.xp)||m.xp<0||
     !Number.isSafeInteger(m.levelBefore)||!Number.isSafeInteger(m.levelAfter))||
   detailed.reduce((sum,m)=>sum+m.xp,0)!==saved.xp
  ))throw new Error("Répartition XP persistée invalide");
 const xpRows=detailed
  ?[Object.freeze({label:'XP de l’équipe',value:'+'+saved.xp+' XP au total'}),
    ...detailed.map((m,index)=>Object.freeze({label:'Créature '+(index+1)+' · '+name(m.speciesId),
      value:'+'+m.xp+' XP · niv. '+m.levelBefore+' → '+m.levelAfter}))]
  :[Object.freeze({label:'XP créature',value:'+'+saved.xp+' XP pour '+member}),
    Object.freeze({label:'Progression',value:'Niveau '+saved.levelBefore+' → '+saved.levelAfter})];
 const itemName=id=>{
  const authored=session.rules.loot.items.find(item=>item.id===id);
  if(authored)return authored.name;
  // Official bestiary is the only naming authority for species fragments.
  if(id.startsWith('fragment:')&&session.rules.fragmentRecruitment?.enabled){
   const species=bestiaryCards.find(card=>card.id===id.slice('fragment:'.length));
   if(species)return 'Éclat de '+species.name;
  }
  return id;
 };
 const drops=saved.drops.map(item=>itemName(item.itemId)+' ×'+item.quantity);
 const title=saved.outcome==='victory'?'Victoire':
  saved.outcome==='defeat'?'Défaite':'Fuite';
 return Object.freeze({title,outcome:saved.outcome,
  rows:Object.freeze([
   Object.freeze({label:'Adversaire',value:name(saved.enemyId)}),
   ...xpRows,
   Object.freeze({label:'XP du héros',value:'+'+saved.heroXp+' XP'}),
   Object.freeze({label:'Monnaie',value:'+'+saved.currency}),
   Object.freeze({label:'Objets',value:drops.length?drops.join(', '):'Aucun objet'}),
   ...(saved.rewardWarnings?.length?[Object.freeze({
    label:'Récompense indisponible',value:saved.rewardWarnings.join(' · ')
   })]:[])
  ])});
}
