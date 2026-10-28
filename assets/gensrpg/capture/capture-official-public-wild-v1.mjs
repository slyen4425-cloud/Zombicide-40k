import {createCaptureOfficialHubCompositionV1} from './capture-official-hub-composition-v1.mjs';
import {createCaptureSavedProfileLabMigrationV1} from './saved-profile-lab-migration-v1.mjs';

// The original captureStartWildBattle declaration is the only public caller.
// This module owns its transient view, never the roster, World, gameplay
// clock, author catalog, original handler or historical Combat simulation.
let opening=false;
let controller=null;
let activeView=null;
let statusBox=null;
let listeners=null;

const text=error=>String(error?.message||error||'Erreur inconnue');
function statusHost(){
 return document.getElementById('captureGameHub') || document.body;
}
function notify(message,{pending=false}={}){
 if(!statusBox){
  statusBox=document.createElement('section');
  statusBox.dataset.captureOfficialStatus='true';
  statusBox.setAttribute('role','status');
  statusBox.style.cssText='padding:10px;margin:8px 0;border:1px solid #85a88a;border-radius:10px;background:#213528;color:#fff;font:15px system-ui';
  statusHost().prepend(statusBox);
 }
 statusBox.replaceChildren();
 const p=document.createElement('p');p.textContent=message;statusBox.append(p);
 if(pending){
  const retry=document.createElement('button');
  retry.type='button';retry.textContent='Réessayer la sauvegarde du combat';
  retry.style.cssText='padding:10px;min-height:44px;border-radius:8px';
  retry.addEventListener('click',()=>{
   try{controller?.retryCommit();}
   catch(error){notify('La sauvegarde est toujours en attente : '+text(error),{pending:true});}
  });
  statusBox.append(retry);
 }
}
function forgetNotice(){
 statusBox?.remove();
 statusBox=null;
}
function protectNavigation(){
 if(listeners)return;
 const pagehide=()=>{
  if(controller?.status().phase==='running'){
   try{controller.cancel();}catch(error){notify('Arrêt Capture : '+text(error));}
  }
 };
 const beforeunload=event=>{
  if(controller?.status().phase==='commit-pending'){
   event.preventDefault();
   event.returnValue='Une sauvegarde du combat reste à confirmer.';
  }
 };
 window.addEventListener('pagehide',pagehide);
 window.addEventListener('beforeunload',beforeunload);
 listeners={pagehide,beforeunload};
}
function releaseNavigation(){
 if(!listeners)return;
 window.removeEventListener('pagehide',listeners.pagehide);
 window.removeEventListener('beforeunload',listeners.beforeunload);
 listeners=null;
}
function userView(battle,context,resources){
 if(activeView)throw new Error('Une vue du combat Capture officiel est déjà active');
 const snapshot=context?.snapshot;
 const player=snapshot?.sides?.[0]?.creatures?.[0];
 const opponent=snapshot?.sides?.[1]?.creatures?.[0];
 if(!player||!opponent)throw new TypeError('Le monde Capture ne fournit pas de rencontre 1v1');
 const authored=resources.authoredSource.buildEncounter({
  ...resources.settings,encounterId:context.encounterId,
  player:{instanceId:player.instanceId,creatureId:player.creatureId},
  opponent:{instanceId:opponent.instanceId,creatureId:opponent.creatureId}
 });
 const native=authored.nativeCombatSource;
 const source=resources.source;
 const resolver=globalThis.GensAssetResolverV1?.resolveCaptureLabAsset;
 if(typeof resolver!=='function')throw new Error('Resolver officiel des visuels Capture absent');

 const root=document.createElement('section');
 root.dataset.captureOfficialBattle='true';
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Combat Monster Capture officiel');
 root.style.cssText='position:fixed;inset:0;z-index:80000;overflow:auto;background:#101b16;color:#f4fff4;padding:env(safe-area-inset-top) 12px env(safe-area-inset-bottom);font:15px system-ui';
 const style=document.createElement('style');
 style.textContent=`
 [data-capture-official-battle] .cap-lab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:980px;margin:auto}
 [data-capture-official-battle] .cap-lab-fighter{display:flex;flex-direction:column;align-items:center;min-width:0;text-align:center;border:1px solid #668b76;border-radius:12px;padding:6px}
 [data-capture-official-battle] img{width:clamp(90px,19vw,180px);height:clamp(85px,21vh,160px);object-fit:contain}
 [data-capture-official-battle] progress{width:100%;max-width:260px}
 [data-capture-official-battle] .cap-lab-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:12px auto;max-width:980px}
 [data-capture-official-battle] button{min-height:46px;min-width:120px;padding:8px;border-radius:8px;background:#356944;color:#fff;border:1px solid #81b68e}
 [data-capture-official-battle] button:disabled{opacity:.5}
 [data-capture-official-battle] .cap-lab-head{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:980px;margin:4px auto}
 @media(max-width:650px){[data-capture-official-battle] .cap-lab-actions button{flex:1 1 130px}}
 `;
 root.append(style);
 const head=document.createElement('header');head.className='cap-lab-head';
 const title=document.createElement('h2');title.textContent='⚔️ Monster Capture · Combat officiel';
 const cancel=document.createElement('button');
 cancel.type='button';cancel.textContent='Annuler (garder la rencontre)';
 cancel.addEventListener('click',()=>controller?.cancel());
 head.append(title,cancel);root.append(head);
 const grid=document.createElement('div');grid.className='cap-lab-grid';
 const cards=native.battleFormat.actors.map(actor=>{
  const creature=authored.exported.creatures.find(c=>c.id===actor.creatureId);
  const presentation=authored.exported.presentation?.creatures?.[creature?.presentationId];
  const visual=actor.actorId===native.battleFormat.localActorId?
   presentation?.visual?.back:presentation?.visual?.front;
  if(!visual?.assetId)throw new Error('Visuel auteur absent : '+actor.creatureId);
  const asset=resolver({catalog:resources.catalog,assetId:visual.assetId,
   commit:source.assetsSha,approvedCommit:source.assetsSha,
   approvedRepository:source.assetsRepository});
  const card=document.createElement('article');card.className='cap-lab-fighter';
  const name=document.createElement('strong');name.textContent=actor.displayName;
  const img=document.createElement('img');img.alt='Créature '+actor.displayName;
  img.src=asset.url;img.decoding='async';img.dataset.authorAssetId=visual.assetId;
  const hp=document.createElement('span'),meter=document.createElement('progress');
  meter.setAttribute('aria-label','PV de '+actor.displayName);
  const energy=document.createElement('span');
  if(actor.actorId===native.battleFormat.localActorId)energy.dataset.playerEnergy='true';
  card.append(name,img,hp,meter,energy);grid.append(card);
  return {id:actor.actorId,hp,meter,energy};
 });
 root.append(grid);
 const message=document.createElement('p');message.setAttribute('role','status');
 message.style.textAlign='center';root.append(message);
 const actions=document.createElement('div');actions.className='cap-lab-actions';
 for(const skill of battle.skills()){
  const button=document.createElement('button');button.type='button';button.textContent=skill.name;
  button.addEventListener('click',()=>{
   try{
    const result=battle.useSkill(skill.id);
    message.textContent=result.ok?'Compétence lancée.':'Compétence indisponible actuellement.';
   }catch(error){message.textContent='Compétence : '+text(error);}
  });
  actions.append(button);
 }
 const flee=document.createElement('button');flee.type='button';flee.textContent='Fuir';
 flee.addEventListener('click',()=>{if(!battle.flee())message.textContent='La fuite est indisponible.';});
 actions.append(flee);root.append(actions);
 document.body.append(root);
 const oldFocus=document.activeElement;
 cancel.focus();
 const view={
  render(state){
   for(const card of cards){
    const fighter=state.fighters?.[card.id];
    if(!fighter)throw new Error('État officiel Combat incomplet : '+card.id);
    card.hp.textContent='PV '+fighter.hp+' / '+fighter.maxHp;
    card.meter.max=fighter.maxHp;card.meter.value=fighter.hp;
    card.energy.textContent='Énergie '+fighter.energy+' / '+fighter.maxEnergy;
   }
  },
  dispose(){
   root.remove();
   if(activeView===view)activeView=null;
   if(oldFocus?.isConnected)oldFocus.focus();
  }
 };
 activeView=view;
 return view;
}

async function ensureExistingPort(){
 if(!globalThis.GensCaptureBattleBridgeContractV1){
  await import('./battle-bridge-contract-v1.js');
 }
 if(!globalThis.GensCaptureLabOwnershipPortV1){
  await import('./lab-ownership-port-v1.js');
 }
 const validator=globalThis.GensCaptureBattleBridgeContractV1?.result;
 const port=globalThis.GensCaptureLabOwnershipPortV1;
 if(typeof validator!=='function'||typeof port?.install!=='function'){
  throw new Error('Contrat ou port Combat Capture officiel absent');
 }
 return {validator,port};
}

function returnToHub(event){
 if(event.cancelled)notify('Combat annulé : la rencontre sauvage reste disponible.');
 else notify(({
  victory:'Victoire : combat enregistré.',
  defeat:'Défaite : résultat enregistré.',
  flee:'Fuite : retour au monde enregistré.'
 })[event.outcome]||'Combat terminé.');
 if(controller?.status().phase!=='commit-pending'){
  try{controller?.dispose();}catch(error){notify('Fermeture Capture : '+text(error));}
  controller=null;
  releaseNavigation();
 }
}
function ownerError(event){
 const pending=event.commitPending===true;
 notify((pending?'Sauvegarde partielle : ne relance pas le combat. ':'Erreur de combat : ')+
  text(event.error),{pending});
 if(!pending){
  try{controller?.dispose();}catch(_){}
  controller=null;releaseNavigation();
 }
}

// Only the canonical public Capture owner calls this from the real
// captureStartWildBattle declaration. Saved World and team writes pass
// exclusively through its callbacks.
export async function startCaptureOfficialPublicWildV1({creatureId,owners,confirmConsent}){
 if(opening||controller)throw new Error('Un combat ou une sauvegarde Capture est déjà en cours');
 if(typeof confirmConsent!=='function')throw new TypeError('Consentement explicite requis');
 const name=String(creatureId||'');
 if(!name||owners.readWorldState()?.last?.type!=='wild'||
  String(owners.readWorldState().last.creatureId)!==name)throw new Error('Rencontre sauvage inexistante ou périmée');
 const originalHero=owners.activeHeroId(),originalKey=owners.worldStorageKey();
 const originalWorld=JSON.stringify(owners.readWorldState());
 opening=true;forgetNotice();
 let instance=null;
 try{
  const {validator,port}=await ensureExistingPort();
  instance=await createCaptureOfficialHubCompositionV1({
   siteBaseUrl:new URL('./',document.baseURI),
   owners,combatPort:port,validateBattleResult:validator,
   mountBattle:userView,onReturn:returnToHub,onError:ownerError
  });
  if(owners.activeHeroId()!==originalHero||owners.worldStorageKey()!==originalKey||
     JSON.stringify(owners.readWorldState())!==originalWorld){
   throw new Error('Le profil ou la rencontre a changé pendant le chargement officiel');
  }
  if(!instance.resources.publishedSpecies.includes(name)){
   throw new Error('Cette espèce ne possède pas encore de transfert auteur officiel : '+name);
  }
  const migration=createCaptureSavedProfileLabMigrationV1({
   activeHeroId:owners.activeHeroId,loadHeroState:owners.loadHeroState,
   saveHeroState:owners.saveHeroState,readEncounter:()=>owners.readWorldState().last,
   worldStorageKey:owners.worldStorageKey,
   authoredSource:instance.resources.authoredSource,
   readBattleSettings:()=>instance.resources.settings,
   combatSha:instance.resources.source.combatSha
  });
  // Existing migration receipts remain in the user's canonical profile.
  // No second migration or overwrite is allowed.
  const alreadyMigrated=!!owners.loadHeroState(originalHero)?.captureLabProfileMigrationV1;
  if(!alreadyMigrated){
   const plan=migration.prepare();
   if(plan.status==='migration-required'){
    const agreed=await confirmConsent(plan.consentText);
    if(!agreed){
     notify('Migration annulée : aucune donnée modifiée. La rencontre reste disponible.');
     instance.dispose();return Object.freeze({started:false,reason:'declined'});
    }
    migration.commit(plan,{acknowledged:plan.consentText});
   }
  }
  // The true canonical saved-profile transaction revalidates identities
  // after consent and refuses old HP, reserves, stale World and bad skills.
  controller=instance;protectNavigation();
  const result=instance.startWildBattle(name);
  notify('Combat officiel lancé.');return Object.freeze({started:true,encounterId:result.encounterId});
 }catch(error){
  if(instance && controller!==instance){
   try{instance.dispose();}catch(_){}
  }
  if(controller===instance && controller?.status().phase!=='commit-pending'){
   try{controller.dispose();}catch(_){}
   controller=null;releaseNavigation();
  }
  notify('Combat officiel non démarré : '+text(error),{
   pending:controller?.status().phase==='commit-pending'
  });
  throw error;
 }finally{opening=false;}
}
