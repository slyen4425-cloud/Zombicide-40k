// Capture Aventure owns the saved party. This emits a short-lived, versioned
// PROJECTION of its actual member to the first-party Exploration runtime.
// It never creates an actor, battle, level, creature definition or XP source.
import {ADVENTURE_SAVE_SCHEMA_V1} from './adventure-contract-v1.mjs';
import {ADVENTURE_PUBLISHED_GRANT_SCHEMA_V1} from './adventure-publication-grant-v1.mjs';

export const ADVENTURE_PLAYING_PARTY_SCHEMA_V1='gensrpg.capture.v2.active-party.v1';
const safeId=(v,field)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(v))
  throw new RangeError('Invalid Adventure playing party '+field);
 return v;
};
function exact(value,keys,label){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  Object.keys(value).length!==keys.length||
  keys.some(k=>!Object.hasOwn(value,k)))
  throw new TypeError('Invalid '+label+' fields');
 return value;
}
export function writeAdventurePlayingPartyV1({
 storage,session,world,publicationGrant,combatSha
}={}){
 if(typeof storage?.setItem!=='function'||typeof storage?.getItem!=='function')
  throw new TypeError('Official same-origin sessionStorage required');
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||session?.version!==1||
    session?.status!=='playing')
  throw new Error('Genuine playing AdventureSession required for native party');
 const sessionId=safeId(session.sessionId,'sessionId');
 const worldId=safeId(world?.id,'worldId');
 if(session.world?.mapRef!==worldId)
  throw new Error('Adventure party world does not match saved WorldDocument');
 const grant=exact(publicationGrant,
  ['schema','version','sessionId','worldId','combatSha','allowedCreatureIds'],
  'authoritative Combat Bestiaire publication grant');
 if(grant.schema!==ADVENTURE_PUBLISHED_GRANT_SCHEMA_V1||grant.version!==1||
    grant.sessionId!==sessionId||grant.worldId!==worldId)
  throw new Error('Playing party not authorised by matching Bestiaire session/world grant');
 if(typeof combatSha!=='string'||!/^[a-f0-9]{40}$/.test(combatSha))
  throw new TypeError('Official pinned Combat SHA required');
 if(grant.combatSha!==combatSha)
  throw new Error('Adventure playing party Combat SHA mismatch');
 if(!Array.isArray(grant.allowedCreatureIds)||
    new Set(grant.allowedCreatureIds).size!==grant.allowedCreatureIds.length)
  throw new TypeError('Official Bestiaire must provide a valid unique species allowlist');
 const saved=session.party?.active;
 const instanceId=safeId(saved?.instanceId,'instanceId');
 const speciesId=safeId(saved?.speciesId,'speciesId');
 if(!grant.allowedCreatureIds.includes(speciesId))
  throw new RangeError('Owned playing species not published/ready in official Bestiaire');
 if(!Number.isSafeInteger(saved.level)||saved.level<1||saved.level>100)
  throw new RangeError('Saved creature level must be between 1 and 100');
 if(saved.hp!==null&&(!Number.isSafeInteger(saved.hp)||saved.hp<0))
  throw new RangeError('Saved creature HP must be null or nonnegative');
 const data=Object.freeze({
  schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,
  sessionId,worldId,combatSha:grant.combatSha,
  partyRef:'adventure-party:'+sessionId,
  active:Object.freeze({instanceId,speciesId,level:saved.level,hp:saved.hp})
 });
 storage.setItem(ADVENTURE_PLAYING_PARTY_SCHEMA_V1+':'+sessionId,
  JSON.stringify(data));
 return data;
}
