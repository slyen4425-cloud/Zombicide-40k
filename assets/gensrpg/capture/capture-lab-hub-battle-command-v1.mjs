// Capture Hub's explicitly injected 1v1 combat command.
// World owns encounters; Capture roster owns persistence; the existing port
// owns the Lab provider; the pinned Lab Core alone owns combat rules/AI/time.
// No global handler replacement, storage, UI DOM scanning or alternate engine.
export function createCaptureLabHubBattleCommandV1({
 transaction, combatPort, engine, createProvider, clock, mountBattle,
 onReturn = () => {}, onError = () => {}
}) {
 if (!transaction || typeof transaction.prepareWild !== 'function' ||
     typeof transaction.status !== 'function') {
  throw new TypeError('Original Capture World transaction required');
 }
 for (const [key,fn] of Object.entries({createProvider,mountBattle,onReturn,onError})) {
  if (typeof fn !== 'function') throw new TypeError('Capture Hub requires '+key);
 }
 for (const name of ['install','uninstall','startEncounter','stopEncounter','status']) {
  if (typeof combatPort?.[name] !== 'function') {
   throw new TypeError('Existing Capture Combat ownership port missing '+name);
  }
 }
 if (!engine || typeof engine.createRosterSession !== 'function') {
  throw new TypeError('Pinned official Combat Lab engine required');
 }
 let current = null, disposed = false, lastError = null;

 function notify(which,event) {
  try {
   (which === 'return' ? onReturn : onError)(Object.freeze(event));
  } catch(error) {
   // The creator's UI callback has no permission to rerun a persisted result.
   // Keep the failure observable without fabricating a second save or outcome.
   lastError = error;
  }
 }
 function release(entry) {
  if (!entry.provider) return;
  let releaseError=null;
  try {
   if (combatPort.status().battleActive) combatPort.stopEncounter();
  } catch(error) {
   releaseError=error;
  } finally {
   try {
    if (combatPort.status().installed) combatPort.uninstall(entry.provider);
   } catch(error) {
    releaseError=releaseError ?? error;
   }
   entry.provider=null;
  }
  if (releaseError) throw releaseError;
 }
 function abort(entry,error) {
  if (current!==entry || entry.phase!=='running') return false;
  current=null;
  try {entry.ticket.cancel();} catch(cancelError) {error=error??cancelError;}
  try {release(entry);} catch(releaseError){error=error??releaseError;}
  lastError=error;
  notify('error',{encounterId:entry.encounterId,error,commitPending:false});
  return true;
 }
 function finish(entry,result,{retry=false}={}) {
  if (current!==entry || (entry.phase!=='running'&&entry.phase!=='commit-pending')) return false;
  entry.rawResult=result;
  entry.phase='committing';
  let applied;
  try {
   applied=entry.ticket.applyResult(result);
  } catch(error) {
   lastError=error;
   const ticketStillPending=transaction.status().pending;
   entry.phase=ticketStillPending?'commit-pending':'closed';
   try {release(entry);} catch(releaseError) {lastError=releaseError;}
   if (!ticketStillPending) current=null;
   notify('error',{encounterId:entry.encounterId,error,commitPending:ticketStillPending});
   if (retry) throw error;
   return false;
  }
  // Validation may reject a cancelled outcome without mutating either owner.
  entry.phase='closed';
  current=null;
  try {
   release(entry);
  } catch(error) {
   lastError=error;
   notify('error',{encounterId:entry.encounterId,error,commitPending:false});
   if (retry) throw error;
  }
  notify('return',applied?{...applied,encounterId:entry.encounterId}:
    {encounterId:entry.encounterId,cancelled:true,applied:false});
  return applied;
 }
 function startWildBattle(creatureId) {
  if (disposed) throw new Error('Capture Hub command disposed');
  if (current) throw new Error('Capture Hub encounter already active or commit pending');
  if (combatPort.status().installed) throw new Error('Another Capture Combat provider is already installed');
  const ticket=transaction.prepareWild(creatureId);
  const entry={encounterId:ticket.encounterId,ticket,provider:null,phase:'starting',rawResult:null};
  try {
   entry.provider=createProvider({
    engine,clock,resolveBattle:context=>ticket.resolveBattle(context),mountBattle
   });
   combatPort.install(entry.provider);
   const handle=combatPort.startEncounter({
    encounterId:ticket.encounterId,snapshot:ticket.snapshot,
    mode:'capture-world-wild',persist:true
   });
   if (!handle || typeof handle.completion?.then !== 'function') {
    throw new TypeError('Official Capture Combat provider returned no completion');
   }
   entry.handle=handle;
   entry.phase='running';
   current=entry;
   Promise.resolve(handle.completion).then(
    result=>finish(entry,result),
    error=>abort(entry,error)
   );
   return Object.freeze({ready:true,encounterId:ticket.encounterId,session:handle});
  } catch(error) {
   // No result has been committed; keep the canonical World wild encounter.
   current=null;
   try {ticket.cancel();} catch (_) {}
   try {release(entry);} catch(releaseError) {lastError=releaseError;}
   throw error;
  }
 }
 function cancel() {
  const entry=current;
  if (!entry || entry.phase!=='running') return false;
  current=null;
  entry.phase='closed';
  entry.ticket.cancel();
  release(entry);
  notify('return',{encounterId:entry.encounterId,cancelled:true,applied:false});
  return true;
 }
 function retryCommit() {
  if (!current || current.phase!=='commit-pending') {
   throw new Error('No pending Capture World result commit');
  }
  return finish(current,current.rawResult,{retry:true});
 }
 function dispose() {
  if (disposed) return false;
  if (current?.phase==='commit-pending') {
   // A hero may have been saved while the World writer failed. Losing this
   // pending reference could cause the player to replay a consumed battle.
   throw new Error('Capture World commit pending: retry or resolve before leaving');
  }
  if (current?.phase==='running') cancel();
  disposed=true;
  return true;
 }
 function status() {
  return Object.freeze({
   phase:disposed?'disposed':current?.phase??'idle',
   encounterId:current?.encounterId??null,
   battleActive:combatPort.status().battleActive,
   lastError:lastError?.message??null
  });
 }
 return Object.freeze({startWildBattle,cancel,retryCommit,dispose,status});
}
