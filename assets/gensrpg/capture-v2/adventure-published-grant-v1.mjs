// GenSRPG Capture owns the AdventureSession and issues ONLY a short-lived,
// read-only projection of Combat's real published Bestiary. Exploration owns
// creature spawn rates, terrain encounters and navigation. No creature, skill,
// battle engine or gameplay save is recreated here.
import {ADVENTURE_SAVE_SCHEMA_V1} from './adventure-contract-v1.mjs';
import {createPublishedEncounterCatalogV1} from './adventure-encounter-catalog-v1.mjs';

export const ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1=
 'gensrpg.capture.v2.published-encounters.v1';

function safeId(value,field){
 if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(value))
  throw new RangeError('Invalid Adventure '+field+' identifier');
 return value;
}

export function createAdventurePublishedEncounterGrantV1({
 session,worldId,combatSha,bestiaryCards,captureCatalog
}={}){
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||session?.version!==1||
    session.status!=='playing')
  throw new Error('Only a saved, playing AdventureSession may authorize encounters');
 const sessionId=safeId(session.sessionId,'session');
 const targetWorld=safeId(worldId,'world');
 if(session.world?.mapRef!==targetWorld||session.world.position!==null)
  throw new Error('Encounter authorization world does not match the real Adventure world');
 if(typeof combatSha!=='string'||!/^[a-f0-9]{40}$/.test(combatSha))
  throw new TypeError('Official Combat main SHA must be an immutable 40-digit hash');
 const published=createPublishedEncounterCatalogV1({
  bestiaryCards,captureCatalog
 });
 if(!published.resolveCreature(session.party?.active?.speciesId))
  throw new Error('La créature active de cette partie n’est plus publiée dans le Bestiaire officiel');
 const allowedCreatureIds=Object.freeze(published.listCreatures().map(c=>c.id));
 return Object.freeze({
  schema:ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1,version:1,
  sessionId,worldId:targetWorld,combatSha,allowedCreatureIds
 });
}
