// Monster Capture-only game rules. Creature IDs and artwork are taken from the
// published Combat Bestiary; all fragments live in the existing Adventure inventory.
export const ADVENTURE_FRAGMENT_ITEM_PREFIX_V1='fragment.';
export const SHOWCASE_ADVENTURE_RECRUITMENT_V1=Object.freeze({
 enabled:true,fragmentChancePercent:100,fragmentMinPerVictory:1,
 fragmentMaxPerVictory:1,invocationCost:10,xpFragmentCost:10,xpReward:1000,
 teamMax:6,reserveMax:100,reserveAccessMode:'anywhere'
});
const isInt=(value,min,max,label)=>{
 if(!Number.isSafeInteger(value)||value<min||value>max)
  throw new RangeError(label+' doit être un entier entre '+min+' et '+max);
 return value;
};
export function fragmentItemIdV1(speciesId){
 if(typeof speciesId!=='string'||!/^[a-z0-9][a-z0-9_:.-]*$/i.test(speciesId)||speciesId.length>130)
  throw new RangeError('Identifiant officiel de créature requis');
 return ADVENTURE_FRAGMENT_ITEM_PREFIX_V1+speciesId;
}
export function fragmentSpeciesIdV1(itemId){
 if(typeof itemId!=='string'||!itemId.startsWith(ADVENTURE_FRAGMENT_ITEM_PREFIX_V1))return null;
 const id=itemId.slice(ADVENTURE_FRAGMENT_ITEM_PREFIX_V1.length);
 return fragmentItemIdV1(id)===itemId?id:null;
}
export function normalizeAdventureRecruitmentV1(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new TypeError('Réglages de recrutement requis');
 const keys=['enabled','fragmentChancePercent','fragmentMinPerVictory','fragmentMaxPerVictory',
  'invocationCost','xpFragmentCost','xpReward','teamMax','reserveMax','reserveAccessMode'];
 if(Object.keys(raw).length!==keys.length||keys.some(k=>!Object.hasOwn(raw,k)))
  throw new TypeError('Réglages de recrutement incomplets ou inconnus');
 if(typeof raw.enabled!=='boolean')throw new TypeError('Recrutement activé doit être booléen');
 if(typeof raw.fragmentChancePercent!=='number'||!Number.isFinite(raw.fragmentChancePercent)||
    raw.fragmentChancePercent<0||raw.fragmentChancePercent>100)
  throw new RangeError('Chance de fragment entre 0 et 100 %');
 isInt(raw.fragmentMinPerVictory,1,9999,'Fragment minimum');
 isInt(raw.fragmentMaxPerVictory,raw.fragmentMinPerVictory,9999,'Fragment maximum');
 isInt(raw.invocationCost,1,999999,'Coût invocation');
 isInt(raw.xpFragmentCost,1,999999,'Coût XP');
 isInt(raw.xpReward,1,1000000000,'Récompense XP');
 // The current native Combat roster accepts up to six selectable members.
 // More than six requires a separate, certified Combat contract version.
 isInt(raw.teamMax,1,6,'Équipe utilisable en combat');
 isInt(raw.reserveMax,0,9999,'Capacité réserve hors combat');
 if(!['anywhere','zone','interaction'].includes(raw.reserveAccessMode))
  throw new RangeError('Accès réserve : partout, zone ou interaction');
 return Object.freeze({...raw});
}
