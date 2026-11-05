// Pure display of a COMMITTED Monster Capture Adventure award.
// XP, loot, HP, level and outcome are already decided by official Combat and
// persisted by the single Adventure Core Storage owner. No reroll or mutation.
const integer=(value,label)=>{
 if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)
  throw new RangeError('Invalid committed Combat '+label);
 return value;
};
export function formatAdventureCombatAwardV1({session,award}={}){
 if(!session||typeof session!=='object'||!award||typeof award!=='object'||
  session.lastAward?.encounterId!==award.encounterId||
  session.lastAward?.outcome!==award.outcome)
  throw new TypeError('A saved official Combat award is required to display results');
 const labels={victory:'Victoire !',defeat:'Défaite',fled:'Fuite'};
 const heading=labels[award.outcome];
 if(!heading)throw new RangeError('Invalid committed Combat result outcome');
 const xp=integer(award.xp,'XP');
 const before=integer(award.levelBefore,'levelBefore');
 const after=integer(award.levelAfter,'levelAfter');
 const currency=integer(award.currency,'currency');
 const drops=Array.isArray(award.drops)?award.drops:[];
 const catalog=session.rules?.loot?.items;
 if(!Array.isArray(catalog))throw new TypeError('Saved Adventure item catalog is missing');
 const itemNames=new Map(catalog.map(item=>[item.id,item.name]));
 const loot=drops.map(drop=>{
  integer(drop.quantity,'drop quantity');
  return (itemNames.get(drop.itemId)??drop.itemId)+' × '+drop.quantity;
 });
 const hp=session.party?.active?.hp;
 const hpText=hp===null||hp===undefined?'PV non renseignés':
  (typeof hp==='number'&&Number.isFinite(hp)&&hp>=0
   ?'PV restants : '+Number(hp.toFixed(2)).toLocaleString('fr-FR')
   :'PV indisponibles');
 const summary=[
  xp+' XP',
  'niveau '+before+' → '+after,
  currency+' pièces',
  'Butin : '+(loot.length?loot.join(', '):'aucun'),
  hpText
 ].join(' · ');
 return Object.freeze({heading,summary});
}
export function presentAdventureCombatAwardV1({dialog,heading,summary,session,award}={}){
 if(!dialog||!heading||!summary||typeof dialog.hidden!=='boolean')
  throw new TypeError('The owned Monster Capture result dialog must be mounted');
 const result=formatAdventureCombatAwardV1({session,award});
 heading.textContent=result.heading;
 summary.textContent=result.summary;
 dialog.hidden=false;
 return result;
}
