// GenSRPG Aventure owns the chosen HeroDefinition ID, not its assets.
// The official Exploration user-hero store owns the actual PNG/WebP files.
// This short-lived, session-scoped projection is read only by Exploration
// Jouer; never copy creature data, actor imagery or XP into the grant.
import {ADVENTURE_SAVE_SCHEMA_V1,officialAdventureHeroDefinitionIdV1}
 from './adventure-contract-v1.mjs';

export const ADVENTURE_HERO_SELECTION_SCHEMA_V1='gensrpg.capture.v2.hero-selection.v1';

function safeId(value,field){
 if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(value))
  throw new RangeError('Invalid '+field+' identity for Adventure hero selection');
 return value;
}
export function writeAdventureHeroSelectionGrantV1({
 storage,session,world,heroRecord
}={}){
 if(typeof storage?.setItem!=='function')
  throw new TypeError('Same-origin sessionStorage required');
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||session.version!==1||
  session.status!=='playing')
  throw new Error('A real playing AdventureSession is required for hero selection');
 const sessionId=safeId(session.sessionId,'AdventureSession');
 const worldId=safeId(world?.id,'WorldDocument');
 if(session.world?.mapRef!==worldId)
  throw new Error('Adventure hero selection world does not match the playing session');
 const requestedId=session.hero?.definitionId;
 if(requestedId===undefined){
  if(heroRecord!==null&&heroRecord!==undefined)
   throw new Error('No hero selection recorded in the authoritative AdventureSession');
  return null; // legacy game, never invent a hero ID or create a false grant.
 }
 const heroDefinitionId=officialAdventureHeroDefinitionIdV1(requestedId);
 if(!heroRecord||heroRecord.schema!=='gensrpg-exploration-user-hero-v1'||
  heroRecord.version!==1||heroRecord.id!==heroDefinitionId)
  throw new Error('Selected hero not found in the official Exploration Hero Library');
 const grant=Object.freeze({
  schema:ADVENTURE_HERO_SELECTION_SCHEMA_V1,
  version:1,sessionId,worldId,heroDefinitionId
 });
 storage.setItem(ADVENTURE_HERO_SELECTION_SCHEMA_V1+':'+sessionId,JSON.stringify(grant));
 return grant;
}
