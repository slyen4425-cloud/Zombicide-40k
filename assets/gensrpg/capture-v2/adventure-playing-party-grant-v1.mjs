// Capture Aventure owns the saved party. This emits a short-lived, versioned
// PROJECTION of its actual member to the first-party Exploration runtime.
// It never creates an actor, battle, level, creature definition or XP source.
import {ADVENTURE_SAVE_SCHEMA_V1,availableAdventureStatPointsV1} from './adventure-contract-v1.mjs';
import {ADVENTURE_PUBLISHED_GRANT_SCHEMA_V1} from './adventure-publication-grant-v1.mjs';
import {assertOfficialAdventureWorldIdV1} from './adventure-world-choice-v1.mjs';

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
 storage,session,world,publicationGrant,combatSha,statRegistry=null
}={}){
 if(typeof storage?.setItem!=='function'||typeof storage?.getItem!=='function')
  throw new TypeError('Official same-origin sessionStorage required');
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||session?.version!==1||
    session?.status!=='playing')
  throw new Error('Genuine playing AdventureSession required for native party');
 const sessionId=safeId(session.sessionId,'sessionId');
 const worldId=assertOfficialAdventureWorldIdV1(world?.id);
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
 const rawReserve=session.party?.reserve??[];
 if(!Array.isArray(rawReserve)||rawReserve.length>5)
  throw new RangeError('Adventure team must have at most 6 saved members');
 const rawMembers=[session.party?.active,...rawReserve];
 function projectMember(saved){
  const instanceId=safeId(saved?.instanceId,'instanceId');
  const speciesId=safeId(saved?.speciesId,'speciesId');
  if(!grant.allowedCreatureIds.includes(speciesId))
   throw new RangeError('Owned playing species not published/ready in official Bestiaire');
  if(!Number.isSafeInteger(saved.level)||saved.level<1||
     !Number.isSafeInteger(session.rules?.progression?.maxLevel)||
     saved.level>session.rules.progression.maxLevel)
   throw new RangeError('Saved creature level exceeds the creator-configured Adventure cap');
  if(saved.hp!==null&&(!Number.isFinite(saved.hp)||saved.hp<0||saved.hp>Number.MAX_SAFE_INTEGER))
   throw new RangeError('Saved creature HP must be null or a finite nonnegative number');
  // Individual point budgets belong solely to the existing Core save.
  // The Combat stat registry only supplies the allowed stat identities.
  const hasStatAllocations=Object.hasOwn(saved,'statAllocations');
  let statAllocations=null;
  if(hasStatAllocations){
   const raw=saved.statAllocations;
   if(!raw||typeof raw!=='object'||Array.isArray(raw)||
      Object.getPrototypeOf(raw)!==Object.prototype)
    throw new TypeError('Adventure statAllocations must be a plain object');
   availableAdventureStatPointsV1(session,instanceId);
   const entries=Object.entries(raw);
   if(entries.length){
    if(statRegistry?.schema!=='capture-stat-registry-v1'||!Array.isArray(statRegistry.stats))
     throw new TypeError('Official Combat statRegistry required for allocations');
    const allowed=new Set(statRegistry.stats.map(x=>x.id));
    for(const [id,points] of entries){
     safeId(id,'statId');
     if(!allowed.has(id))
      throw new RangeError('Stat absent du registre officiel Combat: '+id);
     if(typeof points!=='number'||!Number.isSafeInteger(points)||points<0)
      throw new RangeError('Invalid Adventure stat allocation points');
    }
   }
   statAllocations=Object.freeze(Object.fromEntries(entries));
  }
  return Object.freeze({instanceId,speciesId,level:saved.level,hp:saved.hp,
   ...(hasStatAllocations?{statAllocations}:{})});
 }
 const members=rawMembers.map(projectMember);
 if(new Set(members.map(m=>m.instanceId)).size!==members.length)
  throw new RangeError('Duplicate Adventure member instanceId');
 // Project only the creator's game-wide combat policy; preserve real saved HP.
 const multiplier=session.rules?.combat?.hpMultiplier ?? 1;
 if(typeof multiplier!=='number'||!Number.isFinite(multiplier)||multiplier<=0||multiplier>1)
  throw new RangeError('Adventure combatHpMultiplier must be in (0,1]');
 const data=Object.freeze({
  schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,version:1,
  sessionId,worldId,combatSha:grant.combatSha,
  partyRef:'adventure-party:'+sessionId,
  active:members[0],
  ...(rawReserve.length?{reserve:Object.freeze(members.slice(1))}:{}),
  combatHpMultiplier:multiplier
 });
 storage.setItem(ADVENTURE_PLAYING_PARTY_SCHEMA_V1+':'+sessionId,
  JSON.stringify(data));
 return data;
}
