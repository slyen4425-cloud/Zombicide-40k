// The mounted Aventure document owns this port. The event carries only a
// request; the official Exploration journal supplies the actual result.
import {commitAdventureCombatResultV1} from './adventure-combat-commit-v1.mjs';

export const ADVENTURE_COMBAT_REQUEST_V1='gensrpg.capture.v2.adventure-combat-commit.v1';

export function connectAdventureCombatHostV1({
 frame,playUrl,sessionId,worldId,store,locks,readPending,refreshParty,bestiaryCards,progressionCore,onGameOver,onCombatResult
}){
 const expected=new URL(playUrl);
 function assertPlayLocation(value){
  const current=new URL(value);
  if(current.origin!==expected.origin||current.pathname!==expected.pathname||
     current.searchParams.get('play')!=='1'||current.searchParams.get('adventureSession')!==sessionId)
   throw new Error('La demande Combat ne correspond pas à cette partie.');
 }
 function assertActiveGame(){
  if(!frame.isConnected)throw new Error('La partie Aventure est fermée.');
  assertPlayLocation(frame.contentWindow.location.href);
  const active=store.load();
  if(active?.status!=='playing'||active.sessionId!==sessionId||active.world.mapRef!==worldId)
   throw new Error('La partie ou le monde de la sauvegarde Aventure a changé.');
 }
 async function handle({kind,sessionId:requestedSession}){
  if(requestedSession!==sessionId)throw new Error('Le résultat vise une autre partie.');
  assertActiveGame();
  if(typeof locks?.request!=='function')
   throw new Error('Le verrou de sauvegarde Aventure est indisponible.');
  if(kind==='ready')return {ready:true};
  if(kind!=='commit')throw new Error('Demande Combat Aventure inconnue.');

  return locks.request('gensrpg.capture.v2.adventure-combat:'+sessionId,()=>{
   assertActiveGame();
   const envelope=readPending();
   if(!envelope?.result)throw new Error('Aucun résultat de combat en attente pour cette partie.');
   assertPlayLocation(envelope.returnState.returnUrl);
   const {applied,session,award}=commitAdventureCombatResultV1({
    store,envelope,bestiaryCards,progressionCore,random:Math.random,now:new Date().toISOString()
   });
   if(session.status==='playing')refreshParty(session);
   const key=envelope.snapshot.encounterId+':'+envelope.snapshot.returnToken;
   return {receipt:{persisted:true,applied,session:{sessionId,processedEncounterKeys:[key]}},
    gameOver:session.status==='finished',
    view:applied&&award?{session,award}:null};
  });
 }
 const listener=event=>{
  const request=event.detail;
  if(event.target!==frame||typeof request?.respond!=='function')return;
  event.preventDefault(); // Claim the cancellable request before the asynchronous Core write.
  void handle(request).then(
   response=>{
    // Only the official receipt is sent to Exploration; saved XP and drops
    // stay in the parent UI, with no parallel reward or storage owner.
    request.respond({receipt:response.receipt,gameOver:response.gameOver});
    if(response.gameOver&&typeof onGameOver==='function')onGameOver();
    if(response.view&&typeof onCombatResult==='function')onCombatResult(response.view);
   },
   error=>request.respond({error:error.message})
  );
 };
 frame.addEventListener(ADVENTURE_COMBAT_REQUEST_V1,listener);
 return Object.freeze({
  dispose:()=>frame.removeEventListener(ADVENTURE_COMBAT_REQUEST_V1,listener)
 });
}
