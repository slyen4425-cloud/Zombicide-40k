// The GenSRPG AdventureSession authorises ONLY a derived, transient list of
// creatures from Combat's canonical published Bestiary; Explorer owns the
// actual wild encounter resolver and reads this versioned inter-module grant.
// No creature definitions, rarity, stats, XP or combat outcome live here.
import {
 ADVENTURE_SAVE_SCHEMA_V1,publishedAdventureSpeciesV1
} from './adventure-contract-v1.mjs';
import {assertOfficialAdventureWorldIdV1} from './adventure-world-choice-v1.mjs';

export const ADVENTURE_PUBLISHED_GRANT_SCHEMA_V1=
 'gensrpg.capture.v2.published-encounters.v1';

function safeId(value,field){
 if(typeof value!=='string'||
    !/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(value))
  throw new RangeError('Invalid '+field+' identifier in Adventure publication grant');
 return value;
}
function officialSha(value){
 if(typeof value!=='string'||!/^[a-f0-9]{40}$/.test(value))
  throw new RangeError('Official Combat author/engine sha required');
 return value;
}
export function writeAdventurePublishedEncounterGrantV1({
 storage,session,world,bestiaryCards,combatSha
}={}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')
  throw new TypeError('Same-origin transient sessionStorage adapter required');
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||session?.version!==1||
    session?.status!=='playing')
  throw new Error('A true playing GenSRPG AdventureSession is required');
 const sessionId=safeId(session.sessionId,'session');
 const worldId=assertOfficialAdventureWorldIdV1(world?.id);
 if(session.world?.mapRef!==worldId)
  throw new Error('Adventure game and World Builder world identity mismatch');
 const sha=officialSha(combatSha);
 // The Combat Bestiary publication predicate has already run in the one
 // official source, before this projection. Never infer publication from
 // authored Showcase records, creature IDs or a custom game catalog.
 const cards=publishedAdventureSpeciesV1(bestiaryCards);
 const allowed=cards.filter(card=>
  Array.isArray(card.skills)&&card.skills.some(skill=>skill.state==='ready')
 ).map(card=>safeId(card.id,'published creature'));
 const partySpeciesId=safeId(session.party?.active?.speciesId,'owned creature');
 if(!allowed.includes(partySpeciesId))
  throw new Error('Créature possédée absente du Bestiaire publié jouable ; sauvegarde protégée');
 const grant=Object.freeze({
  schema:ADVENTURE_PUBLISHED_GRANT_SCHEMA_V1,version:1,
  sessionId,worldId,combatSha:sha,
  allowedCreatureIds:Object.freeze(allowed)
 });
 // SessionStorage is deliberately not Core Storage: this is a short-lived
 // permission, recomputed from Combat each time Aventure starts/resumes.
 const key=ADVENTURE_PUBLISHED_GRANT_SCHEMA_V1+':'+sessionId;
 storage.setItem(key,JSON.stringify(grant));
 return grant;
}
