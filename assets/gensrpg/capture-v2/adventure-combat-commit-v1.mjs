// GenSRPG Capture owns the durable AdventureSession commit; Exploration and
// Combat own the snapshot and battle result. This adapter never determines an
// outcome, damage, level, loot roll, encounter location or movement position.
// An external bridge may acknowledge/consume its pending handoff ONLY after
// this function returns persisted:true.
import {ADVENTURE_SAVE_SCHEMA_V1,applyAdventureCombatResultV1} from './adventure-contract-v1.mjs';

export function commitAdventureCombatResultV1({
 store,envelope,bestiaryCards,progressionCore,random,now
}={}){
 if(typeof store?.load!=='function'||typeof store?.save!=='function')
  throw new TypeError('Authoritative GenSRPG Adventure Core Storage required');
 const state=store.load();
 if(state?.schema!==ADVENTURE_SAVE_SCHEMA_V1||state.status!=='playing')
  throw new Error('Playing AdventureSession is required before committing CombatResult');
 // Never acknowledge a result created for the static Exploration Tester,
 // another profile, or any different AdventureSession even if species match.
 const partyRef='adventure-party:'+state.sessionId;
 if(envelope?.snapshot?.player?.partyRef!==partyRef)
  throw new Error('Combat snapshot partyRef does not match Adventure session');
 const instanceId=envelope.result?.partyState?.activeInstanceId;
 if(instanceId!==undefined&&instanceId!==state.party.active.instanceId)
  throw new Error('Combat result instance does not match the saved Adventure fighter');
 // Delegate ALL rules, random loot, level and HP projection to the existing
 // GenSRPG Aventure authority; no second reward path is permitted.
 const result=applyAdventureCombatResultV1({
  session:state,envelope,bestiaryCards,progressionCore,random,now
 });
 const key=envelope.snapshot.encounterId+':'+envelope.snapshot.returnToken;
 if(result.applied){
  // If Core Storage throws, this method must throw too; it must NEVER
  // delete/consume Combat's pending result or mark a success elsewhere.
  store.save(result.session);
 }
 // Verify the same canonical Core Storage service can actually reopen the
 // committed record. If write succeeded but readback fails, caller will not
 // acknowledge; retry will take the already-processed no-op branch.
 const stored=store.load();
 if(stored?.sessionId!==state.sessionId||
    !stored.processedEncounterKeys?.includes(key))
  throw new Error('CombatResult Core Storage commit not confirmed; leave pending handoff intact');
 return Object.freeze({
  persisted:true,applied:result.applied,
  session:stored,award:result.applied?result.award:null
 });
}
